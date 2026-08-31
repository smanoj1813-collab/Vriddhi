# Fix: Superadmin / Faculty / Student logins failing (ACCOUNT_NOT_FOUND)

## Symptoms

- Superadmin, faculty, and student accounts could not log in — Firebase Auth
  accepted the password, but the app bounced back to the login page with an
  "account not found" error.
- Even when logged in, the Superadmin **Faculty** and **Students** pages
  returned empty lists (permission-denied on the collection queries).
- Faculty/student accounts created through **Import Faculty / Import
  Students** existed in Firebase Auth but could not log in at all.

## Root cause

PR #23 ("identity-and-access hotfix") deployed deny-by-default Firestore rules
whose identity helpers **errored out** for most real accounts:

```
function claimRole()   { return request.auth.token.role; }   // ← ERRORS when claim absent
function role()        { return claimRole() ?? userDoc().role; } // ← get() on missing doc ERRORS
```

Rules assume every signed-in user has either:

1. `role` / `collegeId` **custom claims**, or
2. a `users/{uid}` Firestore profile document.

But the real database has three generations of accounts:

| Generation | Custom claims | `users/{uid}` doc | Where identity lives |
|---|---|---|---|
| Provisioned via `provisionUser` CF | ✅ | ✅ | users |
| **Legacy** (original seed) | ❌ | ❌ | `superadmins/{uid}`, `faculty/{uid}`, `students/{uid}` |
| Client-imported (REST `signUp`) | ❌ (REST API can't set claims) | ⚠️ write was denied by the same rules | `faculty/…` profile only |

For those accounts, `claimRole()` and the `userDoc()` fallback **throw a rules
error**, and any rule that touches `role()` / `collegeId()` is denied entirely.
The client's `getUserData()` (login role resolution) therefore read *nothing*,
returned `null`, and login threw `ACCOUNT_NOT_FOUND` — for superadmins,
faculty, and students alike. The same error made `isSuperadmin()` false/error
on the Faculty & Students list queries, and blocked the `users/{uid}` writes
that imports depend on (leaving orphaned Auth accounts with no profile).

Secondary issues fixed in the same pass:

- **Duplicate `AuthProvider`** — `App.tsx` wrapped the route tree in a second
  `AuthProvider` nested inside the one in `main.tsx`, creating two independent
  auth states with duplicate `onAuthStateChanged` identity resolution.
- **Cloud Function caller checks** only accepted `users/{uid}` docs, so a
  legacy superadmin could not even call `provisionUser` /
  `bulkCreateStudentAccounts`.

## What changed

### `current-firestore.rules`

1. **Null-safe identity resolution** — claim access guarded with
   `'role' in request.auth.token`; `users/{uid}` access guarded with
   `exists()`; `role()` resolution order is now
   **claim → users doc → `superadmins/{uid}` doc**; `collegeId()` falls back to
   the user's own `students/{uid}` / `faculty/{uid}` profile doc.
2. **Self-profile reads** (`isOwner(id)`) on `superadmins`, `faculty`,
   `admins`, `hods`, `mentors` so legacy accounts can resolve their identity
   at login (placed *before* any `resource.data` access that can error on
   missing legacy fields).
3. **Field-guarded** `ownsStudentProfile` / `ownsStudentId` / `sameCollege`.
4. **`users` create** allowed for a *verified superadmin only*, with
   validation (doc ID == `uid`, whitelisted role, no password material) —
   this un-blocks UserImport / FacultyImport, which must persist the lookup
   doc client-side because the REST signUp API cannot set claims.
   Everyone else stays Cloud-Function-only.

### `src/App.tsx`

Removed the nested duplicate `AuthProvider` (it is mounted once in `main.tsx`).

### `functions/src/userProvisioning.ts`, `functions/src/studentAuth.ts`

Caller identity checks fall back to `superadmins/{uid}` so legacy superadmins
can provision users and bulk-import students.

### `src/modules/superadmin/api/superAdminApi.ts`

Self-healing imports: when an import meets an email whose profile doc exists
but whose `users/{uid}` lookup doc is missing (an orphan from the broken
window), the import now **restores the missing doc** instead of failing the
row. Re-running the same import CSV heals previously broken accounts (their
original passwords keep working; the credentials table shows `—` for them).

## Verification

- `npm run build` — ✅ TypeScript + Vite clean
- `cd functions && npx tsc --noEmit` — ✅

## Deploy (required — these fixes are inert until deployed)

```bash
# 1. Firestore rules (this is what unblocks login)
firebase deploy --only firestore:rules

# 2. Cloud Functions (caller-check fallbacks)
npm --prefix functions run build
firebase deploy --only functions

# 3. Hosting (client fixes: double provider, import self-heal)
npm run build
firebase deploy --only hosting
```

## Recovering accounts created during the broken window

Accounts whose Auth user was created but whose profile/lookup docs were
written by a *denied* import can be healed two ways:

1. **Re-run the same import CSV** — the self-heal path restores the missing
   `users/{uid}` doc and reports it in the results panel (original password
   still valid).
2. For a single user, re-importing that one row through **Import Faculty** is
   enough.

No manual Firebase console surgery is required.
