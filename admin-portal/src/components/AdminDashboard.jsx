import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../services/api";

const cardAnim = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
};

function normalizeRows(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
}

function pickDate(row) {
  return row?.submitted_at ?? row?.handled_at ?? row?.needed_date ?? row?.created_at ?? null;
}

function toTs(d) {
  if (!d) return null;
  if (d instanceof Date) return d.getTime() || null;
  const s = String(d).trim();
  if (!s) return null;
  const dt = new Date(s.includes(" ") ? s.replace(" ", "T") : s);
  return dt.getTime() || null;
}

function startOfDayTs(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildDayKeys(fromTs, toTsInclusive) {
  const keys = [];
  let cur = startOfDayTs(fromTs);
  const end = startOfDayTs(toTsInclusive);
  while (cur <= end) {
    keys.push(dayKey(cur));
    cur += 24 * 60 * 60 * 1000;
  }
  return keys;
}

export default function AdminDashboard({ isDarkMode }) {
  const [loading, setLoading] = useState(true);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [rows, setRows] = useState([]);

  // Filters
  const [statuses, setStatuses] = useState({ pending: true, approved: true, rejected: true });
  const [requesterType, setRequesterType] = useState("all");
  const [trendDays, setTrendDays] = useState(7);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/requests?status=pending,approved,rejected&fields=lite&limit=2000");
      setRows(normalizeRows(data));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const allRows = useMemo(() => {
    return rows.map((r) => ({
      ...r,
      __status: String(r.status || "").trim().toLowerCase(),
      __requesterType: String(r.requester_type || "").trim().toLowerCase(),
      __ts: toTs(pickDate(r)),
    }));
  }, [rows]);

  const requesterTypeOptions = useMemo(() => {
    const set = new Set();
    allRows.forEach((r) => { if (r.requester_type) set.add(r.requester_type.trim()); });
    return ["all", ...Array.from(set).sort()];
  }, [allRows]);

  const filtered = useMemo(() => {
    return allRows.filter((r) => {
      if (!statuses[r.__status]) return false;
      if (requesterType !== "all" && r.__requesterType !== requesterType.toLowerCase()) return false;
      return true;
    });
  }, [allRows, statuses, requesterType]);

  const filteredSorted = useMemo(() => [...filtered].sort((a, b) => (b.__ts ?? 0) - (a.__ts ?? 0)), [filtered]);

  const counts = useMemo(() => {
    return filtered.reduce((acc, r) => {
      acc.total++;
      if (acc[r.__status] !== undefined) acc[r.__status]++;
      return acc;
    }, { total: 0, pending: 0, approved: 0, rejected: 0 });
  }, [filtered]);

  const trend = useMemo(() => {
    const now = Date.now();
    const end = startOfDayTs(now);
    const start = end - (trendDays - 1) * 24 * 60 * 60 * 1000;
    const keys = buildDayKeys(start, end);
    const map = Object.fromEntries(keys.map((k) => [k, 0]));

    for (const r of filtered) {
      if (!r.__ts || r.__ts < start || r.__ts > now + 86400000) continue;
      const k = dayKey(r.__ts);
      if (map[k] !== undefined) map[k]++;
    }

    const values = keys.map((k) => ({ key: k, day: k, count: map[k] }));
    return { values, max: Math.max(1, ...values.map((v) => v.count)) };
  }, [filtered, trendDays]);

  const latestPending = useMemo(() => filteredSorted.filter((r) => r.__status === "pending").slice(0, 8), [filteredSorted]);

  const surfaceCard = isDarkMode ? "bg-slate-900/60 border border-slate-800" : "bg-white border border-slate-200 shadow-sm";
  const muted = isDarkMode ? "text-slate-400" : "text-slate-500";
  const title = isDarkMode ? "text-white" : "text-[#1D4477]";
  const chip = (active) => active 
    ? (isDarkMode ? "bg-slate-800 text-[#FF0000] border border-white/5" : "bg-[#1D4477] text-white shadow-sm")
    : (isDarkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-[#1D4477]");

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className={`text-xl md:text-2xl font-black tracking-widest uppercase ${title}`}>
            Admin Overview
          </h3>
          <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${muted} mt-1`}>
            Real-time Request Analytics
          </p>
        </div>
        <button 
          onClick={load} 
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${
            isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-[#1D4477] text-white hover:bg-[#16335a] shadow-md shadow-blue-900/20"
          }`}
        >
          Refresh Data
        </button>
      </div>

      {/* FILTER COMMAND BAR - Fixed Layout Grid */}
      <div className={`p-2 rounded-2xl ${surfaceCard} grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2`}>
        {/* Requester Type */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isDarkMode ? "bg-slate-950/40" : "bg-slate-50"}`}>
          <span className={`text-[10px] font-black uppercase tracking-widest ${muted} whitespace-nowrap`}>Type:</span>
          <select
            value={requesterType}
            onChange={(e) => setRequesterType(e.target.value)}
            className={`w-full bg-transparent text-sm font-bold outline-none cursor-pointer ${isDarkMode ? "text-slate-200" : "text-[#1D4477]"}`}
          >
            {requesterTypeOptions.map((opt) => (
              <option key={opt} value={opt} className={isDarkMode ? "bg-slate-900" : "bg-white"}>
                {opt === "all" ? "All Requester Types" : opt.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Status Toggle Group */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isDarkMode ? "bg-slate-950/40" : "bg-slate-50"}`}>
          <span className={`text-[10px] font-black uppercase tracking-widest ${muted} whitespace-nowrap`}>Status:</span>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {["pending", "approved", "rejected"].map((s) => (
              <button 
                key={s} 
                onClick={() => setStatuses((st) => ({ ...st, [s]: !st[s] }))} 
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${chip(statuses[s])}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Trend Toggle Group - Spans full width on md but 1 col on xl */}
        <div className={`md:col-span-2 xl:col-span-1 flex items-center gap-3 px-4 py-3 rounded-xl ${isDarkMode ? "bg-slate-950/40" : "bg-slate-50"}`}>
          <span className={`text-[10px] font-black uppercase tracking-widest ${muted} whitespace-nowrap`}>Trend:</span>
          <div className="flex gap-1.5">
            {[7, 14, 30].map((d) => (
              <button 
                key={d} 
                onClick={() => setTrendDays(d)} 
                className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${chip(trendDays === d)}`}
              >
                {d}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Volume", val: counts.total },
          { label: "Pending", val: counts.pending },
          { label: "Approved", val: counts.approved },
          { label: "Rejected", val: counts.rejected },
        ].map((stat) => (
          <motion.div key={stat.label} variants={cardAnim} initial="hidden" animate="visible" className={`p-5 rounded-2xl ${surfaceCard}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${muted}`}>{stat.label}</p>
            <p className={`text-2xl md:text-3xl font-black mt-2 ${title}`}>{stat.val}</p>
          </motion.div>
        ))}
      </div>

      {/* CHART SECTION */}
      <motion.div variants={cardAnim} initial="hidden" animate="visible" className={`p-6 rounded-2xl ${surfaceCard}`}>
        <div className="flex items-center justify-between mb-8">
          <p className={`text-xs font-black tracking-widest uppercase ${muted}`}>Performance Timeline</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FF0000]" />
            <span className={`text-[10px] font-bold uppercase ${muted}`}>Volume per Day</span>
          </div>
        </div>
        
        <div className="flex items-end gap-1.5 h-40 relative px-2">
          {trend.values.map((v, i) => (
            <div key={v.key} className="flex-1 h-full flex flex-col justify-end items-center relative group" onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)}>
              <AnimatePresence>
                {hoveredBar === i && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: -5 }} exit={{ opacity: 0, y: 5 }} className={`absolute bottom-full z-10 px-3 py-1.5 rounded-lg text-[10px] font-black shadow-2xl border mb-2 pointer-events-none whitespace-nowrap ${isDarkMode ? "bg-slate-800 border-slate-700 text-[#FF0000]" : "bg-white border-slate-200 text-[#FF0000]"}`}>
                    {v.count} Requests
                  </motion.div>
                )}
              </AnimatePresence>
              <div 
                className={`w-full max-w-[18px] rounded-t-lg transition-all duration-500 cursor-pointer ${isDarkMode ? "bg-slate-800 group-hover:bg-[#FF0000]" : "bg-slate-100 group-hover:bg-[#FF0000]"} ${hoveredBar === i ? "opacity-100 scale-x-110 shadow-[0_0_15px_rgba(255,0,0,0.3)]" : "opacity-70"}`} 
                style={{ height: `${Math.max(8, Math.round((v.count / trend.max) * 100))}%` }} 
              />
              <span className={`text-[8px] font-black mt-3 uppercase tracking-tighter ${muted} opacity-40 group-hover:opacity-100 transition-opacity`}>
                {v.day.slice(5).replace("-", "/")}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* QUEUE SECTION */}
      <motion.div variants={cardAnim} initial="hidden" animate="visible" className={`p-6 rounded-2xl ${surfaceCard}`}>
        <div className="flex items-center justify-between mb-6">
          <p className={`text-xs font-black tracking-widest uppercase ${muted}`}>Active Queue</p>
          <span className="px-2 py-1 rounded bg-red-500/10 text-[#FF0000] text-[10px] font-black uppercase">Pending Only</span>
        </div>
        <div className="space-y-1">
          {latestPending.length === 0 ? (
            <div className={`text-center py-10 rounded-xl border-2 border-dashed ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
              <p className={`text-sm font-bold ${muted}`}>No pending requests in this segment.</p>
            </div>
          ) : (
            latestPending.map((x) => (
              <div key={x.id} className={`py-3 flex items-start justify-between gap-4 group transition-all px-3 rounded-xl ${isDarkMode ? "hover:bg-white/5" : "hover:bg-[#1D4477]/5"}`}>
                <div className="min-w-0">
                  <p className={`text-sm font-black truncate ${title}`}>{x.full_name || "Guest"}</p>
                  <p className={`text-[10px] mt-1 uppercase font-bold tracking-tight ${muted} truncate opacity-70`}>
                    {x.request_type || "General"} • {x.requester_code || x.tracking_code || "No Code"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-[10px] font-black ${muted}`}>{x.__ts ? new Date(x.__ts).toLocaleDateString() : "-"}</p>
                  <p className={`text-[10px] font-black text-[#FF0000] mt-1`}>PENDING</p>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {loading && (
        <div className="fixed bottom-6 right-6 flex items-center gap-3 px-4 py-2 rounded-full bg-black/80 backdrop-blur-md border border-white/10 shadow-2xl">
          <div className="w-2 h-2 rounded-full bg-[#FF0000] animate-ping" />
          <div className="text-white font-black text-[10px] uppercase tracking-widest">Live Sync</div>
        </div>
      )}
    </div>
  );
}