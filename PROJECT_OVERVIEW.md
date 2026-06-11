# FastTrack — Intermittent Fasting, Macro & Workout Tracker

Expo SDK 54 (React Native 0.76) + Supabase + NativeWind v4 + Zustand + TanStack Query.

## Quick Start

```bash
cd /Users/ash/FastTrack
npx expo start --web --port 8081    # web (localhost:8081)
npx expo start --ios                 # native
```

Test account: `test@fasttrack.app` / `test1234`

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Expo SDK 54 + Expo Router (file-based routing) |
| Styling | NativeWind v4 (Tailwind via className) |
| State | Zustand (fasting store, goal store) |
| Server State | TanStack Query (QueryClientProvider in `app/_layout.tsx`) |
| Backend | Supabase (PostgreSQL, Auth, RLS, Realtime, Edge Functions) |
| Icons | Hugeicons — individual file imports only (`dist/esm/IconName`) |
| Animations | react-native-reanimated (SVG progress ring, worklets v0.5.1) |
| Food Search | OpenFoodFacts API via Supabase Edge Function proxy |
| Dates | date-fns |
| Notifications | expo-notifications (native only, web-safe guards) |
| Dark/Light Mode | Custom theme system with Zustand + AsyncStorage persistence |

## ⚠️ Critical Gotchas

### NativeWind v4 Setup
ALL five required or app won't render:
1. `metro.config.js` with `withNativeWind(config, { input: "./global.css" })`
2. `global.css` with `@tailwind base/components/utilities` AND `--css-interop-darkMode: "class"` CSS variable
3. `babel.config.js` with `["babel-preset-expo", { jsxImportSource: "nativewind" }]` AND `"nativewind/babel"` AND `"react-native-reanimated/plugin"`
4. `import "../global.css"` in `app/_layout.tsx`
5. `nativewind-env.d.ts` with `/// <reference types="nativewind/types" />`

### Hugeicons — Barrel Export Crashes Metro
```ts
// ✓ CORRECT
import Timer01Icon from "@hugeicons/core-free-icons/dist/esm/Timer01Icon";
// ✗ WRONG — crashes Metro
import { Timer01Icon } from "@hugeicons/core-free-icons";
```
Add `.d.ts` declarations in `hugeicons.d.ts` for any new icons.

### TextInput on iOS — Must Use Inline style
NativeWind's `text-white` does NOT apply to native iOS TextInput. Always add:
```tsx
style={{ color: "#FFFFFF" }}
```

### No `<Redirect>` in Layout Files
Crashes web. Handle auth redirects only in `app/index.tsx`.

### `<Modal>` on Web — Renders Inline
Use conditional inline rendering instead. Our app uses inline confirmation panels (see Break Fast/End Session).

### Alert.alert — Silent on Web
`Alert.alert` silently fails on web. We use a custom toast system (`useToast` hook + `Toast` component) for all user feedback across the app.

### StyleSheet.setFlag
Does NOT exist on web.

### ExpoSecureStore — Not on Web
`lib/supabase.ts` switches: `Platform.OS === "web"` → localStorage, else → SecureStore.

### Supabase Realtime Channel Conflicts
`useFastingSession` mounted in multiple components creates duplicate channels. Use `useRef` + `Date.now()` for unique channel names with ref-based cleanup.

### Supabase FK Syntax
Correct: `REFERENCES auth.users(id) ON DELETE CASCADE ON UPDATE CASCADE`
Wrong: `REFERENCES auth.users(id ON DELETE CASCADE)`

### SDK 54 (not 56)
Downgraded from SDK 56 for Expo Go compatibility. Reanimated worklets locked to `0.5.1`. Babel config includes `react-native-reanimated/plugin`.

### OpenFoodFacts API (CORS)
Direct calls from web are blocked by CORS. We use a Supabase Edge Function (`food-search`) as a proxy. The Edge Function has retry logic (3 attempts) and returns friendly errors. Intermittent 503s from OpenFoodFacts are expected — the retry logic handles most cases.

