# Workout Groups — Implementation Plan

> **Status**: Planned — not started. Medium effort (~695 lines across 12 files).

---

## Feature Summary

Add the ability to organize exercises into named groups on the Workouts tab. Groups act as **custom filters** — an exercise can belong to multiple groups or none. Selecting a group shows only its exercises, and per-group reordering, remove, calendar/trends filtering all follow the selected group context.

### Design principles followed

- **Chip row selector** — horizontal ScrollView with pill chips (active = lime bg), matching ScheduleSelector + MealTypeSelector patterns
- **Bottom-sheet modals** — standard `animationType="slide"` + backdrop `Pressable` + `onStartShouldSetResponder`
- **Delete confirmation** — separate bottom-sheet with rose icon, name, full-width danger button (`ACCENT.rose`)
- **Section headings** — Space Grotesk 700, 12px, uppercase, +0.1em letter-spacing
- **GlassPanel** — existing component, no new card containers needed
- **`withOfflineFallback()`** — all mutations wrapped (same as My Meals)
- **Theme-aware** — no hardcoded colors

---

## Database

### Migration `20250715000016_workout_groups.sql`

```sql
-- Parent: named workout groups
CREATE TABLE workout_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, name)
);

-- Join: group ↔ exercise membership (M:N) with per-group sort_order
CREATE TABLE workout_group_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES workout_groups(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES workout_goals(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(group_id, goal_id)
);

-- Indexes
CREATE INDEX idx_workout_groups_user_id ON workout_groups(user_id);
CREATE INDEX idx_workout_group_exercises_group_id ON workout_group_exercises(group_id);
CREATE INDEX idx_workout_group_exercises_goal_id ON workout_group_exercises(goal_id);

-- RLS — workout_groups (direct user_id check)
ALTER TABLE workout_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own workout groups"
  ON workout_groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own workout groups"
  ON workout_groups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own workout groups"
  ON workout_groups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workout groups"
  ON workout_groups FOR DELETE USING (auth.uid() = user_id);

-- RLS — workout_group_exercises (EXISTS subquery, matching my_meal_items pattern)
ALTER TABLE workout_group_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own workout group exercises"
  ON workout_group_exercises FOR SELECT USING (
    EXISTS (SELECT 1 FROM workout_groups WHERE id = group_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can create their own workout group exercises"
  ON workout_group_exercises FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM workout_groups WHERE id = group_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can update their own workout group exercises"
  ON workout_group_exercises FOR UPDATE USING (
    EXISTS (SELECT 1 FROM workout_groups WHERE id = group_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can delete their own workout group exercises"
  ON workout_group_exercises FOR DELETE USING (
    EXISTS (SELECT 1 FROM workout_groups WHERE id = group_id AND user_id = auth.uid())
  );
```

---

## Types (`lib/types.ts`)

```typescript
export type WorkoutGroup = {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  exercises: WorkoutGoal[];  // joined and sorted by workout_group_exercises.sort_order
};
```

---

## Shared constants (`lib/exercise-icons.ts`)

Extract `EXERCISE_CATEGORIES` from `ExercisePanel.tsx` into `exercise-icons.ts` so both `ExercisePanel` and `useWorkoutGroups` can reference it:

```typescript
export const EXERCISE_CATEGORIES: Record<string, string> = {
  pushups: "UPPER BODY",
  crunches: "CORE",
  situps: "CORE",
  squats: "LEGS",
};
```

---

## Hook: `hooks/useWorkoutGroups.ts`

Modeled on `useMyMeals.ts` (~200 lines).

### Query

```typescript
useQuery({
  queryKey: ["workout_groups", userId],
  queryFn: async () => {
    // 1. Fetch groups
    const { data: groups } = await supabase.from("workout_groups").select("*")...
    // 2. Fetch join rows for all groups
    const groupIds = groups.map(g => g.id);
    const { data: joinRows } = await supabase.from("workout_group_exercises")
      .select("*").in("group_id", groupIds)...
    // 3. Fetch goal details for all referenced goals
    const goalIds = joinRows.map(j => j.goal_id);
    const { data: goals } = await supabase.from("workout_goals")
      .select("*").in("id", goalIds)...
    // 4. Merge: assign sorted goals to each group
    return groups.map(g => ({
      ...g,
      exercises: joinRows
        .filter(j => j.group_id === g.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(j => goals.find(goal => goal.id === j.goal_id))
        .filter(Boolean),
    }));
  },
  enabled: !!userId,
  staleTime: 1000 * 60 * 2,
})
```

