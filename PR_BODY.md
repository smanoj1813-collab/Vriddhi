### What

- Add a superadmin-only **Access Control** page at `/superadmin/access`.
- Add `grantUserRole` callable in `asia-south1` to create or repair accounts in one operation:
  - Creates Firebase Auth users when necessary.
  - Sets `role` and `collegeId` custom claims.
  - Creates or updates `users/{uid}`.
  - Creates or updates role-specific profile documents.
  - Creates/merges `superadmins/{uid}` for superadmins and removes it when another role is granted.
  - Links matching student profiles with both `uid` and `userId`.
  - Records the operation in `logs`.
- Add `diagnoseIdentity` callable to audit Auth claims, lookup documents, role profiles, and student linkage, with an actionable `issues[]` report.
- Add the Access Control entry to the superadmin User Management sidebar.
- Add `AUTH_AUDIT.md` documenting the identity model, SOP, and safety guidance.
- Include `setup-access-control.mjs`, a self-contained idempotent installer containing the feature payload and anchored patches.

### Why

The application has multiple generations of accounts: claims-provisioned users, legacy profile-only users, and client-imported users. Identity gaps between Firebase Auth, custom claims, `users/{uid}`, and role collections made account repair and creation error-prone. This provides a single audited workflow for creating another superadmin, granting roles, repairing existing accounts, and diagnosing incomplete identities.

### Verification

- `npm run build` — passed (TypeScript + Vite).
- `cd functions && npm run build` — passed (TypeScript).
- Installer tested against a pristine `main` tree — all payload files written and all anchored patches applied.
- Installer rerun against the working tree — idempotent.
- `git diff --check` — passed.

### Deploy after merge

```bash
firebase deploy --only functions
firebase deploy --only hosting
```

After granting a role, the target user must sign out and sign back in to refresh Firebase custom claims. Review the diff before deployment; this PR does not deploy or merge anything automatically.
