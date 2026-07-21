# FastTrack

**Intermittent fasting, workout & macro tracker built with Expo + Supabase.**

A lightweight, streamlined mobile app for intermittent fasting cycle tracking, workout logging, nutrition and water tracking, period/cycle tracking, and AI-powered coaching — all at zero cost.

Existing fasting/fitness tracker apps have become visually cluttered and rely heavily on aggressive monetisation via premium tiers. I built this to escape that model and return to a straightforward, feature-rich experience at zero cost.

Expo's unified codebase reduces the overhead of native development while maintaining a high-performance experience across both iOS and Android.

---

## Screenshots

| Fasting | Workouts | Food Logging |
|---------|----------|--------------|
| ![Fast Tab](assets/screenshots/ft_fasting.PNG) | ![Workouts Tab](assets/screenshots/ft_workouts.PNG) | ![Nutrition Tab](assets/screenshots/ft_nutrition.PNG) |

---

## Features

### Fasting
- **Countdown timer** with animated SVG progress ring, dynamic phase labels
- **Custom start time** — pick any start date/time up to 3 days back before starting a fast, or edit it during an active fast via the timer ring's pencil icon
- **Schedule presets**: 14:10, 16:8, 18:6, 20:4, OMAD — plus custom via stepper
- **Weekly calendar** showing which days you fasted, with session-aware connecting lines between consecutive fasts
- **Full month calendar** with tap-to-view fast details
- **Mood check-ins** during fasts with chart and timeline
- **Previous fasts** list with expandable detail and bottom-sheet delete
- **End eating / discard fast** via bottom-sheet confirmation modals

### Workouts
- **Exercise panels** for pushups, crunches, sit-ups, squats + custom exercises
- **12 SVG exercise icons** (MingCute + Lucide) with theme-tinting and icon picker
- **Quick-log rep chips** (10/15/20/25/30 + custom) with confirmation bottom-sheet
- **Daily goal editor** via bottom-sheet modal with presets + stepper
- **Progress tracking** with inline progress rings
- **Exercise reordering** with up/down arrows
- **Calorie estimation** based on reps, sets, and body weight
- **Weekly calendar** (7-day circle strip) and **full month calendar** with connecting lines
- **30-day trends chart** (SVG line) with reps/calories toggle
- **Weekly stats** (total reps, sets, calories)
- **AI-powered workout insight** — dynamic Groq-generated encouragement after logging sets
- **Workout groups** — organize exercises into named groups

### Nutrition
- **Full-screen food logging** (`LogMealModal`) with search, quick-add, custom form, and meal builder
- **Food search** via OpenFoodFacts Edge Function proxy with native system keyboard and Groq LLM fallback
- **Quick-add** common foods, configurable via multi-select chip editor
- **Custom item form** with stepper controls (no system keyboard needed)
- **Barcode scanner** for packaged foods
- **Photo food logging** via camera or gallery with Groq Llama 4 Scout vision model
- **Meal calendar** with month view, dot indicators, and day-tap meal details with edit/delete
- **Date/time picker** bottom-sheet with Yesterday/Today shortcuts
- **My Meals** library — save and re-log multi-item meal templates with one tap
- **Water tracking** with selectable presets and custom input
- **AI Insights** on Home tab with personalized fasting/nutrition/workout summary
- **AI Coach** chat (Groq-powered) for nutrition, fasting, and workout guidance

### Profile & Settings
- **Weight tracking** with chart, goal weight, weight change indicator
- **Unit preferences**: kg/lbs, cm/ft, ml/fl oz
- **Dark/light/system mode** toggle with auto dark mode support and full light palette
- **Modular tracker system** — enable/disable Fasting, Workouts, Food, or Period independently
- **Local notifications** for fast reminders, water, and milestones
- **Settings inline** (no standalone settings page)
- **Dynamic fasting phase insights** during active fasts

### Period Tracker
- **CycleWheel** — animated SVG ring showing phase arcs (menstrual/follicular/ovulatory/luteal) with day counter
- **PeriodCalendar** — full month grid with phase-colored cells, predicted period dates, and symptom indicators
- **Symptom logging** — flow intensity (4 levels), cramps, mood (7 options), energy, headache/bloating/cravings
- **Phase-aware fasting recommendations** (longer fasts in follicular, shorter in luteal)
- **Ovulation prediction** and **fertile window** (6-day window, 5 days before ovulation + ovulation day)
- **Cycle settings** — configurable cycle length (21-45), period duration (2-10), luteal phase (10-17)
- **AI coach integration** — cycle phase context for personalized guidance
- **Home tab panel** with phase badge and fasting tip

### UI & Animations
- **GlassPanel** — theme-aware semi-transparent card component used across all screens
- **Staggered panel entrance** on Home tab with fade-in-up animations
- **Breathing logo** with spring pulse on splash screen
- **Ambient floating background circles** (lime/cyan/rose) behind content
- **Animated pressables** with scale-down feedback on all interactive elements
- **Tab bar icon bounce + pulse** animation
- **Login entrance sequence** — logo springs in, form fields stagger in
- **Confetti celebration** on session complete
- **Skeleton shimmer** loading states on key screens
- **ErrorBoundary** — top-level crash recovery with theme-aware fallback UI

