# FastTrack — Intermittent Fasting, Workouts & Macro Tracker

Expo SDK 54 (React Native 0.81) + Supabase + NativeWind + Zustand + TanStack Query.

## Building for iOS (Standalone App)

You can build and install FastTrack as a standalone iPhone app **without enrolling in the Apple Developer Program** ($99/yr), using a free "Personal Team" signing cert that lasts 7 days. Full steps below.

### Prerequisites
- macOS with Xcode 16+ (rename: "Xcode 26" for iOS 26 device support)
- iPhone with **Developer Mode** enabled (Settings → Privacy & Security → Developer Mode)
- iPhone plugged into Mac via USB
- Expo account (free at https://expo.dev)
- `eas-cli`: `npm i -g eas-cli` (may need `--prefix ~/.npm-global` if you get permission errors)

### One-time setup
```bash
# 1. Log in to Expo (creates account at expo.dev if needed)
~/.npm-global/bin/eas login

# 2. Initialize EAS project (fills extra.eas.projectId in app.json)
eas init

# 3. Configure OTA updates (fills updates.url in app.json)
eas update:configure

# 4. Generate native iOS project from app.json
npx expo prebuild --clean --platform ios

# 5. One-time Xcode signing setup:
#    - Open ios/FastTrack.xcworkspace
#    - Select the "FastTrack" target → Signing & Capabilities tab
#    - Check "Automatically manage signing"
#    - Team dropdown → select your Apple ID (Personal Team)
#    - Close Xcode (it remembers the setting)
```

### Build & install to your iPhone
```bash
# Plug iPhone in via USB, trust the Mac on the phone
npx expo run:ios --device
```
- First build: ~3-5 minutes (downloads ~100MB of Pods)
- After install, you may need to **trust the developer** on the phone:
  Settings → General → VPN & Device Management → tap your Apple ID → "Trust"
- Cert lasts **7 days**. After expiry, re-run `npx expo run:ios --device` to renew.

### Pushing JS-only updates (no rebuild needed)
```bash
eas update --branch production --message "fix description"
```
The app picks up the new JS bundle on next launch. No cert renewal needed.

### Upgrading to TestFlight / App Store (later, optional)
Requires Apple Developer Program enrollment ($99/yr at https://developer.apple.com):
```bash
eas build --profile production --platform ios
eas submit --profile production --platform ios
```

### Bundle identifier
- Currently `com.ashcdev2.fasttrack` (changed from `com.fasttrack.app` because the
  original was already registered by another developer in App Store Connect)
- Change in both `app.json` (`ios.bundleIdentifier`) AND
  `ios/FastTrack.xcodeproj/project.pbxproj` (`PRODUCT_BUNDLE_IDENTIFIER`) — must match

### iOS-specific gotchas
- **Personal teams don't support push notifications** — `aps-environment` entitlement
  is stripped from the build. Local notifications still work (scheduled on-device).
  Remote push (APNs) requires a paid Apple Developer account.
- **iOS 26 device support**: Xcode downloads platform files on demand. If your phone
  runs iOS 26.x but the build fails with "iOS 26.x is not installed", open
  Xcode → Settings → Platforms (or Components) and download the matching version.
- **Developer Mode** must be enabled on the iPhone for builds to install.
  First-time USB connection requires tapping "Trust" on the phone.

### EAS Project
- Project ID: `c4a4b201-84a4-433f-a303-3945786d495b`
- Owner: `ashcdev2`
- Dashboard: https://expo.dev/accounts/ashcdev2/projects/FastTrack

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

### Pre-commit Hook (Safety Net):
- A `.githooks/pre-commit` hook blocks all commits unless `ALLOW_COMMIT=true` is set.
- This physically prevents unauthorized commits by the AI.
- The hook is git-tracked and configured via `git config core.hooksPath .githooks`.

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
| State | Zustand (fasting store, goal store, theme store, food log store) |
| Data Fetching | TanStack Query (QueryClientProvider in root layout) |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Edge Functions) |
| Icons | MaterialCommunityIcons (`@expo/vector-icons`) |
| Animations | react-native-reanimated + react-native-svg + expo-linear-gradient |
| Food Search | OpenFoodFacts API via Supabase Edge Function proxy (with Groq LLM fallback). Food photo analysis via Groq Llama 4 Scout vision model. |
| AI Coach | Groq-powered (`llama-3.3-70b-versatile`) AI coaching via Supabase Edge Function, aware of user's fasting, nutrition, workout, and weight data. |
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

### Expo Router — `<Redirect>` Crashes on Web
Do NOT use `<Redirect>` inside layout files. Handle auth redirects in `app/index.tsx` instead.

### Auth Redirect — `<Redirect>` Does NOT React to State Changes in Stack Routes
`app/index.tsx` uses `useEffect` + `router.replace()` (not `<Redirect>`) because `<Redirect>` only fires on initial render. `app/index.tsx` is a route in the Stack — once it calls `router.replace()`, it unmounts and its effects die. **Auth state changes that happen while the user is on another screen (e.g., `/login`) must be handled imperatively in that screen** — see `login.tsx` (navigates after `signIn`) and `app/(tabs)/_layout.tsx` (guards against no session). Sign-out is handled inline in `app/(tabs)/profile.tsx` (no standalone settings page).

### React Native Modal on Web
`<Modal>` from react-native renders inline on web. Use conditional inline rendering or custom overlays.

### Alert.alert on Web
`Alert.alert` silently fails on web. We use a custom toast system (`useToast` hook + `Toast` component) for all user feedback across the app.

### Theme System
All components must use `useThemeStore` + `getThemeColors()` from `lib/theme-colors.ts`. Never hardcode `#FFFFFF`, `rgba(255,255,255,0.X)`, or `bg-slate-900`.

### Glass Panel Component
All card containers must use the `<GlassPanel>` component from `components/GlassPanel.tsx`, not the CSS-based `.glass-panel` utility class (which doesn't work on native). `GlassPanel` applies theme-aware inline styles with semi-transparent backgrounds and borders. Supports `as="pressable"` for tappable panels and `rounded={false}` for chart wrappers. Never hardcode `rgba` backgrounds on panel shells.

### Design Conventions (Round 1)
Standardized values enforced across all screens and components:

| Element | Value | Notes |
|---------|-------|-------|
| Panel-to-panel spacing | `mb-section-gap` (32px) | tailwind config token, replaces `mb-6`/`mb-8` |
| Panel padding | `p-5` (20px) | maps to `container-padding` token |
| Panel border-radius | `rounded-xl` | never `rounded-lg` or `rounded-2xl` on panel shells |
| Primary buttons | `py-4 rounded-xl` | full-width CTAs (Start Fast, End Fast) |
| Secondary buttons | `py-3 rounded-xl` | inline actions (Edit Goal, Remove, etc.) |
| Danger buttons | `py-3 rounded-xl` with `ACCENT.rose` bg | text color: `c.textOnDark` |
| Text inputs | `py-3 rounded-xl` | consistent across all forms |
| Section heading margin | `mb-4` (16px) | applies to all uppercase section titles |
| Content bottom padding | `paddingBottom: 85` | matches tab bar height (`85px`), no dead space |
| Modal backdrops | `Pressable` with `onPress` to dismiss | inner content must use `onStartShouldSetResponder={() => true}` to stop propagation |
| Delete confirmations | Bottom-sheet `Modal` with `animationType="slide"` | never inline confirmation blocks |

### Modal Backdrop Pattern (Required)
Every bottom-sheet modal must use this exact structure:
```tsx
<Modal visible={...} transparent animationType="slide" onRequestClose={onClose}>
  <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={onClose}>
    <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }}>
      ...content...
    </Pressable>
  </Pressable>
</Modal>
```
The inner `Pressable` with `onStartShouldSetResponder={() => true}` prevents backdrop tap from propagating to content.

### Fasting Lifecycle
Three clear phases: **Idle** (schedule selector shown) → **Fasting** (ring fills, "Break Fast" button) → **Eating** (ring turns cyan, "End Eating Window" button). The eating phase timer counts down remaining eating time. Schedule selection is only shown when idle. A date/time picker bottom-sheet lets you set a custom start time (up to 3 days back) before starting, with a live schedule preview. During an active fast, tap the pencil icon next to "Started" in the timer ring to edit the start time — all timers and notifications reschedule automatically.

### Custom Fast Start Time
- **Before starting**: Tapping "Start Fast" opens a date/time picker (default: now). User can adjust via hour/minute scrollers + date shortcuts (Today / Yesterday / 2d ago / 3d ago), or tap "Start Now" to skip the picker. The schedule preview panel updates live as the time is adjusted.
- **During a fast**: A pencil icon next to "Started" in the timer ring schedule strip opens the same picker pre-filled with the current start time. Confirming updates `start_time` in Supabase, cancels and reschedules all notifications, and the timer/eating-window calculations update reactively.
- **Constraints**: Max 3 days in the past. Future start times are disabled on today's date.
- **Notifications**: All time-based notifications (fast complete, check-in, eating window reminder) are rescheduled using the correct `remainingSeconds` from the adjusted start time, not `fastingHours * 3600`.

### ACCENT.lime / ACCENT.cyan / ACCENT.coral
`ACCENT.mint` is defined in the palette but never used in any UI component. All UI uses `ACCENT.lime` (#c3f400), `ACCENT.cyan` (#00daf3), or `ACCENT.coral` (#FF6B52) for the various accent roles.

### Login Screen Video Background
The login screen plays a looping MP4 background video via `expo-av`, with a 75% gradient overlay for dimming (`expo-linear-gradient`). On web, video is skipped (auto-play restrictions) and falls back to the solid background color. Video file is bundled at `assets/videos/background.mp4`.

On mount, the logo icon + wordmark scale in with a spring animation, a lime glow ring pulses behind the icon, and the subtitle + form fields fade in with staggered delays.

### LogMealModal — Full-Screen Food Logging Modal
Food logging happens inside a full-screen `<Modal>` (`LogMealModal`) with this layout:
- Fixed header + native search bar (`TextInput` with system keyboard, not custom keyboard) + search results
- Meal type selector, date/time picker, quick-add favorites, recent foods, custom item form
- MealBuilder staging area at the bottom with item count badge and auto-scroll on add
- Items in the staging area are tappable — opens edit modal to adjust quantity, calories, protein, carbs, fat
- Barcode scanner (wrapped in `Modal`) for food packaging
- Photo capture via `FoodCamera` component (`expo-camera`) or gallery via `expo-image-picker`
- Search uses Supabase Edge Function `food-search` (OpenFoodFacts → Groq LLM fallback) with results returned in ~1.5s via parallel execution

### Groq Vision Models
The `food-photo` Edge Function uses Groq vision models (`meta-llama/llama-4-scout-17b-16e-instruct` or `qwen/qwen3.6-27b`) for photo-based food recognition. These models must be enabled in the Groq project settings at https://console.groq.com/settings/project/limits. The Edge Function supports both base64 image data and remote image URLs.

### Offline Support — Mutation Queue
All mutation hooks wrap their `mutationFn` with `withOfflineFallback()` from `lib/offline-mutation.ts`. When offline or on network error:
1. Mutation is enqueued to AsyncStorage via `enqueueMutation()` (`lib/offline-queue.ts`)
2. `mutationFn` returns `null` (optimistic update is skipped in `onSuccess`)
3. On reconnect, `useOfflineQueueProcessor` replays the queue against Supabase
4. All query caches are invalidated after sync
- Queue processor skips individual failed items (doesn't block the rest), adds 500ms delay between retries
- Query cache is written to AsyncStorage on every change and **hydrated on startup** (filters data older than 24h)
- `@tanstack/query-async-storage-persister` is installed but unused — hydration is manual

### Food Log Staging Persistence
`useFoodLogStore` persists `stagedItems`, `selectedMealType`, and `stagedDate` to AsyncStorage (`@fasttrack_food_log_staging`). Auto-restored on app boot via `loadFromStorage()`. `stagedDate` is stored as ISO string (not `Date` object).

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
- `unit_preferences` (JSONB) — weight: kg/lbs, height: cm/ft, water: ml/floz
- `quick_add_foods` (JSONB) — array of food names for quick-add grid
- `enabled_trackers` (JSONB) — which trackers are enabled: fasting, workouts, food, period
- `period_settings` (JSONB) — cycle_length, period_duration, luteal_phase_length

**fasting_sessions** — `id`, `user_id`, `start_time`, `end_time`, `status`, `fasting_duration_minutes`, `fasting_schedule`, `created_at`

**food_log** — `id`, `user_id`, `session_id`, `name`, `brand`, `serving_size`, `calories`, `protein_g`, `carbs_g`, `fat_g`, `meal_type`, `logged_at`

**water_log** — `id`, `user_id`, `amount_ml`, `logged_at`

**fast_check_ins** — `id`, `user_id`, `session_id`, `mood` (1-5), `note`, `phase`, `created_at`

**daily_summaries** — `id`, `user_id`, `summary_date`, totals, `generated_at`

**workout_goals** — `id`, `user_id`, `exercise_type`, `daily_goal`, `calories_per_rep`, `enabled`

**workout_log** — `id`, `user_id`, `exercise_type`, `reps`, `sets`, `calories_burned`, `logged_at`

**my_meals** — `id`, `user_id`, `name`, `description`, `use_count`, `last_used_at`, `created_at`, `updated_at`

**my_meal_items** — `id`, `meal_id`, `name`, `brand`, `serving_size`, `calories`, `protein_g`, `carbs_g`, `fat_g`, `sort_order`

**period_log** — `id`, `user_id`, `log_date`, `flow_intensity`, `cramps`, `mood`, `energy`, `headache`, `bloating`, `cravings`, `notes`, `created_at`

### Migrations
- `20250608000000_initial_schema.sql` — core tables
- `20250608000001_auto_profile_trigger.sql` — auto-create profile
- `20250608000002_fast_check_ins.sql` — check-ins
- `20250608000003_add_fasting_schedule.sql` — schedule column
- `20250610000004_profile_settings.sql` — gender, age, height, BMI, notifications
- `20250610000005_update_profile_trigger.sql` — trigger copies display_name
- `20250610000006_workouts.sql` — workout_goals + workout_log
- `20250611000007_weight_log.sql` — weight tracking
- `20250611000008_unit_preferences.sql` — unit preferences (kg/lbs, cm/ft, ml/floz)
- `20250626000009_quick_add_foods.sql` — quick_add_foods JSONB column on profiles
- `20250626000001_onboarding_completed.sql` — onboarding_completed column on profiles
- `20250627000010_add_workout_icon_name.sql` — icon_name column on workout_goals
- `20250628000011_my_meals.sql` — my_meals table (single-table v1, replaced by v2)
- `20250629000013_enabled_trackers.sql` — enabled_trackers JSONB column on profiles
- `20250702000014_period_tracker.sql` — period_log table + period_settings JSONB column

### RLS
All tables have RLS enabled. Policies use `auth.uid() = user_id`.

## Project Structure

```
FastTrack/
├── app/
│   ├── _layout.tsx              # Root: global.css, QueryClientProvider, Stack, theme init
│   ├── index.tsx                # Auth redirect (login vs tabs)
│   ├── auth/
│   │   └── callback.tsx         # Auth callback (email confirmation redirect)
│   ├── (auth)/
│   │   ├── _layout.tsx          # Auth stack
│   │   ├── login.tsx            # Email/password login with video background
│   │   └── signup.tsx           # Sign up with display name
│   ├── (onboarding)/            # 5-step onboarding wizard
│   └── (tabs)/
│       ├── _layout.tsx          # Bottom tabs: Home | Fast | Workout | Food | Profile
│       ├── index.tsx            # Home dashboard: fasting, workouts, water, macros
│       ├── fast.tsx             # Fast tab: timer, schedule, check-ins, calendar, prev fasts
│       ├── workouts.tsx         # Workouts tab: exercise panels, log sets
│       ├── log-food.tsx         # Log tab: macros panel, Log Meal button, calendar, today's meals
│       └── profile.tsx          # Profile tab: achievements, weight, stats, settings, sign out
├── components/
│   ├── FastingTimer.tsx         # SVG progress ring (theme-aware)
│   ├── ScheduleSelector.tsx     # Schedule presets + custom (onboarding only)
│   ├── MealBuilder.tsx          # Meal staging area
│   ├── MealForm.tsx             # Manual entry with date/time picker
│   ├── LogMealModal.tsx         # Full-screen food logging modal (search, quick-add, custom form, meal builder)
│   ├── EditQuickAddModal.tsx    # Multi-select chip grid for quick-add foods
│   ├── MealCalendarModal.tsx    # Full month calendar with day-tap meal detail
│   ├── BarcodeScanner.tsx       # Camera barcode scanner (wrapped in Modal)
│   ├── FoodCamera.tsx           # Camera food photo capture for AI analysis
│   ├── WaterTracker.tsx         # Bottle presets + custom ml (supports unit prefs)
│   ├── PreviousFasts.tsx        # Expandable list + delete + weekly calendar
│   ├── WeeklyCalendar.tsx       # 7-day circle calendar (Mon–Sun)
│   ├── FastCalendar.tsx         # Full month calendar modal
│   ├── FastingAchievements.tsx  # Unified fasting + workout achievements
│   ├── WeeklyStats.tsx          # Fasting + water + workout weekly stats
│   ├── CheckInPanel.tsx         # Mood + note (theme-aware)
│   ├── CheckInTimeline.tsx      # Timeline (theme-aware)
│   ├── MoodChart.tsx            # SVG mood graph (theme-aware)
│   ├── SettingsPanel.tsx        # Profile, account, notifications, preferences, trackers, appearance, water goal
│   ├── ExercisePanel.tsx        # Exercise card: progress, log, edit goal, icon
│   ├── WorkoutIcon.tsx          # SVG workout icon (MingCute/Lucide, theme-tinted via SvgXml)
│   ├── EditGoalModal.tsx        # Bottom-sheet goal editor (stepper + presets + custom)
│   ├── LogSetModal.tsx          # Log reps + sets (stepper controls)
│   ├── AddExerciseModal.tsx     # Add custom exercise modal with icon picker
│   ├── WeightTracker.tsx        # Weight logging + recent entries (supports unit prefs)
│   ├── WeightChart.tsx          # SVG weight line chart
│   ├── GlassPanel.tsx           # Shared glass-card wrapper (View or Pressable via `as` prop, theme-aware inline styles)
│   ├── ProgressRing.tsx         # Reusable SVG progress ring (animated)
│   ├── OfflineBanner.tsx        # Animated offline banner when connectivity lost
│   ├── Toast.tsx                # Animated toast notification overlay
│   ├── Skeleton.tsx             # Reusable loading skeleton with shimmer sweep
│   ├── ErrorBoundary.tsx        # Top-level render crash recovery screen
│   ├── AnimatedPressable.tsx    # Pressable with spring scale-down animation
│   ├── AnimatedTabIcon.tsx      # Tab bar icon with bounce + pulse animation
│   ├── FastTrackHeader.tsx      # Animated app header with breathing logo
│   ├── AmbientBackground.tsx    # Floating accent circles for depth
│   ├── StaggerPanel.tsx         # Staggered fade-in-up content wrapper
│   ├── EditMyMealModal.tsx      # Create/edit meal templates with items
  ├── MyMealsManagerModal.tsx  # Full CRUD meal template manager
  ├── FoodLogItem.tsx          # Meal entry card (theme-aware)
  ├── CyclePhaseBadge.tsx      # Cycle phase pill badge (theme-aware)
  ├── PeriodCalendar.tsx       # Full month grid with phase-colored days
  ├── CycleWheel.tsx           # SVG cycle phase ring (200px, animated)
  ├── PeriodLogModal.tsx       # Bottom-sheet period symptom logging
  ├── CycleInsights.tsx        # Phase-aware fasting tips panel
  └── PeriodSettingsModal.tsx  # Cycle config with steppers + presets
├── hooks/
│   ├── useAuth.ts               # Auth (signup accepts displayName)
│   ├── useFastingSession.ts     # Session CRUD + streak + realtime
│   ├── useFastingTimer.ts       # Shared single-ticker hook with AppState pause
│   ├── useFastCheckIns.ts       # Check-in CRUD
│   ├── useFoodLog.ts            # Food entries + batch add
│   ├── useWaterLog.ts           # Water tracking
│   ├── useProfile.ts            # Profile CRUD + password + email + notifications + unit prefs
│   ├── useWeeklyFastingStats.ts # Weekly fasting stats
│   ├── useWeeklyWaterStats.ts   # Weekly water stats
│   ├── useWorkoutGoals.ts       # Workout goals CRUD + seed defaults
│   ├── useWorkoutLog.ts         # Log sets, today totals, weekly stats, calorie calc, streaks
│   ├── useMyMeals.ts            # My Meals library CRUD + offline queue
│   ├── useWeightLog.ts          # Weight logging + stats
│   ├── useFastCalendar.ts       # Monthly session fetch for calendar
│   ├── useConnectivity.ts       # NetInfo connectivity detection
│   ├── useOfflineQueueProcessor.ts # Replays queued mutations on reconnect
│   ├── useOfflineQueueProcessor.ts # Replays queued mutations on reconnect
│   ├── useToast.ts              # Toast notification state
│   ├── usePeriodLog.ts          # Period log CRUD + offline queue
│   ├── useCycleTracker.ts       # Cycle phase detection + prediction
│   └── usePeriodSettings.ts     # Period settings on profile
│   ├── useAnimatedBar.ts        # Shared animated progress bar hook
│   ├── useAnimatedCounter.ts    # Number count-up animation hook
│   └── useAnimatedPressable.ts  # Shared press-scale animation hook
├── store/
│   ├── useTrackerStore.ts          # Enabled trackers preferences (Zustand + AsyncStorage)
│   ├── useFastingStore.ts
│   ├── useGoalStore.ts
│   └── useFoodLogStore.ts
├── lib/
│   ├── supabase.ts
│   ├── types.ts                 # All types including WorkoutGoal, WorkoutLogEntry
│   ├── theme-store.ts           # Theme preference (dark/light) persisted
│   ├── theme-colors.ts          # Theme-aware color palette
│   ├── dark-mode.ts             # applyTheme() CSS class toggle
│   ├── notifications.ts
│   ├── fasting-phases.ts        # Fasting phase calculator (6 phases + eating phase)
│   ├── cycle-phases.ts          # Cycle phase detection + prediction + fertile window
│   ├── exercise-icons.ts        # SVG markup + registry for workout icons (MingCute + Lucide)
│   ├── units.ts                 # Unit conversion (kg↔lbs, cm↔ft, ml↔floz)
│   ├── offline-queue.ts         # AsyncStorage-backed mutation queue
│   └── offline-mutation.ts      # withOfflineFallback() + isNetworkError() helpers
├── widgets/                    # Home screen widget plans + implementations (deferred)
├── supabase/
│   ├── schema.sql
│   ├── migrations/              # 14 migrations
│   └── functions/
│   └── functions/
│       ├── daily-summary/
│       ├── food-search/         # OpenFoodFacts proxy + Groq LLM fallback
│       ├── food-photo/          # Groq vision model for photo-based food recognition
│       └── ai-coach/            # Groq-powered AI fasting & fitness coaching
├── assets/
│   ├── screenshots/             # App screenshots for README
│   └── videos/                  # Bundled background video for login screen
└── [config files]
```

## Supabase Project

- **Project URL**: `https://zytqfjjvruehnkntojjd.supabase.co`
- **Project Ref**: `zytqfjjvruehnkntojjd`
- **CLI**: `supabase login` → `supabase link --project-ref zytqfjjvruehnkntojjd` → `supabase db push --linked`

## Feature Breakdown

### Home Tab
- Fasting Today panel with elapsed time, progress ring, and progress bar
- Workout Progress panel with circular progress rings per exercise (animated fill)
- Hydration panel with bottle presets, custom ml, progress bar, and goal cog
- Weight section with chart and tracker (animated line drawing)
- Daily Macros panel with 2×2 grid of macronutrient progress bars (animated fill)
- AI Insights panel with personalized summary and expandable chat input (powered by Groq `ai-coach` Edge Function)
- All panels stagger in on mount with fade+slide entrance animation
- Ambient floating background circles (lime/cyan/rose) drift slowly behind content

### Fast Tab
- Schedule selector (presets + custom)
- Custom start time: date/time picker (up to 3 days back) when starting a fast, with live schedule preview
- Edit start time during active fast via pencil icon in timer ring schedule strip
- Start/break/end fast with bottom-sheet confirmations (end eating window + discard fast). Animated confetti celebration on session complete.
- Timer counts DOWN, progress ring fills UP (spring-animated with glow pulse)
- Schedule strip inside timer ring shows date/time for Started, Eat window, Window closes (tap time to toggle elapsed/remaining)
- All buttons have scale-down press animation
- Notifications reschedule automatically when start time is edited
- Check-ins with mood chart + timeline
- Weekly calendar (7-day circle view) with connecting lines between consecutive fasting days
- Full month calendar modal (tap day for details) with session-aware connecting lines
- Previous fasts with limit (5 default) + Show All toggle, expandable detail + delete

### Workouts Tab
- Exercise panels: pushups, crunches, sit-ups, squats + custom
- Log sets via stepper controls (+/- buttons, preset chips, no keyboard)
- Edit daily goal via stepper + presets + custom input
- Remove exercises
- Default exercises seeded on first use
- **Calorie formula**: `reps × sets × calories_per_rep × (weight_kg / 70)` (uses 70kg fallback if no profile weight)

### Log Tab
- Macros panel at top, Log Meal button opens full-screen `LogMealModal`
- OpenFoodFacts search via Edge Function proxy + Groq LLM fallback (~1.5s response)
- Native system keyboard for search (no custom in-app keyboard)
- Quick-add common foods configurable via `EditQuickAddModal`
- Barcode scanner (wrapped in Modal) for food packaging
- Photo capture via `FoodCamera` component (`expo-camera`) or gallery via `expo-image-picker`
- Custom item form with stepper controls (no numeric TextInput)
- Items added directly to staging with qty 1 (no QuantityModal step)
- Meal builder staging area with auto-scroll, editable items (tap to adjust macros), totals + log button
- Full month `MealCalendarModal` with dot indicators and day-tap meal detail
- Date/time picker bottom-sheet (hour/minute scrollers + Yesterday/Today shortcuts)

### Me Tab
- First name display, unified achievements, weekly stats
- Weight tracking with chart, goal weight, unit preferences

### Period Tab
- CycleWheel SVG ring (200px) showing animated phase arcs (rose/sky/cyan/amber) with progress to next period
- PeriodCalendar full month grid with phase-colored day cells, predicted period dates, symptom dot indicators
- PeriodLogModal bottom-sheet for logging: flow intensity (4 levels), cramps, mood (7 options), energy (3 levels), headache/bloating/cravings toggles, free-text notes
- CycleInsights panel with phase-aware fasting recommendations and period countdown
- Cycle phase detection (menstrual/follicular/ovulatory/luteal) using user's logged history and configured settings
- Ovulation prediction: count backwards from predicted next period using luteal phase length
- Fertile window: 6-day window (5 days before ovulation through ovulation day)
- Prediction confidence scored from cycle variability (0-1)
- PeriodSettingsModal: configure cycle length (21-45), period duration (2-10), luteal phase (10-17) with steppers + presets
- Past Periods history list with start/end dates
- Home tab: Cycle Phase panel with phase badge and fasting tip
- AI coach context includes cycle phase, day, and fertile status
- Tab controlled by tracker toggle (hidden when disabled)

### Settings
- Profile details (name, gender, age, weight, height, BMI with color coding)
- Account (change email/password)
- Notifications preferences (iOS only — Android Expo Go skips notifications)
- Daily water goal presets (1.5L–3.5L)
- Preferences (weight/height/water unit selectors)
- Trackers (enable/disable Fasting, Workouts, Food, Period)
- Dark/light mode toggle
- Sign Out

Note: Settings are inline in the Profile tab (no standalone settings page). All headbars are clean (no bell icons, no cog icons).

## Notifications
- **Local push** (native only): `expo-notifications` — fast reminder, check-in reminder, water reminders, streak milestones. Scheduled on start fast, cancelled on break/end. Web silently no-ops. **Notifications are iOS-only on Expo Go (SDK 53+ removed Android push support).**
- **Email digest**: Supabase Edge Function `daily-summary` — nightly at user-configured time, queries food_log + water_log + workouts, sends via Resend API (only if `RESEND_API_KEY` env var is set on the edge function).
- **Personal-team iOS builds** do not support remote APNs; local scheduled notifications only. Remote push requires a paid Apple Developer account.

## Google SSO — Implementation Attempt (Incomplete)

Google Sign-In was partially implemented but **not working**. Below is what was tried, what's configured, and where it breaks.

### What's configured (working)

**Supabase (Management API):**
- Google auth provider enabled `external_google_enabled: True`
- Web Client ID set (redacted)
- Web Client Secret stored (hashed) in Supabase config
- `uri_allow_list`: `http://localhost:8081,exp://*,fasttrack://*,https://zytqfjjvruehnkntojjd.supabase.co`

**Google Cloud Console (user-created):**
- **Web OAuth client** named "FastTrack Web Client":
  - Client ID: (redacted)
  - Client Secret: (redacted)
  - Authorized redirect URIs:
    - `https://zytqfjjvruehnkntojjd.supabase.co/auth/v1/callback`
    - `https://auth.expo.io/@ashcdev2/FastTrack`
- **Android OAuth client**: (redacted)
- **iOS OAuth client**: (redacted)
- Consent screen in "Testing" mode (need to add test users or publish)

### Current code approach (`hooks/useAuth.ts`)

Uses `useAuthRequest` from `expo-auth-session` with `makeRedirectUri({ useProxy: true })` and `supabase.auth.signInWithIdToken()`. The Expo auth proxy URL `https://auth.expo.io/@ashcdev2/FastTrack` is used as the Google OAuth redirect URI. After auth, the ID token is exchanged with Supabase.

### Approaches tried (all failed)

| # | Approach | What happened |
|---|----------|---------------|
| 1 | `supabase.auth.signInWithOAuth` → `WebBrowser.openAuthSessionAsync` | "too many redirects" / redirect loop |
| 2 | Native OAuth flow with iOS reverse client ID redirect URI | Doesn't work in Expo Go (custom URL schemes not registered) |
| 3 | `Google.useIdTokenAuthRequest` with `iosClientId/androidClientId` (no redirectUri) | "access blocked: authorization error" (Testing mode restriction on web flow) |
| 4 | `Google.useIdTokenAuthRequest` with proxy URL as `redirectUri` | Proxy error page — "something went wrong" |
| 5 | Manual Google OAuth URL construction → `WebBrowser.openAuthSessionAsync` | Same errors (redirect chain issues) |
| 6 | `signInWithOAuth` with iOS client ID configured in Supabase | "requested path is invalid" |
| 7 | `Google.useIdTokenAuthRequest` without custom redirectUri (bare hook) | Falls back to `exp://` scheme — Google rejects as unregistered URI |
| 8 | `useAuthRequest` base hook with `makeRedirectUri({ useProxy: true })` | "access blocked" — current state |

### Root cause analysis

The core challenge is **redirect URI handling in Expo Go**:
- Google Web OAuth requires HTTPS redirect URIs, not custom schemes
- Expo Go uses `exp://` scheme which can't be registered in Google Cloud Console
- Expo auth proxy (`https://auth.expo.io/...`) provides a stable HTTPS URL but the proxy's redirect back to the app (via `exp://`) isn't consistently intercepted by `ASWebAuthenticationSession` on iOS
- `makeRedirectUri({ useProxy: true })` should handle this but `useProxy` isn't in the TypeScript types and may not work correctly in Expo SDK 54

### Likely fix path

1. **Switch to a development build** (not Expo Go) — custom URL schemes like `fasttrack://auth/callback` work reliably in standalone/dev builds
2. **Or use the `@react-native-google-signin/google-signin` package** in a dev build (native module)
3. **Or use `expo-dev-client`** which allows testing native modules without leaving Expo ecosystem
4. **Or add the user's email as a test user** in Google Cloud Console consent screen and use `supabase.auth.signInWithOAuth` with the Web client ID (may work once the Testing mode restriction is lifted)

### Files modified
- `hooks/useAuth.ts` — current state uses `useAuthRequest` + `makeRedirectUri({ useProxy: true })` + `signInWithIdToken`
- `.env` — no longer contains Google env vars (Web Client ID deleted and recreated)
- `app/(auth)/login.tsx` — has "Continue with Google" button wired to `signInWithGoogle()`
- `app/(auth)/signup.tsx` — has "Continue with Google" button
- `package.json` — `expo-auth-session`, `expo-web-browser`, `expo-crypto` installed

### Dependencies installed
- `expo-auth-session`
- `expo-web-browser`
- `expo-crypto`
- `@react-native-google-signin/google-signin` (installed but unused — native module doesn't work in Expo Go)

## Spacing Convention
- Panel-to-panel (across all tabs): `mb-section-gap` (32px)
- Section headings: `text-lg font-bold mb-4` (16px)
- List items within panels: `mb-3` (12px)

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=https://zytqfjjvruehnkntojjd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...```

## Deployment

- **Web**: `npx expo start --web --port 8081`
- **iOS (dev)**: `npx expo run:ios --device` (build + install to plugged-in iPhone)
- **iOS (OTA)**: `eas update --branch production --message "..."` (JS-only changes, no rebuild)
- **iOS (App Store)**: `eas build --profile production --platform ios` + `eas submit` (requires Apple Developer Program)
- **Edge Functions**: `supabase functions deploy daily-summary` / `supabase functions deploy food-search` / `supabase functions deploy food-photo` / `supabase functions deploy ai-coach`
- **TypeScript**: `npx tsc --noEmit`

See [Building for iOS (Standalone App)](#building-for-ios-standalone-app) above for the full iOS build workflow.

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
- [x] Database: 9 migrations (schema + profile settings + workouts + weight log + unit prefs)
- [x] Unit preferences (kg/lbs, cm/ft, ml/floz)
- [x] BMI instant update + color coding
- [x] Weekly calendar view (Zero-style circles)
- [x] Full month calendar modal
- [x] Previous fasts limit with Show All toggle
- [x] Auth redirect fix — useEffect + router.replace() for state-change navigation
- [x] iOS standalone build — EAS config, personal-team signing, OTA updates
- [x] Stitch visual redesign — Inter + Space Grotesk fonts, glass-panel cards, dark glass-morphism UI
- [x] MaterialCommunityIcons replacing Hugeicons throughout
- [x] Eating phase: cyan ring, "End Eating Window" button, remaining-time countdown
- [x] Edit Goal modal (bottom-sheet) replacing inline goal editor
- [x] Settings merged into Profile tab (no standalone settings page)
- [x] Bell/cog icons removed from all headers
- [x] Home tab is the only place for daily macros (MacroProgress removed from Profile)
- [x] Fast tab timer countdown fixed for eating phase (eatWindowEndStr computed from session.end_time)
- [x] FastingTimer labels simplified to "REMAINING"/"ELAPSED"
- [x] Round 1 design consistency — panel spacing, padding, border-radius, button sizes, input sizes standardized across all tab screens and components
- [x] All modal backdrops use Pressable with tap-to-dismiss (View→Pressable)
- [x] All delete confirmations use bottom-sheet modals (no inline blocks)
- [x] Home tab panels use glass-panel class (no inline rgba)
- [x] Content paddingBottom=85 across all tabs (flush with tab bar)
- [x] Food page redesign — LogMealModal, CustomKeyboard, QuantityModal, EditQuickAddModal, MealCalendarModal, inline custom form with steppers, dimming overlay, tap-off keyboard dismiss
- [x] Food search uses custom in-app QWERTY keyboard (no iOS system keyboard)
- [x] Query cache hydration on app boot (writes to AsyncStorage on every change, reads back on startup, filters stale >24h)
- [x] Offline mutation queue — all 8 mutation hooks wrapped with withOfflineFallback()
- [x] Queue processor skips failed items (doesn't block the rest), 500ms delay between retries
- [x] Food log staging persists to AsyncStorage (stagedItems, mealType, stagedDate)
- [x] CustomKeyboard shift toggle (uppercase/lowercase)
- [x] Session Complete celebration modal — bottom-sheet with trophy, stats: fasted/ate/total time, streak, completed
- [x] Roadmap expanded — 7 new items (watchOS, Live Activity, photo logging, My Meals, scheduled dark mode, menstrual cycle, AI coach)
- [x] Home tab section headings moved inside glass-panel cards (Fasting Today, Workout Progress, Hydration, Weight, Daily Macros)
- [x] Exercise icon system — 12 MingCute + Lucide icons, WorkoutIcon (SvgXml), icon picker, DB migration
- [x] Login screen video background — looping MP4 + 75% black overlay via expo-av, app icon, updated subtitle
- [x] Android Expo Go stable — expo-notifications require wrapped in try-catch for SDK 53+ compatibility
- [x] Water mutation double-safety — invalidateQueries after setQueryData
- [x] WeightChart fixes — chronological sort, deduplicated labels for 2-entry datasets
- [x] Water goal & progress presets in Settings, hydration celebration modal on Home, cog link to preferences
- [x] Roadmap updated with mobile improvements from explore agent — timer, offline queue, ErrorBoundary, cache perf, app.json cleanup
- [x] Water goal & progress presets in Settings, hydration celebration modal on Home, cog link to preferences
- [x] Auth callback route for email confirmation redirect
- [x] Android tab bar safe area via insets.bottom
- [x] Android startup hang fix — auth redirect and font timeout
- [x] Food logging redesign — native keyboard, larger fonts, no QuantityModal
- [x] Food search Groq LLM fallback (parallel Promise.any)
- [x] Edit staged items inline in MealBuilder
- [x] Auto-scroll to MealBuilder on item add with count badge
- [x] Modular tracker system — documented on roadmap for future implementation
- [x] Light mode redesign + auto dark mode — new LIGHT palette, `getAccentColors`/`getMealColors`, System/Dark/Light toggle, 52+ components updated
- [x] Hydration celebration race condition fix — ref starts as true, only flips after AsyncStorage confirm
- [x] AI Insights on Home tab — personalized summary with expandable Groq-powered chat input
- [x] Food photo capture — `FoodCamera` component uses `expo-camera`, sends to Groq Llama 4 Scout for macro estimation
- [x] Photo picker modal — bottom-sheet with "Take Photo" (via camera) or "Choose from Library" (via expo-image-picker)
- [x] Groq vision Edge Function (`food-photo`) — supports base64 + image URLs, MIME detection, returns food-search format
- [x] AI coach Edge Function (`ai-coach`) — Groq-powered with user fasting/nutrition/workout/weight context
- [x] My Meals library — save meal templates (multi-item collections) from MealBuilder, Today's Meals, and Meal Calendar with one-tap re-log, full CRUD manager in Profile
- [x] Schedule strip inside FastingTimer ring — date/time for Started / Eat window / Window closes, tap time to toggle elapsed/remaining, larger phase badge
- [x] Light mode redesign + auto dark mode — new LIGHT palette, `getAccentColors`/`getMealColors`, System/Dark/Light toggle, 52+ components updated
- [x] Custom fasting start time — date/time picker bottom-sheet (up to 3 days back) when starting fast, live schedule preview, `updateStartTime` mutation with notification rescheduling
- [x] Timer performance optimization — collapsed 4 concurrent `setInterval(1s)` into 2 (1 per screen), added AppState listener to pause timers when backgrounded, extracted `useFastingTimer` shared hook, removed ~96 lines of duplicated interval code
- [x] Menstrual cycle tracker — period_log table, cycle phase detection (menstrual/follicular/ovulatory/luteal), ovulation prediction, fertile window, CycleWheel SVG ring, PeriodCalendar month grid, PeriodLogModal symptom/flow logging, CycleInsights fasting tips, PeriodSettingsModal, AI coach cycle context, 6 components, 3 hooks, 1 migration
- [x] Connecting lines on calendar dots — session-ID-aware lines between consecutive fasting day dots on both WeeklyCalendar and FastCalendar; solid lines for continuous fasts, gap lines with per-segment coloring for transition days where one fast ends and another starts
- [x] Offline queue fixes — mutex lock on queue read-modify-write (prevents lost mutations), exponential backoff retry timer (failed items retry in seconds, not days), batch insert array handling (fixes corrupted food entries), stale item detection (removes items >72h)
- [x] Top-level ErrorBoundary — class component catching render-time crashes, theme-aware fallback UI with "Try Again" (resets boundary) and "Go Home" (navigates to tabs) buttons, dev-only error detail panel, placed in root layout wrapping Stack
- [x] UI animation overhaul — animated pressable scale feedback, smooth ring/bar fills via `withTiming`, skeleton shimmer sweep, tab bar icon bounce + pulse, staggered panel entrance on Home, animated header with breathing logo, splash/loading logo, ambient floating background circles, login entrance sequence (fade+scale+glow), gradient video overlay, barcode laser line, session confetti celebration, LayoutAnimation for expand/collapse, weight chart line drawing

## Next Steps

### Completed
| # | Feature | Status |
|---|---------|--------|
| 1 | **Stitch visual redesign** — Inter + Space Grotesk fonts, glass-panel cards, dark glass-morphism UI, MaterialCommunityIcons, lime/cyan accent palette | Done |
| 2 | **Settings merged into Profile tab** — Removed standalone `/settings` page, all settings live inline at the bottom of Profile | Done |
| 3 | **Header cleanup** — Bell and cog icons removed from all tab headers | Done |
| 4 | **Edit Goal modal** — Bottom-sheet modal replacing inline goal editor | Done |
| 5 | **Eating phase UI** — Cyan ring, prominent EATING WINDOW badge, "End Eating Window" button | Done |
| 6 | **Timer fix** — Countdown works during eating phase (eatWindowEndStr computed from session.end_time) | Done |
| 7 | **FastingTimer labels** — Simplified to "REMAINING"/"ELAPSED" for both phases | Done |
| 8 | **UI redesign** — Fresh palette, Plus Jakarta Sans, mood icons, responsive charts | Done |
| 9 | **Bug fixes / polish** — Theme tokens, hardcoded colors, web compat | Done |
| 10 | **Streak notifications** — Fast reminders, check-ins, water, milestones | Done |
| 11 | **Onboarding flow** — 5-step wizard | Done |
| 12 | **Barcode scanner** — Camera food scanning | Done |
| 13 | **Apple Health / Google Fit** — Weight, workouts, water sync | Done |
| 14 | **Export / reports** — CSV fasting history | Done |
| 15 | **Weekly/monthly insights** — Calorie trends, fasting consistency | Done |
| 16 | **Recent foods** — Quick re-log | Done |
| 17 | **Fasting journal** — Notes per session | Done |
| 18 | **Nutritional insights** — Proactive guidance | Done |
| 19 | **Custom meal templates** — One-tap logging | Done |
| 20 | **Fasting schedule presets** — Auto-suggest from history | Done |
| 21 | **Dark mode improvements** — AMOLED true-black | Done |
| 22 | **Animated achievements** — Unlock animations | Done |
| 23 | **Unit preferences** — kg/lbs, cm/ft, ml/floz | Done |
| 24 | **Weekly calendar** — Zero-style circle calendar | Done |
| 25 | **Full month calendar** — Tap day for fast details | Done |
| 26 | **Round 1 design consistency** — Standardized panels, buttons, modals, spacing across all screens | Done |
| 27 | **Food page redesign** — LogMealModal, CustomKeyboard, QuantityModal, EditQuickAddModal, MealCalendarModal, inline custom form, tap-off keyboard dismiss, dimming overlay | Done |
| 28 | **Offline support** — Query cache hydration, mutation queue (8 hooks), queue processor, food log staging persistence | Done |
| 29 | **Recent/repeat meals** — One-tap re-log from recently logged foods via RECENT grid in LogMealModal | Done |
| 30 | **Custom notification scheduling** — Time picker (instead of presets), per-type times, day-of-week filters, eating window reminder | Done |
| 31 | **Check-in cache fix** — Changed from `invalidateQueries` to `setQueryData` for instant UI update | Done |
| 32 | **Session Complete celebration** — Bottom-sheet modal with trophy, stats breakdown (fasted/ate/total time, streak, completed) after ending eating window | Done |
| 33 | **Roadmap expansion** — Added 7 new items: watchOS app, Live Activity, photo food logging, My Meals library, scheduled dark mode, menstrual cycle, AI fasting coach | Done |
| 34 | **Home tab design consistency** — Section headings (Fasting Today, Workout Progress, Hydration, Weight, Daily Macros) moved inside glass-panel cards | Done |
| 35 | **Exercise icon system** — 12 icons from MingCute (Apache 2.0) + Lucide (ISC), `WorkoutIcon` component via SvgXml, icon picker in AddExerciseModal with auto-guess, `icon_name` DB migration, seeded for 4 defaults | Done |
| 36 | **Login screen video background** — Looping MP4 with dimmed overlay (75% black) via expo-av. Web skips video (auto-play restrictions). App icon + updated subtitle. | Done |
| 37 | **Android Expo Go stability** — Wrapped `expo-notifications` require in try-catch; module unavailable on Android Expo Go (SDK 53+) no longer crashes the entire app | Done |
| 38 | **Water sync double-safety** — Added `invalidateQueries` after `setQueryData` in useWaterLog mutation for guaranteed UI consistency | Done |
| 39 | **WeightChart fixes** — Sort entries chronologically (oldest→newest) for correct line direction; deduplicate date labels for 2-entry datasets | Done |
| 40 | **Water goal & progress** — Daily water target presets (1.5L–3.5L) in Settings via goal store. Hydration Goal Reached celebration modal with trophy icon on Home tab. Cog icon on hydration panel deep-links to Preferences section. | Done |
| 41 | **Auth callback + email signup** — `app/auth/callback.tsx` handles post-confirmation redirect. `useAuth` passes `emailRedirectTo` so Supabase redirects back to app after email confirmation. | Done |
| 42 | **Android tab bar safe area** — Tab bar uses `insets.bottom` on Android to avoid system navigation overlay. iOS unchanged. | Done |
| 43 | **Android startup hang fix** — `app/index.tsx` auth redirect no longer blocks when no session and no onboarding key. Font loading has 10s timeout fallback. | Done |
| 44 | **Food logging redesign** — Native system keyboard instead of custom in-app QWERTY. Font sizes increased across the board. No QuantityModal — items added directly to staging. | Done |
| 45 | **Food search with Groq fallback** — OpenFoodFacts + Groq run in parallel via `Promise.any`. Returns results in ~1.5s. 5s/3s timeouts on fetch calls. | Done |
| 46 | **Edit staged items** — Tappable items in MealBuilder open bottom-sheet edit modal. Adjust quantity, calories, protein, carbs, fat with steppers and presets. | Done |
| 47 | **Auto-scroll on add + staged count badge** — When item is added to meal, view scrolls to MealBuilder. Badge shows "3 items staged — scroll down to review" near top. | Done |
| 48 | **AI Insights on Home tab** — Personalized summary text with expandable "Ask a question" Groq-powered chat input. Coach uses fasting, nutrition, workout, and weight context. | Done |
| 49 | **Food photo capture and analysis** — `FoodCamera` component using `expo-camera`. Photo picker modal with "Take Photo" (camera) / "Choose from Library" (gallery). Groq Llama 4 Scout vision model. | Done |
| 50 | **AI coach Edge Function** — `ai-coach` with Groq `llama-3.3-70b-versatile`. Accepts user data (streak, macros, water, workouts, weight) and returns personalized coaching responses. | Done |
| 51 | **My Meals library** — `my_meals` + `my_meal_items` DB tables, `useMyMeals` hook with offline queue support, `EditMyMealModal` (meal name + item management with steppers), `MyMealsManagerModal` (full CRUD with delete confirmation), MY MEALS section in LogMealModal showing templates with item previews, "Save as Meal" button in MealBuilder, save from Today's Meals and Meal Calendar, per-item Quick Add save, bookmark-plus icon on MealBuilder items | Done |
| 52 | **Edit/delete foods from calendar** — MealCalendarModal tap-to-edit with macro steppers and swipe-to-delete with bottom-sheet confirmation. Wired to `updateEntry` and `deleteEntry` from `useFoodLog` with offline queue support. | Done |
| 53 | **Schedule strip in timer ring** — FastingTimer center now shows date/time strip (Started · Eat window · Window closes) with Today/Tomorrow/weekday format. Tap time to toggle elapsed/remaining. Larger phase badge. | Done |
| 54 | **Modular tracker system** — `store/useTrackerStore.ts` (Zustand + AsyncStorage), `enabled_trackers JSONB` column on profiles, Settings → Trackers section with 4 toggleable trackers (Fasting, Workouts, Food, Period), 5th onboarding step with tracker selection, tab bar filtering via `href:null` with fixed tab order, conditional Home panels (Fasting, Workouts, Food), Profile always on far right | Done |
| 55 | **Light mode redesign + auto dark mode** — Complete light mode overhaul: new LIGHT palette with solid warm grays (WCAG AA), opaque white cards, `getAccentColors(theme)` for theme-aware accents (forest green in light, neon lime in dark), `getMealColors(theme)`. Auto dark mode with System/Dark/Light toggle. CSS variable-based glass-panel. 52+ components updated. | Done |
| 56 | **Custom fasting start time** — Date/time picker bottom-sheet (up to 3 days back) when starting a fast, with live schedule preview panel that updates as you adjust. Edit start time during active fast via pencil icon in timer ring schedule strip. `updateStartTime` mutation on session repositions the timeline and reschedules all notifications. | Done |
| 57 | **Timer performance optimization** — Collapsed 4 concurrent `setInterval(1s)` loops in `fast.tsx` and `index.tsx` into a single shared ticker per screen. Added `AppState` listener to pause timers when backgrounded to prevent battery drain and Android deep-sleep prevention. Extracted `useFastingTimer` shared hook into `hooks/`, removed ~96 lines of duplicated interval code. | Done |
| 58 | **Menstrual cycle tracker** — `period_log` table, cycle phase detection (menstrual/follicular/ovulatory/luteal), ovulation prediction, fertile window calculation with confidence scoring, `CycleWheel` SVG ring with phase arcs, `PeriodCalendar` month grid with phase-colored cells, `PeriodLogModal` bottom-sheet for flow/cramps/mood/energy/symptoms logging, `CycleInsights` phase-aware fasting recommendations, `PeriodSettingsModal` stepper configuration. 6 components, 3 hooks, 1 migration, tab bar integration, Home panel, AI coach context. 18 files, +1520 lines. | Done |
| 59 | **Connecting lines on calendar dots** — session-ID-aware lines between consecutive fasting day dots on both WeeklyCalendar and FastCalendar; solid lines for continuous fasts, gap lines with per-segment coloring for transition days where one fast ends and another starts | Done |
| 60 | **Offline queue fixes** — mutex lock on queue read-modify-write (prevents lost mutations), exponential backoff retry timer (failed items retry in seconds, not days), batch insert array handling (fixes corrupted food entries), stale item detection (removes items >72h) | Done |
| 61 | **Top-level ErrorBoundary** — class component catching render-time crashes, theme-aware fallback UI with "Try Again" (resets boundary) and "Go Home" (navigates to tabs) buttons, dev-only error detail panel, placed in root layout wrapping Stack | Done |
| 62 | **UI animation overhaul** — animated pressable scale feedback, smooth ring/bar fills via `withTiming`, skeleton shimmer sweep, tab bar icon bounce + pulse, staggered panel entrance on Home, animated header with breathing logo, splash/loading logo, ambient floating background circles, login entrance sequence (fade+scale+glow), gradient video overlay, barcode laser line, session confetti celebration, LayoutAnimation for expand/collapse, weight chart line drawing. 5 new components, 3 new hooks, 1 new dependency (expo-linear-gradient). | Done |
| 63 | **InnerLayout hooks-ordering fix** — Moved 4 `useEffect` hooks above the `if (!ready)` early return in `app/_layout.tsx` to prevent "Rendered more hooks than during the previous render" crash on startup. | Done |
| 64 | **WeightChart Reanimated strict mode fix** — Replaced `pathLength.value` read in JSX (`strokeDasharray`) with a `useState` (`dashArray`) to eliminate "Reading from `value` during component render" dev warning. | Done |
| 65 | **GlassPanel component migration** — Replaced CSS-based `.glass-panel` class (unresolvable on native due to CSS variables + `backdrop-filter`) with a theme-aware `GlassPanel` React component using inline `rgba()` values. Supports `as="pressable"` for tappable panels and `rounded={false}` for chart wrappers. Applied across 47 occurrences in 27 files. | Done |
| 66 | **Period log immediate cache update** — Added `setQueryData` to `usePeriodLog` mutation `onSuccess` so the calendar updates instantly after saving period data, without waiting for background refetch. Added `await refetch()` in `handleSave` as a secondary sync. | Done |
| 67 | **Cycle day counter fix** — Normalized `today` to midnight in `useCycleTracker` so `getDaysBetween` returns 0 for same-day comparisons instead of 1 (was incorrectly advancing "Day 1" → "Day 2" when marking today as period start). | Done |
| 68 | **Predicted period days** — Continuation days extend from each logged period start by `period_duration` setting. Removed `d > now` cutoff so future continuation days (e.g., today's start + 5 days) are predicted. Rendered as rose-tinted with dashed border, fully tappable. | Done |
| 69 | **PeriodLogModal state reset + error handling** — Added `useEffect` keyed on `dateStr` to reset all modal state between date selections (fixes stale state bug). Added try/catch around `onSave` in `handleMarkPeriodDay` and `handleEndPeriod` so errors don't prevent modal from closing. | Done |
| 70 | **OMAD text wrapping fix** — Added `numberOfLines={1}` to schedule preset label to prevent text wrapping on narrow Android screens. | Done |

### Remaining
| # | Feature | Effort | Description |
|---|---------|--------|-------------|
| 1 | **Biometric auth** | Small | Add optional Face ID / Touch ID (or fingerprint) protection on app launch. Use `expo-local-authentication` to enroll the user's biometrics. When enabled, the app shows a lock screen on startup (or after background timeout) that requires biometric verification before revealing any data. Respects the device's enrolled biometrics — no custom passcode fallback needed. |
| 2 | **Query-cache persistence perf** | Small | `app/_layout.tsx` re-serializes the entire query cache to AsyncStorage on every state change (debounced 1s). Switch to the installed-but-unused `@tanstack/query-async-storage-persister` for incremental writes, or skip writes for large/stale entries. |
| 3 | **Home screen widget** | Medium | Build an iOS widget (WidgetKit via `expo-dev-menu` + native module) and/or Android widget (AppWidget) that shows the current fasting state: timer countdown/elapsed, progress ring, and phase badge. Widget refreshes periodically (e.g., every 15 min on iOS, every 30 min on Android). Tapping the widget deep-links into the Fast tab. **Status**: Planned — full implementation at [widgets/PLAN.md](widgets/PLAN.md). Blocked on SDK 54→56 upgrade and App Groups entitlement verification. |
| 4 | **Apple Health sync** | Medium | Two-way sync with Apple Health (iOS) and Google Fit (Android). Write fasting sessions as "Time In Bed" (a common fasting workaround) or as AFib data. Sync weight logs (already stored locally) to Health, and pull workouts from Health into the workout log. Use `expo-health-connect` (Android) and a native HealthKit bridge (iOS). Show a sync status indicator in Profile. |
| 5 | **Fasting insights / weekly trends** | Medium | Add a dedicated insights section (either on Home tab or a new tab) with charts showing fasting consistency over time. Include: average fast duration per week, fasting frequency (days fasted vs days skipped), streak history graph, and eating window adherence %. Use `react-native-svg` for line/bar charts (same library already used for rings). Filter by 7d / 30d / 90d. |
| 6 | **Export data** | Medium | Allow users to download their data as CSV files. Options: export fasting history (all sessions with start/end/duration/status), food log (all entries with macros and dates), workout log (exercise type, reps, sets, calories). Generate CSVs on-device and share via the system share sheet (`expo-sharing`). Add an "Export" button in Profile settings. |
| 7 | **Accessibility** | Medium | Support Dynamic Type (iOS) / Font Size (Android) so system font scaling affects the app. Add proper `accessibilityLabel`, `accessibilityRole`, and `accessibilityState` to all interactive elements (buttons, toggles, chips, rings). Ensure sufficient color contrast ratios across both themes. Test with VoiceOver (iOS) and TalkBack (Android). |
| 8 | **Testing** | Medium | Set up Jest + React Native Testing Library. Unit tests for Zustand stores, integration tests for hooks (useFastingSession, useFoodLog, useProfile), E2E smoke tests (Detox/Maestro) for login→fast→log→end. |
| 9 | **App Store deployment + app.json cleanup** | Medium | Prepare the app for App Store and Google Play submission: distribution builds, screenshots, description, keywords, privacy policy, Apple review checklist. Also fix `app.json`: align Android `package` to `com.ashcdev2.fasttrack` (match iOS), remove duplicate `CAMERA` permission and unused `RECORD_AUDIO` permission. |
| 10 | **Multi-language support** | Large | Internationalize the entire app using `expo-localization` to detect the device language and `i18next` (or similar) for string lookups. Extract all user-facing strings into locale files (en.json as source, fr.json, es.json, etc.). Cover: auth screens, onboarding, all tab screens, modals, settings, notifications, and error messages. Start with English + 1-2 additional languages (Spanish, French). |
| 11 | **Social features** | Large | Add community features: share fasting achievements as images (streak, total fasts, weekly consistency) via the system share sheet. Optional "friends" system where users can follow each other's public stats (streak, total fasts, weekly avg). Lightweight challenges (e.g., "7-day streak challenge") with opt-in participation and a leaderboard. All social features must be opt-in with privacy controls. |
| 12 | **watchOS companion app** | Medium | Apple Watch app showing current fasting timer, progress ring, and phase badge. Quick actions: "Break Fast", "Log Water", "Log Mood". Uses `WatchConnectivity` to sync session state from iPhone. Complications for the watch face showing elapsed time and next milestone. |
| 13 | **Live Activity / Dynamic Island** | Medium | iOS 16+ Live Activity displaying the fasting countdown timer on the lock screen and Dynamic Island. Updates in real-time without opening the app. *Note: requires paid Apple Developer account for APNs push to update the Live Activity.* |
| 14 | **Photo food logging** | Medium | Snap a photo of a meal and estimate macros via a vision API (OpenAI Vision, Gemini, or Apple CoreML). Presents estimated food items for confirmation/adjustment before logging. Hugely reduces friction vs manual search/entry. |
| 15 | **Scheduled dark/light mode** | Small | Auto-switch theme based on time of day (dark at sunset, light at sunrise) rather than only following system appearance. Useful since fasting is time-bound and users often check the app at night. Toggle in Profile: Manual / System / Scheduled (with time pickers). |
| 16 | **AI fasting coach** | Large | Chat interface ("Ask Coach") that answers questions like "how am I doing?", "what should I eat to hit my protein?", "when should I start my next fast to hit my goal?", "why do I feel lightheaded?" Powered by an LLM (via Supabase Edge Function) with access to the user's fasting, food, workout, and weight data. Makes the app feel genuinely intelligent and personalized. |
| 17 | **Social sign-in (Apple / Google)** | Medium | Add Apple Sign In and Google Sign In as authentication options alongside email/password. Previous attempt failed due to Expo Go redirect URI limitations. **Current state**: Web OAuth client ID configured in Google Cloud + Supabase Google provider enabled; `expo-auth-session` + `expo-web-browser` + `expo-crypto` installed; "Continue with Google" button on login/signup screens wired to `signInWithGoogle()` in `useAuth.ts`. **Likely fix**: Switch to a development build (not Expo Go) where custom URL schemes like `fasttrack://auth/callback` are reliably intercepted by `ASWebAuthenticationSession`. See "Google SSO — Implementation Attempt" section above for full details on all approaches tried. |
