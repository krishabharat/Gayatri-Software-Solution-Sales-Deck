# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
# Android app (APK)

This React application can be packaged for Android with Capacitor. Cloud features continue to use the configured Supabase project and require an internet connection.

## Requirements

- Node.js and npm
- Android Studio with the Android SDK installed
- A JDK supported by the installed Android Gradle Plugin
- A local `.env.capacitor.local` file containing the production `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`

Use the publishable key only. Never put a Supabase service-role key or database password in the mobile app. The Vercel environment settings are not automatically available to a local APK build.

## Build and open the Android project

```sh
npm install
npm run android:sync
npm run android:open
```

In Android Studio, wait for Gradle sync to finish, then use **Build > Build Bundle(s) / APK(s) > Build APK(s)**. Android Studio will show the generated APK location.

Run `npm run android:sync` again after changing app code so the Android project receives the latest web build.
