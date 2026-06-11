# FastTrack — Intermittent Fasting, Macro & Workout Tracker

Expo SDK 54 (React Native 0.76) + Supabase + NativeWind + Zustand + TanStack Query.

## Quick Start

```bash
cd /Users/ash/FastTrack
npx expo start --web --port 8081    # web (localhost:8081)
npx expo start --ios                 # native
```

Test account: `test@fasttrack.app` / `test1234`

## Git Workflow (CRITICAL — READ THIS FIRST)

### The Development Cycle (MANDATORY ORDER):

1. **Plan** — Present changes to the user. Explain what will change and why.
2. **Wait for greenlight** — Do NOT start building until the user explicitly approves (e.g., "yes", "go ahead", "proceed").
3. **Build** — Implement the approved changes. Make code changes only.
4. **Ask for feedback** — Do NOT commit. Present the result to the user and ask if they're happy.
5. **Wait for commit approval** — The user must explicitly say "commit", "push", "greenlight", or similar.
6. **Commit and push** — Only then commit and push to GitHub.

### Rules:
1. NEVER commit or push without the user's explicit approval
2. NEVER skip the feedback step — always ask before committing
3. ALWAYS wait for greenlight before building
4. NEVER build changes that haven't been approved
5. If the user is unhappy, go back to step 1 (Plan)

### If something breaks:
```bash
git revert HEAD          # Undo the last commit
git checkout .           # Discard all uncommitted changes
git log --oneline        # See history of snapshots
```

**Repo:** https://github.com/ashcdev-hub/FastTrack

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54 + Expo Router (file-based routing) |
| Styling | NativeWind v4 (Tailwind CSS for RN) — requires `metro.config.js` with `withNativeWind` and `global.css` import |
| State | Zustand (fasting store, goal store, theme store) |
| Data Fetching | TanStack Query (QueryClientProvider in root layout) |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Edge Functions) |
| Icons | Hugeicons (`@hugeicons/react-native` + `@hugeicons/core-free-icons`) — individual file imports only |
| Animations | react-native-reanimated + react-native-svg |
| Food Search | OpenFoodFacts API via Supabase Edge Function proxy (CORS fix) |
| Dates | date-fns |
| Notifications | expo-notifications (native only) |
| Theme | Dark/light mode via Zustand + AsyncStorage + CSS class toggle |

## ⚠️ Known Issues & Gotchas

### NativeWind v4 Setup (CRITICAL)
NativeWind v4 requires ALL of these or the app won't render:
1. `metro.config.js` with `withNativeWind(config, { input: "./global.css" })`
2. `global.css` with `@tailwind base/components/utilities` AND `--css-interop-darkMode: "class"` CSS variable
3. `babel.config.js` with `["babel-preset-expo", { jsxImportSource: "nativewind" }]` AND `"nativewind/babel"`
4. `import "../global.css"` in `app/_layout.tsx`
5. `nativewind-env.d.ts` with `/// <reference types="nativewind/types" />`

### Hugeicons — Barrel Export Broken with Metro
`import { IconName } from "@hugeicons/core-free-icons"` crashes Metro. Always import from individual files:
```ts
import Timer01Icon from "@hugeicons/core-free-icons/dist/esm/Timer01Icon";
```

### Expo Router — `<Redirect>` Crashes on Web
Do NOT use `<Redirect>` inside layout files. Handle auth redirects in `app/index.tsx` instead.

### React Native Modal on Web
`<Modal>` from react-native renders inline on web. Use conditional inline rendering or custom overlays.

### Alert.alert on Web
`Alert.alert` silently fails on web. We use a custom toast system (`useToast` hook + `Toast` component) for all user feedback across the app.

### Theme System
All components must use `useThemeStore` + `getThemeColors()` from `lib/theme-colors.ts`. Never hardcode `#FFFFFF`, `rgba(255,255,255,0.X)`, or `bg-slate-900`.

### OpenFoodFacts CORS
Direct calls from web blocked by CORS. Use Supabase Edge Function `food-search` as proxy.

### Supabase FK Syntax
Correct: `REFERENCES auth.users(id) ON DELETE CASCADE ON UPDATE CASCADE`

## Database Schema

### Tables

**profiles** — extends auth.users
- `id`, `email`, `display_name`, `avatar_url`, `timezone`, `weight_kg`
- `gender`, `age`, `height_cm`, `bmi` (auto-calculated by trigger)
- `daily_calorie_goal` (2000), `daily_protein_goal` (150), `daily_carbs_goal` (200), `daily_fat_goal` (65)
- `fasting_hours` (16), `eating_hours` (8)
- `notification_preferences` (JSONB)

**fasting_sessions** — `id`, `user_id`, `start_time`, `end_time`, `status`, `fasting_duration_minutes`, `fasting_schedule`, `created_at`

