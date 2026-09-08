# Project Context: Smaran

## Overview
This repository is a React Native mobile application for a caregiver and memory-support experience. The app is centered around a patient-facing daily wellness dashboard, reminders, memory albums, trusted contacts, biometric access, and caregiver profile management.

The project appears to be a custom product-style app rather than a standard boilerplate React Native starter. It includes a local-first mobile app and a small FastAPI backend scaffold.

## Main App
- App entry: [App.js](App.js)
- Project config: [package.json](package.json)
- Theme: [src/theme.js](src/theme.js)

## App Purpose
The application is designed to help a patient/caregiver manage:
- reminders and daily routines
- memory games and cognitive activities
- personal health profile information
- trusted people / emergency circle
- photo memory albums
- caregiver mode and patient mode
- language selection
- biometric access control

## High-Level Architecture
### Frontend (React Native)
The mobile app is implemented as a single custom state-driven application in [App.js](App.js). It does not appear to use a formal navigation package like React Navigation. Instead, it manages a `screen` state and conditionally renders the active screen.

Major user flows:
- `splash`
- `login`
- `signup`
- `biometricSetup`
- `onboarding`
- `home`
- `reminders`
- `games`
- `talk`
- `photos`
- `circle`
- `profile`
- `music`
- `relax`
- `forgot`

### Persistence Layer
Local persistence is handled in [src/services/storage.js](src/services/storage.js) using AsyncStorage.

Stored data includes:
- profile
- reminders
- people / circle contacts
- memory albums
- legacy key migration handling

### Native Features
The app integrates native capabilities via services under [src/services/](src/services):
- biometric auth
- reminder scheduling / alarm sync
- notifications
- speech / TTS / sound
- camera capture

## Directory Structure
### Root
- [App.js](App.js): app controller and screen orchestration
- [App_backup.tsx](App_backup.tsx): backup copy of an earlier implementation
- [index.js](index.js): React Native app entry point
- [app.json](app.json): app metadata and native config
- [babel.config.js](babel.config.js): Babel setup
- [metro.config.js](metro.config.js): Metro bundler config
- [package.json](package.json): dependencies and scripts
- [README.md](README.md): setup/integration notes
- [tsconfig.json](tsconfig.json): TypeScript config

### src/
- [src/theme.js](src/theme.js): app colors and shared styles
- [src/screens/](src/screens): UI screens for the app
- [src/services/](src/services): storage, notifications, biometric, reminder, speech, alarm logic
- [src/components/](src/components): reusable UI pieces like nav, cards, icons, headers

### backend/
The Python backend is a small FastAPI service under [backend/app/main.py](backend/app/main.py).

It includes:
- authentication routes
- DB initialization
- health endpoint
- CORS configuration

## Key Screens
### Home screen
- [src/screens/HomeScreen.js](src/screens/HomeScreen.js)
- Provides greeting, date, reminder summary, feature cards, and quick actions.
- Links to reminders, games, memory gallery, talk/AI screen, etc.

### Reminders screen
- Handles daily reminder scheduling, editing, completion status, and native sync.

### Photos screen
- Displays memory albums and supports photo upload/gallery flows.

### Circle screen
- Shows personal contacts, physician, caregiver, and emergency contacts.

### Profile screen
- Manages patient/caregiver mode, language, personal details, and profile updates.

### Authentication & onboarding flow
- login, signup, forgot password, onboarding, biometric setup screens

## State Management Pattern
The app uses React state hooks and local component state, with a centralized root app state in [App.js](App.js). It keeps data like:
- profile
- reminders
- people
- memories
- language
- mode
- boot state
- biometric state

The app also uses refs to track screen history and boot state.

## Local Storage Design
Storage is intentionally versioned and defensive:
- keys are namespaced with version suffixes
- data is normalized before use
- legacy keys are migrated when available
- storage is cleared on logout

This is a strong pattern for a small mobile app that needs stable local data handling.

## Native App Features and Integrations
The app integrates many platform capabilities:
- biometric authentication
- camera access
- native alarm scheduling with notification sync
- TTS / voice-related support
- storage-based reminders persistence
- Android hardware back handling

## Notable Observations
### Strengths
- Good feature breadth for a caregiving app
- Thoughtful local-first persistence
- Native integration for reminders and health-focused workflows
- Clean visual theme and custom cards/buttons

### Risks / Maintenance Notes
- Screen flow is custom and centralized, which can become brittle as app complexity grows
- App logic and UI rendering are tightly coupled in [App.js](App.js)
- Several features are feature-rich but may need refactoring into smaller modules and clearer state boundaries
- Future scalability would benefit from React Navigation and a more formal state management approach

## Overall Assessment
This project is a substantial custom React Native application for a caregiver and memory support workflow. It is closer to a polished app prototype than a minimal tutorial app, with a clear product goal and a reasonable local-first implementation.

The most important files to understand first are:
- [App.js](App.js)
- [src/services/storage.js](src/services/storage.js)
- [src/screens/HomeScreen.js](src/screens/HomeScreen.js)
- [src/theme.js](src/theme.js)
- [package.json](package.json)

## Suggested Next Steps
- Split the large screen-controller logic in [App.js](App.js) into separate feature modules
- Adopt a navigation structure for easier deep-linking and screen management
- Move business logic into services/hooks to reduce component complexity
- Add tests around persistence and reminder behavior
- Review the backend integration path to see whether the FastAPI service is currently used or still scaffolding
