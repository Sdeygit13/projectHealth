# Smaran — SIH26003 Frontend v4

This package contains the corrected React Native frontend for the Smaran SIH26003 prototype.

## v4 fixes
- Removed the top Login header/pill.
- Removed the @ field icon and other unnecessary identifier icons.
- Login label is now `Enter Email or Phone Number`.
- Placeholder is now `Email or Phone Number`.
- Removed the demo-account credentials from the visible UI.
- Improved Android screen fitting and vertical spacing.
- Prevented automatic password focus/autofill behavior on Android while retaining autocomplete semantics.
- Added working Android hardware Back navigation using a real navigation history stack.
- Existing screen-level Back buttons continue to work.
- Login validation remains active.
- Login loading/disabled state remains active.
- Generic authentication errors remain active.
- Basic failed-attempt throttling remains active.
- No `100% Offline` UI text is included.

## Demo login for frontend testing
Email: caregiver@smaran.app
Password: Smaran123

Replace the temporary demo authentication with the team's real HTTPS authentication API before production use.