### Theme System
All components must use `useThemeStore` + `getThemeColors()` from `lib/theme-colors.ts`. Never hardcode `#FFFFFF`, `rgba(255,255,255,0.X)`, or `bg-slate-900` — use theme colors instead.

## Project Structure

```
FastTrack/
├── app/
│   ├── _layout.tsx              # Root: global.css, QueryClientProvider, Stack, theme init
│   ├── index.tsx                # Auth redirect (login vs tabs)
│   ├── settings.tsx             # Standalone settings screen (cog icon navigates here)
│   ├── (auth)/
│   │   ├── _layout.tsx          # Auth stack (no Redirect here)
│   │   ├── login.tsx            # Email/password login + Quick Test Login button
│   │   └── signup.tsx           # Sign up with display name (profile auto-created by DB trigger)
│   └── (tabs)/
│       ├── _layout.tsx          # Bottom tabs: Fast | Workouts | Log Food | Me
│       ├── index.tsx            # Fast tab: timer, schedule selector, check-ins, previous fasts
│       ├── workouts.tsx         # Workouts tab: exercise panels, log sets, add exercises
│       ├── log-food.tsx         # Log Food tab: food search, meal builder, water tracker
│       └── profile.tsx          # Me tab: achievements, weekly stats, macro progress
├── components/
│   ├── AppHeader.tsx            # Shared header with title + settings cog icon
│   ├── FastingTimer.tsx         # SVG circular progress ring (idle/fast/eat, theme-aware)
│   ├── ScheduleSelector.tsx     # Preset schedules (14:10, 16:8, 18:6, 20:4, OMAD) + custom
│   ├── MacroProgress.tsx        # Calorie/protein/carbs/fat progress bars (theme-aware)
│   ├── FoodLogItem.tsx          # Individual meal entry card (theme-aware)
│   ├── FoodSearch.tsx           # OpenFoodFacts search via Edge Function + quick-add presets
│   ├── MealBuilder.tsx          # Staging area for building meals before logging
│   ├── MealForm.tsx             # Manual meal entry with date/time picker
│   ├── WaterTracker.tsx         # Bottle size presets + custom ml input
│   ├── PreviousFasts.tsx        # Expandable list + inline delete + session detail
│   ├── FastingAchievements.tsx  # Unified fasting + workout achievements (streaks, milestones)
│   ├── WeeklyStats.tsx          # Fasting, water, and workout weekly stats
│   ├── CheckInPanel.tsx         # Mood selector (5 emojis) + note input (theme-aware)
│   ├── CheckInTimeline.tsx      # Vertical timeline of check-ins (theme-aware)
│   ├── MoodChart.tsx            # SVG line graph of mood over time (theme-aware)
│   ├── SettingsPanel.tsx        # Profile details, account, notifications, appearance settings
│   ├── ExercisePanel.tsx        # Reusable card for each exercise: progress, log, edit goal (stepper + presets + custom)
│   ├── LogSetModal.tsx          # Modal: reps + sets via stepper controls (no keyboard), calorie preview
│   ├── AddExerciseModal.tsx     # Modal: add custom exercise type
│   ├── Toast.tsx                # Animated toast notification overlay (success/error, auto-dismiss)
│   └── Skeleton.tsx             # Reusable loading skeleton (theme-aware)
├── hooks/
│   ├── useAuth.ts               # Session, sign in/up/out (accepts displayName for signup)
│   ├── useFastingSession.ts     # Active session CRUD + past sessions + streak + realtime
│   ├── useFastCheckIns.ts       # Check-in CRUD for active session + read for past sessions
│   ├── useFoodLog.ts            # Daily food entries + batch add + computed totals
│   ├── useWaterLog.ts           # Water intake tracking
│   ├── useProfile.ts            # Profile CRUD: updateProfile, updateGoals, updatePassword, updateEmail, updateNotificationPreferences
│   ├── useWeeklyFastingStats.ts # Weekly fasting: avg duration, longest fast, total hours
│   ├── useWeeklyWaterStats.ts   # Weekly water: daily average, goal hit rate
│   ├── useWorkoutGoals.ts       # Workout goals CRUD + seed defaults
│   └── useWorkoutLog.ts         # Log sets, today's totals, weekly stats, calorie calc, streaks
│   └── useToast.ts              # Toast notification state (success/error, auto-dismiss)
├── store/
│   ├── useFastingStore.ts       # fastingHours, eatingHours, session sync
│   └── useGoalStore.ts          # Daily calorie/macro/water goals (AsyncStorage)
├── lib/
│   ├── supabase.ts              # Client init (Platform-aware: localStorage vs SecureStore)
│   ├── types.ts                 # TypeScript types (all tables + WorkoutGoal, WorkoutLogEntry)
│   ├── database.types.ts        # Auto-generated from Supabase schema
│   ├── notifications.ts         # Push notification setup (native only, web-safe)
│   ├── theme-store.ts           # Zustand store: theme preference (dark/light) persisted to AsyncStorage
│   ├── theme-colors.ts          # Returns correct colors for current theme (text, bg, borders, inputs)
│   └── dark-mode.ts             # applyTheme() adds/removes 'dark' class on root element
├── supabase/
│   ├── schema.sql               # Full schema reference
│   ├── migrations/              # Numbered migration files
│   └── functions/
│       ├── daily-summary/       # Edge Function: nightly email digest via Resend
│       └── food-search/         # Edge Function: OpenFoodFacts proxy (CORS fix, retry logic)
├── global.css                   # NativeWind directives + --css-interop-darkMode CSS var
├── metro.config.js              # withNativeWind config
├── babel.config.js              # NativeWind babel presets + reanimated plugin
├── tailwind.config.js           # Content paths + nativewind preset
├── hugeicons.d.ts               # Module declaration for deep Hugeicons imports
├── nativewind-env.d.ts          # NativeWind type reference
├── css.d.ts                     # CSS module declaration
├── .env                         # EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
├── PROJECT_OVERVIEW.md          # Full project documentation
└── AGENTS.md                    # This file
```