### Mutations (all with `withOfflineFallback`)

| Mutation | Function | Details |
|----------|----------|---------|
| `addGroup(name, goalIds[])` | `addGroup` | Insert group row + batch insert join rows (`supabase.from("workout_group_exercises").insert(items)`) |
| `updateGroup(id, name, goalIds[])` | `updateGroup` | Update name on group. **Full child replacement**: delete all join rows for this group, then re-insert with new goalIds (matching My Meals pattern) |
| `deleteGroup(id)` | `deleteGroup` | Delete group row (cascade handles join rows). Exercises are **not** deleted. |
| `reorderGroupGoal(groupId, goalId, direction)` | `reorderGroupGoal` | Read current join rows for group, find adjacent goal by `sort_order`, swap `sort_order` values (matching `reorderGoal` pattern) |
| `removeFromGroup(groupId, goalId)` | `removeFromGroup` | Delete the single join row. Exercise stays globally enabled. |

### Auto-suggest seeding

On first fetch (empty groups), if the user has exercises with known `EXERCISE_CATEGORIES`, fire once:

```typescript
useEffect(() => {
  if (!groupsLoading && groups.length === 0 && goals.length > 0 && !seededRef.current) {
    seededRef.current = true;
    seedDefaultGroups();
  }
}, [groups, groupsLoading, goals]);
```

`seedDefaultGroups` iterates user's exercises, groups by `EXERCISE_CATEGORIES` value, creates one group per unique category, and assigns matching exercises to each group via `addGroup`.

### Returns

```typescript
{
  groups: WorkoutGroup[],
  loading: boolean,
  addGroup, updateGroup, deleteGroup,
  reorderGroupGoal, removeFromGroup,
  refetch,
}
```

---

## Components

### `EditWorkoutGroupModal.tsx` (new, ~180 lines)

**Pattern**: Bottom-sheet modal, modeled on `EditMyMealModal`.

**Props:**
```typescript
type EditWorkoutGroupModalProps = {
  visible: boolean;
  group?: WorkoutGroup | null;   // null = create mode, defined = edit mode
  allGoals: WorkoutGoal[];       // all enabled goals available to assign
  onSave: (data: { name: string; goalIds: string[] }) => Promise<void>;
  onClose: () => void;
};
```

**Layout:**
1. **Header**: "Create Group" / "Edit Group" title
2. **Name field**: `TextInput` with `py-3 rounded-xl`, placeholder "e.g. Leg Day", auto-capitalize words
3. **Section heading**: "Exercises"
4. **Exercise list**: All enabled goals shown as rows, grouped by category (`EXERCISE_CATEGORIES`), with section headers:
   - Each row: `WorkoutIcon(16px)` + exercise name + `daily_goal` label + `Switch` or `Pressable` toggle
   - Grouped under labels: UPPER BODY / CORE / LEGS / OTHER
   - Toggled = in this group
5. **Save button**: Full-width `py-4 rounded-xl` lime CTA at bottom

**State reset**: `useEffect` keyed on `visible` + `group` to reset form on open.

### `WorkoutGroupsManagerModal.tsx` (new, ~120 lines)

**Pattern**: Manager modal with list + nested edit + delete confirmation, modeled on `MyMealsManagerModal`.

**Props:**
```typescript
type WorkoutGroupsManagerModalProps = {
  visible: boolean;
  userId: string;
  onClose: () => void;
};
```

**Layout:**
1. **Header**: "Workout Groups" title + "Add" text button (lime)
2. **Loading**: `ActivityIndicator`
3. **Empty state**: `dumbbell` icon (MCI `"dumbbell"`) + "No groups yet. Create one to organize your exercises!" text
4. **Group list rows**:
   - `dumbbell` icon (size 16, lime)
   - Group name (Inter 700)
   - Exercise count badge (Space Grotesk, muted)
   - Pencil icon → edit (opens `EditWorkoutGroupModal`)
   - Trash icon → delete confirmation
5. **Delete confirmation**: Separate bottom-sheet modal:
   - Rose icon circle
   - "Delete [Group Name]?" (Inter 700 18px)
   - "All exercises will stay available — they just won't be grouped." (Inter 400 13px, muted)
   - Danger button: "Delete" (`ACCENT.rose` bg, `c.textOnDark` text)
   - Cancel button: secondary style (`c.buttonBg`)

