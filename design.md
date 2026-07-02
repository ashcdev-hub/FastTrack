---
version: alpha
name: FastTrack — Lime & Cyan Dark Glass
description: A high-contrast dark-mode fitness tracker for intermittent fasting, workouts, and macros. Built around a single electric lime accent, a cool cyan secondary, and a coral warning. Visual language is glass-morphism, dense data display, and monospaced-feeling labels via Space Grotesk.
colors:
  primary: "#c3f400"
  "primary-bg": "rgba(195,244,0,0.15)"
  "primary-border": "rgba(195,244,0,0.3)"
  "primary-on": "#161e00"
  secondary: "#00daf3"
  "secondary-bg": "rgba(0,218,243,0.12)"
  "secondary-border": "rgba(0,218,243,0.3)"
  "secondary-on": "#00363d"
  tertiary: "#FF6B52"
  "tertiary-bg": "rgba(255,107,82,0.12)"
  "tertiary-border": "rgba(255,107,82,0.3)"
  error: "#F43F5E"
  "error-bg": "rgba(244,63,94,0.12)"
  "error-border": "rgba(244,63,94,0.3)"
  warning: "#FBBF24"
  "warning-bg": "rgba(251,191,36,0.12)"
  "warning-border": "rgba(251,191,36,0.3)"
  info: "#38BDF8"
  "info-bg": "rgba(56,189,248,0.12)"
  bg: "#131313"
  surface: "#201f1f"
  elevated: "#2a2a2a"
  "card-bg": "rgba(28,28,30,0.8)"
  "card-border": "rgba(44,44,46,1)"
  "card-bg-alt": "#1c1b1b"
  "input-bg": "rgba(255,255,255,0.07)"
  "input-border": "rgba(255,255,255,0.12)"
  "button-bg": "rgba(255,255,255,0.08)"
  divider: "rgba(255,255,255,0.07)"
  "tab-bar-bg": "rgba(19,19,19,0.8)"
  "tab-bar-border": "rgba(53,53,52,0.2)"
  text: "#ffffff"
  "text-secondary": "#e5e2e1"
  "text-muted": "#c4c9ac"
  "text-faint": "rgba(196,201,172,0.35)"
  placeholder: "rgba(196,201,172,0.5)"
  overlay: "rgba(0,0,0,0.5)"
  "text-on-accent": "#161e00"
  "text-on-dark": "#ffffff"
typography:
  "display-lg":
    fontFamily: Inter
    fontSize: 48px
    fontWeight: 700
    lineHeight: 56px
    letterSpacing: "-0.02em"
  "headline-lg":
    fontFamily: Inter
    fontSize: 32px
    fontWeight: 700
    lineHeight: 40px
    letterSpacing: "-0.01em"
  "headline-mobile":
    fontFamily: Inter
    fontSize: 28px
    fontWeight: 700
    lineHeight: 34px
  "title-md":
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 700
    lineHeight: 28px
  "body-md":
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
  "body-sm":
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
  "body-bold":
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 700
    lineHeight: 24px
  "stats-xl":
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: 600
    lineHeight: 40px
    letterSpacing: "-0.04em"
  "stats-lg":
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: 600
    lineHeight: 36px
  "label-caps":
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: 700
    lineHeight: 16px
    letterSpacing: "0.1em"
  "label-sm":
    fontFamily: Space Grotesk
    fontSize: 10px
    fontWeight: 700
    lineHeight: 12px
    letterSpacing: "0.1em"
  "number-mono":
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: 700
    letterSpacing: "-0.01em"
rounded:
  none: 0px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  "2xl": 32px
  full: 9999px
