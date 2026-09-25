// Item 4.5: one shared install page, pinned to the admin copy. The wrapper must
// pass the role explicitly — re-exporting the shared default would silently
// render the student copy on the admin route.
import PWAInstallPage from '@/shared/pages/PWAInstallPage';

export default function AdminPWAInstallPage() {
  return <PWAInstallPage role="admin" />;
}
