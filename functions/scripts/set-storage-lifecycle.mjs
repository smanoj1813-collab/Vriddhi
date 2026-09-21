#!/usr/bin/env node
/**
 * Set (or show) Firebase Storage lifecycle rules for auto-expiring uploads.
 *
 * WHY
 *   Assignment submissions and paper files currently accumulate forever.
 *   GCS lifecycle rules delete objects by age/prefix server-side — no
 *   running code, no cost for the mechanism itself. This script applies the
 *   product decision:
 *
 *     assignment-submissions/   → delete after 365 days
 *     paper-files/              → delete after 365 days
 *     colleges/…/materials/     → NO auto-delete (college-owned teaching
 *                                 content; faculty re-upload if needed)
 *     prep-media/               → NO auto-delete (published public content)
 *
 * CREDENTIALS (never commit) — same convention as seed-question-bank.mjs:
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * or GOOGLE_APPLICATION_CREDENTIALS pointing at a service-account JSON file.
 *
 * USAGE (from repo root):
 *   npm --prefix functions install
 *   node functions/scripts/set-storage-lifecycle.mjs          # show current rules
 *   node functions/scripts/set-storage-lifecycle.mjs --apply  # apply the rules above
 */
import { admin } from 'firebase-admin';

const APPLY = process.argv.includes('--apply');
const ONE_YEAR_DAYS = 365;

const LIFECYCLE_RULES = [
  {
    action: { type: 'Delete' },
    condition: { age: ONE_YEAR_DAYS, prefix: 'assignment-submissions/' },
  },
  {
    action: { type: 'Delete' },
    condition: { age: ONE_YEAR_DAYS, prefix: 'paper-files/' },
  },
];

function initializeAdmin() {
  if (admin.apps.length > 0) return admin;
  const hasEnv =
    process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY;
  if (hasEnv) {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  }
  return admin.initializeApp({ credential: admin.credential.applicationDefault() });
}

function printRules(rules) {
  if (!rules || rules.length === 0) {
    console.log('  (no lifecycle rules configured)');
    return;
  }
  for (const rule of rules) {
    const cond = rule.condition || {};
    console.log(`  ${rule.action?.type}  prefix=${cond.prefix || '(all)'}  age=${cond.age ?? '-'} days`);
  }
}

async function main() {
  const app = initializeAdmin();
  const bucket = app.storage().bucket();
  console.log(`Project: ${app.options.projectId || 'unknown'}  bucket: ${bucket.name}\n`);

  if (!APPLY) {
    const metadata = await bucket.getMetadata();
    console.log('Current lifecycle rules:');
    printRules(metadata.metadata?.lifecycle?.rule || metadata.metadata?.lifecycle);
    console.log('\nDry run — nothing changed. Re-run with --apply to set:');
    printRules(LIFECYCLE_RULES);
    return;
  }

  await bucket.setMetadata({ lifecycle: LIFECYCLE_RULES });
  console.log('Applied lifecycle rules:');
  printRules(LIFECYCLE_RULES);
  console.log('\nNote: existing objects older than 365 days under those prefixes will be deleted within ~1 day of the rule taking effect.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