### `ExercisePanel.tsx` — modifications (~15 lines added)

New optional prop:
```typescript
onRemoveFromGroup?: () => void;
```

When `onRemoveFromGroup` is provided (group context):
- "Remove" button calls `onRemoveFromGroup` instead of `onToggleEnabled(goal.id, false)`
- Confirmation modal text: "Remove [exercise_type] from this group?" (vs "Remove this exercise?")
- Up/down arrows still work the same — callbacks are wired by the workouts screen

When `onRemoveFromGroup` is NOT provided ("All" context):
- Existing behavior unchanged

---

## Workouts screen (`app/(tabs)/workouts.tsx`)

### New state

```typescript
const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
```

### New hook

```typescript
const {
  groups,
  loading: groupsLoading,
  addGroup, updateGroup, deleteGroup,
  reorderGroupGoal, removeFromGroup,
} = useWorkoutGroups(user?.id);
```

### Group selector chip row

Rendered below the "SESSION ACTIVE / Daily Burn" header, above the exercise list:

```tsx
<ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-section-gap">
  <View className="flex-row gap-2">
    {/* "All" chip — always first */}
    <Pressable
      onPress={() => setSelectedGroupId("all")}
      className="py-3 px-4 rounded-xl"
      style={{ backgroundColor: selectedGroupId === "all" ? accent.lime : c.cardBgAlt }}
    >
      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 14, ... }}>
        All
      </Text>
    </Pressable>

    {/* Group chips */}
    {groups.map((g) => (
      <Pressable
        key={g.id}
        onPress={() => setSelectedGroupId(g.id)}
        className="py-3 px-4 rounded-xl"
        style={{ backgroundColor: selectedGroupId === g.id ? accent.lime : c.cardBgAlt }}
      >
        <Text numberOfLines={1} style={{ fontFamily: "Inter_700Bold", fontSize: 14, ... }}>
          {g.name}
        </Text>
      </Pressable>
    ))}

    {/* "+ Manage" chip */}
    <Pressable
      onPress={() => setShowGroupManager(true)}
      className="py-3 px-4 rounded-xl"
      style={{ backgroundColor: c.cardBgAlt, borderWidth: 1, borderColor: c.cardBorder, borderStyle: "dashed" }}
    >
      <MaterialCommunityIcons name="cog" size={16} color={c.textMuted} />
    </Pressable>
  </View>
</ScrollView>
```

### Exercise filtering

```typescript
// Which exercises to show
const activeGoalIds = selectedGroupId === "all"
  ? null   // show all
  : new Set(groups.find(g => g.id === selectedGroupId)?.exercises.map(e => e.id) ?? []);

const activeGoals = activeGoalIds
  ? enabledGoals.filter(g => activeGoalIds.has(g.id))
  : enabledGoals;
```

### ExercisePanel wiring (group context)

```tsx
{activeGoals.map((goal, index) => {
  const isGroupContext = selectedGroupId !== "all";
  return (
    <ExercisePanel
      key={goal.id}
      goal={goal}
      todayTotal={todayTotals[goal.exercise_type]}
      onLogSet={() => { setSelectedGoal(goal); setShowLogModal(true); }}
      onQuickLog={(reps) => handleQuickLog(goal, reps)}
      onUpdateGoal={(goalId, dailyGoal) => updateGoal(goalId, { daily_goal: dailyGoal })}
      onToggleEnabled={(goalId, enabled) => toggleEnabled(goalId, enabled)}
      onMoveUp={isGroupContext
        ? () => reorderGroupGoal(selectedGroupId, goal.id, "up")
        : () => reorderGoal(goal.id, "up")
      }
      onMoveDown={isGroupContext
        ? () => reorderGroupGoal(selectedGroupId, goal.id, "down")
        : () => reorderGoal(goal.id, "down")
      }
      isFirst={index === 0}
      isLast={index === activeGoals.length - 1}
      onRemoveFromGroup={isGroupContext
        ? () => removeFromGroup(selectedGroupId, goal.id)
        : undefined
      }
    />
  );
})}
```

### Calendar & trends filtering

When a group is selected, filter the data passed to `WorkoutWeeklyCalendar`, `WorkoutCalendar`, and `WorkoutTrendsChart`:

