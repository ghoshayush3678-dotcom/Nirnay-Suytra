# निर्णय सूत्र — Nirnay Sutra

**Tagline:** *"Every word, proven before it’s published."*

Nirnay Sutra is an AI brand-governance platform that reviews content **before publication** against an organisation's approved guidelines, verified facts, terminology, and visual/accessibility rules. It combines retrieval-first grounding, a deterministic code rule engine, a strict citation verifier, zero-click risk-scored Autopilot, and role-based Firebase Authentication & Firestore security rules.

---

## Deploy to GitHub Pages

Nirnay Sutra is published as a 100% client-side, fully static application at:
`https://ghoshayush3678-dotcom.github.io/Nirnay-Suytra/` (Repository: `Nirnay-Suytra`).

Follow these steps to deploy and configure GitHub Pages:

### 1. Enable GitHub Actions for Pages
1. On GitHub, navigate to your repository **Nirnay-Suytra**.
2. Click **Settings** &rarr; **Pages** (in the left sidebar).
3. Under **Build and deployment &gt; Source**, select **GitHub Actions** (do not select "Deploy from a branch").

### 2. Configure GitHub Repository Secrets
The GitHub Actions workflow (`.github/workflows/deploy.yml`) builds the app with Vite and passes environment secrets at build time.

1. In your GitHub repository, open **Settings** &rarr; **Secrets and variables** &rarr; **Actions**.
2. Under **Repository secrets**, click **New repository secret** for each of the following:

| Secret Name | Source / Description |
| :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Firebase Console &rarr; Project Settings &rarr; Web app API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `[project-id].firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase Project ID (e.g. `nirnay-sutra`) |
| `VITE_FIREBASE_STORAGE_BUCKET` | `[project-id].firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Numerical sender ID from Firebase Project Settings |
| `VITE_FIREBASE_APP_ID` | Web app ID (e.g. `1:...:web:...`) |
| `VITE_FIRESTORE_DATABASE_ID` | Firestore Database ID (e.g. `(default)` or custom database ID) |
| `VITE_GEMINI_API_KEY` | *(Optional)* Google AI Studio Gemini API Key for client-side semantic reviews |

### 3. Add GitHub Pages to Firebase Authorized Domains
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project and navigate to **Authentication** &rarr; **Settings** &rarr; **Authorized domains**.
3. Click **Add domain** and enter:
   ```
   ghoshayush3678-dotcom.github.io
   ```
4. Click **Save**. This ensures Google Sign-In and popup/redirect authentication succeed without throwing `auth/unauthorized-domain`.

### 4. Push Code to Trigger Deployment
Push your changes to the `main` branch:
```bash
git add .
git commit -m "Fix GitHub Pages deployment and static asset paths"
git push origin main
```
The workflow `.github/workflows/deploy.yml` will automatically:
1. Check out the repository.
2. Set up Node 20 with cached dependencies.
3. Run `npm ci` and `npm run build` with `VITE_BASE=/Nirnay-Suytra/` and your repository secrets.
4. Upload `dist` as the Pages artifact and publish using `actions/deploy-pages@v4`.

---

## Security Warning: `VITE_` Environment Variables

> ⚠️ **CRITICAL SECURITY NOTICE FOR CLIENT-SIDE BUILDS:**
> 
> In Vite, any environment variable prefixed with `VITE_` (such as `VITE_FIREBASE_API_KEY`, `VITE_FIRESTORE_DATABASE_ID`, or `VITE_GEMINI_API_KEY`) is **inlined directly into public JavaScript bundles during `npm run build`**.
>
> - **Anyone visiting your website can inspect your page source and see these values.**
> - **Never** prefix backend master keys, service account JSON private keys, Firebase Admin credentials, or billing administrator keys with `VITE_`.
> - Firebase Client API keys are designed to be public identification tokens; their access is secured through **Firebase Authentication** and **Firestore Security Rules** (`firestore.rules`).
> - If you provide `VITE_GEMINI_API_KEY`, restrict the key in the Google Cloud Console / AI Studio Console to your specific authorized HTTP referrers (`https://ghoshayush3678-dotcom.github.io/*`). If omitted, Nirnay Sutra seamlessly runs its high-speed offline deterministic rule engine.

---

## Required Environment Variables Reference

Nirnay Sutra reads its Firebase configuration **only** from the following environment variables (with no hard-coded or placeholder keys):

```bash
VITE_BASE="/Nirnay-Suytra/"
VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN=""
VITE_FIREBASE_PROJECT_ID=""
VITE_FIREBASE_STORAGE_BUCKET=""
VITE_FIREBASE_MESSAGING_SENDER_ID=""
VITE_FIREBASE_APP_ID=""
VITE_FIRESTORE_DATABASE_ID=""
VITE_GEMINI_API_KEY=""
```

Before calling any authentication function, the app verifies that all required variables are present and non-empty. If any variable is missing, the app displays the **Setup incomplete: missing Firebase configuration** screen listing each variable as **Found** or **Missing** (without ever displaying secret values), with a one-click button to **Explore Demo Workspace (Sample Data)**.

---

## Fixing Sign-in Errors

If you encounter a Firebase Authentication error while signing in, follow the five Firebase Console steps below:

1. **Switch on Authentication (`auth/configuration-not-found`)**:
   Authentication isn't switched on for this Firebase project. In the [Firebase console](https://console.firebase.google.com/), open **Authentication**, click **Get started**, then enable **Google** and **Email/Password** under **Sign-in method**.
2. **Enable the Sign-In Provider (`auth/operation-not-allowed`)**:
   This sign-in method isn't enabled. Enable it in the Firebase Console under **Authentication &gt; Sign-in method** (enable both **Google** and **Email/Password**).
3. **Add Your Domain to Authorized Domains (`auth/unauthorized-domain`)**:
   Add `ghoshayush3678-dotcom.github.io` under **Authentication &gt; Settings &gt; Authorized domains** in the Firebase Console.
4. **Verify Project API Key (`auth/invalid-api-key`)**:
   The API key doesn't match this project. Open **Project settings &gt; General &gt; Your apps** in the Firebase Console and re-copy the config values into your GitHub Secrets or `.env`.
5. **Unblock Popups or Use Redirect Sign-In (`auth/popup-blocked` / `auth/popup-closed-by-user`)**:
   Allow popups for this site in your browser and click **Try again**, or click **Continue with redirect sign-in** to fall back to `signInWithRedirect`.

---

## Deploying Firestore Security Rules (`firestore.rules`)

The repository uses only free-tier Firebase services (**Firebase Authentication** with Google and Email/Password, and **Cloud Firestore** — no Storage, no Cloud Functions, and no Phone Authentication). To deploy `firestore.rules`:

```bash
firebase deploy --only firestore:rules
```
