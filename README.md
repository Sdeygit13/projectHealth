# Smaran final integration update

This ZIP contains the updated `src/` plus the integrated `App.js`.

## One required dependency for the new Memory Album gallery

The new multi-photo gallery uses `react-native-image-picker`.
From the project root run:

```powershell
npm install react-native-image-picker
```

Then rebuild Android:

```powershell
npx react-native run-android
```

For a normal Android app, the library handles the photo picker flow. If your Android project targets a setup that requires explicit media permissions, follow the library's current Android setup instructions.

## Important Android reminder-alarm requirement

Smaran's notification service uses Notifee trigger notifications and exact alarms. Ensure the Android app has the exact-alarm permission required by the Notifee version installed in your project, then rebuild the native app. `app.json` does not control this native Android permission.

## What was integrated

- Status-bar-safe global app content area.
- Centralized Android hardware/app Back handling.
- Persistent profile, reminders, trusted people and memory albums.
- Reminder add/edit/delete/complete synchronization with notifications.
- Real Circle contacts with country code + 10-digit mobile number and Android dialer calling.
- Caregiver contact pinned to the top and visibly marked.
- Multi-photo gallery selection and album-style memory UI.
- English/Bengali/Hindi/Assamese language selection.
- Patient/Caregiver mode switching protected by biometric authentication.
- Biometric enable/disable uses the existing biometric service.
