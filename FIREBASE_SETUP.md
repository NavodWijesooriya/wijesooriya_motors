# Firebase account setup

1. In Firebase Authentication, create three email/password users and set their display names to `Malith`, `Dananjaya`, and `Me (Admin)`. Their login emails and passwords are managed by Firebase Authentication, not by the app.
2. Create a Firestore database for the same Firebase project, then deploy the rules from this repository with `firebase deploy --only firestore:rules --project YOUR_PROJECT_ID`.
3. In Authentication, copy the administrator account's UID. In Firestore, create `userRoles/{ADMIN_UID}` with a string field `role` set to `admin`. Do not create role documents for Malith or Dananjaya; authenticated users without this role are regular users. The app cannot create or edit role documents.
4. Configure the app's Firebase web settings in the local environment, then sign in with each account. New vehicle records are owned by the UID of the account that creates them. The administrator can read and manage all vehicle records; regular users can access only records with their own UID.

Existing records stored only in a browser's local storage are not automatically migrated because their owner cannot be verified. Export a backup from the old browser and import it while signed into the account that should own those records.