## Database Schema

### Tables (in `supabase/schema.sql` + migrations)

**profiles** — extends auth.users
- `id` (UUID, FK to auth.users), `email`, `display_name`, `avatar_url`, `timezone`
- `weight_kg`, `gender`, `age`, `height_cm`, `bmi` (auto-calculated by trigger)
- `daily_calorie_goal` (default 2000), `daily_protein_goal` (150), `daily_carbs_goal` (200), `daily_fat_goal` (65)
- `fasting_hours` (default 16), `eating_hours` (default 8)
- `notification_preferences` (JSONB: fasting_reminders, eating_reminders, daily_digest)
- Auto-created via DB trigger `handle_new_user()` on auth.users insert (copies display_name from metadata)

**fasting_sessions**
- `id`, `user_id` (FK profiles), `start_time`, `end_time`, `status` (fasting/eating/broken/completed)
- `fasting_duration_minutes`, `fasting_schedule` (e.g. "16:8", "OMAD"), `created_at`

**food_log**
- `id`, `user_id`, `session_id` (FK fasting_sessions, nullable), `name`, `brand`, `serving_size`
- `calories`, `protein_g`, `carbs_g`, `fat_g`, `meal_type` (breakfast/lunch/dinner/snack/other), `logged_at`

**water_log**
- `id`, `user_id`, `amount_ml` (default 250), `logged_at`

**fast_check_ins** (mood + notes during fasts)
- `id`, `user_id`, `session_id` (FK fasting_sessions), `mood` (1-5), `note`, `phase` (fasting/eating), `created_at`

