export default function PageLoader() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-transparent">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-3 border-slate-200 dark:border-slate-800" />
        <div className="w-12 h-12 rounded-full border-3 border-teal-600 border-t-transparent animate-spin absolute" />
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Loading...</p>
    </div>
  );
}
