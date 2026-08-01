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
      color: 'text-gray-900',
      bg: 'bg-white',
      border: 'border-gray-200',
    },
    {
      label: 'Attendance Completed',
      value: `${completedClasses} / ${totalClasses}`,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    {
      label: 'Pending Attendance',
      value: pendingClasses,
      color: pendingClasses > 0 ? 'text-amber-700' : 'text-gray-700',
      bg: pendingClasses > 0 ? 'bg-amber-50' : 'bg-gray-50',
      border: pendingClasses > 0 ? 'border-amber-200' : 'border-gray-200',
    },
    {
      label: 'Students Absent Today',
      value: totalAbsent,
      color: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border ${card.border} ${card.bg} p-4 shadow-sm transition-shadow duration-200 hover:shadow-md`}
        >
          <p className="text-xs font-medium text-gray-500">{card.label}</p>
          <p className={`mt-1 text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}