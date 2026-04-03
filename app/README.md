# STA Test Website Flutter App

This folder contains a Flutter wrapper app that runs the existing website code with the same HTML/CSS/JS/data logic.

## What is reused

- `app/assets/www/public/*` copied from the website `public/*`
- `app/assets/www/src/*` copied from the website `src/*`

The app opens:

- `http://localhost:8080/public/index.html`

served from bundled app assets.

## Setup (one-time)

Flutter SDK is required.

1. Install Flutter and add it to PATH.
2. Open terminal in this `app` folder.
3. Verify Flutter is installed:

```bash
flutter --version
```

If this fails, add Flutter `bin` folder to PATH and reopen terminal.

4. Generate platform files:

```bash
flutter create . --platforms=android
```

5. Install dependencies:

```bash
flutter pub get
```

6. Run app (debug):

```bash
flutter run
```

7. Build APK:

```bash
flutter build apk --release
```

APK output path:

- `app/build/app/outputs/flutter-apk/app-release.apk`

## Finalized Android app identity

- Application ID / package: `com.sta.testwebsite`
- App label: `STA Test Website`

## Keep website and app in sync

If you update website files under project root `public/` or `src/`, re-copy them into `app/assets/www/` before building.

PowerShell example from repo root:

```powershell
Copy-Item -Recurse -Force "public/*" "app/assets/www/public/"
Copy-Item -Recurse -Force "src/*" "app/assets/www/src/"
```