spacing:
  0: 0px
  unit: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  "2xl": 32px
  "3xl": 40px
  "4xl": 64px
  gutter: 20px
  margin: 20px
  "section-gap": 32px
  "panel-gap": 24px
  "container-padding": 20px
  "stack-gap": 12px
  "touch-target": 44px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-on}"
    typography: "{typography.body-bold}"
    rounded: "{rounded.md}"
    padding: 16px
  button-primary-pressed:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-on}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.button-bg}"
    textColor: "{colors.text}"
    typography: "{typography.body-bold}"
    rounded: "{rounded.md}"
    padding: 16px
  button-icon:
    backgroundColor: "{colors.button-bg}"
    textColor: "{colors.text-secondary}"
    size: 44px
    rounded: "{rounded.md}"
  card:
    backgroundColor: "{colors.card-bg}"
    rounded: "{rounded.xl}"
    padding: 20px
    backdropFilter: "blur(20px)"
  card-flat:
    backgroundColor: "{colors.card-bg-alt}"
    rounded: "{rounded.xl}"
    padding: 20px
  card-border:
    backgroundColor: "{colors.card-bg}"
    borderColor: "{colors.card-border}"
    borderWidth: 1px
    rounded: "{rounded.xl}"
    padding: 20px
  input:
    backgroundColor: "{colors.input-bg}"
    textColor: "{colors.text}"
    borderColor: "{colors.input-border}"
    borderWidth: 1px
    rounded: "{rounded.md}"
    padding: 12px
    typography: "{typography.body-md}"
  badge:
    backgroundColor: "{colors.elevated}"
    textColor: "{colors.text}"
    rounded: "{rounded.full}"
    padding: 8px
    typography: "{typography.label-sm}"
  tab-bar:
    backgroundColor: "{colors.tab-bar-bg}"
    borderColor: "{colors.tab-bar-border}"
    borderTopWidth: 1px
    height: 85px
  progress-ring-track:
    stroke: "rgba(255,255,255,0.05)"
    strokeWidth: 6px
  progress-ring-indicator:
    stroke: "{colors.primary}"
    strokeLinecap: round
  progress-ring-indicator-eating:
    stroke: "{colors.secondary}"
    strokeLinecap: round
  chip:
    backgroundColor: "{colors.button-bg}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.md}"
    padding: 8px
    typography: "{typography.label-caps}"
  chip-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-on}"
    rounded: "{rounded.md}"
    padding: 8px
    typography: "{typography.label-caps}"
  divider:
    backgroundColor: "{colors.divider}"
    height: 1px
  modal-sheet:
    backgroundColor: "{colors.elevated}"
    rounded: "{rounded.2xl}"
    padding: 24px
  icon-button:
    backgroundColor: "{colors.button-bg}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    size: 44px
---

# Design System: FastTrack — Lime & Cyan Dark Glass

**Source of truth for the FastTrack fitness tracking app.** This document captures the visual identity so AI design tools (Google Stitch, etc.) and human designers can reproduce, extend, and redesign the app with consistent results.

---

## Overview

FastTrack is a **dark-mode-first** fitness tracker for intermittent fasting, workouts, and macros. The aesthetic is **technical, dense, and electric** — closer to a high-end sports watch or a Bloomberg terminal than a wellness app. Every screen should feel like a control panel: data-forward, glanceable, and engineered.

The visual personality is defined by three tensions:

1. **Dark canvas, electric accent.** Almost everything is a near-black or translucent surface. A single electric lime (`#c3f400`) is reserved for the most important action or status on a screen. Nothing competes.
2. **Glass, not cards.** All containers are translucent dark surfaces with a subtle 20px backdrop blur. There are no drop shadows. Depth comes from tonal layering — surface, card, elevated.
3. **Monospaced-feeling labels, humanist body.** Space Grotesk is used for all data, labels, and stats — uppercase, tracked-out, technical. Inter carries the human voice for body text, headlines, and prompts.

The app is mobile-first (iOS-sized, 1170×2532 design canvas) with a five-tab bottom navigation: **Home, Fast, Workout, Food, Profile**. The Profile tab doubles as the full settings hub — there is no separate settings page.

Brand voice: **confident, minimal, no marketing fluff.** No emoji. No illustrations. No gradients. The UI is the brand.

---

## Colors

The palette is rooted in **near-black neutrals** with two electric accents and a single warm warning color. The lime is the only "loud" color; everything else supports it.

