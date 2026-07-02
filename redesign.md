# FastTrack — Google Stitch Redesign

> **Historical document**: This file documents the initial Stitch-to-production redesign process.
> Some references (e.g., Plus Jakarta Sans → Inter + Space Grotesk, component structure changes)
> have since been implemented; others are superseded. See `design.md` for the current design system.

## Design Tokens (from Stitch)

### Colors (Dark Mode Only)

```
background / surface-dim:    #131313
surface-container-lowest:    #0e0e0e
surface-container-low:       #1c1b1b
surface-container:           #201f1f
surface-container-high:      #2a2a2a
surface-container-highest:   #353535 / #353534
surface-bright:              #393939
surface-variant:             #353534

primary (text):              #ffffff
on-surface:                  #e5e2e1
on-surface-variant:          #c4c9ac

primary-container / lime:    #c3f400 (also #ccff00)
primary-fixed:               #c3f400
primary-fixed-dim:           #abd600
on-primary:                  #283500
on-primary-fixed:            #161e00
on-primary-fixed-variant:    #3c4d00
on-primary-container:        #556d00
inverse-primary:             #506600
surface-tint:                #abd600

secondary:                   #bdf4ff
secondary-fixed:             #9cf0ff
secondary-fixed-dim:         #00daf3
secondary-container:         #00e3fd
on-secondary:                #00363d
on-secondary-fixed:          #001f24
on-secondary-fixed-variant:  #004f58
on-secondary-container:      #00616d

tertiary:                    #ffffff
tertiary-fixed:              #d2e5f5
tertiary-fixed-dim:          #b6c9d8
on-tertiary:                 #21323e
on-tertiary-fixed:           #0b1d29
on-tertiary-fixed-variant:   #374956
tertiary-container:          #d2e5f5
on-tertiary-container:       #556774

error:                       #ffb4ab
on-error:                    #690005
error-container:             #93000a
on-error-container:          #ffdad6

outline:                     #8e9379
outline-variant:             #444933

inverse-surface:             #e5e2e1
inverse-on-surface:          #313030
```

### Typography

| Token | Font | Size | Line H | Weight | Letter-spacing |
|-------|------|------|--------|--------|----------------|
| display-lg | Inter | 48px | 56px | 700 | -0.02em |
| headline-lg | Inter | 32px | 40px | 700 | -0.01em |
| headline-lg-mobile | Inter | 28px | 34px | 700 | — |
| body-md | Inter | 16px | 24px | 400 | — |
| stats-xl | Space Grotesk | 40px | 40px | 600 | -0.04em |
| label-caps | Space Grotesk | 12px | 16px | 700 | 0.1em |

**Imports needed:**
- `@expo-google-fonts/inter` (Inter_400Regular, Inter_700Bold, Inter_800ExtraBold)
- `@expo-google-fonts/space-grotesk` (SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold)

### Spacing

| Token | Value |
|-------|-------|
| unit | 4px |
| stack-gap | 12px |
| section-gap | 32px |
| container-padding | 20px |
| touch-target | 44px |

### Border Radius

| Token | Value |
|-------|-------|
| default | 2px (0.125rem) |
| lg | 4px (0.25rem) |
| xl | 8px (0.5rem) |
| full | 12px (0.75rem) |

### Glass Panel (reusable component)

```
background: rgba(28, 28, 30, 0.8)
backdrop-filter: blur(20px)   [iOS only; fallback on web]
border: 1px solid rgba(44, 44, 46, 1)
border-radius: 8px (0.5rem / rounded-xl)
```

### Icons

Replace Hugeicons → MaterialCommunityIcons from `@expo/vector-icons`.

