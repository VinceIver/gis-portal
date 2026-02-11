import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Download,
  FileText,
  PackagePlus,
  Loader2,
  FolderSearch,
  BadgeCheck,
  Clock,
  XCircle,
  Paperclip,
} from "lucide-react";
import { api } from "../services/api";
import RequestModal from "./RequestModal";

// --- HELPERS ---
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

const anim = {
  container: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  },
  card: {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 260, damping: 22 },
    },
  },
};

const statusPill = (statusRaw) => {
  const status = String(statusRaw || "").toLowerCase();
  if (status === "approved")
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "rejected")
    return "bg-rose-50 text-rose-700 border-rose-100";
  return "bg-amber-50 text-amber-700 border-amber-100";
};

function StatusIcon({ status }) {
  const s = String(status || "").toLowerCase();
  if (s === "approved")
    return <BadgeCheck size={14} className="text-emerald-600" />;
  if (s === "rejected")
    return <XCircle size={14} className="text-rose-600" />;
  return <Clock size={14} className="text-amber-600" />;
}

export default function Resources() {
  const [openRequest, setOpenRequest] = useState(false);
  const [trackCode, setTrackCode] = useState("");
  const [tracking, setTracking] = useState(false);
  const [trackErr, setTrackErr] = useState("");
  const [trackResult, setTrackResult] = useState(null);

  // Backend base URL (Express)
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Convert "/uploads/..." or "/resources/..." from backend to full backend URL
  const toBackendUrl = (url) => {
    if (!url) return "#";
    const u = String(url);
    if (/^https?:\/\//i.test(u)) return u;
    return `${API_BASE}${u.startsWith("/") ? "" : "/"}${u}`;
  };

  // Frontend public base (safe even if deployed under subfolder)
  const PUBLIC_BASE = import.meta.env.BASE_URL || "/";

  // ✅ Your template is in: public/RDE-01_Borrowing_Form.docx
  // So it is served at: <frontend-origin>/RDE-01_Borrowing_Form.docx
  // If deployed under subfolder, BASE_URL handles it.
  const resources = useMemo(
    () => [
      {
        id: "borrow-form",
        title: "RDE-01 Borrowing Form",
        desc: "Download the official borrowing form (Word document).",
        type: "DOCX",
        fileUrl: `${PUBLIC_BASE}RDE-01_Borrowing_Form.docx`,
        downloadName: "RDE-01_Borrowing_Form.docx",
      },
    ],
    [PUBLIC_BASE]
  );

  const runTrack = async () => {
    const code = String(trackCode || "").trim();
    setTrackErr("");
    setTrackResult(null);
    if (!code) return setTrackErr("Please enter your SR Code / Tracking Code.");

    setTracking(true);
    try {
      const { data } = await api.get(
        `/api/resources/requests/track/${encodeURIComponent(code)}`
      );
      if (data?.request) {
        setTrackResult({
          request: data.request,
          deliveries: Array.isArray(data.deliveries) ? data.deliveries : [],
        });
      } else {
        setTrackErr("No record found.");
      }
    } catch (err) {
      setTrackErr(err?.response?.data?.message || "No record found for that code.");
    } finally {
      setTracking(false);
    }
  };

  const r = trackResult?.request;
  const deliveries = trackResult?.deliveries || [];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-0">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div className="px-6 py-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-lg">
              <BookOpen size={22} />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                Portal
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Resource <span className="text-red-600">Center</span>
              </h1>
            </div>
          </div>

          <button
            onClick={() => setOpenRequest(true)}
            className="group inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-xl shadow-red-600/20"
          >
            New Request
            <PackagePlus
              size={18}
              className="group-hover:rotate-12 transition-transform"
            />
          </button>
        </div>

        {/* TRACKER BAR */}
        <div className="p-4 md:p-6 bg-slate-50/50">
          <div className="max-w-3xl flex flex-col md:flex-row items-center gap-3">
            <div className="w-full flex-1 flex items-center gap-3 rounded-2xl bg-white border border-slate-200 px-4 py-3 focus-within:ring-4 focus-within:ring-red-600/10 focus-within:border-red-600 transition-all shadow-sm">
              <FolderSearch className="text-slate-400" size={18} />
              <input
                value={trackCode}
                onChange={(e) => setTrackCode(e.target.value)}
                placeholder="Track your resources via SR Code / Tracking Code..."
                className="flex-1 bg-transparent outline-none text-sm font-bold text-slate-900 placeholder:text-slate-400"
                onKeyDown={(e) => e.key === "Enter" && runTrack()}
              />
              <button
                onClick={runTrack}
                disabled={tracking}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[9px] transition-colors disabled:opacity-50"
              >
                {tracking ? <Loader2 size={14} className="animate-spin" /> : "Track"}
              </button>
            </div>
          </div>
          {trackErr && (
            <p className="mt-3 text-xs font-bold text-red-500 ml-2">{trackErr}</p>
          )}
        </div>
      </div>

      {/* TRACKING RESULTS */}
      <AnimatePresence mode="wait">
        {trackResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden mb-8"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-2">
                <StatusIcon status={r?.status} />
                <span className="font-black text-slate-900 text-[10px] uppercase tracking-widest">
                  Request Status
                </span>
              </div>
              <span
                className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${statusPill(
                  r?.status
                )}`}
              >
                {r?.status}
              </span>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <MiniInfoCard label="Requester" value={r?.requester_name} />
                <MiniInfoCard label="Tracking Code" value={r?.tracking_code} />
                <MiniInfoCard label="SR Code" value={r?.sr_code || "N/A"} />
                <MiniInfoCard label="Deadline" value={formatDate(r?.needed_date)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MiniInfoBlock label="Items Requested" value={r?.requested_items} />
                <MiniInfoBlock label="Intended Purpose" value={r?.purpose} />
              </div>

              {deliveries.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    Available Downloads
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {deliveries.map((d) => (
                      <a
                        key={d.id}
                        href={toBackendUrl(d.file_url)}
                        download={d.original_name || undefined}
                        className="flex items-center gap-3 bg-white hover:border-red-600 border border-slate-200 px-4 py-2.5 rounded-2xl transition-all group"
                      >
                        <Paperclip
                          size={16}
                          className="text-slate-400 group-hover:text-red-600"
                        />
                        <span className="text-xs font-bold text-slate-700">
                          {d.original_name || "File"}
                        </span>
                        <Download size={14} className="text-red-600" />
                      </a>
                    ))}
                  </div>

                  <p className="mt-2 text-[11px] text-slate-400">
                    If your browser opens the file instead of downloading, your
                    backend should send the file with Content-Disposition: attachment.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DOWNLOADABLE RESOURCES */}
      <motion.div
        variants={anim.container}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {resources.map((x) => (
          <motion.div
            key={x.id}
            variants={anim.card}
            className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-shadow group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                <FileText size={24} />
              </div>
              <span className="text-[10px] font-black px-3 py-1 bg-slate-100 rounded-full text-slate-500 uppercase tracking-widest">
                {x.type}
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-2">{x.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">{x.desc}</p>

            <a
              href={x.fileUrl}
              download={x.downloadName}
              className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-900 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[10px] transition-all"
            >
              Download Template <Download size={16} />
            </a>
          </motion.div>
        ))}
      </motion.div>

      {/* MODAL COMPONENT */}
      <RequestModal
        isOpen={openRequest}
        onClose={() => setOpenRequest(false)}
        onSuccess={(code) => setTrackCode(code)}
      />
    </div>
  );
}

function MiniInfoCard({ label, value }) {
  return (
    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
      <div className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
        {label}
      </div>
      <div className="text-sm font-bold text-slate-900 truncate">{value || "-"}</div>
    </div>
  );
}

function MiniInfoBlock({ label, value }) {
  return (
    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5">
      <div className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
        {label}
      </div>
      <div className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
        {value || "-"}
      </div>
    </div>
  );
}