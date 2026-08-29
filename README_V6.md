# Smaran v6 — React Native update

This bundle is based on the user's latest Smaran `src` folder, `App.js`, and `package.json`.

## v6 changes

1. DOB picker now supports Year -> Month -> Day selection for caregiver and patient.
2. Home greeting is driven by the patient first name and current time.
3. Reminders can be added, edited, completed/uncompleted, and deleted.
4. Reminder data is persisted locally with AsyncStorage and is structured so a backend can replace the storage layer.
5. In-app reminder bell was added to Home and the Reminders screen.
6. Android/iOS local scheduled notifications use Notifee.
7. Guardian Mode requires biometric authentication before it can be enabled.
8. Post-signup biometric setup is mandatory; there is no skip path.
9. Bottom navigation and Profile UI were refreshed.
10. Home "Your day at a glance" now derives reminder count and activity minutes from current reminder data.

## Install

From the React Native project root:

```powershell
npm install
```

If you are replacing files manually, make sure `package.json` contains:

- `@react-native-async-storage/async-storage`
- `@notifee/react-native`
- `@react-native-community/datetimepicker`

Then rebuild Android:

```powershell
cd android
.\gradlew clean
cd ..
npm start -- --reset-cache
```

Open a second terminal:

```powershell
npx react-native run-android
```

## Android reminder permission

On Android 12+, exact timestamp triggers may require the user to allow exact alarms. Smaran detects this and offers to open the Android alarm permission settings when a reminder is saved.

The relevant permission can also be declared in `android/app/src/main/AndroidManifest.xml` if your Android build does not already receive it through the notification library:

```xml
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

## Important backend note

This v6 bundle uses AsyncStorage for the current working prototype. The dashboard is no longer hard-coded for reminder count/activity minutes, but a real server database/API is not included because no backend source was supplied with the uploaded project. Replace the storage service with your backend API when that backend is ready.
