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
  Package,
  ClipboardList,
} from "lucide-react";
import { api } from "../services/api";
import ResourceTrackingResult from "./ResourceTrackingResult";

const listContainerVars = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

function safeDate(d) {
  if (!d) return "—";
  const s = String(d).trim();
  let dt;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, day] = s.split("-").map(Number);
    dt = new Date(y, m - 1, day, 12, 0, 0);
  } else {
    dt = new Date(s.includes(" ") ? s.replace(" ", "T") : s);
  }

  return isNaN(dt.getTime())
    ? "—"
    : dt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

function normalizeConsultationResponse(data) {
  const raw = data;
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.requests)
    ? raw.requests
    : Array.isArray(raw?.data)
    ? raw.data
    : [];

  return list.map((r) => ({
    kind: "consultation",
    id: r.id,
    status: r.status,
    needed_date: r.needed_date,
    request_type: r.request_type,
    description: r.description,
    full_name: r.full_name,
    department: r.department,
    remarks: r.remarks,
    _raw: r,
  }));
}

function normalizeResourceResponse(data) {
  if (!data) return [];

  // tracking_code mode: { request, deliveries }
  if (data.request) {
    const r = data.request;
    const deliveries = Array.isArray(data.deliveries) ? data.deliveries : [];
    return [
      {
        kind: "resource",
        id: r.id,
        status: r.status,
        needed_date: r.needed_date,
        request_type: "RESOURCE",
        description: r.requested_items || r.purpose || "Resource request",
        tracking_code: r.tracking_code,
        deliveries,
        _raw: r,
      },
    ];
  }

  // SR mode: { requests: [...] } (no deliveries yet)
  if (Array.isArray(data.requests)) {
    return data.requests.map((r) => ({
      kind: "resource",
      id: r.id,
      status: r.status,
      needed_date: r.needed_date,
      request_type: "RESOURCE",
      description: r.requested_items || r.purpose || "Resource request",
      tracking_code: r.tracking_code, // needed for fetching deliveries
      deliveries: null, // null = not loaded yet
      _raw: r,
    }));
  }

  return [];
}