### Accents (functional roles)

- **Electric Lime (`#c3f400`) — primary.** Reserved for the single most important action or status on a screen: the primary button, active fast progress, the user's current rep count, the active tab indicator. Never decorative. Pairs with a near-black text color (`#161e00`) for maximum contrast.
- **Cyan (`#00daf3`) — secondary.** Used for the eating-phase progress ring, water/hydration data, secondary CTAs, and links. Cool, technical, and clearly distinct from the lime.
- **Coral (`#FF6B52`) — tertiary / warning.** Used sparingly for "fast started at", delete confirmations, and alerts. Never for primary actions.
- **Rose (`#F43F5E`) — error / destructive.** Sign Out button, destructive actions, error states. Always paired with a soft red-tinted background.
- **Amber (`#FBBF24`) — warning.** Streak-at-risk, deadline approaching, attention needed.
- **Sky (`#38BDF8`) — info.** Tips, hints, neutral callouts.

### Neutrals (surfaces and text)

The neutral scale is a tight, dark progression. Surfaces layer on top of `#131313` to create depth without shadows.

- **`#131313` (bg):** The base page background. Used behind every screen.
- **`rgba(28,28,30,0.8)` (card-bg):** The default card / panel background, with 20px backdrop blur. The most-used surface.
- **`#1c1b1b` (card-bg-alt):** Flat opaque variant for cards that need to be visually heavier.
- **`#201f1f` (surface):** One step above the page background. Used for the FastingTimer center overlay.
- **`#2a2a2a` (elevated):** Modal sheets, popovers, and the most-raised surface.
- **`#393939` (surface-bright):** Reserved for disabled states and subtle hover backgrounds.

### Text

- **`#ffffff` (text):** Headlines, primary data points, the current state.
- **`#e5e2e1` (text-secondary):** Body text, supporting copy, icon buttons.
- **`#c4c9ac` (text-muted):** Captions, labels, metadata. Has a subtle warm-green tint.
- **`rgba(196,201,172,0.35)` (text-faint):** Disabled labels and the most-quiet metadata.

### Translucent tints (12-15% opacity)

Every accent has a paired translucent background and border for badges, active states, and confirmation dialogs:

- `primaryBg = rgba(195,244,0,0.15)` + `primaryBorder = rgba(195,244,0,0.3)`
- `secondaryBg = rgba(0,218,243,0.12)` + `secondaryBorder = rgba(0,218,243,0.3)`
- `tertiaryBg = rgba(255,107,82,0.12)` + `tertiaryBorder = rgba(255,107,82,0.3)`
- `errorBg = rgba(244,63,94,0.12)` + `errorBorder = rgba(244,63,94,0.3)`

### Color rules

- **One primary action per screen.** If two buttons both need lime, you've made a design mistake — demote the second to `button-secondary` (translucent white).
- **Lime only on dark.** The lime is calibrated for `#131313`–`#2a2a2a` backgrounds. Don't use it on white or light.
- **Coral is for events, not UI.** It's a status color. The eating window and the delete button earn it; a tab icon does not.
- **No full-bleed colored backgrounds.** Accents live in buttons, rings, progress bars, and badges. Page surfaces stay dark.

---

## Typography

Two font families, used with strict role separation:

### Inter (humanist sans-serif)

Inter carries every piece of natural-language content. It is friendly enough for body copy and confident enough for headlines.

- **Display (`Inter_700Bold`, 32–48px):** Screen titles, hero numbers, the user's name on the profile tab.
- **Headline (`Inter_700Bold`, 24–28px):** Section headings, card titles.
- **Title (`Inter_700Bold`, 20px):** Sub-headings inside cards.
- **Body (`Inter_400Regular`, 16px / 14px):** Long-form copy, descriptions, button labels.
- **Body Bold (`Inter_700Bold`, 16px):** All button labels, strong inline emphasis.

### Space Grotesk (geometric / mono-feeling)

Space Grotesk is reserved for **all data and metadata**. Its geometric construction evokes precision — stopwatch tick marks, monitor gauges, dashboards. It is always used uppercase with generous letter spacing when used as labels.