**food_log** — `id`, `user_id`, `session_id`, `name`, `brand`, `serving_size`, `calories`, `protein_g`, `carbs_g`, `fat_g`, `meal_type`, `logged_at`

**water_log** — `id`, `user_id`, `amount_ml`, `logged_at`

**fast_check_ins** — `id`, `user_id`, `session_id`, `mood` (1-5), `note`, `phase`, `created_at`

**daily_summaries** — `id`, `user_id`, `summary_date`, totals, `generated_at`

**workout_goals** — `id`, `user_id`, `exercise_type`, `daily_goal`, `calories_per_rep`, `enabled`

**workout_log** — `id`, `user_id`, `exercise_type`, `reps`, `sets`, `calories_burned`, `logged_at`

### Migrations
- `20250608000000_initial_schema.sql` — core tables
- `20250608000001_auto_profile_trigger.sql` — auto-create profile
- `20250608000002_fast_check_ins.sql` — check-ins
- `20250608000003_add_fasting_schedule.sql` — schedule column
- `20250610000004_profile_settings.sql` — gender, age, height, BMI, notifications
- `20250610000005_update_profile_trigger.sql` — trigger copies display_name
- `20250610000006_workouts.sql` — workout_goals + workout_log

### RLS
All tables have RLS enabled. Policies use `auth.uid() = user_id`.

## Project Structure

```
FastTrack/
├── app/
│   ├── _layout.tsx              # Root: global.css, QueryClientProvider, Stack, theme init
│   ├── index.tsx                # Auth redirect (login vs tabs)
│   ├── settings.tsx             # Standalone settings screen
│   ├── (auth)/
│   │   ├── _layout.tsx          # Auth stack
│   │   ├── login.tsx            # Email/password login
│   │   └── signup.tsx           # Sign up with display name
│   └── (tabs)/
│       ├── _layout.tsx          # Bottom tabs: Fast | Workouts | Log Food | Me
│       ├── index.tsx            # Fast tab: timer, schedule, check-ins, previous fasts
│       ├── workouts.tsx         # Workouts tab: exercise panels, log sets
│       ├── log-food.tsx         # Log Food tab: food search, meal builder, water
│       └── profile.tsx          # Me tab: achievements, weekly stats, macro progress
├── components/
│   ├── AppHeader.tsx            # Header with title + settings cog
│   ├── FastingTimer.tsx         # SVG progress ring (theme-aware)
│   ├── ScheduleSelector.tsx     # Schedule presets + custom
│   ├── MacroProgress.tsx        # Macro progress bars (theme-aware)
│   ├── FoodSearch.tsx           # OpenFoodFacts search + quick-add presets
│   ├── MealBuilder.tsx          # Meal staging area
│   ├── MealForm.tsx             # Manual entry with date/time picker
│   ├── WaterTracker.tsx         # Bottle presets + custom ml
│   ├── PreviousFasts.tsx        # Expandable list + delete
│   ├── FastingAchievements.tsx  # Unified fasting + workout achievements
│   ├── WeeklyStats.tsx          # Fasting + water + workout weekly stats
│   ├── CheckInPanel.tsx         # Mood + note (theme-aware)
│   ├── CheckInTimeline.tsx      # Timeline (theme-aware)
│   ├── MoodChart.tsx            # SVG mood graph (theme-aware)
│   ├── SettingsPanel.tsx        # Profile, account, notifications, appearance
│   ├── ExercisePanel.tsx        # Exercise card: progress, log, edit goal (stepper + presets + custom)
│   ├── LogSetModal.tsx          # Log reps + sets (stepper controls, no keyboard)
│   ├── AddExerciseModal.tsx     # Add custom exercise modal
│   ├── Toast.tsx                # Animated toast notification overlay
│   ├── Skeleton.tsx             # Reusable loading skeleton (theme-aware)
│   └── FoodLogItem.tsx          # Meal entry card (theme-aware)
├── hooks/
│   ├── useAuth.ts               # Auth (signup accepts displayName)
│   ├── useFastingSession.ts     # Session CRUD + streak + realtime
│   ├── useFastCheckIns.ts       # Check-in CRUD
│   ├── useFoodLog.ts            # Food entries + batch add
│   ├── useWaterLog.ts           # Water tracking
│   ├── useProfile.ts            # Profile CRUD + password + email + notifications
│   ├── useWeeklyFastingStats.ts # Weekly fasting stats
│   ├── useWeeklyWaterStats.ts   # Weekly water stats
│   ├── useWorkoutGoals.ts       # Workout goals CRUD + seed defaults
│   ├── useWorkoutLog.ts         # Log sets, today totals, weekly stats, calorie calc, streaks
│   └── useToast.ts              # Toast notification state (success/error, auto-dismiss)
├── store/
│   ├── useFastingStore.ts
│   └── useGoalStore.ts
├── lib/
│   ├── supabase.ts
│   ├── types.ts                 # All types including WorkoutGoal, WorkoutLogEntry
│   ├── theme-store.ts           # Theme preference (dark/light) persisted
│   ├── theme-colors.ts          # Theme-aware color palette
│   ├── dark-mode.ts             # applyTheme() CSS class toggle
│   └── notifications.ts
├── supabase/
│   ├── schema.sql
│   ├── migrations/              # 7 migrations
│   └── functions/
│       ├── daily-summary/
│       └── food-search/         # OpenFoodFacts proxy + retry logic
└── [config files]
```

