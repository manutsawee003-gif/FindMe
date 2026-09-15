# FindMe configuration

The Expo SDK 54 Phase 1 application has been scaffolded. Backend and live services are not connected yet.

## Google Cloud

- Firebase project: `findme-7146d`.
- Firebase Web app config is recorded in the root `.env.example`. Install the Firebase Web SDK before adding a client-side Firestore adapter.
- Google Maps project currently configured: My First Project (`project-1fd9f15d-b5e0-41fc-b7d`). These may be separate projects; use the Firebase project ID for Firestore and keep the Maps project for Maps keys until you intentionally migrate them.
- Verified in the signed-in Cloud Console on 2026-09-08: Maps SDK for Android and Maps SDK for iOS are both enabled.
- Separate Maps keys are stored in the ignored root `.env`.
- The iOS key was verified directly in the Console; its underscores have no backslashes.
- Console currently lists 35 allowed APIs for the existing keys. Cloud settings have not been changed.
- Before a native build, select Android package name and iOS bundle identifier, obtain the Android signing certificate SHA-1, and restrict each key to its app and corresponding Maps SDK.
- Do not replace app identifiers or signing fingerprints with guessed values.

## LINE and backend

- LINE Login channel ID: `2011495461`.
- Authentication will use LINE identity verification and backend-managed FindMe sessions, without Firebase Authentication.
- Set a newly issued LINE channel secret only in backend secrets. The secret shared in chat has not been copied into mobile configuration.
- Backend URL and LINE callback URL are pending backend implementation.
- Local callback URL to register in LINE Developers is `http://localhost:8787/auth/line/callback`.
- Firestore access is designed to run through the authenticated backend with authorization checks; LINE tokens do not authenticate mobile Firestore SDK calls.
- Before starting the backend, create a service account or use Application Default Credentials for `findme-7146d`, then set `GOOGLE_APPLICATION_CREDENTIALS` outside the mobile app. Never commit the service-account JSON.

## Next phase

Review the Phase 1 foundation before proceeding to backend/database setup. Environment files and dynamic Maps configuration have been preserved.