export default function TrackRequests() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [error, setError] = useState("");

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const toBackendUrl = (url) => {
    if (!url) return "#";
    const u = String(url);
    if (/^https?:\/\//i.test(u)) return u;
    return `${API_BASE}${u.startsWith("/") ? "" : "/"}${u}`;
  };

  // Fetch deliveries for a resource item using its tracking_code
  const loadResourceDeliveries = async (it) => {
    const tcode = String(it?.tracking_code || it?._raw?.tracking_code || "").trim();
    if (!tcode) return it;

    try {
      const { data } = await api.get(
        `/api/resources/requests/track/${encodeURIComponent(tcode)}`
      );

      if (!data?.request) return { ...it, deliveries: [] };

      const deliveries = Array.isArray(data.deliveries) ? data.deliveries : [];

      return {
        ...it,
        tracking_code: data.request.tracking_code || tcode,
        _raw: data.request,
        deliveries,
      };
    } catch {
      return { ...it, deliveries: [] };
    }
  };

  const handleSelect = async (it) => {
    setSelected(it);
    setShowMobileDetail(true);

    // If SR list mode, deliveries are null; load them when selected
    if (it.kind === "resource" && it.deliveries == null) {
      const updated = await loadResourceDeliveries(it);

      setSelected(updated);
      setItems((prev) =>
        prev.map((x) => (x.kind === updated.kind && x.id === updated.id ? updated : x))
      );
    }
  };

  const track = async (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    setItems([]);
    setSelected(null);
    setShowMobileDetail(false);
    setError("");

    try {
      const [consultRes, resourceRes] = await Promise.allSettled([
        api.get(`/api/requests/track/${encodeURIComponent(trimmed)}`),
        api.get(`/api/resources/requests/track/${encodeURIComponent(trimmed)}`),
      ]);

      let merged = [];

      if (consultRes.status === "fulfilled") {
        merged = merged.concat(normalizeConsultationResponse(consultRes.value.data));
      }

      if (resourceRes.status === "fulfilled") {
        merged = merged.concat(normalizeResourceResponse(resourceRes.value.data));
      }

      if (!merged.length) {
        const msg1 =
          consultRes.status === "rejected"
            ? consultRes.reason?.response?.data?.message
            : null;
        const msg2 =
          resourceRes.status === "rejected"
            ? resourceRes.reason?.response?.data?.message
            : null;

        setError(msg1 || msg2 || "Tracking code not found.");
        return;
      }

      merged.sort((a, b) => {
        const ta = new Date(a.needed_date || 0).getTime() || 0;
        const tb = new Date(b.needed_date || 0).getTime() || 0;
        if (tb !== ta) return tb - ta;
        return (b.id || 0) - (a.id || 0);
      });

      setItems(merged);

      const first = merged[0] || null;
      setSelected(first);
      if (first) setShowMobileDetail(true);

      // Auto-load deliveries if first item is resource from SR list mode
      if (first?.kind === "resource" && first.deliveries == null) {
        const updatedFirst = await loadResourceDeliveries(first);
        setSelected(updatedFirst);
        setItems((prev) =>
          prev.map((x) =>
            x.kind === updatedFirst.kind && x.id === updatedFirst.id ? updatedFirst : x
          )
        );
      }
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
    const s = String(selected?.status || "").toLowerCase();
    if (s.includes("approve")) return "approved";
    if (s.includes("reject")) return "rejected";
    return "pending";
  }, [selected]);

  const currentStatus = statusConfig[selectedStatus] || statusConfig.pending;

  const KindBadge = ({ kind }) => {
    const isRes = kind === "resource";
    return (
      <span className="inline-flex items-center gap-2">
        {isRes ? <Package size={14} /> : <ClipboardList size={14} />}
        {isRes ? "RESOURCE" : "CONSULTATION"}
      </span>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
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
                  Track <span className="text-red-600">Requests / Resources</span>
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
        {error ? (
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
              <div className="text-slate-600 font-medium text-sm">{error}</div>
            </div>
          </motion.div>
        ) : items.length > 0 ? (
          <motion.div
            variants={listContainerVars}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8"
          >
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
                  {items.length} found
                </span>
              </div>

              <div className="flex flex-col gap-3 max-h-[60vh] lg:max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
                {items.map((it) => {
                  const isActive =
                    selected?.kind === it.kind && selected?.id === it.id;

                  return (
                    <button
                      key={`${it.kind}-${it.id}`}
                      onClick={() => handleSelect(it)}
                      className={`w-full text-left rounded-[1.5rem] border p-5 transition-all ${
                        isActive
                          ? "bg-white border-red-200 shadow-lg ring-4 ring-red-600/10"
                          : "bg-white/70 border-slate-200 hover:bg-white hover:shadow-md"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span
                          className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border inline-flex items-center gap-2 ${
                            isActive
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          <KindBadge kind={it.kind} />
                        </span>

                        <span className="text-[9px] font-bold text-slate-400">
                          {safeDate(it.needed_date)}
                        </span>
                      </div>

                      <div
                        className={`font-black text-xs md:text-sm leading-snug line-clamp-2 ${
                          isActive ? "text-[#0F172A]" : "text-slate-700"
                        }`}
                      >
                        {it.kind === "resource" ? it.description : `"${it.description}"`}
                      </div>

                      {it.kind === "resource" && it.deliveries == null && (
                        <div className="mt-2 text-[10px] font-bold text-slate-400">
                          Click to load delivered files
                        </div>
                      )}

                      {it.kind === "resource" && Array.isArray(it.deliveries) && it.deliveries.length > 0 && (
                        <div className="mt-2 text-[10px] font-bold text-emerald-600">
                          {it.deliveries.length} file(s) available
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

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

              {selected?.kind === "resource" ? (
                <motion.div
                  key={`${selected.kind}-${selected.id}`}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <ResourceTrackingResult
                    request={selected._raw}
                    deliveries={Array.isArray(selected.deliveries) ? selected.deliveries : []}
                    toBackendUrl={toBackendUrl}
                  />
                </motion.div>
              ) : (
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
                        <p className="text-sm font-medium text-slate-500">No remarks yet.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}