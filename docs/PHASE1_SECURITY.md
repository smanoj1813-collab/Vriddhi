# Phase 1 security hardening

Do **not** deploy Firestore rules or Functions until emulator tests pass and a rules backup is taken.

## Operator actions (cannot be done in git)

1. Create Secret Manager secrets used by Functions:
   - `GEMINI_API_KEY`
   - `OPENAI_API_KEY`
   - `DEEPSEEK_API_KEY`
2. **Rotate** any Gemini / OpenAI / DeepSeek / Anthropic keys that were ever placed in Vite `VITE_*` variables or committed `.env` files.
3. Backfill Firebase Auth custom claims (`role`, `collegeId`) for existing users via Admin SDK.
4. Take a Firestore rules version backup before deploy.

## Tests

```bash
PUPPETEER_SKIP_DOWNLOAD=true npm --prefix functions ci
npm --prefix functions run build
npm --prefix functions test
```

Rules emulator (optional):

```bash
firebase emulators:start --only firestore
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm --prefix functions test
```
