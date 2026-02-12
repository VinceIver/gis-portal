// src/components/reports/SlaPanel.jsx
import { motion } from "framer-motion";
import { formatDuration } from "../../utils/reportMetrics";

const cardAnim = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } },
};

export default function SlaPanel({ isDarkMode, surfaceCard, muted, title, sla }) {
  return (
    <motion.div variants={cardAnim} initial="hidden" animate="visible" className={`p-6 rounded-2xl ${surfaceCard}`}>
      <div className="flex items-center justify-between mb-4">
        <p className={`text-xs font-black tracking-widest uppercase ${muted}`}>SLA & Overdue Risk</p>
        <span className="px-2 py-1 rounded bg-red-500/10 text-[#FF0000] text-[10px] font-black uppercase">
          Compliance {sla.compliance}%
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Completed (For SLA)", val: sla.completedCount },
          { label: "Within SLA", val: sla.withinCount },
          { label: "Over SLA", val: sla.overCount },
          { label: "Overdue Pending", val: sla.overduePendingCount },
        ].map((x) => (
          <div key={x.label} className={`p-4 rounded-2xl ${isDarkMode ? "bg-slate-950/40" : "bg-slate-50"}`}>
            <p className={`text-[10px] font-black uppercase tracking-widest ${muted}`}>{x.label}</p>
            <p className={`text-2xl font-black mt-2 ${title}`}>{x.val}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className={`text-[10px] font-black uppercase tracking-widest ${muted}`}>Top Overdue Pending</p>
        <p className={`text-[10px] font-black uppercase tracking-widest ${muted}`}>Age / Overdue</p>
      </div>

      <div className="space-y-1">
        {sla.overduePendingTop.length === 0 ? (
          <div className={`text-center py-8 rounded-xl border-2 border-dashed ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
            <p className={`text-sm font-bold ${muted}`}>No overdue pending items.</p>
          </div>
        ) : (
          sla.overduePendingTop.map((x) => (
            <div key={x.r.id} className={`py-3 flex items-start justify-between gap-4 px-3 rounded-xl ${isDarkMode ? "hover:bg-white/5" : "hover:bg-[#1D4477]/5"}`}>
              <div className="min-w-0">
                <p className={`text-sm font-black truncate ${title}`}>{x.r.full_name || "Guest"}</p>
                <p className={`text-[10px] mt-1 uppercase font-bold tracking-tight ${muted} truncate opacity-70`}>
                  {x.r.request_type || "General"} • {x.r.requester_code || x.r.tracking_code || "No Code"} • SLA {x.days}d
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className={`text-[10px] font-black ${muted}`}>{formatDuration(x.ageMs)}</p>
                <p className={`text-[10px] font-black text-[#FF0000] mt-1`}>{formatDuration(x.overdueByMs)} overdue</p>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}