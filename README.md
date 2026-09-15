# FindMe

Don't Just Report. Get Found.

## Phase 1 — Project Foundation

Expo SDK 54, TypeScript strict mode, and Expo Router. Includes Home, Map, Family, Profile, and an SOS demonstration modal. Shared colors and UI components support consistent contrast and touch targets.

This phase does not authenticate users, request GPS permissions, load live maps, share locations, or send emergency requests. All screens label the prototype state. LINE authentication will use a backend-managed session without Firebase Authentication.

## Run

```sh
npm ci
npm start
```

Open with a compatible Expo Go SDK 54 client or an SDK 54 development build. For browser preview, use `npm run web`. Windows cannot run an iOS simulator; use a physical iPhone or a Mac for iOS testing.

## Checks

```sh
npm run typecheck
npx expo install --check
npx expo export --platform all
```

## Configuration

Copy `.env.example` to `.env` when setting up another machine. Maps keys are read by `app.config.js`; the native app includes them, so configure Cloud Console restrictions before distributing builds. Never place the LINE Channel Secret in an `EXPO_PUBLIC_*` variable.

See `SETUP.md` for Cloud configuration and pending app identifiers. Backend environment placeholders are in `backend/.env.example`.

The Firebase Firestore project is `findme-7146d`. The backend must be given server-side Google credentials before it can read or write Firestore.

## Manual smoke check

1. Open each bottom tab; confirm its title and prototype status.
2. On Home, open SOS; confirm that the page explicitly says no request is sent.
3. Return Home, then use the Family shortcut.
4. Confirm there are no authentication or location permission prompts in this phase.

Continue to Phase 2 only after Phase 1 review, as required by the project brief.

## Verification — 2026-09-08

- TypeScript check passed.
- `expo install --check` passed: dependencies match SDK 54.
- Metro export generated Android, iOS, and Web bundles successfully.
- Browser smoke test passed for all four tabs and Home → SOS → Home.
- Native device testing remains pending; bundle generation is not a physical device test.
- npm reported 25 dependency vulnerabilities (16 moderate, 9 high) after installation. Dependency audit/remediation remains pending; no forced upgrades were applied because SDK 54 must be preserved.