- **Stats XL (`SpaceGrotesk_600SemiBold`, 40px, -0.04em):** Hero numbers — the timer, current weight, current calories. Tightly tracked.
- **Stats LG (`SpaceGrotesk_600SemiBold`, 32px):** Secondary stats — daily macros, weekly totals.
- **Label Caps (`SpaceGrotesk_700Bold`, 12px, +0.1em, UPPERCASE):** Every section heading, every tab label, every chip, every metadata row. This is the spine of the visual language.
- **Label SM (`SpaceGrotesk_700Bold`, 10px, +0.1em, UPPERCASE):** Inline labels, badge text, status pills.

### Typography rules

- **All section headings are uppercase Space Grotesk with +0.1em letter spacing.** Even section labels inside cards. The mixed-case Inter headlines carry the meaning; the Space Grotesk labels carry the structure.
- **Numbers in stats use Space Grotesk, never Inter.** This is how you know the screen is a dashboard.
- **Tight tracking on large sizes, wide tracking on small labels.** `headline-lg` is `-0.01em`; `label-caps` is `+0.1em`. The contrast reinforces the role split.
- **No font weight below 400. No italics.** The brand is confident and direct.

---

## Layout

Mobile-first, single-column scrolling. The app is designed for an iPhone canvas (1170×2532) but adapts to any aspect ratio via the responsive NativeWind utility classes.

### Vertical rhythm

- **Container padding:** 20px on the left and right of every screen. Never less.
- **Section gap:** 32px between major sections (e.g., Fasting Today → Hydration → Macros on Home).
- **Panel gap:** 24px between cards within a section.
- **Stack gap:** 12px between list items within a card.
- **Touch targets:** Minimum 44×44px on every tappable element. Icon buttons are always 44px square.

### Fixed Top App Bar

Every tab has the same top bar pattern — no bell, no cog:

- **Height:** 44px content + 8px top padding to clear the iPhone notch.
- **Left side:** A 32px circular avatar placeholder (account icon) + the "FastTrack" wordmark in `Inter_800ExtraBold`, 22px, lime (`#c3f400`), letter-spacing -0.5px.
- **Right side:** Empty. The Profile tab is the only place settings live.

### Bottom Tab Bar

- **Height:** 85px total (8px top padding + 22px icons + 10px label + 28px bottom safe area).
- **5 tabs, equal width:** Home (view-dashboard), Fast (timer), Workout (dumbbell), Food (food-apple), Profile (account-circle).
- **Active tint:** Lime. Inactive tint: `rgba(229,226,225,0.3)`.
- **Labels:** Space Grotesk 700, 10px, +0.5px letter-spacing, 2px top margin from icon.

### Card layout

- All cards are full-width within the container padding.
- Internal padding: 20px.
- Cards stack vertically with 24px gap.
- No horizontal scrolling inside cards except for the date strip and quick-add rows.

### Spacing rules

- **No 5px, 7px, 13px spacing values.** Stick to the 4px unit scale (4, 8, 12, 16, 20, 24, 32, 40, 64).
- **When in doubt, use 16px or 20px.** The design favors generous but not luxurious whitespace.

---

## Elevation & Depth

There are **no drop shadows** in the design. Depth is conveyed entirely through **tonal layering** — every "raised" element is one or two steps lighter than the surface beneath it, with optional translucency and a subtle border.

### Surface hierarchy (bottom to top)

1. **`#131313` (bg)** — Page background. The deepest layer.
2. **`rgba(28,28,30,0.8)` with 20px backdrop-blur (card-bg)** — Standard card. The most common elevated surface.
3. **`#1c1b1b` (card-bg-alt)** — Opaque heavy card. Used when the card needs to feel more solid (e.g., the weight chart container on Profile).
4. **`#201f1f` (surface)** — Mid-level surface. Used inside the FastingTimer for the center badge.
5. **`#2a2a2a` (elevated)** — Modal sheets, popovers, the "edit goal" bottom sheet, the top layer of any stack.

