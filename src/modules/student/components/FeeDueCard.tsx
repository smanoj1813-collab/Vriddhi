// src/components/student/FeeDueCard.tsx
import { motion } from 'framer-motion';
import { IndianRupee, AlertTriangle, Calendar, CreditCard } from 'lucide-react';
import type { FeeSummary } from '../types/student';

interface FeeDueCardProps {
  fees: FeeSummary;
  onPayNow: () => void;
}

export default function FeeDueCard({ fees, onPayNow }: FeeDueCardProps) {
  const totalDue = fees.totalBalance + fees.totalOverdue;
  const hasOverdue = fees.totalOverdue > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className={`glass-card rounded-xl border overflow-hidden ${hasOverdue ? 'border-red-500/30' : 'border-slate-700/30'}`}
    >
      <div className="p-5 border-b border-slate-700/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${hasOverdue ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
            <IndianRupee size={18} className={hasOverdue ? 'text-red-400' : 'text-emerald-400'} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Fee Status</h3>
            <p className="text-sm text-slate-400">Semester 2</p>
          </div>
        </div>
        {hasOverdue && (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">
            <AlertTriangle size={12} />
            Overdue
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-white">Rs.{totalDue.toLocaleString('en-IN')}</span>
          <span className="text-sm text-slate-400 mb-1">total due</span>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Total Fees</span>
            <span className="text-white font-medium">Rs.{fees.totalFees.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Paid</span>
            <span className="text-emerald-400 font-medium">Rs.{fees.totalPaid.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Balance</span>
            <span className="text-amber-400 font-medium">Rs.{fees.totalBalance.toLocaleString('en-IN')}</span>
          </div>
          {hasOverdue && (
            <div className="flex justify-between text-sm">
              <span className="text-red-400">Overdue + Late Fee</span>
              <span className="text-red-400 font-medium">Rs.{fees.totalOverdue.toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>

        <div className="mt-4 h-2 rounded-full bg-slate-700/50 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(fees.totalPaid / fees.totalFees) * 100}%` }}
            transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">{((fees.totalPaid / fees.totalFees) * 100).toFixed(1)}% paid</p>

        {fees.upcomingDue.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
            <p className="text-xs font-medium text-slate-300 mb-2">Upcoming Due Dates</p>
            {fees.upcomingDue.slice(0, 2).map(fee => (
              <div key={fee.id} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar size={10} />
                  {new Date(fee.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
                <span className="text-white font-medium">Rs.{fee.balance.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onPayNow}
          className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-white font-medium rounded-lg transition-colors"
        >
          <CreditCard size={16} />
          Pay Now
        </button>
      </div>
    </motion.div>
  );
}