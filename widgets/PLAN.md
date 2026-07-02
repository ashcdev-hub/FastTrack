# Home Screen Widgets — Implementation Plan

> **Status**: Deferred — blocked on Expo SDK upgrade (54→56) for iOS (`expo-widgets` requires SDK 56+), and Apple Developer Program for App Groups (restricted entitlement on free Personal Team). Android is feasible today but deferred alongside iOS for platform parity.

---

## Feature Summary

Fasting Timer widgets across four widget families:

| Platform | Family | Size | Content | Tap Target |
|----------|--------|------|---------|------------|
| iOS | Small | 169×169pt | Progress ring + elapsed time + phase badge | Fast tab |
| iOS | Medium | 360×169pt | Left: ring + time. Right: schedule strip | Fast tab |
| iOS | Lock Screen Circular | ~40pt ring | Mini progress ring + elapsed hours | Fast tab |
| iOS | Lock Screen Rectangular | wide bar | "Fasting 12h 34m · Fat Burn" + progress bar | Fast tab |
| iOS | Lock Screen Inline | text strip | "12h 34m remaining" above clock | Fast tab |
| Android | Small | 2×2 cells | Progress ring + elapsed time + phase badge | Fast tab |
| Android | Medium | 4×2 cells | Left: ring. Right: schedule strip | Fast tab |

### Future additions (not part of this plan)
- **Multi-Tracker** (medium 2×2 grid: fasting, water, workouts, period)
- **Water Tracker** (small ring widget)
- **Workout Progress** (small ring widget)
- **Period Tracker** (small phase ring widget)

---

## Data Flow

The widget receives only raw timestamps (`start_time_iso`, `status`) and computes elapsed/remaining/progress/phase independently from the current date. This means the widget stays accurate even if the app is killed.

```
fast.tsx / index.tsx             useWidgetSync hook           Widget
     │                                    │                      │
     │ on timer tick (~5s)                │ writes to shared     │
     │ on mutation onSuccess              │ storage              │
     │ on AppState change                 │                      │
     ▼                                    ▼                      ▼
┌─────────────────────┐          ┌──────────────────┐   ┌──────────────────────┐
│  Fasting state:      │          │  Shared Storage:  │   │  Widget computes:    │
│  - start_time_iso    │  ──write→│  start_time_iso   │──→│  - elapsed from UTC  │
│  - status            │          │  status           │   │  - progress %        │
│  - schedule          │          │  schedule         │   │  - phase label       │
│  - fasting_hours     │          │  fasting_hours    │   │  - remaining time    │
│  - eating_hours      │          │  eating_hours     │   └──────────────────────┘
│  - streak            │          │  streak           │
│  - timer_state       │          └──────────────────┘
└─────────────────────┘
```

---

## Shared Storage Schema

### iOS — App Groups UserDefaults

`UserDefaults(suiteName: "group.com.ashcdev2.fasttrack")` at key `"fasting_widget"`:

```json
{
  "v": 1,
  "start_time_iso": "2026-07-02T06:30:00.000Z",
  "end_time_iso": null,
  "status": "fasting",
  "schedule": "16:8",
  "fasting_hours": 16,
  "eating_hours": 8,
  "streak": 12,
  "updated_at": 1751449200
}
```

### Android — AsyncStorage

Same JSON blob at `@fasttrack_widget_fasting` key in app's AsyncStorage directory. Android widgets share the app's storage context — no App Group equivalent needed.

---

## Widget Timeline Strategy (iOS)

WidgetKit cannot maintain second-level accuracy. Instead:
- Timeline generates entries every **5 minutes** for a **2-hour** window
- `.atEnd` policy: WidgetKit requests a new timeline when the last entry passes
- App triggers `reloadAllTimelines()` on each UserDefaults write (immediate refresh)
- When app is backgrounded/killed, widget falls back to timeline entries with 5-min granularity
- Each timeline entry computes elapsed from the stored `start_time_iso` UTC timestamp

---

## New Files

| File | Platform | Purpose |
|------|----------|---------|
| `lib/widget-data.ts` | Both | Serialize/deserialize widget JSON, compute display values from start_time |
| `hooks/useWidgetSync.ts` | Both | Writes fasting data to shared storage on state changes (debounced 5s, immediate on mutation) |
| `widgets/index.ts` | iOS | WidgetBundle registration for home screen + lock screen families |
| `widgets/FastingWidget.tsx` | iOS | Small + medium + lock screen widget layouts |
| `widgets/android/FastingWidget.android.tsx` | Android | Glance-based small + medium widget |
| `widgets/android/task-handler.ts` | Android | `registerWidgetTaskHandler` for system-driven updates |

---

## Modified Files

| File | Change |
|------|--------|
| `app.json` | Add plugin config: `expo-widgets` (iOS) + `react-native-android-widget` |
| `app/_layout.tsx` | Mount widget sync provider component |
| `app/(tabs)/fast.tsx` | Call `widgetSync.update()` on timer ticks + mutation `onSuccess` |

---

## Dependencies

| Package | Platform | SDK 54 Compatible? | Notes |
|---------|----------|-------------------|-------|
| `expo-widgets` | iOS | **No** — requires SDK 56 | Blocked until SDK upgrade |
| `@expo/ui` | iOS | **No** — bundled with expo-widgets | Required for SwiftUI-like widget components |
| `react-native-android-widget` | Android | **Yes** — 0.20.x compatible | Requires `'use no memo'` directive for React 19 |

---

## Blockers

| Blocker | Platform | Resolution |
|---------|----------|------------|
| **SDK 54 → 56 required** | iOS | `expo-widgets` needs at least SDK 55 (alpha) / SDK 56 (stable). Breaking: React Native 0.81→0.83+, NativeWind, Metro config. Can't test widgets in Expo Go — must use dev build. |
| **App Groups entitlement** | iOS | Required for widget↔app data sharing. Restricted entitlement — may not provision on free Personal Team signing. Requires Apple Developer Program ($99/yr) or verification that Personal Team suffices. |
| **Dev build only** | Both | Widgets never work in Expo Go. Must use `npx expo prebuild` + `npx expo run:ios --device`. Main app still testable in Expo Go without the widget. |

---

## Implementation Checklist (when revisited)

- [ ] Verify App Group provisioning on Personal Team (quick test build)
- [ ] Upgrade Expo SDK 54 → 56 (if App Groups verified working)
- [ ] Install `expo-widgets` + `@expo/ui` (iOS)
- [ ] Install `react-native-android-widget` (Android)
- [ ] Build `lib/widget-data.ts` — shared serialization layer
- [ ] Build `hooks/useWidgetSync.ts` — app-side sync hook
- [ ] Build `widgets/FastingWidget.tsx` — iOS layouts
- [ ] Build `widgets/index.ts` — iOS WidgetBundle
- [ ] Build `widgets/android/FastingWidget.android.tsx` — Android layouts
- [ ] Build `widgets/android/task-handler.ts` — Android handler
- [ ] Wire `app/(tabs)/fast.tsx` to sync on ticks + mutations
- [ ] Wire `app/_layout.tsx` to mount provider
- [ ] Update `app.json` with plugin configs
- [ ] `npx expo prebuild --clean` + dev build
- [ ] TypeScript check (`npx tsc --noEmit`)
- [ ] Test on device (iOS + Android)
