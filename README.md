# निर्णय सूत्र — Nirnay Sutra

**Tagline:** *"Every word, proven before it’s published."*

Nirnay Sutra is an AI brand-governance platform that reviews content **before publication** against an organisation's approved guidelines, verified facts, terminology, and visual/accessibility rules. It combines retrieval-first grounding, a deterministic code rule engine, a strict citation verifier, zero-click risk-scored Autopilot, and role-based Firebase Authentication & Firestore security rules.

---

## Required Environment Variables

Nirnay Sutra reads its Firebase configuration **only** from the following seven environment variables (with no hard-coded or placeholder values):

```bash
VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN=""
VITE_FIREBASE_PROJECT_ID=""
VITE_FIREBASE_STORAGE_BUCKET=""
VITE_FIREBASE_MESSAGING_SENDER_ID=""
VITE_FIREBASE_APP_ID=""
VITE_FIRESTORE_DATABASE_ID=""
```

Before calling any authentication function, the app verifies that all seven variables are present and not empty. If any variable is missing, the app displays the **Setup check** screen listing each variable as **Found** or **Missing** (without ever displaying its value).

---

## Fixing sign-in errors

If you encounter a Firebase Authentication error while signing in, follow the five Firebase Console steps below:

1. **Switch on Authentication (`auth/configuration-not-found`)**:
   Authentication isn't switched on for this Firebase project. In the [Firebase console](https://console.firebase.google.com/project/nirnay-sutra), open **Authentication**, click **Get started**, then enable **Google** and **Email/Password** under **Sign-in method**.
2. **Enable the Sign-In Provider (`auth/operation-not-allowed`)**:
   This sign-in method isn't enabled. Enable it in the Firebase Console under **Authentication > Sign-in method** (enable both **Google** and **Email/Password**).
3. **Add Your Domain to Authorized Domains (`auth/unauthorized-domain`)**:
   Add this site's address under **Authentication > Settings > Authorized domains** in the Firebase Console (for example, `localhost` and your Cloud Run / AI Studio preview domain `*.run.app`).
4. **Verify Project API Key (`auth/invalid-api-key`)**:
   The API key doesn't match this project. Open **Project settings > General > Your apps** in the Firebase Console and re-copy the config values into your `VITE_FIREBASE_*` environment variables.
5. **Unblock Popups or Use Redirect Sign-In (`auth/popup-blocked` / `auth/popup-closed-by-user`)**:
   Allow popups for this site in your browser and click **Try again**, or click **Continue with redirect sign-in** to fall back to `signInWithRedirect`.

---

## Deploying Firestore Security Rules (`firestore.rules`)

The repository uses only free-tier Firebase services (**Firebase Authentication** with Google and Email/Password, and **Cloud Firestore** — no Storage, no Cloud Functions, and no Phone Authentication). To deploy `firestore.rules`:

```bash
firebase deploy --only firestore:rules
```

> **Security Review Note:** Please review and test the generated `firestore.rules` in the Firebase Rules Playground before sharing your workspace broadly.