### Offline Support
- **Query cache hydration** — last-known data shown on app boot without network
- **Mutation queue** — all inserts/updates/deletes enqueue when offline, replay on reconnect
- **Smart queue processor** — skips individual failed items, retries with delay
- **Food log staging persistence** — meal building survives app restart
- **Connectivity detection** via NetInfo with animated offline banner

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54 + Expo Router (file-based routing) |
| UI | React Native 0.81 + NativeWind v4 (Tailwind CSS) |
| Fonts | Inter + Space Grotesk (via `@expo-google-fonts/...`) |
| State | Zustand (fasting, goals, theme, food log staging) |
| Offline | NetInfo + AsyncStorage mutation queue + query cache hydration |
| Data Fetching | TanStack Query |
| AI | Groq (`llama-3.3-70b-versatile` + `llama-4-scout-17b-16e-instruct` vision model) via Supabase Edge Functions |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Edge Functions) |
| Auth | Supabase Auth + expo-secure-store (native) / localStorage (web) |
| Native Modules | expo-camera (barcode), expo-notifications, expo-secure-store |
| Icons | MaterialCommunityIcons (`@expo/vector-icons`) |
| Animations | react-native-reanimated |
| Charts | react-native-svg |
| Edge Functions | `food-search` (OpenFoodFacts proxy + Groq LLM fallback), `food-photo` (Groq vision analysis), `ai-coach` (personalized fasting/nutrition/workout guidance), `daily-summary` (email digest) |
| Dates | date-fns |
| OTA Updates | EAS Update |
| iOS Build | EAS Build + personal-team signing (no Apple Developer Program needed for personal use) |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for database)

### Installation

```bash
git clone https://github.com/ashcdev-hub/FastTrack.git
cd FastTrack
npm install
```

### Environment Variables

Create a `.env` file:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Running

```bash
npx expo start --web --port 8081    # Web
npx expo start --ios                 # iOS
npx expo start --android             # Android
```

### Building for iPhone (Standalone App)

You can build and install FastTrack directly on your iPhone **without an Apple Developer Program membership** (free, using a personal team). Full instructions are in [AGENTS.md](AGENTS.md#building-for-ios-standalone-app).

Quick summary:
```bash
npm i -g eas-cli
eas login
eas init                            # one-time
eas update:configure                # one-time
npx expo prebuild --clean --platform ios
# Open ios/FastTrack.xcworkspace in Xcode, set Personal Team signing
npx expo run:ios --device           # build + install to your iPhone
```

For JS-only changes after first install:
```bash
eas update --branch production --message "fix description"
```

---

## Project Structure

```
FastTrack/
├── app/                    # Expo Router screens
│   ├── (tabs)/             # Bottom tab navigation
│   │   ├── index.tsx       # Home tab (daily overview)
│   │   ├── fast.tsx        # Fast tab (timer, schedule)
│   │   ├── workouts.tsx    # Workouts tab
│   │   ├── log-food.tsx    # Log tab
│   │   └── profile.tsx     # Profile tab (with settings inline)
│   ├── (auth)/             # Login & signup
│   └── (onboarding)/       # Onboarding wizard
├── components/             # 30 reusable components
├── hooks/                  # 15 custom hooks
├── lib/                    # Utilities, types, theme, offline support
├── store/                  # Zustand stores
└── supabase/               # Schema, migrations, edge functions
```

---

## Database

16 migrations covering:

| Migration | Description |
|-----------|-------------|
| `initial_schema` | Core tables (profiles, fasting_sessions, food_log, water_log, etc.) |
| `auto_profile_trigger` | Auto-create profile on signup |
| `fast_check_ins` | Mood check-in support |
| `add_fasting_schedule` | Schedule column on fasting sessions |
| `profile_settings` | Gender, age, height, BMI, notifications |
| `update_profile_trigger` | Trigger copies display_name |
| `workouts` | Workout goals and log tables |
| `weight_log` | Weight tracking with auto-sync to profile |
| `unit_preferences` | User preferred units (kg/lbs, cm/ft, ml/floz) |
| `quick_add_foods` | Quick-add food names stored on profiles |
| `onboarding_completed` | Onboarding completion flag on profiles |
| `add_workout_icon_name` | SVG workout icon names on workout_goals |
| `my_meals` | Meal template library (my_meals + my_meal_items) |
| `enabled_trackers` | Toggleable tracker preferences (Fasting, Workouts, Food, Period) |
| `period_tracker` | Period log table + cycle settings on profiles |
| `workout_sort_order` | Sort order column on workout_goals for exercise reordering |
| `workout_groups` | Workout group tables for organizing exercises |

All tables have RLS enabled with `auth.uid() = user_id` policies.

---

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run `npx tsc --noEmit` to verify TypeScript
4. Submit a pull request

---

## License

All Rights Reserved — view-only. See [LICENSE](LICENSE) for details.
You may view this code, but you may not use, copy, modify, or distribute it.

## Author

Ash Eskrett