### Card borders

- Every card has a 1px border in `rgba(44,44,46,1)`. The border is what defines the card edge against the page background — without it, translucent cards disappear on the same-color background.
- Buttons, inputs, and chips also have subtle white-tinted borders (`rgba(255,255,255,0.12)`).

### Glass panel utility

- The `glass-panel` class applies `background: rgba(28,28,30,0.8)`, `backdrop-filter: blur(20px)`, and a 1px border in `rgba(44,44,46,1)`. Use it on every rounded-xl card across the app — never inline the styles.

### When to use a shadow

- **Don't.** The only time shadows appear are very subtle `shadow-lime` glows on the primary button (offset 0,0 / opacity 0.15 / radius 20). Every other depth cue comes from color and translucency.

---

## Shapes

The shape language is **rounded and confident**. There are no sharp corners anywhere in the UI.

### Corner radius scale

- **`0px` (none):** Reserved for the SVG progress ring stroke and the icon glyphs themselves.
- **`8px` (sm):** Small chips, tags, and the preset water-bottle buttons inside a card.
- **`12px` (md):** Standard buttons, inputs, and the bottom sheet handles.
- **`16px` (xl):** All cards and panels. The default.
- **`24px` (2xl):** Modal bottom sheets, the "End Eating Window?" confirmation card.
- **`32px`:** Reserved for the largest hero containers.
- **`9999px` (full):** Pills, badges, and circular elements (the avatar placeholder, the 8/16 progress dots in the FastingTimer).

### Shape rules

- **All cards use 16px.** No exceptions.
- **All buttons use 12px.** Slightly tighter than the card to make the button feel like a "press" inside the card.
- **The FastingTimer progress ring is a circle with no rounded corners** — but the inner AUTOPHAGY ACTIVE / EATING WINDOW badge is `full` (pill).
- **No mixed rounding on the same component.** A card and its contained button can be 16px / 12px respectively, but a single element never mixes radii on different sides.

### Icons

- All icons are **MaterialCommunityIcons** (`@expo/vector-icons`), 16–28px depending on context.
- Tab icons: 22px.
- Card header icons: 16px.
- Empty-state / large feature icons: 24–28px.
- Icon color: matches the surrounding text or the active accent. Never multicolored.

---

## Components

The design system is built around a small set of atoms. Every screen is composed from these.

### Buttons

**Primary button** — The most important action on the screen. Always lime. Always full-width on mobile.

- Background: `#c3f400` (primary)
- Text: `#161e00` (primary-on) in `Inter_700Bold`, 18px
- Padding: 16px vertical
- Radius: 12px
- Optional: a faint lime glow shadow (offset 0,0 / opacity 0.15 / radius 20)
- Leading icon: 20–22px, primary-on color

**Secondary button** — Every other action. Translucent white on dark.

- Background: `rgba(255,255,255,0.08)` (button-bg)
- Text: `#ffffff` in `Inter_700Bold`, 14–16px
- Padding: 12–16px vertical
- Radius: 12px
- Border: 1px `rgba(255,255,255,0.12)` (subtle)

**Icon button** — Square, used in headers and compact actions.

- Background: `rgba(255,255,255,0.08)`
- Size: 44×44px
- Radius: 12px
- Icon: 22px, `#e5e2e1` (text-secondary)

**Destructive button** — Sign Out, delete confirmations.

- Background: `rgba(244,63,94,0.12)` (errorBg)
- Border: 1px `rgba(244,63,94,0.3)` (errorBorder)
- Text: `#F43F5E` (error) in `Inter_700Bold`

### Cards / Panels

- **Default card:** 16px radius, 20px padding, `card-bg` background with backdrop blur, 1px `card-border`.
- **Card header pattern:** A `label-caps` row at the top (12px Space Grotesk 700, uppercase, +0.1em letter-spacing) in `text-muted` color, with an optional action or counter on the right.
- **Card body:** Inter for copy, Space Grotesk for any numbers or stats.
- **Cards are never interactive themselves** — they contain Pressables, but the card surface itself is a layout container.

