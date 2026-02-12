import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../services/api";

const cardAnim = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
};

const DAY_MS = 24 * 60 * 60 * 1000;

function toTs(input) {
  if (!input) return null;

  const s = String(input).trim();
  if (!s) return null;

  // If it's date-only, force local noon to avoid timezone shifting to previous day
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0).getTime();
  }

  // If it's "YYYY-MM-DD HH:mm:ss", convert to ISO-like
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(s)) {
    const iso = s.replace(" ", "T");
    const dt = new Date(iso);
    return Number.isFinite(dt.getTime()) ? dt.getTime() : null;
  }

  const dt = new Date(s);
  return Number.isFinite(dt.getTime()) ? dt.getTime() : null;
}

function startOfDayTs(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

// Monday-based week start (Mon)
function startOfWeekTs(ts) {
  const d = new Date(ts);
  const day = d.getDay(); // 0=Sun ... 6=Sat
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function weekLabelFromStartTs(weekStartTs) {
  const d = new Date(weekStartTs);
  return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}`;
}

function monthKeyFromTs(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function monthLabelFromKey(key) {
  return key.replace("-", "/");
}

function buildWeekStarts(fromTs, toTsInclusive) {
  const keys = [];
  let cur = startOfWeekTs(fromTs);
  const end = startOfWeekTs(toTsInclusive);
  while (cur <= end) {
    keys.push(cur);
    cur += 7 * DAY_MS;
  }
  return keys;
}

function buildMonthKeys(fromTs, toTsInclusive) {
  const keys = [];
  const d = new Date(fromTs);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);

  const end = new Date(toTsInclusive);
  end.setDate(1);
  end.setHours(0, 0, 0, 0);

  while (d.getTime() <= end.getTime()) {
    keys.push(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}`);
    d.setMonth(d.getMonth() + 1);
  }
  return keys;
}