Mapping (Stitch icon name → MaterialCommunityIcons name):
| Stitch Icon | MaterialCommunityIcons |
|-------------|----------------------|
| dashboard | view-dashboard |
| timer | timer-outline |
| fitness_center | dumbbell |
| restaurant | food-apple |
| person | account-circle-outline |
| notifications | bell-outline |
| bolt | lightning-bolt |
| stop_circle | stop-circle-outline |
| sentiment_satisfied | emoji-happy |
| sentiment_neutral | emoji-neutral |
| sentiment_dissatisfied | emoji-sad |
| add | plus |
| remove | minus |
| add_circle | plus-circle-outline |
| search | magnify |
| barcode_scanner | barcode-scan |
| egg | egg-outline |
| rice_bowl | rice |
| coffee | coffee-outline |
| query_stats | chart-timeline-variant |
| directions_run | run |
| timer (filled) | timer |
| person (filled) | account-circle |
| fitness_center (filled) | dumbbell |
| restaurant (filled) | food-apple |

## Screen-by-Screen Changes

### 1. Home Screen (Fast Tab) — `app/(tabs)/index.tsx`

**Header:**
- Fixed top bar with avatar circle (32px) + "FastTrack" title + notifications bell icon
- backdrop-blur-xl, border-b border-surface-variant/20
- height: touch-target (44px), px: container-padding (20px)

**Sections (vertical, space-y-section-gap = 32px):**

