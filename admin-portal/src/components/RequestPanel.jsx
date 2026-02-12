import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, Loader2, ArrowUpDown, Search } from "lucide-react";
import { api } from "../services/api";
import RequestModal from "./RequestModal";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

// --- helpers for sorting ---
const toTs = (v) => {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;

  const iso = s.includes(" ") ? s.replace(" ", "T") : s;
  const d = new Date(iso);
  const t = d.getTime();
  return Number.isFinite(t) ? t : null;
};

export default function RequestsPanel({ type, statusTab, isDarkMode }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // ✅ filter button state
  const [sortOrder, setSortOrder] = useState("desc"); // desc=newest, asc=oldest
  // ✅ search state
  const [searchTerm, setSearchTerm] = useState("");

  const safeDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return isNaN(dt.getTime())
      ? "—"
      : dt.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const status = String(statusTab || "PENDING").toLowerCase();
      const { data } = await api.get(`/api/requests?status=${status}`);
      const incoming = Array.isArray(data) ? data : data?.rows || [];
      setRows(incoming);
    } catch (err) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [statusTab, type]);

  useEffect(() => {
    load();
  }, [load]);

  // Filter and Sort Rows
  const filteredAndSortedRows = useMemo(() => {
    let arr = Array.isArray(rows) ? [...rows] : [];

    // Search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      arr = arr.filter((r) => 
        (r.student_name || r.full_name || "").toLowerCase().includes(query)
      );
    }

    // Sort logic
    arr.sort((a, b) => {
      const aTs =
        toTs(a?.created_at) ??
        toTs(a?.date_created) ??
        toTs(a?.createdAt) ??
        toTs(a?.needed_date) ??
        0;

      const bTs =
        toTs(b?.created_at) ??
        toTs(b?.date_created) ??
        toTs(b?.createdAt) ??
        toTs(b?.needed_date) ??
        0;

      return sortOrder === "desc" ? bTs - aTs : aTs - bTs;
    });

    return arr;
  }, [rows, sortOrder, searchTerm]);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/api/requests/${id}/approve`);
      setSelectedRequest(null);
      load();
    } catch (err) {
      alert("Action failed");
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Reason for rejection:");
    if (!reason) return;
    try {
      await api.patch(`/api/requests/${id}/reject`, { reason });
      setSelectedRequest(null);
      load();
    } catch (err) {
      alert("Action failed");
    }
  };

  if (loading) {
    return (
      <div
        className={`h-full flex flex-col items-center justify-center gap-4 ${
          isDarkMode ? "text-slate-700" : "text-slate-300"
        }`}
      >
        <Loader2 className="animate-spin text-[#FF0000]" size={48} />
        <p className="font-bold text-sm tracking-[0.3em] uppercase animate-pulse">
          Updating Records
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        {/* ✅ SEARCH INPUT */}
        <div className="relative w-full sm:w-80">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} size={16} />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 text-xs font-bold rounded-lg border outline-none transition-all ${
              isDarkMode 
                ? "bg-slate-900 border-slate-800 text-white focus:border-[#FF0000]/60" 
                : "bg-white border-slate-200 text-[#1D4477] focus:border-[#1D4477]"
            }`}
          />
        </div>

        {/* ✅ FILTER / SORT BUTTON */}
        <button
          type="button"
          onClick={() => setSortOrder((p) => (p === "desc" ? "asc" : "desc"))}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-black uppercase rounded-lg border transition ${
            isDarkMode
              ? "bg-slate-900 text-white border-slate-800 hover:border-[#FF0000]/60"
              : "bg-white text-[#1D4477] border-slate-200 hover:border-[#1D4477]"
          }`}
          title="Toggle sort order"
        >
          <ArrowUpDown size={16} />
          {sortOrder === "desc" ? "Newest First" : "Oldest First"}
        </button>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        key={`${type}-${statusTab}`}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
      >
        {filteredAndSortedRows.length > 0 ? (
          filteredAndSortedRows.map((req) => (
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -5 }}
              key={req.id}
              onClick={() => setSelectedRequest(req)}
              className={`rounded-xl p-6 border transition-all cursor-pointer group flex flex-col h-full relative ${
                isDarkMode
                  ? "bg-slate-900 border-slate-800 hover:border-[#FF0000]/50 hover:shadow-2xl hover:shadow-[#FF0000]/5"
                  : "bg-white border-slate-200 hover:border-[#1D4477] hover:shadow-2xl"
              }`}
            >
              <div className="flex justify-between items-center mb-5 relative z-10">
                <span
                  className={`text-[10px] font-black px-3 py-1 rounded-md border uppercase tracking-tighter ${
                    isDarkMode
                      ? "bg-white/5 text-white border-white/20"
                      : "bg-[#1D4477]/5 text-[#1D4477] border-[#1D4477]/10"
                  }`}
                >
                  {String(req.requester_type || "student").toUpperCase()}
                </span>

                <div
                  className={`flex items-center gap-1.5 transition-colors ${
                    isDarkMode
                      ? "text-slate-500 group-hover:text-[#FF0000]"
                      : "text-slate-300 group-hover:text-[#1D4477]"
                  }`}
                >
                  <CalendarIcon size={14} />
                  <span className="text-[11px] font-bold uppercase tracking-tight">
                    {safeDate(req.needed_date)}
                  </span>
                </div>
              </div>

              <h3
                className={`font-black text-base uppercase mb-0.5 leading-tight transition-colors relative z-10 ${
                  isDarkMode
                    ? "text-white group-hover:text-[#FF0000]"
                    : "text-[#1D4477] group-hover:text-[#FF0000]"
                }`}
              >
                {req.student_name || req.full_name}
              </h3>

              <p
                className={`text-[10px] font-bold uppercase tracking-widest mb-1 truncate ${
                  isDarkMode ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {req.department || "N/A"}
              </p>

              <p className="text-sm text-[#FF0000] font-bold mb-6 relative z-10 truncate opacity-90">
                {req.email}
              </p>

              <div
                className={`mt-auto text-sm leading-relaxed italic p-4 rounded-lg border-l-4 transition-all relative z-10 ${
                  isDarkMode
                    ? "text-slate-400 bg-slate-950/50 border-slate-700 group-hover:border-[#FF0000]"
                    : "text-slate-600 bg-slate-50 border-slate-200 group-hover:border-[#1D4477]"
                }`}
              >
                "{req.topic || req.description}"
              </div>
            </motion.div>
          ))
        ) : (
          <div
            className={`col-span-full text-center py-32 font-black text-sm uppercase tracking-[0.5em] border-4 border-dashed rounded-3xl ${
              isDarkMode
                ? "text-slate-800 border-slate-900"
                : "text-slate-300 border-slate-100"
            }`}
          >
            Empty Records
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {selectedRequest && (
          <RequestModal
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            statusTab={statusTab}
            safeDate={safeDate}
            handleApprove={handleApprove}
            handleReject={handleReject}
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>
    </>
  );
}