### Inputs

- Background: `rgba(255,255,255,0.07)` (input-bg)
- Border: 1px `rgba(255,255,255,0.12)` (input-border)
- Text: `#ffffff`, Inter 400, 16px
- Placeholder: `rgba(196,201,172,0.5)`
- Radius: 12px
- Padding: 12px
- Height: ~48px (one line of body-md + 12px padding × 2)

### Chips

Chips are used in the schedule selector, meal type picker, preset stepper, and water bottle presets.

- **Default chip:** `button-bg` background, `text-muted` text, Space Grotesk 700 12px, 12px radius, 10px vertical padding.
- **Active chip:** `primary` background, `primary-on` text, 12px radius. The active state is the only state that gets the lime.
- Chips are pill-shaped horizontally but with 12px corners (not full-rounded) to match the buttons.

### Badges / Pills

- Full-rounded pill (`9999px`), 8px vertical padding, 12px horizontal padding.
- Background: `elevated` (#2a2a2a).
- Border: 1px in a translucent version of the badge's accent color (e.g., `rgba(68,73,51,0.3)` for lime, `rgba(50,80,90,0.3)` for cyan).
- Text: `text` color, Space Grotesk 700 10px, uppercase.
- Leading dot: 8px circle in the accent color.

### Progress Ring

The FastingTimer uses a 320px SVG ring.

- **Track:** `#1c1b1b` (a near-black that's one step above the page background), 6px stroke width.
- **Indicator:** `primary` lime during fasting, `secondary` cyan during eating. Round linecap. 6px stroke width.
- **Glow ring:** An additional 10px-wide ring behind the indicator at 3-10% opacity, pulsing on a 3-second sin wave.
- **Center content:** An 8px dot in the active accent color, the AUTOPHAGY ACTIVE / EATING WINDOW badge, the timer text, and a swap toggle below.

### Tab Bar

See Layout section above. 5 tabs, equal width, lime active tint, Space Grotesk 700 10px labels.

### Modal Bottom Sheet

- Anchored to the bottom of the screen.
- Background: `elevated` (#2a2a2a).
- Radius: 32px top corners (the rest of the sheet is the screen width).
- Padding: 24px.
- Title: Inter 700Bold 20–24px, `text` color.
- Has a close (X) or back arrow in the top-left, a primary action button in the bottom-right.
- Used for: Edit Goal, Log Set, Add Exercise, Add Custom Item, Date/Time picker.

### Section Heading (label-caps)

- Font: Space Grotesk 700, 12px, UPPERCASE, +0.1em letter-spacing
- Color: `text-muted` (`#c4c9ac`)
- Margin-bottom: 16px from the section content
- Sits above the section it labels, left-aligned

### Toast

- Fixed at the top of the screen, below the app bar.
- Background: `elevated` (#2a2a2a) with backdrop blur.
- Text: `text` color, Inter 400, 14px.
- Optional leading icon: 18px in the relevant accent color.
- Auto-dismisses after 3 seconds with a fade-out animation.

### Bar / Progress Bar (1px / 1.5px thin)

Used for hydration, macros, workout goals, fasting progress.

- Track: `rgba(53,53,52,0.3)` (a barely-visible grey on dark)
- Indicator: `primary` lime, or `secondary` cyan for hydration
- Height: 1.5px (or 1px for tighter rows)
- Radius: full
- Fills left-to-right.

---

## App-specific components

### FastingTimer (hero)

The most distinctive component in the app. Lives only on the Fast tab.

- 320px circular SVG ring.
- Above the ring: "CURRENT PROTOCOL" (label-caps) + "16:8 Fast" (Inter 700 32px) + lightning-bolt icon in lime.
- Inside the ring: AUTOPHAGY ACTIVE badge (fasting) or EATING WINDOW badge (eating), the timer in Space Grotesk 600 40px, a swap toggle below.
- **Edit start time**: During fasting, a small pencil icon appears next to the "Started" label in the schedule strip. Tapping it opens a date/time bottom-sheet allowing the user to adjust when they actually began fasting (up to 3 days in the past).
- Below the ring: the "Break Fast" / "End Eating Window" primary button, full-width lime.
- Lifecycle: Idle → Fasting (lime ring) → Eating (cyan ring) → complete.

### Progress Bar Card (Fast tab)

Used in the schedule preview panel (labeled "IF YOU START NOW" / "PREVIEW" when adjusting start time).

- 3 columns: Fast starts (lime), Eat window (cyan), Window closes (coral).
- Each column: 8px dot in the accent color, 12px label in text-muted, 14px time in text.
- All 3 columns equal width, evenly spaced.
- Panel updates dynamically when adjusting the custom start time in the date/time picker.

### Schedule Selector

- "Fasting Schedule" label-caps heading.
- Horizontal row of 5 equal-width preset chips: 14:10, 16:8, 18:6, 20:4, OMAD.
- Each chip: 12px radius, default vs active state, with a 12px time + 10px duration underneath.

### Macro Card (Home)

- 2×2 grid of equal-width cards.
- Each card: 16px radius, 20px padding, glass-panel.
- Top: label-caps "CALORIES" / "PROTEIN" / etc.
- Middle: 22px Space Grotesk 600 number + 12px unit.
- Bottom: a 1px progress bar.

### Water Tracker (Food tab + Home)

- Cyan-tinted card with a 4px cyan left border.
- Three quick-add buttons (250ml, 500ml, 750ml) in a row.
- A full-width "Add Water" primary button below.

### Exercise Panel (Workout tab)

- 16px radius, 20px padding, glass-panel.
- Top: Category label-caps + exercise name in Inter 700 28px.
- Right: Current reps (lime Space Grotesk 600 40px) / goal.
- Middle: A stepper row showing the day's total reps, with - and + buttons.
- Below: Two side-by-side secondary buttons — "Edit Goal" (opens modal) and "Remove" (toggleable, with confirmation).

### Weight Chart

- SVG line chart, 100% width, ~180px tall.
- Stroke: 2px lime (`primary`).
- Dot markers at each data point: 6px lime circles.
- A dashed horizontal goal line in `text-faint`.
- Below: weight-tracker component (current weight, change indicator, log button, recent entries list).

### Achievement Card

- 16px radius, 20px padding, glass-panel.
- Icon: 28px lime on a `limeBg` circular background.
- Title: Inter 700 18px, `text`.
- Description: Inter 400 14px, `text-secondary`.
- Progress bar at the bottom if the achievement is in-progress.

### Weekly Stats

- 3 equal-width cards in a row: Fasting, Water, Workouts.
- Each: label-caps title, big Space Grotesk 600 number, small unit/caption.

### Mood Selector (Check-in panel)

- 5 mood icons in a horizontal row, equal width.
- Each: 44×44px circular button, default `button-bg` background.
- Active: `primaryBg` background, lime icon, lime 2px border.
- Mood values: 1-5 with colors muted → lime gradient.

---

## Do's and Don'ts

### Do

- **Do use lime for exactly one thing per screen.** The most important action, status, or number. Nothing else.
- **Do layer surfaces with translucency and tone, not shadows.** card-bg on bg on elevated creates depth.
- **Do set all section headings in Space Grotesk uppercase with letter-spacing.** Even inside cards. Even in modals.
- **Do use the glass-panel utility for every rounded-xl card.** Never inline the styles.
- **Do show 44×44px minimum touch targets.** Icon buttons, chips, mood selectors — all at least 44px.
- **Do pair every accent with a 12-15% translucent background and a 30% border** for badges, confirmation dialogs, and active states.
- **Do use the secondary cyan for water, the eating phase, and "info" supplementary data.** It balances the lime without competing.
- **Do keep the header bars clean** — no bell, no cog. The Profile tab is the only place settings live.
- **Do use 1.5px or 1px progress bars for in-card data.** Reserve the big ring (320px) for the FastingTimer hero only.

### Don't

- **Don't put a full-bleed colored background on any screen.** Surfaces stay dark; accents live in buttons and rings.
- **Don't use coral as a primary action color.** It's for events (fast-started time), warnings, and delete buttons only.
- **Don't use the lime accent on white or light backgrounds.** It's calibrated for `#131313`–`#2a2a2a`.
- **Don't mix Inter and Space Grotesk in the same line of text.** Numbers use Space Grotesk; surrounding copy uses Inter.
- **Don't add drop shadows anywhere except the lime glow on the primary button.** Depth comes from color, not blur.
- **Don't show more than one progress ring per screen.** The FastingTimer is the only place a 320px ring belongs. Smaller cards use 1px bars.
- **Don't use sharp corners.** The smallest radius in the system is 8px (small chips), and most things are 12-16px.
- **Don't use full-rounded pills for non-pill content.** The pill shape is reserved for badges and the AUTOPHAGY ACTIVE / EATING WINDOW indicator.
- **Don't add headers, bells, or cogs to tab screens.** The top app bar is always just the FastTrack wordmark on the left. Settings live in the Profile tab.
- **Don't duplicate the "Daily Macros" view on the Profile tab.** The Home tab is the only place for current macro progress.

---

## Screen inventory (for redesigning)

If you're redesigning the app, here's what each tab must contain at a minimum:

### Home tab (`/`)

- Fixed top app bar (FastTrack wordmark, no icons).
- "Fasting Today" card: current fast status, elapsed time, progress ring, % complete, tappable to navigate to Fast tab.
- "Workout Progress" card: top 2 enabled exercises with progress bars.
- "Hydration" card: 3 quick-add water buttons + an "Add Water" primary button.
- "Daily Macros" 2×2 grid: Calories, Protein, Carbs, Fat.
- Bottom tab bar.

### Fast tab (`/fast`)

- Fixed top app bar.
- Hero: FastingTimer (320px ring) with protocol label, "Break Fast" / "End Eating Window" primary button.
- "If You Start Now" panel: Fast starts (lime), Eat window (cyan), Window closes (coral).
- "Fasting Schedule" preset chips + custom.
- "Check-in" panel: 5-mood selector + optional note.
- "Previous Fasts" list: 5 default + Show All, expandable detail, delete.
- "Weekly Calendar" (7-day circles) + "Full Month Calendar" modal trigger.

### Workout tab (`/workouts`)

- Fixed top app bar.
- "Session Active / Daily Burn" heading.
- List of ExercisePanel cards (pushups, crunches, sit-ups, squats + custom).
- "Add Custom Exercise" dashed-border button (opens modal).
- "Insight" card at the bottom with a motivational stat.

### Food tab (`/log-food`)

- Fixed top app bar.
- Search bar with barcode scanner icon.
- "Daily Macro Goal Summary" card: calories remaining + 3 macro progress rings.
- "Quick Add" 2×2 grid (Eggs, Rice, Chicken Breast, Coffee).
- "Water Tracker" card (cyan left border, 3 quick-add buttons).
- "Meal Type" selector (breakfast, lunch, dinner, snack).
- Date/time picker chip.
- "Search Food" (OpenFoodFacts) + quick-add chips.
- "+ Add Custom Item" button.
- "Meal Builder" staging area.
- "Today's Meals" list.

### Profile tab (`/profile`)

- Fixed top app bar.
- First name greeting in Inter 700 28px.
- FastingAchievements: streak, completed fasts, pushup streak, weekly pushups.
- Weight Chart + Weight Tracker in a glass-panel card.
- WeeklyStats: Fasting, Water, Workouts.
- "Settings" label-caps heading.
- SettingsPanel inline: profile details, account, notifications, unit preferences, theme toggle.
- Sign Out button (destructive, rose).

---

## Version

This design system corresponds to the current production build of FastTrack. The primary accent is lime, the secondary is cyan, the design is dark-mode-first, and the visual language is glass-morphism with monospaced-feeling labels. Any redesign generated from this file should preserve those four properties above all others.
