// src/shared/components/ChangePasswordForm.tsx
// ------------------------------------------------------------------
// The ONE password-change form for every portal (student settings, staff
// settings, and the forced MustChangePasswordGate after an admin issues a
// one-time password).
//
// Why a shared component: the two ad-hoc forms it replaces both collected a
// "current password" and then never verified it, allowed 6-character
// passwords while every provisioning path enforces 10, and died with
// "requires-recent-login" on long sessions. This flow does it properly:
//
//   1. reauthenticateWithCredential(current password) — proves possession and
//      simultaneously satisfies Firebase's recent-login requirement;
//   2. updatePassword(new password);
//   3. best-effort clearMyMustChangePassword callable so a rotated one-time
//      password stops nagging (self-only by construction server-side);
//   4. best-effort token refresh so the new claims land without re-login.
// ------------------------------------------------------------------
import { useState } from 'react';
import { Check, Eye, EyeOff, Loader2, Lock, ShieldAlert } from 'lucide-react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '@/Firebase/config';

/** Must match grantUserRole / CreateCollegeAdmin / the ops scripts. */
export const MIN_PASSWORD_LENGTH = 10;

interface ChangePasswordFormProps {
  /** Called after a successful rotation (the gate uses it to close). */
  onDone?: () => void;
  /** Hide the heading when the host page already provides one. */
  bare?: boolean;
}

export default function ChangePasswordForm({ onDone, bare }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const inputClass =
    'w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      setMsg({ type: 'err', text: 'You are not signed in.' });
      return;
    }
    if (!currentPassword) {
      setMsg({ type: 'err', text: 'Enter your current password.' });
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setMsg({ type: 'err', text: `Use at least ${MIN_PASSWORD_LENGTH} characters.` });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'err', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword === currentPassword) {
      setMsg({ type: 'err', text: 'The new password must be different from the current one.' });
      return;
    }

    setSaving(true);
    setMsg(null);
    try {
      // 1. Prove possession of the account. This also refreshes the
      //    "last sign-in time", so step 2 can never hit requires-recent-login.
      const email = user.email;
      if (!email) throw new Error('This account has no email credential.');
      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(email, currentPassword)
      );

      // 2. Rotate the credential.
      await updatePassword(user, newPassword);

      // 3. Clear the one-time-password nag (best effort — an older deployed
      //    backend without the callable must not fail the rotation itself;
      //    the flag simply clears on the next admin-side rotation instead).
      try {
        const clear = httpsCallable(functions, 'clearMyMustChangePassword');
        await clear({});
      } catch {
        /* non-fatal */
      }

      // 4. Pull the updated claims into the current session (best effort).
      try {
        await user.getIdToken(true);
      } catch {
        /* non-fatal — claims refresh within the hour anyway */
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMsg({ type: 'ok', text: 'Password changed successfully.' });
      onDone?.();
    } catch (err: any) {
      const code: string = err?.code || '';
      let text = err?.message || 'Failed to change password.';
      if (code.includes('wrong-password') || code.includes('invalid-credential')) {
        text = 'Current password is incorrect.';
      } else if (code.includes('weak-password')) {
        text = `That password is too weak — use at least ${MIN_PASSWORD_LENGTH} characters.`;
      } else if (code.includes('requires-recent-login')) {
        text = 'Session too old — sign out, sign in again, then change your password.';
      }
      setMsg({ type: 'err', text });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!bare && (
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white pb-1">Security &amp; Password</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Changing your password signs the change through your current password and updates every portal.
          </p>
        </div>
      )}

      <div className="space-y-4 max-w-md pt-1">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 block">
            Current Password
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="The password you sign in with"
              required
              autoComplete="current-password"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
            >
              {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Got a one-time password from your administrator? That is your current password.
          </p>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 block">
            New Password
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={`Minimum ${MIN_PASSWORD_LENGTH} characters`}
              required
              autoComplete="new-password"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label={showNew ? 'Hide new password' : 'Show new password'}
            >
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 block">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter the new password"
              required
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
          <ul className="list-disc pl-4 space-y-1">
            <li>Use at least {MIN_PASSWORD_LENGTH} characters</li>
            <li>Include numbers and symbols for stronger security</li>
            <li>Don&apos;t reuse your previous passwords</li>
          </ul>
        </div>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-xl text-xs font-bold border flex items-center gap-2 max-w-md ${
            msg.type === 'ok'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          {msg.type === 'ok' ? <Check size={14} /> : <ShieldAlert size={14} />}
          {msg.text}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold text-xs md:text-sm shadow-sm transition-all flex items-center gap-2"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
        Update Password
      </button>
    </form>
  );
}
