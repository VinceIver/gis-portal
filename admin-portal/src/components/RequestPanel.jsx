import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
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

export default function RequestsPanel({ type, statusTab, isDarkMode }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const safeDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return isNaN(dt.getTime())
      ? "—"
      : dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const status = String(statusTab || "PENDING").toLowerCase();
      const { data } = await api.get(`/api/requests?status=${status}`);
      setRows(Array.isArray(data) ? data : data?.rows || []);
    } catch (err) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [statusTab, type]);

  useEffect(() => {
    load();
  }, [load]);

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
      <div className={`h-full flex flex-col items-center justify-center gap-4 ${isDarkMode ? "text-slate-700" : "text-slate-300"}`}>
        <Loader2 className="animate-spin text-[#FF0000]" size={48} />
        <p className="font-bold text-sm tracking-[0.3em] uppercase animate-pulse">Updating Records</p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        key={`${type}-${statusTab}`}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
      >
        {rows.length > 0 ? (
          rows.map((req) => (
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
                    isDarkMode ? "text-slate-500 group-hover:text-[#FF0000]" : "text-slate-300 group-hover:text-[#1D4477]"
                  }`}
                >
                  <CalendarIcon size={14} />
                  <span className="text-[11px] font-bold uppercase tracking-tight">{safeDate(req.needed_date)}</span>
                </div>
              </div>

              <h3
                className={`font-black text-base uppercase mb-0.5 leading-tight transition-colors relative z-10 ${
                  isDarkMode ? "text-white group-hover:text-[#FF0000]" : "text-[#1D4477] group-hover:text-[#FF0000]"
                }`}
              >
                {req.student_name || req.full_name}
              </h3>

              <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 truncate ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                {req.department || "N/A"}
              </p>

              <p className="text-sm text-[#FF0000] font-bold mb-6 relative z-10 truncate opacity-90">{req.email}</p>

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
              isDarkMode ? "text-slate-800 border-slate-900" : "text-slate-300 border-slate-100"
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