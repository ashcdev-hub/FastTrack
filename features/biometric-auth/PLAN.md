# Biometric Authentication — Implementation Plan

> **Status**: Planned — not started. No paid developer account needed on either platform.

---

## Feature Summary

Add optional Face ID / Touch ID (iOS) or fingerprint/face unlock (Android) protection on app launch or after background timeout. Users opt in via a "Require Biometrics" toggle in Profile settings.

| Platform | Implementation | Fallback |
|----------|---------------|----------|
| iOS (Expo Go) | `expo-local-authentication` wraps `LAContext` (Face ID / Touch ID) | Device passcode (standard iOS fallback) |
| Android (Expo Go) | `expo-local-authentication` wraps `BiometricPrompt` | PIN/pattern/password via `BiometricManager` |
| Web | `hasHardwareAsync()` returns `false` → lock screen is bypassed entirely | N/A |
| iOS dev build | Same as Expo Go, no additional entitlements needed | Device passcode |
| iOS App Store | Same — no restricted capabilities; works on free cert | Device passcode |

## Auth Flow

```
App launch / return from background
  ├─ Biometrics enabled? ──No──▶ Normal app UI
  │
  └─ Yes
       ├─ hasHardwareAsync() ──false──▶ Normal app UI (bypass on unsupported devices)
       │
       └─ true
            ├─ authenticateAsync()
            │     ├─ success ──▶ Normal app UI
            │     ├─ user fallback (device pin) ──▶ Normal app UI
            │     └─ failure / cancel ──▶ Stay on lock screen (retry or use passcode)
```

## Settings & Persistence

- **Toggle**: "Require Biometrics" in Profile → Settings section
- **Storage**: `AsyncStorage` key `@fasttrack_biometrics_enabled` (boolean)
- **Timeout**: Optional configurable delay (immediate, 30s, 1min, 5min) before re-prompting after app backgrounding
- **Store**: Add `biometricsEnabled` + `biometricsTimeout` to Zustand store or a dedicated `useSettingsStore`

## Implementation Steps

### Phase 1: Core Biometric Prompt (Small)

1. **Install**: `expo-local-authentication` (already in use elsewhere? Check `package.json`)
2. **Create hook**: `hooks/useBiometricAuth.ts`
   - `isAvailable`: check `hasHardwareAsync()` + `isEnrolledAsync()`
   - `authenticate`: call `authenticateAsync()` with config
   - `biometricsEnabled`: read/write AsyncStorage
3. **Create lock screen**: `components/BiometricLockScreen.tsx`
   - Theme-aware overlay (full-screen, above all content)
   - Padlock icon + "Unlock with Face ID / Touch ID" prompt
   - "Use Passcode" fallback button
   - Tap icon to retry
4. **Integrate in root layout**: `app/_layout.tsx`
   - Wrap `Stack` with lock screen visibility check
   - Listen to `AppState` changes for background→foreground transitions
   - Skip completely on web (`Platform.OS === 'web'`)

### Phase 2: Settings & Timeout (Small)

5. **Settings toggle**: Add "Require Biometrics" row in `SettingsPanel.tsx`
   - Only visible when `isAvailable` is true
   - Toggle writes to AsyncStorage
   - Optional: timeout dropdown (immediate / 30s / 1min / 5min)
6. **Background timeout**: Track `lastActiveTime` in Zustand
   - On `AppState` change to active, compare against timeout setting
   - Re-prompt biometrics if exceeded

## Key API Methods (`expo-local-authentication`)

```ts
import * as LocalAuthentication from 'expo-local-authentication';

// Check availability
const compatible = await LocalAuthentication.hasHardwareAsync();
const enrolled = await LocalAuthentication.isEnrolledAsync();
const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
// types includes: FINGERPRINT, FACIAL_RECOGNITION, IRIS

// Authenticate
const result = await LocalAuthentication.authenticateAsync({
  promptMessage: 'Unlock FastTrack',
  fallbackLabel: 'Use Passcode',        // iOS fallback button label
  cancelLabel: 'Cancel',                 // Android cancel button
  disableDeviceFallback: false,          // allow passcode as fallback
});
// result: { success: boolean, error?: string, warning?: string }
```

## Platform Notes

| Concern | Detail |
|---------|--------|
| **Expo Go support** | Works on both iOS and Android Expo Go — no dev build needed |
| **Free cert** | iOS `LAContext` requires no entitlements; works on Personal Team |
| **Web** | `hasHardwareAsync()` returns `false` — bypass lock screen entirely |
| **App Store Review** | Biometrics are a standard iOS feature; no review friction |
| **Android permissions** | `USE_BIOMETRIC` permission auto-merged by Expo; no manual manifest entry |
| **Edge cases** | Device without biometrics enrolled → `isEnrolledAsync()` is `false` → toggle hidden in settings |
| **Security** | Biometrics are device-level only — no biometric data leaves the device. The app just gets a `success`/`failure` boolean |

## Not in Scope

- Custom passcode / PIN fallback (uses device-native passcode fallback instead)
- Hardware-backed keystore / secure enclave encryption
- Per-screen locking (lock screen covers entire app uniformly)
- Biometric-tied encryption keys for data at rest

## Files to Create / Modify

| File | Type | Purpose |
|------|------|---------|
| `hooks/useBiometricAuth.ts` | New | Auth availability, authenticate, settings read/write |
| `components/BiometricLockScreen.tsx` | New | Full-screen overlay with unlock prompt |
| `app/_layout.tsx` | Modify | Wrap Stack with lock screen + AppState listener |
| `components/SettingsPanel.tsx` | Modify | Add "Require Biometrics" toggle row |
| `store/` | Possibly new | Lightweight settings store or add to existing store |
