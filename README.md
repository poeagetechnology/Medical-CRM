# MedCRM — Hospital Management

Patients, scheduling, operations, billing and analytics for a hospital, built with
React (Create React App), Tailwind CSS, Firebase Authentication and Cloud Firestore.

## Getting started

Requires Node.js 18+.

```bash
npm install
cp .env.example .env.local   # fill in your Firebase web app values
npm run dev                  # same as npm start, opens http://localhost:3000
```

### One-time Firebase setup

1. Enable **Email/Password** sign-in and create a **Firestore** database.
2. Publish the security rules: `firebase deploy --only firestore:rules`
   (or paste `firestore.rules` into Console → Firestore → Rules).
3. Create the first Super Admin:
   `SUPER_ADMIN_EMAIL=you@hospital.com SUPER_ADMIN_PASSWORD=<strong password> npm run create-super-admin`

Everyone else uses **Create account** and waits for a Super Admin to approve them
under **Users & Access**.

## Features

| Area | Screens |
| --- | --- |
| Overview | Dashboard, Calendar, Notifications, Search (`Ctrl/⌘ + K` from anywhere) |
| Patients | Patients, Patient profile, Reports, OP queue, Checkups |
| Operations | Appointments, Doctors, Smart reports, Surgeries, Beds, Ambulance, Medical center |
| Finance | Billing, Analytics |
| Administration | Staff, Users & access, Settings (backup / reset), My profile |

Linked workflows: appointment check-in issues an OP token; admitting a patient to a
bed sets their room; starting a surgery marks the surgeon busy; completed visits can
be invoiced; renaming a patient or doctor updates linked records.

## Project structure

```
src/
  App.jsx                 auth gate, routing (hash based), page registry
  components/
    ui/                   design system: buttons, modal, drawer, table, form, toasts
    layout/               sidebar, top bar, command palette, error boundary
    editors/              one create/edit/delete form per record type
    charts.jsx            themed recharts wrappers
  config/navigation.js    menu entries and quick actions
  context/AuthContext.jsx sign-in, sign-up, profile, password
  hooks/                  live collections, workflows, routing, theme
  pages/                  one file per screen
  services/               rename cascade, printing, backup / reset
  utils/                  roles (RBAC), form definitions, formatting, statistics
firestore.rules           server-side permissions (mirrors utils/roles.js)
```

## Changing permissions

Edit `src/utils/roles.js` **and** `firestore.rules`, then re-deploy the rules.

## Adding a screen

1. Create `src/pages/MyPage.jsx` using `Page` and `PageHeader` from `components/ui`.
2. Register it in `SCREENS` (`App.jsx`), `SECTIONS` (`config/navigation.js`) and
   `PAGE_ACCESS` (`utils/roles.js`).

## Deploying to Vercel

1. Import the repo at https://vercel.com/new (`vercel.json` sets build and output).
2. Add every `REACT_APP_FIREBASE_*` variable from `.env.example` under
   Project → Settings → Environment Variables.
3. Deploy. CRA inlines these values at build time, so redeploy after changing them.
4. Add your domain in Firebase Console → Authentication → Settings → Authorized domains.