1. **Fasting Today Section**
   - Label caps "FASTING TODAY" with percentage right-aligned
   - Glass panel card with:
     - Left: stats-xl elapsed time (e.g. "14h 20m") + label "ELAPSED OF 16H GOAL"
     - Right: SVG progress ring (r=40, stroke 8, track #1c1b1b, indicator #c3f400)
     - Bottom: mini progress bar (h-1, bg-surface-variant/30, fill bg-primary-fixed)

2. **Workout Progress Section**
   - Label caps "WORKOUT PROGRESS"
   - Glass panel card with exercise entries:
     - Icon (material) + name + "50/100" right-aligned
     - Progress bar (h-1.5, bg-secondary-fixed-dim)

3. **Hydration Section**
   - Label caps "HYDRATION" + "1750 / 3000 ml" right-aligned
   - Glass panel card:
     - Bottle preset buttons (250ml, 500ml, 750ml) — horizontal scroll
     - "Add Water" full-width button (bg-primary-fixed, text-on-primary-fixed)

4. **Daily Macros Section**
   - Label caps "DAILY MACROS"
   - 2x2 grid of glass panel cards:
     - Calories, Protein, Carbs, Fat
     - Each: value + unit + progress bar with different colors:
       - Calories → bg-primary-container
       - Protein → bg-tertiary-fixed-dim
       - Carbs → bg-secondary-fixed
       - Fat → bg-error

**Bottom Nav:**
- 5 tabs: Home, Fast, Workout, Food, Profile
- Active tab: filled icon + bold text (text-primary-fixed)
- Inactive tabs: opacity-60
- bg-background/80 backdrop-blur-xl, border-t border-surface-variant/20

### 2. Fast Tab (Timer) — `app/(tabs)/index.tsx` (integrated with Home)

Actually, the Stitch design merges Fast tab into the dashboard. The existing timer is combined with the home screen.

**Fast-specific layout:**
- "Current Protocol" header with schedule name + bolt icon
- Large SVG progress ring centerpiece (320px max)
- Elapsed time in stats-xl (e.g. "12:45:28")
- "AUTOPHAGY ACTIVE" badge (green dot + label)
- "End Fast" button (bg-primary-container, lime glow shadow)
- Mood check-in grid (3 moods: HAPPY, NEUTRAL, LOW ENERGY)
- Schedule preset selector (horizontal tabs: 14:10, 16:8, 18:6, 20:4, OMAD)
- Insights mini-card (gradient border, progress bar)

### 3. Workouts Tab — `app/(tabs)/workouts.tsx`

**Changes:**
- "SESSION ACTIVE" label caps + "Daily Burn" heading
- Exercise panels with:
  - Category label (e.g. "UPPER BODY", "CORE", "LEGS")
  - Exercise name in headline-lg
  - Progress bar (h-1, bg-primary-fixed or bg-secondary-fixed-dim when complete)
  - Stepper controls (+/- buttons, centered value display)
  - Reps count display
- Add custom exercise button (dashed border)
- Motivation banner at bottom

**Stepper control (reusable):**
```
bg-surface-container-high, rounded, p-1
- button (touch-target square, hover effect)
- center: value (stats-xl 32px) + "REPS TODAY" label
+ button (touch-target square, hover effect)
```

### 4. Log/Food Tab — `app/(tabs)/log-food.tsx`

**Changes:**
- Search bar with leading magnify icon + barcode scanner button
- Daily macro goal summary card with 3 SVG progress rings (PRO, CARB, FAT)
- Quick add grid (2x2) with icon + name + kcal
- Water tracker with:
  - Left accent border (border-l-secondary-fixed-dim)
  - Current/total display
  - Goal progress bar (h-3)
  - 3 bottle presets (250ml, 500ml, 750ml)
- Recent food logs with thumbnails

### 5. Profile/Me Tab — `app/(tabs)/profile.tsx`

Extend the same design language:
- Glass panel cards
- Same color/typography tokens
- Updated icon mapping

### 6. Bottom Tab Nav — `app/(tabs)/_layout.tsx`

Replace Hugeicons with MaterialCommunityIcons.
5 tabs: Home (view-dashboard), Fast (timer-outline), Workout (dumbbell), Food (food-apple), Profile (account-circle-outline).
Active: filled variation + bold tab label.

### 7. Settings — `app/settings.tsx`

Update to use new color/typography tokens.

## Files to Modify

### Core Configuration
- `tailwind.config.js` — add new color tokens, font families, spacing, border radius
- `global.css` — add glass-panel class, progress ring styles
- `lib/theme-colors.ts` — complete overhaul to Stitch palette (dark theme only or both)

### Fonts
- `app/_layout.tsx` — replace font loading (PlusJakartaSans → Inter + Space Grotesk)

### Icons
- Remove `@hugeicons/core-free-icons`, `@hugeicons/react-native` from package.json
- Install `@expo/vector-icons` (bundled but need import changes)

### Components (New/Modified)
- Create `components/GlassPanel.tsx` — reusable glass card wrapper
- Create `components/ProgressRing.tsx` — SVG progress ring component
- Create `components/StepperControl.tsx` — +/- stepper for workouts
- Modify `components/WaterTracker.tsx` — match Stitch design (bottle presets, accent border)
- Modify `components/FastingTimer.tsx` — update styling
- Modify `components/CheckInPanel.tsx` — 3-mood grid (Stitch) vs 5-mood row (current)
- Modify `components/MacroProgress.tsx` — 2x2 grid with rings
- Modify `components/AppHeader.tsx` — fixed top bar with avatar
- Modify `components/ExercisePanel.tsx` — update styling
- Modify `components/PreviousFasts.tsx` — update styling
- Modify `components/WeeklyStats.tsx` — update styling
- Modify `components/FastingAchievements.tsx` — update styling
- Modify `components/WeightChart.tsx` — update styling
- Modify `components/WeightTracker.tsx` — update styling

### Screens
- `app/(tabs)/_layout.tsx` — new tab bar design, MaterialCommunityIcons
- `app/(tabs)/index.tsx` — complete redesign
- `app/(tabs)/workouts.tsx` — complete redesign
- `app/(tabs)/log-food.tsx` — complete redesign
- `app/(tabs)/profile.tsx` — update styling
- `app/_layout.tsx` — new fonts

## Implementation Order

1. Tailwind config + global.css updates
2. Theme colors (lib/theme-colors.ts)
3. Font loading (app/_layout.tsx)
4. New components: GlassPanel, ProgressRing, StepperControl
5. Tab nav redesign (_layout.tsx)
6. Home/Fast tab (index.tsx) + components
7. Workouts tab + components
8. Log/Food tab + components
9. Profile tab + components
10. Settings screen update
11. TypeScript check

## Preserved Functionality

- All hooks, state management, data fetching logic stay unchanged
- Database schema, Supabase queries, API calls unchanged
- Navigation structure stays the same (file-based routing)
- Auth flow, timer logic, streak calculations unchanged
- Unit conversion, notification scheduling unchanged
