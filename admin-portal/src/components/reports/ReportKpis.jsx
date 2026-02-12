// src/components/reports/ReportKpis.jsx
import { motion } from "framer-motion";
import { formatDuration } from "../../utils/reportMetrics";

const cardAnim = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } },
};

export default function ReportKpis({ surfaceCard, muted, title, kpis }) {
  const items = [
    { label: "Received (Range)", val: kpis.receivedCount },
    { label: "Completed (Range)", val: kpis.completedCount },
    { label: "Completion Rate", val: `${kpis.completionRate}%` },
    { label: "Pending Now", val: kpis.pendingNowCount },
    { label: "Avg Turnaround", val: formatDuration(kpis.avgTurnaround) },
    { label: "Median Turnaround", val: formatDuration(kpis.medTurnaround) },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      {items.map((x) => (
        <motion.div
          key={x.label}
          variants={cardAnim}
          initial="hidden"
          animate="visible"
          className={`p-5 rounded-2xl ${surfaceCard}`}
        >
          <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${muted}`}>{x.label}</p>
          <p className={`text-2xl md:text-3xl font-black mt-2 ${title}`}>{x.val}</p>
        </motion.div>
      ))}
    </div>
  );
}