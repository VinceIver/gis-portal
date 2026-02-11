import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Calendar,
  User,
  Building2,
  AlertCircle,
  ChevronLeft,
  Search,
} from "lucide-react";
import { api } from "../services/api";

const listContainerVars = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

export default function TrackRequests() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const track = async (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    setRequests([]);
    setSelected(null);
    setShowMobileDetail(false);

    try {
      const { data } = await api.get(
        `/api/requests/track/${encodeURIComponent(trimmed)}`
      );
      const list = Array.isArray(data?.requests) ? data.requests : [];
      setRequests(list);
      setSelected(list[0] || null);
      if (list[0]) setShowMobileDetail(true);
    } catch (err) {
      setRequests([]);
      setSelected({
        error: err?.response?.data?.message || "Tracking code not found.",
      });
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    approved: {
      badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
      label: "APPROVED",
    },
    rejected: {
      badge: "bg-rose-50 text-rose-700 border-rose-100",
      label: "REJECTED",
    },
    pending: {
      badge: "bg-amber-50 text-amber-700 border-amber-100",
      label: "PENDING",
    },
  };

  const selectedStatus = useMemo(() => {
    const s = selected?.status?.toLowerCase?.() || "";
    if (s.includes("approve")) return "approved";
    if (s.includes("reject")) return "rejected";
    return "pending";
  }, [selected]);

  const currentStatus = statusConfig[selectedStatus] || statusConfig.pending;

  const safeDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return isNaN(dt.getTime())
      ? "—"
      : dt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
  };

  const handleSelectRequest = (r) => {
    setSelected(r);
    setShowMobileDetail(true);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* SEARCH */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 md:mb-10"
      >
        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shadow-lg">
                <Search size={18} />
              </div>
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-300">
                  Tracking Portal
                </div>
                <div className="text-lg font-black tracking-tight text-[#0F172A] leading-none">
                  Track <span className="text-red-600">Request</span>
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={track}
            className="p-4 md:p-6 flex flex-col md:flex-row gap-3 md:gap-4"
          >
            <div className="flex-1 flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200 px-4 py-4 focus-within:ring-4 focus-within:ring-red-600/10 focus-within:border-red-600 transition">
              <Activity className="text-red-600" size={18} />
              <input
                required
                className="flex-1 bg-transparent outline-none text-sm md:text-base font-semibold text-[#0F172A] placeholder:text-slate-400"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter SR CODE / Tracking Code (e.g. 22-XXXXX)"
              />
            </div>

            <button
              disabled={loading}
              className="shrink-0 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] px-8 py-4 shadow-2xl shadow-red-600/20 disabled:opacity-60 transition"
            >
              {loading ? "Tracking..." : "Track"}
            </button>
          </form>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ERROR */}
        {selected?.error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto bg-white border border-rose-100 rounded-[2rem] shadow-xl p-6 md:p-8 flex items-start gap-4"
          >
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <div className="text-rose-600 font-black uppercase tracking-widest text-[10px] mb-1">
                Tracking Error
              </div>
              <div className="text-slate-600 font-medium text-sm">
                {selected.error}
              </div>
            </div>
          </motion.div>
        ) : requests.length > 0 ? (
          <motion.div
            variants={listContainerVars}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8"
          >
            {/* LIST */}
            <div
              className={`lg:col-span-4 ${
                showMobileDetail ? "hidden lg:block" : "block"
              }`}
            >
              <div className="flex items-center justify-between px-2 mb-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.35em]">
                  History
                </span>
                <span className="text-[9px] font-black text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-full uppercase tracking-widest">
                  {requests.length} found
                </span>
              </div>

              <div className="flex flex-col gap-3 max-h-[60vh] lg:max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
                {requests.map((r) => {
                  const isActive = selected?.id === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleSelectRequest(r)}
                      className={`w-full text-left rounded-[1.5rem] border p-5 transition-all ${
                        isActive
                          ? "bg-white border-red-200 shadow-lg ring-4 ring-red-600/10"
                          : "bg-white/70 border-slate-200 hover:bg-white hover:shadow-md"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span
                          className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border ${
                            isActive
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {r.request_type || "GENERAL"}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">
                          {safeDate(r.needed_date)}
                        </span>
                      </div>

                      <div
                        className={`font-black text-xs md:text-sm leading-snug line-clamp-2 ${
                          isActive ? "text-[#0F172A]" : "text-slate-700"
                        }`}
                      >
                        "{r.description}"
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DETAIL */}
            <div
              className={`lg:col-span-8 ${
                !showMobileDetail ? "hidden lg:block" : "block"
              }`}
            >
              <button
                onClick={() => setShowMobileDetail(false)}
                className="lg:hidden flex items-center gap-2 text-red-600 font-black text-[10px] mb-4 uppercase tracking-widest"
              >
                <ChevronLeft size={16} />
                Back to List
              </button>

              <motion.div
                key={selected?.id}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-slate-100 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-red-600/5 blur-2xl" />
                <div className="absolute -left-20 -bottom-24 w-72 h-72 rounded-full bg-[#0F172A]/5 blur-2xl" />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div
                      className={`px-4 py-2 rounded-full border text-[9px] font-black tracking-[0.25em] shadow-sm ${currentStatus.badge}`}
                    >
                      {currentStatus.label}
                    </div>

                    <div className="text-right">
                      <div className="text-slate-300 text-[9px] font-black uppercase tracking-[0.35em] mb-1">
                        Ref ID
                      </div>
                      <div className="text-[#0F172A] font-black font-mono text-xl md:text-2xl tracking-tighter">
                        #{selected?.id}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl md:text-3xl font-black text-[#0F172A] leading-tight mb-8">
                    “<span className="text-red-600">{selected?.description}</span>”
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-y border-slate-100 mb-6">
                    <div>
                      <label className="flex items-center gap-2 text-slate-400 text-[9px] font-black uppercase tracking-[0.35em] mb-2">
                        <User size={14} />
                        Requester
                      </label>
                      <div className="font-bold text-sm md:text-base text-slate-900">
                        {selected?.full_name || "—"}
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-slate-400 text-[9px] font-black uppercase tracking-[0.35em] mb-2">
                        <Calendar size={14} />
                        Target Date
                      </label>
                      <div className="font-bold text-sm md:text-base text-slate-900">
                        {safeDate(selected?.needed_date)}
                      </div>
                    </div>

                    {selected?.department && (
                      <div className="sm:col-span-2">
                        <label className="flex items-center gap-2 text-slate-400 text-[9px] font-black uppercase tracking-[0.35em] mb-2">
                          <Building2 size={14} />
                          Department
                        </label>
                        <div className="font-bold text-sm md:text-base text-slate-900">
                          {selected.department}
                        </div>
                      </div>
                    )}
                  </div>

                  {selected?.remarks ? (
                    <div className="bg-slate-50 p-6 rounded-[1.75rem] border border-slate-200 relative">
                      <div className="absolute top-6 left-0 w-1 h-10 bg-red-600 rounded-r-full" />
                      <label className="text-[9px] font-black text-red-600 uppercase tracking-[0.35em] mb-2 block">
                        Admin Remarks
                      </label>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed">
                        {selected.remarks}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-6 rounded-[1.75rem] border border-slate-200">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.35em] mb-2 block">
                        Admin Remarks
                      </label>
                      <p className="text-sm font-medium text-slate-500">
                        No remarks yet.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}