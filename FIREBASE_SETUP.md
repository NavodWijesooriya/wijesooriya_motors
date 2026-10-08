# Firebase account approval and data setup

1. Enable Email/Password sign-in in Firebase Authentication and create a web app in the same Firebase project as Firestore.
2. Configure the six `VITE_FIREBASE_*` values from the Firebase web app configuration in your local `.env` file and in **Vercel → Project Settings → Environment Variables** for every deployment environment. These are public browser configuration values; Firestore security rules, not secret client keys, protect account data. Redeploy after changing Vercel environment variables because Vite embeds them at build time.
3. Create a Firestore database for the same Firebase project and deploy this repository's rules:

   ```text
   firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
   ```

4. Register the first administrator through the website. In Firebase Console, find that account's Authentication UID and its `users/{AUTH_UID}` registration document; set `approvalStatus` to `approved`, then create `userRoles/{AUTH_UID}` with the string field `role: "admin"`. Do not create a shared `admin` identity or let the client edit role documents. The administrator can then approve or reject future requests under **Settings → Registration Requests**. Regular users do not need a role document.
5. Users register with an email address and password. Their Firestore profile is created with `approvalStatus: "pending"`; only an administrator can change it to `approved` or `rejected`. Approved users must save a business name before the application opens.

The registration request is stored at `users/{AUTH_UID}` with `email`, `approvalStatus`, `submittedAt`, `createdAt`, and `updatedAt`. Approval and rejection decisions record `reviewedBy` and `reviewedAt`. Rejected and pending profiles cannot read or write the private dealership data collections, even if the Firebase Authentication account still exists.

## Passkey biometric unlock

The app uses WebAuthn platform credentials (passkeys) for device-mediated fingerprint, face, or other OS user verification. Biometric samples remain on the device. Firebase Cloud Functions verify registration and assertion signatures and store only the credential ID, public key, and signature counter. On app startup and whenever it is backgrounded, the app clears its persisted Firebase session; users then unlock with a registered passkey or sign in with their email and password. An explicit **Log Out** deactivates the passkeys; the next password sign-in reactivates them. Users can permanently remove registered passkeys from Settings.

Cloud Functions require a Firebase project with billing enabled. Choose the canonical HTTPS origin from which users will install and open the PWA, and deploy the Functions and Firestore rules:

```text
firebase deploy --only functions,firestore:rules --project YOUR_PROJECT_ID
```

All callable functions explicitly enable CORS. If the browser reports a CORS preflight failure, check the function endpoint directly: a `404 Not Found` means the callable was not deployed to the configured project/region, and cannot be fixed by changing browser CORS settings. Confirm that `VITE_FIREBASE_PROJECT_ID` names the intended project and that `firebase functions:list --project YOUR_PROJECT_ID` includes `beginBiometricAuthentication` in `asia-south1`; then deploy the command above. A preflight response should be successful and include `Access-Control-Allow-Origin`.

On first deployment, provide these function parameters when prompted:

- `WEBAUTHN_ORIGIN`: the exact app origin, including scheme and port when applicable, with no trailing slash (for example `https://sales.example.com`).
- `WEBAUTHN_RP_ID`: that origin's hostname only, without scheme or port (for example `sales.example.com`).

These values must match the deployed PWA origin for WebAuthn verification to succeed. For local testing against a Functions deployment, configure `WEBAUTHN_ORIGIN` as `http://localhost:3000` and `WEBAUTHN_RP_ID` as `localhost`; use a separate Firebase project or the Firebase Emulator Suite so those settings do not replace production's origin/RP ID. Credentials registered for `localhost` cannot be used on the production domain. Re-deploy Functions if the app's canonical domain changes. After deployment, configure Firestore TTL for the `expiresAt` field on `webauthnChallenges` and `webauthnRateLimits` so expired records are eventually removed; expired challenges are rejected even before TTL cleanup.

In **Settings → Firebase Account**, the user can register up to five platform passkeys after confirming their password. The browser/operating system determines which local verification method is available; if platform verification is unavailable or a credential is not registered, use email and password. WebAuthn requires a secure context (HTTPS, or localhost during development) and a supported browser/device.

## Data ownership

Each account's profile and data live under its Authentication UID:

```text
users/{AUTH_UID}
users/{AUTH_UID}/bikes/{bikeId}
users/{AUTH_UID}/settings/preferences
users/{AUTH_UID}/sales/{saleId}
users/{AUTH_UID}/invoices/{invoiceId}
users/{AUTH_UID}/customers/{customerId}
users/{AUTH_UID}/expenses/{expenseId}
users/{AUTH_UID}/products/{productId}
```

The profile document stores account and business identity. Inventory vehicles and settings are stored in `bikes` and `settings/preferences`; sales, invoice snapshots, and customer snapshots are stored in their own subcollections under the same UID. Related sale and customer details are also retained on the vehicle sale record for existing screens and printed invoices. The Firebase client uses Firestore's persistent IndexedDB cache to retain data for offline PWA launches and synchronize changes with Firestore when connected; Firestore remains the source of truth across devices.

Firestore rules authorize profile and business-data access only when the path UID matches `request.auth.uid`. All user data subcollections under `users/{AUTH_UID}` inherit the approved-account check, so the admin role does not grant access to other users' business records.
Only admins can list user profiles, which lets the Settings approval queue show pending requests. Each request can be reviewed only once; decisions cannot be changed by the applicant or overwritten from the client.

## Existing Firestore records

On sign-in, the app copies legacy `bikes` documents whose `ownerUid` matches the signed-in UID into that account's `users/{AUTH_UID}/bikes` collection. It copies the matching `userSettings/{AUTH_UID}` document into `users/{AUTH_UID}/settings/preferences` if that new settings document does not already exist. It also backfills separate sale, invoice, and customer snapshots from existing vehicle sale records without deleting or overwriting existing records. Migration keeps legacy records in place and never overwrites records already in the user's new collection. Legacy reads are owner-only and legacy writes are disabled by the rules.

Legacy records without a verifiable `ownerUid` are deliberately not assigned automatically; review and migrate those with a trusted administrative process. Browser-only backups can still be restored from the account's Settings screen while signed in as the intended owner.
