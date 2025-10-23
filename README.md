# FireFit Probation Tracker (Starter)

Vite + React app wired for Firebase Auth/Firestore and Netlify deploy. Includes:
- Driver Check-Offs page
- Department Info page
- Admin Info page
- Classroom link page
- Admin Editor (Department/Links/Driver Tasks)
- Exports page (CSV for driver & module signoffs)

## Quick Start
1. Clone & install
```bash
npm i
```
2. Copy `.env.example` to `.env` and fill Firebase values.
3. Run locally
```bash
npm run dev
```
4. Deploy to Netlify (build: `npm run build`, publish: `dist`).

## Firebase
- Import `firestore.rules` into Console → Firestore → Rules.
- Seed config docs (`config/department`, `config/links`, `config/driver_tasks`) from your console.

## Pages
- `/driver` – record driver check-offs (mentor/admin)
- `/department` – read department info
- `/admin` – read admin contacts
- `/classroom` – open Google Classroom & resources
- `/admin-editor` – edit config (admin only, via rules)
- `/exports` – download CSVs

## CSV Export
Exports read from:
- `driver_signoffs` (id, userId, taskId, result, notes, evaluatorId, createdAt)
- `signoffs` (id, userId, moduleId, taskId, attemptNumber, result, score, notes, evaluatorId, createdAt)

If Firestore asks for an index (range on `createdAt` + equality), follow the link to create it.

---

**Note:** This starter expects you already have Auth enabled and user docs under `/users/{uid}` with `isActive` and optionally `shift`, `displayName`.