export default function TrainingReportsSection({ isDarkMode }) {
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(null);
  const [rows, setRows] = useState([]);

  // 7D = 1 WEEK, 14D = 2 WEEKS, 30D = 4 WEEKS, 90D = 3 MONTHS
  const [rangeDays, setRangeDays] = useState(30);

  const surfaceCard = isDarkMode
    ? "bg-slate-900/60 border border-slate-800"
    : "bg-white border border-slate-200 shadow-sm";
  const muted = isDarkMode ? "text-slate-400" : "text-slate-500";
  const title = isDarkMode ? "text-white" : "text-[#1D4477]";
  const chip = (active) =>
    active
      ? isDarkMode
        ? "bg-slate-800 text-white border border-white/5"
        : "bg-[#1D4477] text-white shadow-sm"
      : isDarkMode
      ? "text-slate-500 hover:text-slate-300"
      : "text-slate-400 hover:text-[#1D4477]";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/trainings");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const normalized = useMemo(() => {
    return rows.map((r) => {
      const ts =
        toTs(r.training_datetime) ||
        toTs(r.datetime) ||
        toTs(r.training_date) ||
        toTs(r.date) ||
        null;

      const capacity = Number(r.capacity || 0);
      const attendees = Number(r.attendees_count ?? r.attendees ?? 0);

      return {
        ...r,
        __ts: ts,
        __capacity: Number.isFinite(capacity) ? capacity : 0,
        __attendees: Number.isFinite(attendees) ? attendees : 0,
      };
    });
  }, [rows]);

  // Upcoming window: include trainings from today up to the next rangeDays (inclusive)
  const windowed = useMemo(() => {
    const now = Date.now();
    const start = startOfDayTs(now); // start of today
    const end = start + rangeDays * DAY_MS - 1; // end of last day in window
    return normalized.filter((r) => r.__ts != null && r.__ts >= start && r.__ts <= end);
  }, [normalized, rangeDays]);

  const kpis = useMemo(() => {
    const trainings = windowed.length;
    const participants = windowed.reduce((a, r) => a + r.__attendees, 0);
    const capTotal = windowed.reduce((a, r) => a + (r.__capacity > 0 ? r.__capacity : 0), 0);

    const avg = trainings > 0 ? participants / trainings : 0;
    const utilization = capTotal > 0 ? (participants / capTotal) * 100 : 0;

    return { trainings, participants, avg, utilization, capTotal };
  }, [windowed]);

  // Trend: aggregate by WEEK for 7/14/30, by MONTH for 90
  const trend = useMemo(() => {
    const now = Date.now();
    const start = startOfDayTs(now);
    const end = start + rangeDays * DAY_MS - 1;

    const bucketMode = rangeDays >= 90 ? "month" : "week";

    if (bucketMode === "month") {
      // upcoming 3 months including current month
      const startMonth = new Date(start);
      startMonth.setDate(1);
      startMonth.setHours(0, 0, 0, 0);

      const endMonth = new Date(startMonth.getTime());
      endMonth.setMonth(endMonth.getMonth() + 2); // current + next 2 = 3 months
      const monthEndTs = endMonth.getTime() + (31 * DAY_MS); // safe cushion for buildMonthKeys end

      const keys = buildMonthKeys(startMonth.getTime(), monthEndTs);
      const map = Object.fromEntries(keys.map((k) => [k, { trainings: 0, participants: 0 }]));

      for (const r of windowed) {
        if (!r.__ts) continue;
        const k = monthKeyFromTs(r.__ts);
        if (!map[k]) continue;
        map[k].trainings += 1;
        map[k].participants += r.__attendees;
      }

      const values = keys.map((k) => ({
        key: k,
        label: monthLabelFromKey(k),
        trainings: map[k].trainings,
        participants: map[k].participants,
      }));

      const max = Math.max(1, ...values.map((v) => Math.max(v.trainings, v.participants)));
      return { values, max };
    }

    // WEEK mode: 7=>1, 14=>2, 30=>4
    const weeksCount = rangeDays === 7 ? 1 : rangeDays === 14 ? 2 : 4;

    const startWeekStart = startOfWeekTs(start);
    const endWeekStart = startWeekStart + (weeksCount - 1) * 7 * DAY_MS;

    const weekStarts = buildWeekStarts(startWeekStart, endWeekStart);
    const map = Object.fromEntries(weekStarts.map((ws) => [String(ws), { trainings: 0, participants: 0 }]));

    for (const r of windowed) {
      if (!r.__ts) continue;
      const k = String(startOfWeekTs(r.__ts));
      if (!map[k]) continue;
      map[k].trainings += 1;
      map[k].participants += r.__attendees;
    }

    const values = weekStarts.map((ws) => ({
      key: String(ws),
      label: weekLabelFromStartTs(ws),
      trainings: map[String(ws)].trainings,
      participants: map[String(ws)].participants,
    }));

    const max = Math.max(1, ...values.map((v) => Math.max(v.trainings, v.participants)));
    return { values, max };
  }, [windowed, rangeDays]);

  const topTrainings = useMemo(() => {
    return [...windowed]
      .sort((a, b) => b.__attendees - a.__attendees || (a.__ts ?? 0) - (b.__ts ?? 0))
      .slice(0, 8);
  }, [windowed]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className={`p-2 rounded-2xl ${surfaceCard} flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-3 px-4 py-3">
          <span className={`text-[10px] font-black uppercase tracking-widest ${muted}`}>Range:</span>
          <div className="flex gap-1.5">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setRangeDays(d)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${chip(rangeDays === d)}`}
              >
                {d}D
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={load}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
            isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-[#1D4477] text-white hover:bg-[#16335a]"
          }`}
        >
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Trainings", val: kpis.trainings },
          { label: "Participants", val: kpis.participants },
          { label: "Avg Attendance", val: kpis.avg ? kpis.avg.toFixed(1) : "0.0" },
          { label: "Utilization", val: `${kpis.utilization ? kpis.utilization.toFixed(0) : "0"}%` },
        ].map((x) => (
          <motion.div key={x.label} variants={cardAnim} initial="hidden" animate="visible" className={`p-5 rounded-2xl ${surfaceCard}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${muted}`}>{x.label}</p>
            <p className={`text-2xl md:text-3xl font-black mt-2 ${title}`}>{x.val}</p>
          </motion.div>
        ))}
      </div>

      {/* Trend Chart */}
      <motion.div variants={cardAnim} initial="hidden" animate="visible" className={`p-6 rounded-2xl ${surfaceCard}`}>
        <div className="flex items-center justify-between mb-8">
          <p className={`text-xs font-black tracking-widest uppercase ${muted}`}>
            Trainings vs Participants ({rangeDays === 90 ? "Monthly" : "Weekly"})
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isDarkMode ? "bg-slate-300" : "bg-slate-400"}`} />
              <span className={`text-[10px] font-bold uppercase ${muted}`}>Trainings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FF0000]" />
              <span className={`text-[10px] font-bold uppercase ${muted}`}>Participants</span>
            </div>
          </div>
        </div>

        <div className="flex items-end gap-2 h-44 relative px-2">
          {trend.values.map((v, i) => {
            const tH = Math.max(6, Math.round((v.trainings / trend.max) * 100));
            const pH = Math.max(6, Math.round((v.participants / trend.max) * 100));

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
                        isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
                      }`}
                    >
                      <span className="mr-3">T: {v.trainings}</span>
                      <span>P: {v.participants}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="w-full h-full flex items-end justify-center gap-1 max-w-[34px]">
                  <div
                    className={`${isDarkMode ? "bg-slate-700" : "bg-slate-200"} w-1/2 rounded-t-md transition-all duration-300 ${
                      hovered === i ? "opacity-100" : "opacity-70"
                    }`}
                    style={{ height: `${tH}%` }}
                    title="Trainings"
                  />
                  <div
                    className={`bg-[#FF0000] w-1/2 rounded-t-md transition-all duration-300 ${
                      hovered === i ? "opacity-100" : "opacity-70"
                    }`}
                    style={{ height: `${pH}%` }}
                    title="Participants"
                  />
                </div>

                <span className={`text-[8px] font-black mt-3 uppercase tracking-tighter ${muted} opacity-40 group-hover:opacity-100 transition-opacity`}>
                  {v.label}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Highlights */}
      <motion.div variants={cardAnim} initial="hidden" animate="visible" className={`p-6 rounded-2xl ${surfaceCard}`}>
        <div className="flex items-center justify-between mb-6">
          <p className={`text-xs font-black tracking-widest uppercase ${muted}`}>Top Trainings (Attendance)</p>
          <span
            className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
              isDarkMode ? "bg-white/5 text-slate-200" : "bg-slate-100 text-slate-700"
            }`}
          >
            Next {rangeDays === 90 ? "3 Months" : `${rangeDays} Days`}
          </span>
        </div>

        <div className="space-y-1">
          {topTrainings.length === 0 ? (
            <div className={`text-center py-10 rounded-xl border-2 border-dashed ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
              <p className={`text-sm font-bold ${muted}`}>No trainings found in this range.</p>
            </div>
          ) : (
            topTrainings.map((x) => (
              <div
                key={x.id}
                className={`py-3 flex items-start justify-between gap-4 px-3 rounded-xl ${
                  isDarkMode ? "hover:bg-white/5" : "hover:bg-[#1D4477]/5"
                }`}
              >
                <div className="min-w-0">
                  <p className={`text-sm font-black truncate ${title}`}>{x.title || "Training"}</p>
                  <p className={`text-[10px] mt-1 uppercase font-bold tracking-tight ${muted} truncate opacity-70`}>
                    {x.location || "No Location"} • Cap: {x.__capacity || 0}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-[10px] font-black ${muted}`}>{x.__ts ? new Date(x.__ts).toLocaleDateString() : "-"}</p>
                  <p className="text-[10px] font-black text-[#FF0000] mt-1">{x.__attendees} attendees</p>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {loading && (
        <div className="fixed bottom-6 right-6 flex items-center gap-3 px-4 py-2 rounded-full bg-black/80 backdrop-blur-md border border-white/10 shadow-2xl">
          <div className="w-2 h-2 rounded-full bg-[#FF0000] animate-ping" />
          <div className="text-white font-black text-[10px] uppercase tracking-widest">Loading</div>
        </div>
      )}
    </div>
  );
}