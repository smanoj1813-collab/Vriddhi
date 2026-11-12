import {
  Activity, AlignHorizontalJustifyCenter, Award, BookOpen, Boxes,
  Calculator, CalendarCheck, CalendarDays, ChartColumn, CircleCheckBig, Cog,
  DoorOpen, Eye, FileText, Footprints, GraduationCap, HandCoins, HeartHandshake,
  Layers, LayoutDashboard, Library, Lightbulb, ListChecks, MessagesSquare,
  Network, NotebookPen, Presentation, Receipt, Rocket, Scale,
  SearchCheck, Settings, ShieldCheck, ShoppingCart, Smartphone, TrendingUp,
  UserCheck, Users, Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { DrilldownSelection } from './drilldowns';

export type DrilldownSceneId =
  | 'academics' | 'assessments' | 'campus-operations'
  | 'principal' | 'hod' | 'faculty' | 'operations' | 'finance' | 'students'
  | 'upskilling';

export interface DrilldownVisuals {
  scene: DrilldownSceneId;
  /** One icon per highlight, in the same order as the drill-down copy. */
  highlights: readonly LucideIcon[];
  /** One icon per workflow step, in the same order as the drill-down copy. */
  workflow: readonly LucideIcon[];
}

export function drilldownKey(selection: DrilldownSelection): string {
  return selection.kind === 'upskilling' ? 'upskilling' : selection.id;
}

const VISUALS: Record<string, DrilldownVisuals> = {
  academics: {
    scene: 'academics',
    highlights: [BookOpen, CalendarDays, UserCheck, Network],
    workflow: [Lightbulb, CalendarDays, Activity],
  },
  assessments: {
    scene: 'assessments',
    highlights: [Library, NotebookPen, Smartphone, ChartColumn],
    workflow: [NotebookPen, FileText, SearchCheck],
  },
  'campus-operations': {
    scene: 'campus-operations',
    highlights: [Receipt, Library, ShoppingCart, HandCoins],
    workflow: [NotebookPen, Settings, ChartColumn],
  },
  principal: {
    scene: 'principal',
    highlights: [LayoutDashboard, ShieldCheck, Wallet, Scale],
    workflow: [Eye, SearchCheck, Footprints],
  },
  hod: {
    scene: 'hod',
    highlights: [LayoutDashboard, BookOpen, Users, MessagesSquare],
    workflow: [AlignHorizontalJustifyCenter, Network, HeartHandshake],
  },
  faculty: {
    scene: 'faculty',
    highlights: [CalendarDays, UserCheck, NotebookPen, TrendingUp],
    workflow: [BookOpen, Presentation, ListChecks],
  },
  operations: {
    scene: 'operations',
    highlights: [CalendarDays, Library, Boxes, ShoppingCart],
    workflow: [Settings, Cog, CircleCheckBig],
  },
  finance: {
    scene: 'finance',
    highlights: [NotebookPen, Receipt, HandCoins, ChartColumn],
    workflow: [NotebookPen, Calculator, SearchCheck],
  },
  students: {
    scene: 'students',
    highlights: [CalendarCheck, FileText, Smartphone, GraduationCap],
    workflow: [Eye, BookOpen, Footprints],
  },
  upskilling: {
    scene: 'upskilling',
    highlights: [Layers, NotebookPen, CircleCheckBig, Award],
    workflow: [DoorOpen, BookOpen, Rocket],
  },
};

export function getDrilldownVisuals(selection: DrilldownSelection): DrilldownVisuals {
  return VISUALS[drilldownKey(selection)];
}
