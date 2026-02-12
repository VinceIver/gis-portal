// src/components/reports/BreakdownTable.jsx
import { motion } from "framer-motion";
import { formatDuration } from "../../utils/reportMetrics";

const cardAnim = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } },
};

export default function BreakdownTable({ surfaceCard, muted, title, label, rows, maxRows = 10 }) {
  const view = (rows || []).slice(0, maxRows);

  return (
    <motion.div variants={cardAnim} initial="hidden" animate="visible" className={`p-6 rounded-2xl ${surfaceCard}`}>
      <div className="flex items-center justify-between mb-4">
        <p className={`text-xs font-black tracking-widest uppercase ${muted}`}>{label}</p>
        <span className={`text-[10px] font-black uppercase ${muted}`}>Top {maxRows}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className={`${muted} text-[10px] uppercase tracking-widest`}>
              <th className="py-2 pr-3">Group</th>
              <th className="py-2 pr-3">Received</th>
              <th className="py-2 pr-3">Completed</th>
              <th className="py-2 pr-3">Approved</th>
              <th className="py-2 pr-3">Rejected</th>
              <th className="py-2 pr-3">Approval %</th>
              <th className="py-2 pr-3">Avg TAT</th>
              <th className="py-2">Med TAT</th>
            </tr>
          </thead>
          <tbody>
            {view.length === 0 ? (
              <tr>
                <td colSpan={8} className={`py-6 ${muted} text-sm font-bold`}>
                  No data for this segment.
                </td>
              </tr>
            ) : (
              view.map((r) => (
                <tr key={r.label} className="border-t border-black/5">
                  <td className={`py-3 pr-3 font-black ${title} max-w-[280px] truncate`}>{r.label}</td>
                  <td className={`py-3 pr-3 font-bold ${muted}`}>{r.received}</td>
                  <td className={`py-3 pr-3 font-bold ${muted}`}>{r.completed}</td>
                  <td className={`py-3 pr-3 font-bold ${muted}`}>{r.approved}</td>
                  <td className={`py-3 pr-3 font-bold ${muted}`}>{r.rejected}</td>
                  <td className={`py-3 pr-3 font-black ${muted}`}>{r.approvalRate}%</td>
                  <td className={`py-3 pr-3 font-black ${muted}`}>{formatDuration(r.avgTurnaround)}</td>
                  <td className={`py-3 font-black ${muted}`}>{formatDuration(r.medTurnaround)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}