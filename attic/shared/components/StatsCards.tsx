interface StatsCardsProps {
  totalClasses: number;
  completedClasses: number;
  pendingClasses: number;
  totalAbsent: number;
}

export function StatsCards({ totalClasses, completedClasses, pendingClasses, totalAbsent }: StatsCardsProps) {
  const cards = [
    {
      label: 'Classes Assigned Today',
      value: totalClasses,
      color: 'text-slate-900 dark:text-white',
      badgeBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    {
      label: 'Attendance Completed',
      value: `${completedClasses} / ${totalClasses}`,
      color: 'text-emerald-700 dark:text-emerald-400',
      badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    },
    {
      label: 'Pending Attendance',
      value: pendingClasses,
      color: pendingClasses > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300',
      badgeBg: pendingClasses > 0 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    },
    {
      label: 'Students Absent Today',
      value: totalAbsent,
      color: 'text-rose-700 dark:text-rose-400',
      badgeBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{card.label}</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className={`text-2xl font-extrabold ${card.color}`}>{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