## Supabase Project

- **Project URL**: `https://zytqfjjvruehnkntojjd.supabase.co`
- **Project Ref**: `zytqfjjvruehnkntojjd`
- **CLI**: `supabase login` → `supabase link --project-ref zytqfjjvruehnkntojjd` → `supabase db push --linked`

## Feature Breakdown

### Fast Tab
- Schedule selector (presets + custom)
- Start/break/end fast with inline confirmations
- Timer counts DOWN, progress ring fills UP
- Check-ins with mood chart + timeline
- Previous fasts with expandable detail + delete

### Workouts Tab
- Exercise panels: pushups, crunches, sit-ups, squats + custom
- Log sets via stepper controls (+/- buttons, preset chips, no keyboard)
- Edit daily goal via stepper + presets + custom input
- Remove exercises
- Default exercises seeded on first use

### Log Food Tab
- Meal type selector at top, date/time picker
- OpenFoodFacts search via Edge Function proxy
- Quick-add common foods
- Meal builder staging area
- Water tracker with bottle presets

### Me Tab
- First name display, unified achievements, weekly stats, macro progress

### Settings
- Profile details (name, gender, age, weight, height, BMI)
- Account (change email/password)
- Notifications preferences
- Dark/light mode toggle

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=https://zytqfjjvruehnkntojjd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Deployment

- **Web**: `npx expo start --web --port 8081`
- **iOS**: `npx expo run:ios`
- **Edge Functions**: `supabase functions deploy daily-summary` / `supabase functions deploy food-search`
- **TypeScript**: `npx tsc --noEmit`

## Handover Checklist

- [x] Full auth flow with auto-profile creation + display_name
- [x] Fasting lifecycle with timer + progress ring
- [x] Schedule selector on Fast tab
- [x] Check-ins with mood chart + timeline
- [x] Achievements (fasting + workouts unified)
- [x] Previous fasts with expandable detail + delete
- [x] Food search via Edge Function proxy + retry logic
- [x] Meal builder with staging area + date/time picker
- [x] Water tracker with bottle presets + custom ml
- [x] Workouts tab: exercises, log sets, calorie calc
- [x] Settings: profile, account, notifications, dark/light mode
- [x] Dark/light mode across all components
- [x] Me tab: first name, unified achievements, weekly stats
- [x] Signup includes display_name field
- [x] Database: 8 migrations (schema + profile settings + workouts + weight log)
- [x] Edge Functions: food-search proxy + daily-summary
- [x] All components theme-aware (no hardcoded colors)
- [x] Deploy Edge Functions to production
- [x] Loading/skeleton states
- [x] Pushup streak calculation
- [x] Final review and cleanup
- [x] Toast notifications (replaced Alert.alert for web compatibility)
- [x] Fixed total fasts achievement (counts all non-broken sessions)
- [x] Workout goal edit stepper + presets + custom input
- [x] Log Set modal stepper controls (no keyboard)
- [x] Weight tracking (log weight, progress chart, goal weight)
- [x] Database: 8 migrations (schema + profile settings + workouts + weight log)

## Next Steps

| # | Direction | Effort |
|---|-----------|--------|
| 1 | **Testing** — No tests exist yet. Unit tests for hooks, component tests, E2E | Medium |
| 2 | **App Store deployment** — Build profiles, screenshots, store listings, submit to iOS/Android | Medium |
| 3 | **Barcode scanner** — Scan food packaging for instant logging via camera | Medium |
| 4 | **Apple Health / Google Fit** — Sync workouts, weight, and water | Medium |
| 5 | **Streak notifications** — Reminders to start fast, check in, drink water | Small |
| 6 | **Export / reports** — PDF or CSV export of fasting history, nutrition, workouts | Small |
| 7 | **Social features** — Share progress, friend challenges | Large |
| 8 | **Widget support** — iOS/Android home screen widget showing fasting timer | Medium |
| 9 | **Bug fixes / polish** — Review and improve existing UX | Ongoing |
