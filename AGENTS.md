# FastTrack — Intermittent Fasting, Macro & Workout Tracker

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

### Glass Panel Utility
All card containers must use the `glass-panel` utility class from `global.css`, not `c.cardBg`/`c.cardBorder` inline styles. This applies to all rounded-xl cards on every tab screen. Do NOT use inline `rgba` backgrounds — Home tab uses `glass-panel` class everywhere.

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
Three clear phases: **Idle** (schedule selector shown) → **Fasting** (ring fills, "Break Fast" button) → **Eating** (ring turns cyan, "End Eating Window" button). The eating phase timer counts down remaining eating time. Schedule selection is only shown when idle.

### ACCENT.lime / ACCENT.cyan / ACCENT.coral
`ACCENT.mint` is defined in the palette but never used in any UI component. All UI uses `ACCENT.lime` (#c3f400), `ACCENT.cyan` (#00daf3), or `ACCENT.coral` (#FF6B52) for the various accent roles.

### Custom In-App Keyboard (No iOS System Keyboard)
All text input uses a custom in-app QWERTY keyboard (`CustomKeyboard`) instead of the iOS system keyboard. Used for food search. Supports shift toggle (uppercase/lowercase via `arrow-up-bold` icon), backspace, space, and a magnifying glass search button. The keyboard renders inside a `<Modal>` and uses `useSafeAreaInsets` for bottom padding.

### LogMealModal — Full-Screen Food Logging Modal
Food logging happens inside a full-screen `<Modal>` (`LogMealModal`) with this layout:
- Fixed header + search bar + search results (outside ScrollView to stay visible when keyboard shows)
- Dimmed content area below (opacity 0.15 + overlay) when keyboard is active — tap overlay to dismiss keyboard
- Custom keyboard at the bottom
- Search bar is a `Pressable` (not `TextInput`) — tapping shows the custom keyboard
- `pointerEvents: "none"` on ScrollView when keyboard showing to prevent accidental taps

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
- `20250611000007_weight_log.sql` — weight tracking
- `20250611000008_unit_preferences.sql` — unit preferences (kg/lbs, cm/ft, ml/floz)
- `20250626000009_quick_add_foods.sql` — quick_add_foods JSONB column on profiles

### RLS
All tables have RLS enabled. Policies use `auth.uid() = user_id`.

## Project Structure

```
FastTrack/
├── app/
│   ├── _layout.tsx              # Root: global.css, QueryClientProvider, Stack, theme init
│   ├── index.tsx                # Auth redirect (login vs tabs)
│   ├── (auth)/
│   │   ├── _layout.tsx          # Auth stack
│   │   ├── login.tsx            # Email/password login
│   │   └── signup.tsx           # Sign up with display name
│   ├── (onboarding)/            # 4-step onboarding wizard
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
│   ├── CustomKeyboard.tsx       # In-app QWERTY keyboard (no iOS system keyboard)
│   ├── QuantityModal.tsx        # Bottom-sheet stepper for serving quantity
│   ├── EditQuickAddModal.tsx    # Multi-select chip grid for quick-add foods
│   ├── MealCalendarModal.tsx    # Full month calendar with day-tap meal detail
│   ├── BarcodeScanner.tsx       # Camera barcode scanner (wrapped in Modal)
│   ├── WaterTracker.tsx         # Bottle presets + custom ml (supports unit prefs)
│   ├── PreviousFasts.tsx        # Expandable list + delete + weekly calendar
│   ├── WeeklyCalendar.tsx       # 7-day circle calendar (Mon–Sun)
│   ├── FastCalendar.tsx         # Full month calendar modal
│   ├── FastingAchievements.tsx  # Unified fasting + workout achievements
│   ├── WeeklyStats.tsx          # Fasting + water + workout weekly stats
│   ├── CheckInPanel.tsx         # Mood + note (theme-aware)
│   ├── CheckInTimeline.tsx      # Timeline (theme-aware)
│   ├── MoodChart.tsx            # SVG mood graph (theme-aware)
│   ├── SettingsPanel.tsx        # Profile, account, notifications, preferences, appearance
│   ├── ExercisePanel.tsx        # Exercise card: progress, log, edit goal
│   ├── EditGoalModal.tsx        # Bottom-sheet goal editor (stepper + presets + custom)
│   ├── LogSetModal.tsx          # Log reps + sets (stepper controls)
│   ├── AddExerciseModal.tsx     # Add custom exercise modal
│   ├── WeightTracker.tsx        # Weight logging + recent entries (supports unit prefs)
│   ├── WeightChart.tsx          # SVG weight line chart
│   ├── GlassPanel.tsx           # Shared glass-card wrapper
│   ├── ProgressRing.tsx         # Reusable SVG progress ring
│   ├── OfflineBanner.tsx        # Animated offline banner when connectivity lost
│   ├── Toast.tsx                # Animated toast notification overlay
│   ├── Skeleton.tsx             # Reusable loading skeleton with shimmer
│   └── FoodLogItem.tsx          # Meal entry card (theme-aware)
├── hooks/
│   ├── useAuth.ts               # Auth (signup accepts displayName)
│   ├── useFastingSession.ts     # Session CRUD + streak + realtime
│   ├── useFastCheckIns.ts       # Check-in CRUD
│   ├── useFoodLog.ts            # Food entries + batch add
│   ├── useWaterLog.ts           # Water tracking
│   ├── useProfile.ts            # Profile CRUD + password + email + notifications + unit prefs
│   ├── useWeeklyFastingStats.ts # Weekly fasting stats
│   ├── useWeeklyWaterStats.ts   # Weekly water stats
│   ├── useWorkoutGoals.ts       # Workout goals CRUD + seed defaults
│   ├── useWorkoutLog.ts         # Log sets, today totals, weekly stats, calorie calc, streaks
│   ├── useWeightLog.ts          # Weight logging + stats
│   ├── useFastCalendar.ts       # Monthly session fetch for calendar
│   ├── useConnectivity.ts       # NetInfo connectivity detection
│   ├── useOfflineQueueProcessor.ts # Replays queued mutations on reconnect
│   └── useToast.ts              # Toast notification state
├── store/
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
│   ├── units.ts                 # Unit conversion (kg↔lbs, cm↔ft, ml↔floz)
│   ├── offline-queue.ts         # AsyncStorage-backed mutation queue
│   └── offline-mutation.ts      # withOfflineFallback() + isNetworkError() helpers
├── supabase/
│   ├── schema.sql
│   ├── migrations/              # 10 migrations
│   └── functions/
│       ├── daily-summary/
│       └── food-search/         # OpenFoodFacts proxy + retry logic
├── assets/
│   └── screenshots/             # App screenshots for README
└── [config files]
```

## Supabase Project

- **Project URL**: `https://zytqfjjvruehnkntojjd.supabase.co`
- **Project Ref**: `zytqfjjvruehnkntojjd`
- **CLI**: `supabase login` → `supabase link --project-ref zytqfjjvruehnkntojjd` → `supabase db push --linked`

## Feature Breakdown

### Fast Tab
- Schedule selector (presets + custom)
- Start/break/end fast with bottom-sheet confirmations (end eating window + discard fast)
- Timer counts DOWN, progress ring fills UP
- Check-ins with mood chart + timeline
- Weekly calendar (7-day circle view)
- Full month calendar modal (tap day for details)
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
- OpenFoodFacts search via Edge Function proxy + custom in-app QWERTY keyboard (no iOS system keyboard)
- Quick-add common foods configurable via `EditQuickAddModal`
- Barcode scanner (wrapped in Modal) for food packaging
- Custom item form with stepper controls (no numeric TextInput)
- Quantity stepper modal before adding to staging
- Meal builder staging area with totals + log button
- Full month `MealCalendarModal` with dot indicators and day-tap meal detail
- Date/time picker bottom-sheet (hour/minute scrollers + Yesterday/Today shortcuts)

### Me Tab
- First name display, unified achievements, weekly stats, macro progress
- Weight tracking with chart, goal weight, unit preferences

### Settings
- Profile details (name, gender, age, weight, height, BMI with color coding)
- Account (change email/password)
- Notifications preferences
- Preferences (weight/height/water unit selectors)
- Dark/light mode toggle
- Sign Out

Note: Settings are inline in the Profile tab (no standalone settings page). All headbars are clean (no bell icons, no cog icons).

## Notifications
- **Local push** (native only): `expo-notifications` — fast reminder, check-in reminder, water reminders, streak milestones. Scheduled on start fast, cancelled on break/end. Web silently no-ops.
- **Email digest**: Supabase Edge Function `daily-summary` — nightly at user-configured time, queries food_log + water_log + workouts, sends via Resend API (only if `RESEND_API_KEY` env var is set on the edge function).
- **Personal-team iOS builds** do not support remote APNs; local scheduled notifications only. Remote push requires a paid Apple Developer account.

## Spacing Convention
- Panel-to-panel (across all tabs): `mb-section-gap` (32px)
- Section headings: `text-lg font-bold mb-4` (16px)
- List items within panels: `mb-3` (12px)

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=https://zytqfjjvruehnkntojjd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Deployment

- **Web**: `npx expo start --web --port 8081`
- **iOS (dev)**: `npx expo run:ios --device` (build + install to plugged-in iPhone)
- **iOS (OTA)**: `eas update --branch production --message "..."` (JS-only changes, no rebuild)
- **iOS (App Store)**: `eas build --profile production --platform ios` + `eas submit` (requires Apple Developer Program)
- **Edge Functions**: `supabase functions deploy daily-summary` / `supabase functions deploy food-search`
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
| 11 | **Onboarding flow** — 4-step wizard | Done |
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

### Remaining
| # | Feature | Effort | Description |
|---|---------|--------|-------------|
| 1 | **Water goal & progress** | Small | Let users set a daily water target (e.g., 2L / 64 fl oz) in settings. Display a progress ring on the Home tab next to the macro rings, filling as water is logged throughout the day. Surface remaining amount (e.g., "1.2L remaining") and celebrate when the goal is hit. |
| 2 | **Edit/delete foods from calendar** | Small | The MealCalendarModal currently shows what was eaten on a given day but provides no way to modify entries. Add tap-to-edit (opens a pre-filled form to update serving size or macros) and swipe-to-delete (with confirmation) directly inside the calendar detail panel. |
| 3 | **Auto dark mode** | Small | Currently the app defaults to dark mode with a manual toggle in Profile. Integrate `useColorScheme()` from react-native to detect the system's Appearance setting and switch automatically. Keep the manual toggle as an override — when set to "System", follow the OS; when set to Light or Dark, lock to that mode. |
| 4 | **Biometric auth** | Small | Add optional Face ID / Touch ID (or fingerprint) protection on app launch. Use `expo-local-authentication` to enroll the user's biometrics. When enabled, the app shows a lock screen on startup (or after background timeout) that requires biometric verification before revealing any data. Respects the device's enrolled biometrics — no custom passcode fallback needed. |
| 5 | **Home screen widget** | Medium | Build an iOS widget (WidgetKit via `expo-dev-menu` + native module) and/or Android widget (AppWidget) that shows the current fasting state: timer countdown/elapsed, progress ring, and phase badge. Widget refreshes periodically (e.g., every 15 min on iOS, every 30 min on Android). Tapping the widget deep-links into the Fast tab. |
| 6 | **Apple Health sync** | Medium | Two-way sync with Apple Health (iOS) and Google Fit (Android). Write fasting sessions as "Time In Bed" (a common fasting workaround) or as AFib data. Sync weight logs (already stored locally) to Health, and pull workouts from Health into the workout log. Use `expo-health-connect` (Android) and a native HealthKit bridge (iOS). Show a sync status indicator in Profile. |
| 7 | **Fasting insights / weekly trends** | Medium | Add a dedicated insights section (either on Home tab or a new tab) with charts showing fasting consistency over time. Include: average fast duration per week, fasting frequency (days fasted vs days skipped), streak history graph, and eating window adherence %. Use `react-native-svg` for line/bar charts (same library already used for rings). Filter by 7d / 30d / 90d. |
| 8 | **Export data** | Medium | Allow users to download their data as CSV files. Options: export fasting history (all sessions with start/end/duration/status), food log (all entries with macros and dates), workout log (exercise type, reps, sets, calories). Generate CSVs on-device and share via the system share sheet (`expo-sharing`). Add an "Export" button in Profile settings. |
| 9 | **Accessibility** | Medium | Support Dynamic Type (iOS) / Font Size (Android) so system font scaling affects the app. Add proper `accessibilityLabel`, `accessibilityRole`, and `accessibilityState` to all interactive elements (buttons, toggles, chips, rings). Ensure sufficient color contrast ratios across both themes. Test with VoiceOver (iOS) and TalkBack (Android). |
| 10 | **Testing** | Medium | Set up a testing framework (Jest + React Native Testing Library). Write unit tests for all Zustand stores (fasting store, goal store, food log store). Write integration tests for critical hooks (useFastingSession, useFoodLog, useProfile). Add E2E smoke tests (Detox or Maestro) covering the core flow: login → start fast → log food → end fast → view summary. |
| 11 | **App Store deployment** | Medium | Prepare the app for App Store and Google Play submission. Create iOS build profiles for distribution (vs development). Generate required screenshots (6.7" and 5.5" for iOS, various Android sizes). Write App Store description, keywords, and privacy policy. Run through Apple's review checklist (no push without paid account, test IAP if any). Submit via `eas submit`. |
| 12 | **Multi-language support** | Large | Internationalize the entire app using `expo-localization` to detect the device language and `i18next` (or similar) for string lookups. Extract all user-facing strings into locale files (en.json as source, fr.json, es.json, etc.). Cover: auth screens, onboarding, all tab screens, modals, settings, notifications, and error messages. Start with English + 1-2 additional languages (Spanish, French). |
| 13 | **Social features** | Large | Add community features: share fasting achievements as images (streak, total fasts, weekly consistency) via the system share sheet. Optional "friends" system where users can follow each other's public stats (streak, total fasts, weekly avg). Lightweight challenges (e.g., "7-day streak challenge") with opt-in participation and a leaderboard. All social features must be opt-in with privacy controls. |
