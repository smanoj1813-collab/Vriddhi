// src/modules/auth/components/MustChangePasswordGate.tsx
// ------------------------------------------------------------------
// Closes the one-time-password loop: admins issue generated passwords
// (grantUserRole / resetUserPassword / manageOfficeStaff) and the backend
// stamps `mustChangePassword: true` on the token claims — but until now
// nothing in the UI read the flag, so a shared one-time password lived
// forever.
//
// Behaviour:
//   - After sign-in, reads the claim from getIdTokenResult() (no extra
//     network round trip — the token is already local).
//   - Shows a focused modal offering ChangePasswordForm.
//   - "Remind me later" is allowed (a hard lock could strand a mid-exam
//     student or a clerk mid-challan), but the prompt returns at every
//     fresh sign-in because the sessionStorage marker does not survive it.
//   - On success the callable clears the claim server-side and the token is
//     refreshed, so the gate stays closed.
// ------------------------------------------------------------------
import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChangePasswordForm from '@/shared/components/ChangePasswordForm';

const DISMISS_KEY = 'vriddhi_must_change_password_dismissed';

export default function MustChangePasswordGate() {
  const { firebaseUser } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const evaluate = async () => {
      if (!firebaseUser) {
        setOpen(false);
        // A signed-out session must not carry the dismissal into the next
        // sign-in (which may be a different person on a shared device).
        try { sessionStorage.removeItem(DISMISS_KEY); } catch { /* ignore */ }
        return;
      }
      try {
        const token = await firebaseUser.getIdTokenResult();
        if (cancelled) return;
        const flagged = token.claims?.mustChangePassword === true;
        let dismissed = false;
        try { dismissed = sessionStorage.getItem(DISMISS_KEY) === '1'; } catch { /* ignore */ }
        setOpen(flagged && !dismissed);
      } catch {
        // Offline or token trouble — never trap the user behind the gate
        // because the claim could not be read.
        if (!cancelled) setOpen(false);
      }
    };
    evaluate();
    return () => { cancelled = true; };
  }, [firebaseUser]);

  if (!open) return null;

  const dismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mcp-title"
    >
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-700 shadow-2xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3 mb-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/15">
            <KeyRound className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </span>
          <div className="min-w-0">
            <h2 id="mcp-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Set your own password
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You are signed in with a one-time password issued by an administrator.
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
          One-time passwords are shared over chat or email, so anyone who has seen yours
          could sign in as you. Choose a personal password now — your administrator
          cannot see it, and it never leaves Firebase Authentication.
        </p>

        <ChangePasswordForm bare onDone={() => setOpen(false)} />

        <button
          type="button"
          onClick={dismiss}
          className="mt-4 w-full py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Remind me later
        </button>
      </div>
    </div>
  );
}
