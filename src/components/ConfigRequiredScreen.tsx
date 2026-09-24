// src/components/ConfigRequiredScreen.tsx
//
// Rendered INSTEAD of the app when the Firebase web config was not embedded at
// build time. Vite inlines `import.meta.env.VITE_*` during `vite build`; if the
// VITE_FIREBASE_* variables are absent from the build environment the app would
// otherwise boot and then fail cryptically on the first Auth/Firestore call.
// This turns that into an explicit, actionable screen. Correctly configured
// builds never reach this component.

import type { FirebaseConfigStatus } from '@/Firebase/config';

export default function ConfigRequiredScreen({ status }: { status: FirebaseConfigStatus }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'system-ui, sans-serif',
        background: '#0b1120',
        color: '#e2e8f0',
      }}
    >
      <div style={{ maxWidth: 620 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#f87171' }}>
          Firebase is not configured
        </h1>
        <p style={{ opacity: 0.8, marginBottom: 16 }}>
          This build is missing required Firebase web configuration. The values are inlined at
          build time, so they must be present in the environment when <code>npm run build</code>{' '}
          runs (CI secrets or a local <code>.env</code>).
        </p>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>Missing variables:</p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          {status.missing.map((k) => (
            <li key={k}>
              <code>{k}</code>
            </li>
          ))}
        </ul>
        <p style={{ opacity: 0.7, fontSize: 14 }}>
          See <code>.env.example</code> for the full list. These web values are public by design
          and safe to commit.
        </p>
      </div>
    </div>
  );
}
