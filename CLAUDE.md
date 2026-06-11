# CLAUDE.md — FastTrack Project Notes

## Session Summary (June 8, 2026)

Built the entire FastTrack app from scratch in a single session. The app is a fully functional intermittent fasting & macro tracker running on Expo SDK 56 with Supabase backend.

## What Was Built

### Core Fasting System
- Three-phase state machine: idle → fasting → eating → completed
- Live countdown timer (counts DOWN to eat window during fasting, DOWN to eat window close during eating)
- SVG circular progress ring with animated stroke (fills UP as progress is made)
- Schedule cards showing predicted eating window times with Hugeicons
- Break Fast / End Session with inline confirmation panels (Modal doesn't work on web)
- Schedule shown on timer circle (e.g., "FASTING — OMAD") and schedule card header

### Fasting Schedule Selector
- Preset buttons: 14:10, 16:8, 18:6, 20:4, OMAD
- Custom option with auto-calculating fasting/eating fields (sum to 24h)
- Button text updates to show chosen schedule (e.g., "Start 20:4 Fast")
- Schedule persisted on each fasting session in Supabase
- Previous fasts show schedule badge (e.g., "16:8")

### Check-in System
- Mood selector (5 emojis: 😫😔😐😊🤩) + optional text note
- Timeline view with colored dots (green=fasting, amber=eating)
- SVG mood-over-time line chart (appears at 3+ check-ins)
- Check-ins persist to Supabase `fast_check_ins` table
- Viewable in Previous Fasts expansion panel

### Achievements
- Day streak (consecutive days with completed fast)
- Total fasts (unique days, not total sessions)
- Next milestone progress bar
- Moved from Fast tab to Dashboard tab per user request

### Food Tracking
- OpenFoodFacts API search (free, no key)
- Manual meal form (name, brand, calories, macros, meal type)
- Daily macro progress bars (calories, protein, carbs, fat)
- Water tracker (moved from Dashboard to Log Food tab per user request)

### Previous Fasts
- Expandable rows showing date, time range, duration, goal percentage, schedule badge
- Delete with inline confirmation (appears below the specific fast row, not at bottom of list)
- Expand to see mood chart + check-in timeline for that session

## Key Files

| File | Purpose |
|------|---------|
| `app/(tabs)/index.tsx` | Fast tab — main screen with timer, schedule selector, check-ins, previous fasts |
| `app/(tabs)/dashboard.tsx` | Dashboard — achievements, macro progress, meals |
| `app/(tabs)/log-food.tsx` | Log Food — water tracker, food search, meal form |
| `app/(tabs)/profile.tsx` | Profile — goals, sign out (NO fasting schedule) |
| `components/ScheduleSelector.tsx` | Preset schedules (14:10, 16:8, 18:6, 20:4, OMAD) + custom |
| `components/FastingTimer.tsx` | SVG circular progress ring (idle/fast/eat states, shows schedule name) |
| `components/PreviousFasts.tsx` | Expandable list with inline delete, schedule badge, check-in detail |
| `hooks/useFastingSession.ts` | Core hook: session CRUD, past sessions, streak, realtime |
| `hooks/useFastCheckIns.ts` | Check-in CRUD + session check-ins for past fasts |
| `lib/supabase.ts` | Supabase client (Platform-aware storage) |
| `lib/notifications.ts` | Push notifications (native only, web-safe) |

## Deployment Commands

```bash
# Web dev server
npx expo start --web --port 8083

# Push schema changes
supabase db push --linked

# Deploy Edge Functions
supabase functions deploy daily-summary

# TypeScript check
npx tsc --noEmit
```

## Key Design Decisions

- **Timer counts DOWN** (not up) — shows remaining time until eat window opens
- **Progress ring fills UP** — shows elapsed progress toward the fasting goal
- **Schedule selector is on Fast tab** (not Profile) — users choose their fast before starting
- **Delete confirmation is inline** (not Modal) — appears below the specific fast row
- **Achievements are on Dashboard** (not Fast tab) — Fast tab focuses on active fasting
- **Water tracker is on Log Food** (not Dashboard) — grouped with food logging
- **No fasting schedule in Profile** — removed per user request, lives on Fast tab

## Remaining Work
1. Profile sync — save fasting hours to Supabase, sync across sessions
2. Deploy Edge Function with Resend API key
3. iPhone testing
4. Loading/skeleton states
5. Final review and cleanup