**daily_summaries** — for email digest
- `id`, `user_id`, `summary_date`, `total_calories`, `total_protein_g`, `total_carbs_g`, `total_fat_g`, `water_ml`, `generated_at`
- Unique constraint on `(user_id, summary_date)`

**workout_goals** — exercise configuration per user
- `id`, `user_id`, `exercise_type`, `daily_goal` (default 100), `calories_per_rep` (default 0.5), `enabled` (default true)
- Unique constraint on `(user_id, exercise_type)`

**workout_log** — individual set entries
- `id`, `user_id`, `exercise_type`, `reps`, `sets`, `calories_burned`, `logged_at`

### Migrations
- `20250608000000_initial_schema.sql` — all core tables + RLS + indexes + triggers
- `20250608000001_auto_profile_trigger.sql` — auto-create profile on signup
- `20250608000002_fast_check_ins.sql` — mood/note check-ins table
- `20250608000003_add_fasting_schedule.sql` — adds `fasting_schedule` column to fasting_sessions
- `20250610000004_profile_settings.sql` — adds gender, age, height, BMI, notification_preferences + BMI trigger
- `20250610000005_update_profile_trigger.sql` — trigger copies display_name from auth metadata
- `20250610000006_workouts.sql` — workout_goals + workout_log tables with RLS

### RLS
All tables have RLS enabled. Policies use `auth.uid() = user_id` for select/insert/update/delete.

## Supabase Project