```typescript
// Filter dailyData (Record<string, entry[]>) by group's exercise types
const groupExerciseTypes = selectedGroupId !== "all"
  ? new Set(groups.find(g => g.id === selectedGroupId)?.exercises.map(e => e.exercise_type) ?? [])
  : null;

const filteredDailyData = groupExerciseTypes && dailyData
  ? Object.fromEntries(
      Object.entries(dailyData).map(([day, entries]) => [
        day,
        entries.filter((e: any) => groupExerciseTypes.has(e.exercise_type)),
      ])
    )
  : dailyData;

const filteredTrends = groupExerciseTypes && trends
  ? trends.filter(t => groupExerciseTypes.has(t.exercise_type))
  : trends;
```

Pass filtered data to:
- `<WorkoutWeeklyCalendar data={filteredDailyData} ... />`
- `<WorkoutTrendsChart trends={filteredTrends} ... />`
- `<WorkoutCalendar dailyData={filteredDailyData} ... />`

### Empty group state

When a group is selected but has no exercises:

```tsx
<GlassPanel className="p-5 items-center">
  <MaterialCommunityIcons name="dumbbell-off" size={32} color={c.textMuted} />
  <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", marginTop: 8 }}>
    No exercises in this group yet.
  </Text>
  <Pressable onPress={() => handleEditGroup(selectedGroupId)} className="mt-4 py-3 px-6 rounded-xl" style={{ backgroundColor: accent.lime }}>
    <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold", fontSize: 14 }}>
      Edit Group
    </Text>
  </Pressable>
</GlassPanel>
```

### New state + modal

```typescript
const [showGroupManager, setShowGroupManager] = useState(false);

{/* At bottom of render tree, after existing modals */}
<WorkoutGroupsManagerModal
  visible={showGroupManager}
  userId={user?.id ?? ""}
  onClose={() => setShowGroupManager(false)}
/>
```

---

## What stays unchanged

| File | Reason |
|------|--------|
| `useWorkoutLog.ts` | Logging is per-exercise, groups don't affect it |
| `useWorkoutTrends.ts` / `useWorkoutCalendar.ts` | Data is fetched by exercise; filtering happens at the screen level |
| `LogSetModal.tsx` | Operates on a single goal, no group awareness needed |
| `EditGoalModal.tsx` | Operates on a single goal's daily_goal |
| `WorkoutIcon.tsx` | Unchanged |
| `GlassPanel.tsx` | Unchanged |
| `ExercisePanel.tsx` (reordering) | Up/down callbacks work identically — the workouts screen wires them differently per context |
| Home tab workout panel | Always shows all enabled exercises regardless of groups |

---

## Edge cases

| Case | Behavior |
|------|----------|
| Delete a group with exercises | Cascade removes join rows; exercises survive |
| Remove exercise from group (group view) | Only removes from that group; exercise stays globally enabled. Still appears in "All". |
| Remove exercise ("All" view or manager) | Disables globally (existing `toggleEnabled`), removed from all groups via cascade |
| Disable globally + re-enable | Exercise returns to any groups it was in before (join rows survive disable) |
| Group with zero exercises | Selectable, shows empty state with "Edit Group" link |
| Duplicate group name | `UNIQUE(user_id, name)` prevents it |
| Long group names | `numberOfLines={1}` on chip |
| Many groups (>5) | Chip row scrolls horizontally |
| Offline | All mutations use `withOfflineFallback()` with the standard pattern |

---

## Implementation order

1. **Migration**: Create `20250715000016_workout_groups.sql` and run `supabase db push`
2. **Types & constants**: Add `WorkoutGroup` type, extract `EXERCISE_CATEGORIES` to `exercise-icons.ts`
3. **Hook**: `useWorkoutGroups.ts` — query + 5 mutations + auto-suggest seeding
4. **Components**: `EditWorkoutGroupModal.tsx` → `WorkoutGroupsManagerModal.tsx`
5. **Screen integration**: Modify `workouts.tsx` — chip row, filtering, context wiring
6. **Calendar/trends filtering**: Pass filtered data to existing chart components
7. **ExercisePanel**: Add `onRemoveFromGroup` prop + conditional UI
8. **Typecheck**: `npx tsc --noEmit`
9. **Deploy migration**: `supabase db push --linked`
