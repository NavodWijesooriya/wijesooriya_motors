# Firebase account and data setup

1. Enable Email/Password sign-in in Firebase Authentication and create the accounts that need access. Firebase Authentication UIDs are the owners of all account data.
2. Create a Firestore database for the same Firebase project and deploy this repository's rules:

   ```text
   firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
   ```

3. For the administrator account, create `userRoles/{AUTH_UID}` with the string field `role: "admin"`. Do not create a shared `admin` identity or let the client edit role documents. Regular users do not need a role document.
4. Configure the Firebase web settings in the local environment and sign in. On first sign-in, the user must save a business name before the application opens.

## Data ownership

Each account's profile and data live under its Authentication UID:

```text
users/{AUTH_UID}
users/{AUTH_UID}/bikes/{bikeId}
users/{AUTH_UID}/settings/preferences
users/{AUTH_UID}/products/{productId}
users/{AUTH_UID}/sales/{saleId}
users/{AUTH_UID}/customers/{customerId}
users/{AUTH_UID}/expenses/{expenseId}
```

Firestore rules authorize profile and business-data access only when the path UID matches `request.auth.uid`. The admin role does not grant access to other users' business records.

## Existing Firestore records

On sign-in, the app copies legacy `bikes` documents whose `ownerUid` matches the signed-in UID into that account's `users/{AUTH_UID}/bikes` collection. It copies the matching `userSettings/{AUTH_UID}` document into `users/{AUTH_UID}/settings/preferences` if that new settings document does not already exist. Migration keeps legacy records in place and never overwrites records already in the user's new collection. Legacy reads are owner-only and legacy writes are disabled by the rules.

Legacy records without a verifiable `ownerUid` are deliberately not assigned automatically; review and migrate those with a trusted administrative process. Browser-only backups can still be restored from the account's Settings screen while signed in as the intended owner.
