// src/components/reports/TrendInflowOutflow.jsx
import { motion, AnimatePresence } from "framer-motion";

const cardAnim = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } },
};

export default function TrendInflowOutflow({
  isDarkMode,
  surfaceCard,
  muted,
  trend,
  hovered,
  setHovered,
}) {
  return (
    <motion.div variants={cardAnim} initial="hidden" animate="visible" className={`p-6 rounded-2xl ${surfaceCard}`}>
      <div className="flex items-center justify-between mb-8">
        <p className={`text-xs font-black tracking-widest uppercase ${muted}`}>Inflow vs Outflow</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isDarkMode ? "bg-slate-300" : "bg-slate-400"}`} />
            <span className={`text-[10px] font-bold uppercase ${muted}`}>Received</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FF0000]" />
            <span className={`text-[10px] font-bold uppercase ${muted}`}>Completed</span>
          </div>
        </div>
      </div>

      <div className="flex items-end gap-1.5 h-44 relative px-2">
        {trend.values.map((v, i) => {
          const rH = Math.max(6, Math.round((v.received / trend.max) * 100));
          const cH = Math.max(6, Math.round((v.completed / trend.max) * 100));

          return (
            <div
              key={v.key}
              className="flex-1 h-full flex flex-col justify-end items-center relative group"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <AnimatePresence>
                {hovered === i && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: -5 }}
                    exit={{ opacity: 0, y: 5 }}
                    className={`absolute bottom-full z-10 px-3 py-1.5 rounded-lg text-[10px] font-black shadow-2xl border mb-2 pointer-events-none whitespace-nowrap ${
                      isDarkMode
                        ? "bg-slate-800 border-slate-700 text-slate-100"
                        : "bg-white border-slate-200 text-slate-900"
                    }`}
                  >
                    <span className="mr-3">R: {v.received}</span>
                    <span>C: {v.completed}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="w-full h-full flex items-end justify-center gap-1 max-w-[26px]">
                <div
                  className={`w-1/2 rounded-t-md transition-all duration-300 ${
                    isDarkMode ? "bg-slate-700" : "bg-slate-200"
                  } ${hovered === i ? "opacity-100" : "opacity-70"}`}
                  style={{ height: `${rH}%` }}
                  title="Received"
                />
                <div
                  className={`w-1/2 rounded-t-md transition-all duration-300 ${
                    isDarkMode ? "bg-[#FF0000]" : "bg-[#FF0000]"
                  } ${hovered === i ? "opacity-100" : "opacity-70"}`}
                  style={{ height: `${cH}%` }}
                  title="Completed"
                />
              </div>

              <span className={`text-[8px] font-black mt-3 uppercase tracking-tighter ${muted} opacity-40 group-hover:opacity-100 transition-opacity`}>
                {v.day.slice(5).replace("-", "/")}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}