import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { api } from "../services/api";

import ReportFilters from "./reports/ReportFilters";
import ReportKpis from "./reports/ReportKpis";
import TrendInflowOutflow from "./reports/TrendInflowOutflow";
import BreakdownTable from "./reports/BreakdownTable";
import SlaPanel from "./reports/SlaPanel";
import TrainingReportsSection from "./reports/TrainingReportsSection";

import {
  normalizeRows,
  enrichRows,
  computeKpis,
  computeTrend,
  groupBreakdown,
  computeSla,
  startOfDayTs,
} from "../utils/reportMetrics";

import { toCSV, downloadText, printPage } from "../utils/reportExport";

const cardAnim = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } },
};

function toDateInputValue(ts) {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function rangeFromPreset(preset) {
  const now = Date.now();
  const end = startOfDayTs(now) + 24 * 60 * 60 * 1000 - 1;

  const d = new Date();
  if (preset === "month") {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return { fromTs: d.getTime(), toTs: end };
  }
  if (preset === "quarter") {
    const q = Math.floor(d.getMonth() / 3);
    d.setMonth(q * 3, 1);
    d.setHours(0, 0, 0, 0);
    return { fromTs: d.getTime(), toTs: end };
  }
  if (preset === "ytd") {
    d.setMonth(0, 1);
    d.setHours(0, 0, 0, 0);
    return { fromTs: d.getTime(), toTs: end };
  }
  const from = startOfDayTs(now) - 6 * 24 * 60 * 60 * 1000;
  return { fromTs: from, toTs: end };
}

export default function AdminReports({ isDarkMode }) {
  const [mode, setMode] = useState("REQUESTS"); // REQUESTS | TRAININGS

  // Requests report state (your existing)
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [hovered, setHovered] = useState(null);

  const [statuses, setStatuses] = useState({ pending: true, approved: true, rejected: true });
  const [requesterType, setRequesterType] = useState("all");
  const [department, setDepartment] = useState("all");
  const [requestType, setRequestType] = useState("all");
  const [handledBy, setHandledBy] = useState("all");

  const [rangePreset, setRangePreset] = useState("month");
  const presetRange = useMemo(() => rangeFromPreset(rangePreset === "custom" ? "month" : rangePreset), [rangePreset]);

  const [fromStr, setFromStr] = useState(() => toDateInputValue(presetRange.fromTs));
  const [toStr, setToStr] = useState(() => toDateInputValue(presetRange.toTs));

  const slaDaysByType = useMemo(
    () => ({
      student: 3,
      faculty: 2,
      outsider: 5,
      default: 3,
    }),
    []
  );

  const load = useCallback(async () => {
    if (mode !== "REQUESTS") return; // only load requests data in Requests mode
    setLoading(true);
    try {
      const { data } = await api.get("/api/requests?status=pending,approved,rejected&fields=lite&limit=2000");
      setRows(normalizeRows(data));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (rangePreset === "custom") return;
    const r = rangeFromPreset(rangePreset);
    setFromStr(toDateInputValue(r.fromTs));
    setToStr(toDateInputValue(r.toTs));
  }, [rangePreset]);

  const allRows = useMemo(() => enrichRows(rows), [rows]);

  const requesterTypeOptions = useMemo(() => {
    const set = new Set();
    allRows.forEach((r) => {
      if (r.requester_type) set.add(String(r.requester_type).trim());
    });
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [allRows]);

  const departmentOptions = useMemo(() => {
    const set = new Set();
    allRows.forEach((r) => {
      if (r.department) set.add(String(r.department).trim());
    });
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [allRows]);

  const requestTypeOptions = useMemo(() => {
    const set = new Set();
    allRows.forEach((r) => {
      if (r.request_type) set.add(String(r.request_type).trim());
    });
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [allRows]);

  const handledByOptions = useMemo(() => {
    const set = new Set();
    allRows.forEach((r) => {
      if (r.handled_by_admin != null) set.add(String(r.handled_by_admin));
    });
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [allRows]);

  const { fromTs, toTs } = useMemo(() => {
    const from = startOfDayTs(new Date(fromStr).getTime() || Date.now());
    const to = startOfDayTs(new Date(toStr).getTime() || Date.now()) + 24 * 60 * 60 * 1000 - 1;
    return { fromTs: from, toTs: to };
  }, [fromStr, toStr]);

  const filtered = useMemo(() => {
    return allRows.filter((r) => {
      if (!statuses[r.__status]) return false;
      if (requesterType !== "all" && r.__requesterType !== requesterType.toLowerCase()) return false;
      if (department !== "all" && String(r.department || "").trim() !== department) return false;
      if (requestType !== "all" && String(r.request_type || "").trim() !== requestType) return false;
      if (handledBy !== "all" && String(r.handled_by_admin ?? "") !== handledBy) return false;
      return true;
    });
  }, [allRows, statuses, requesterType, department, requestType, handledBy]);

  const kpis = useMemo(() => computeKpis(filtered, fromTs, toTs), [filtered, fromTs, toTs]);
  const trend = useMemo(() => computeTrend(filtered, fromTs, toTs), [filtered, fromTs, toTs]);

  const byRequestType = useMemo(() => groupBreakdown(kpis.received, "request_type"), [kpis.received]);
  const byDepartment = useMemo(() => groupBreakdown(kpis.received, "department"), [kpis.received]);
  const byRequesterType = useMemo(() => groupBreakdown(kpis.received, "requester_type"), [kpis.received]);
  const byAdmin = useMemo(() => groupBreakdown(kpis.received, "handled_by_admin"), [kpis.received]);

  const sla = useMemo(() => computeSla(kpis.received, slaDaysByType), [kpis.received, slaDaysByType]);

  const surfaceCard = isDarkMode ? "bg-slate-900/60 border border-slate-800" : "bg-white border border-slate-200 shadow-sm";
  const muted = isDarkMode ? "text-slate-400" : "text-slate-500";
  const title = isDarkMode ? "text-white" : "text-[#1D4477]";
  const chip = (active) =>
    active
      ? isDarkMode
        ? "bg-slate-800 text-[#FF0000] border border-white/5"
        : "bg-[#1D4477] text-white shadow-sm"
      : isDarkMode
      ? "text-slate-500 hover:text-slate-300"
      : "text-slate-400 hover:text-[#1D4477]";

  const exportCsv = () => {
    if (mode !== "REQUESTS") {
      // trainings CSV is intentionally handled in TrainingReportsSection later (if you want)
      return;
    }

    const cols = [
      { label: "ID", key: "id" },
      { label: "Tracking Code", key: "tracking_code" },
      { label: "Requester Type", key: "requester_type" },
      { label: "Full Name", key: "full_name" },
      { label: "Department", key: "department" },
      { label: "Requester Code", key: "requester_code" },
      { label: "Request Type", key: "request_type" },
      { label: "Status", key: "status" },
      { label: "Submitted At", key: "submitted_at" },
      { label: "Handled At", key: "handled_at" },
      { label: "Handled By", key: "handled_by_admin" },
      { label: "Remarks", key: "remarks" },
    ];

    const csv = toCSV(kpis.received, cols);
    const name = `accomplishment_report_${fromStr}_to_${toStr}.csv`;
    downloadText(name, csv, "text/csv");
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className={`text-xl md:text-2xl font-black tracking-widest uppercase ${title}`}>Reports</h3>
          <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${muted} mt-1`}>
            Accomplishment & Performance Analytics
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* mode switch */}
          <div className={`flex gap-1 p-1 rounded-xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
            <button
              onClick={() => setMode("REQUESTS")}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                mode === "REQUESTS"
                  ? isDarkMode
                    ? "bg-slate-800 text-white border border-white/5"
                    : "bg-[#1D4477] text-white shadow-sm"
                  : isDarkMode
                  ? "text-slate-500 hover:text-slate-300"
                  : "text-slate-500 hover:text-[#1D4477]"
              }`}
            >
              Requests
            </button>
            <button
              onClick={() => setMode("TRAININGS")}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                mode === "TRAININGS"
                  ? isDarkMode
                    ? "bg-slate-800 text-white border border-white/5"
                    : "bg-[#1D4477] text-white shadow-sm"
                  : isDarkMode
                  ? "text-slate-500 hover:text-slate-300"
                  : "text-slate-500 hover:text-[#1D4477]"
              }`}
            >
              Trainings
            </button>
          </div>

          {/* actions */}
          {mode === "REQUESTS" && (
            <>
              <button
                onClick={exportCsv}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${
                  isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-[#1D4477] hover:bg-slate-200"
                }`}
              >
                Export CSV
              </button>
              <button
                onClick={printPage}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${
                  isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-[#1D4477] hover:bg-slate-200"
                }`}
              >
                Print / PDF
              </button>
              <button
                onClick={load}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${
                  isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-[#1D4477] text-white hover:bg-[#16335a] shadow-md shadow-blue-900/20"
                }`}
              >
                Refresh Data
              </button>
            </>
          )}
        </div>
      </div>

      {/* BODY */}
      {mode === "TRAININGS" ? (
        <TrainingReportsSection isDarkMode={isDarkMode} />
      ) : (
        <>
          {/* FILTERS */}
          <ReportFilters
            isDarkMode={isDarkMode}
            surfaceCard={surfaceCard}
            muted={muted}
            title={title}
            chip={chip}
            rangePreset={rangePreset}
            setRangePreset={setRangePreset}
            fromStr={fromStr}
            toStr={toStr}
            setFromStr={setFromStr}
            setToStr={setToStr}
            requesterType={requesterType}
            setRequesterType={setRequesterType}
            requesterTypeOptions={requesterTypeOptions}
            department={department}
            setDepartment={setDepartment}
            departmentOptions={departmentOptions}
            requestType={requestType}
            setRequestType={setRequestType}
            requestTypeOptions={requestTypeOptions}
            statuses={statuses}
            setStatuses={setStatuses}
            handledBy={handledBy}
            setHandledBy={setHandledBy}
            handledByOptions={handledByOptions}
          />

          {/* KPIS */}
          <ReportKpis surfaceCard={surfaceCard} muted={muted} title={title} kpis={kpis} />

          {/* TREND */}
          <TrendInflowOutflow
            isDarkMode={isDarkMode}
            surfaceCard={surfaceCard}
            muted={muted}
            trend={trend}
            hovered={hovered}
            setHovered={setHovered}
          />

          {/* SLA */}
          <SlaPanel isDarkMode={isDarkMode} surfaceCard={surfaceCard} muted={muted} title={title} sla={sla} />

          {/* BREAKDOWNS */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <BreakdownTable surfaceCard={surfaceCard} muted={muted} title={title} label="By Request Type" rows={byRequestType} />
            <BreakdownTable surfaceCard={surfaceCard} muted={muted} title={title} label="By Department" rows={byDepartment} />
            <BreakdownTable surfaceCard={surfaceCard} muted={muted} title={title} label="By Requester Type" rows={byRequesterType} />
            <BreakdownTable surfaceCard={surfaceCard} muted={muted} title={title} label="By Admin (Handled By)" rows={byAdmin} />
          </div>

          {loading && (
            <motion.div
              variants={cardAnim}
              initial="hidden"
              animate="visible"
              className="fixed bottom-6 right-6 flex items-center gap-3 px-4 py-2 rounded-full bg-black/80 backdrop-blur-md border border-white/10 shadow-2xl"
            >
              <div className="w-2 h-2 rounded-full bg-[#FF0000] animate-ping" />
              <div className="text-white font-black text-[10px] uppercase tracking-widest">Loading</div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}