- **Project URL**: `https://zytqfjjvruehnkntojjd.supabase.co`
- **Project Ref**: `zytqfjjvruehnkntojjd`
- **Anon Key**: stored in `.env` as `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **Service Role Key**: used for server-side operations (Edge Functions, migrations)
- **Database Password**: `Banisher1234$$$`
- **CLI**: `supabase login` → `supabase link --project-ref zytqfjjvruehnkntojjd` → `supabase db push --linked`
- All schema changes managed by AI.

## Feature Breakdown

### Fast Tab
- **Schedule selector**: Presets (14:10, 16:8, 18:6, 20:4, OMAD) + Custom with auto-calc (sums to 24h)
- **Start Fast button**: Text updates to show chosen schedule
- **Idle state**: SVG circle + "IF YOU START NOW" schedule preview
- **Fasting phase**: Timer counts DOWN to eat window + schedule card + Break Fast button
- **Eating phase**: Timer counts DOWN remaining + schedule card + End Session button
- **Check-ins**: Mood emoji (1-5) + note, visible during fasting/eating only
- **Mood chart**: SVG line graph, 3+ check-ins required
- **Check-in timeline**: Vertical timeline with colored dots (green=fasting, amber=eating)
- **Previous fasts**: Expandable rows with schedule badge, inline delete, mood chart + timeline

### Workouts Tab (NEW)
- **Today's Summary**: Total reps, sets, calories across all exercises
- **Exercise panels**: Pushups, Crunches, Sit-ups, Squats + custom exercises
  - Progress bar toward daily goal
  - Today's reps/sets/calories
  - "Log Set" button → modal with stepper controls for reps (+/- by 5, presets 5-25) and sets (+/- by 1, presets 1-5) + calorie preview (no keyboard required)
  - Edit daily goal inline via stepper (+/- by 10, presets 50-250) + custom input option
  - Remove exercise (hides panel, preserves history)
- **Add Exercise**: Custom exercise name, daily goal, calories per rep
- **Default exercises**: Seeded on first use (pushups 100, crunches 100, situps 50, squats 50)
- **Calorie formula**: `reps × sets × calories_per_rep × (weight_kg / 70)`

### Log Food Tab
- **Meal type selector** at top (Breakfast/Lunch/Dinner/Snack, auto-selected by time)
- **Date/time picker** for when meal was eaten (prevents future dates)
- **Food search**: OpenFoodFacts via Edge Function proxy + retry logic
- **Quick-add presets**: Boiled Egg, Fried Egg, Rice, Bread, Chicken, Banana, etc.
- **Meal builder**: Staging area for building meals before logging
- **Custom item entry**: Name, brand, calories, macros, serving size, quantity
- **Water tracker**: Bottle size presets (250ml–1L) + custom ml input

### Me Tab (Profile)
- **Header**: User's first name (from display_name or email)
- **Unified achievements**: Fasting streak, total fasts, pushup streak + milestone progress bars
- **Today's progress**: Calorie/protein/carbs/fat bars with goals
- **Weekly stats**: Fasting (avg, longest, total hours), water (daily avg, goal rate), workouts (total reps, calories)
- **Sign out**

### Settings (Standalone Screen)
- Accessible via cog icon on any tab header
- **Profile details**: Display name, gender, age, weight, height, BMI (auto-calculated)
- **Account**: Change email (triggers re-confirmation), change password
- **Notifications**: Toggle fasting reminders, eating reminders, daily digest
- **Appearance**: Dark/light mode toggle (persisted to AsyncStorage)

### Auth
- Email/password login/signup with display name
- Profile auto-created via DB trigger (copies display_name from auth metadata)
- Session persisted via SecureStore (native) / localStorage (web)

### Dark/Light Mode
- Full theme system with Zustand store + AsyncStorage persistence
- `applyTheme()` adds/removes 'dark' class on root element
- `getThemeColors()` returns correct colors for current theme
- All components use theme-aware colors (no hardcoded whites/grays)

## Spacing Convention

All panel-to-panel spacing is `mb-6` (24px). Consistent across all tabs.

| Where | Spacing |
|-------|---------|
| Between panels (all tabs) | `mb-6` (24px) |
| Section headings | `text-lg font-bold mb-4` (16px) |
| List items within panels | `mb-3` (12px) |

## Notifications

- **Push**: `expo-notifications` — scheduled when fast starts, cancelled on break/end (native only)
- **Email digest**: Supabase Edge Function `daily-summary` — nightly, queries food_log, sends via Resend API

## Deployment

- **Web**: `npx expo start --web --port 8081`
- **iOS**: `npx expo run:ios` or scan QR with Expo Go
- **Edge Functions**: `supabase functions deploy daily-summary` / `supabase functions deploy food-search`
- **TypeScript check**: `npx tsc --noEmit`
- Server must be restarted after babel config changes.

## Completed Features

- [x] Full auth flow with auto-profile creation
- [x] Fasting lifecycle: idle → fasting → eating → completed
- [x] SVG circular progress ring with smooth animations
- [x] Schedule selector (presets + custom)
- [x] Break Fast / End Session with inline confirmation
- [x] Check-ins: mood emoji + note, mood chart, timeline
- [x] Achievements on Me tab (fasting + workouts)
- [x] Food search (OpenFoodFacts via Edge Function proxy)
- [x] Meal builder with staging area + date/time picker
- [x] Water tracker with bottle size presets
- [x] Previous fasts: expandable, delete, schedule badge
- [x] Workouts tab: pushups, crunches, sit-ups, squats + custom
- [x] Settings: profile details, account, notifications, dark/light mode
- [x] Dark/light mode across all tabs
- [x] Me tab: first name display, unified achievements, weekly stats
- [x] Dashboard tab removed (content moved to Me tab)
- [x] Food search fixed (Edge Function proxy + retry logic)
- [x] Signup includes display_name field
- [x] Pushup streak calculation from workout_log
- [x] Loading/skeleton states for Me, Workouts, Log Food tabs
- [x] Edge Functions deployed (food-search proxy, daily-summary)
- [x] Settings save fix (useEffect sync for profile data)
- [x] Final theme color cleanup (all components theme-aware)
- [x] Toast notifications (replaced Alert.alert for web compatibility)
- [x] Fixed total fasts achievement (counts all non-broken sessions)
- [x] Workout goal edit stepper + presets + custom input
- [x] Log Set modal stepper controls (no keyboard)

## To Be Done

- [ ] None — all planned features complete
