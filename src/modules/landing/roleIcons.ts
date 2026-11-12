import {
  BookOpen, Building2, GraduationCap, Landmark, Wallet, Workflow,
  type LucideIcon,
} from 'lucide-react';
import type { LandingRoleId } from './roles';

/** Public presentation icons only; they never grant or imply permissions. */
export const ROLE_ICONS: Record<LandingRoleId, LucideIcon> = {
  principal: Landmark,
  hod: Building2,
  faculty: BookOpen,
  operations: Workflow,
  finance: Wallet,
  students: GraduationCap,
};
