# Firebase setup

The client is configured through `.env.local`; never commit that file. Copy
`.env.example` when setting up another environment.

## Console configuration

1. In the **plsqlhub** Firebase project, create a Firestore database in
   production mode.
2. Under **Authentication → Sign-in method**, enable **Email/Password** for
   staff login. Enable **Anonymous** only if students will submit through the
   public links without first having an account.
3. Create each user in **Authentication → Users**.
4. Publish the supplied Firestore rules. With the Firebase CLI:

   ```powershell
   npm install -g firebase-tools
   firebase login
   firebase use plsqlhub
   firebase deploy --only firestore:rules
   ```

## Data collections

The Firestore repository uses: `assignments`, `assignmentSubmissions`,
`quizzes`, `quizResponses`, `students`, `bonusAwards`, `attendance`, and
`settings`. The supplied rules allow authenticated users to read and write
these collections; no additional role configuration is needed.

The existing mock data intentionally remains available as development sample
content. Before production use, import or create the course records in the
collections above, then switch screens to the repository helpers in
`lib/firestore.ts` as each feature is migrated.
