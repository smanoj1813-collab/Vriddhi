# Vriddhi authentication and identity audit

## Identity model

Firebase Authentication proves the email/password identity. The application role is wired across Auth custom claims, `users/{uid}`, and the role-specific profile collection. Cloud Functions are the trusted boundary for grants and provisioning; the client only presents the request.

## Access Control SOP

1. A current superadmin opens **Superadmin → Access Control**.
2. Enter an existing Auth email to repair or grant an identity. Existing passwords are preserved.
3. To create a new account, provide the display name and either a password or accept the generated temporary password. Deliver temporary credentials securely and ask the user to change the password.
4. Select the role and college. A superadmin does not require a college; every tenant-scoped role does.
5. Use Identity audit after a grant to confirm claims, lookup documents, profile documents, and student linkage.
6. Re-authentication is required after a role grant so the browser receives refreshed custom claims.

## Guarantees

`grantUserRole` is superadmin-only, region `asia-south1`, idempotent for existing accounts, and records an audit document in `logs`. Granting `superadmin` creates/merges `superadmins/{uid}`; granting another role removes that document as the revocation path. Staff profiles are merged by email when available and students receive both `uid` and `userId` links.

## Important safety notes

- Never put Firebase Admin credentials or passwords in the client.
- Treat temporary passwords as secrets; the callable response is shown only to the initiating superadmin.
- Firestore rules and callable authorization remain the enforcement boundary; UI role checks are not security controls.
- Review audit results and the diff before deploying functions or hosting.
