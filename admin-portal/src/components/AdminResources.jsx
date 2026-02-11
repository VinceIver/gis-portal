import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileStack,
  Loader2,
  CheckCircle2,
  XCircle,
  Link as LinkIcon,
  FileUp,
  MessageSquare,
  Download,
} from "lucide-react";
import { api } from "../services/api";

const statusStyles = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-100",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-100",
};

const toApiStatus = (s) => String(s || "PENDING").toLowerCase();

const anim = {
  list: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } } },
};

const safeDateTime = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime())
    ? "—"
    : dt.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
};

export default function AdminResources({ statusTab = "PENDING", isDarkMode = false }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState("");

  const [deliverOpen, setDeliverOpen] = useState(false);
  const [deliverType, setDeliverType] = useState("FILE"); // FILE | LINK | NOTE
  const [deliverUrl, setDeliverUrl] = useState("");
  const [deliverMsg, setDeliverMsg] = useState("");
  const [deliverFile, setDeliverFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/resources/admin/requests?status=${toApiStatus(statusTab)}`);
      setRows(Array.isArray(data) ? data : []);
      setSelected((prev) => {
        if (!prev) return (Array.isArray(data) && data[0]) || null;
        const stillThere = (Array.isArray(data) ? data : []).find((r) => r.id === prev.id);
        return stillThere || (Array.isArray(data) && data[0]) || null;
      });
    } catch (e) {
      setRows([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }, [statusTab]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      await api.patch(`/api/resources/admin/requests/${selected.id}/approve`);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const openReject = () => {
    if (!selected) return;
    setRejectRemarks("");
    setRejectOpen(true);
  };

  const reject = async () => {
    if (!selected || submitting) return;
    const remarks = rejectRemarks.trim();
    if (!remarks) return;
    setSubmitting(true);
    try {
      await api.patch(`/api/resources/admin/requests/${selected.id}/reject`, { remarks });
      setRejectOpen(false);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const openDeliver = () => {
    if (!selected) return;
    setDeliverType("FILE");
    setDeliverUrl("");
    setDeliverMsg("");
    setDeliverFile(null);
    setDeliverOpen(true);
  };

  const submitDelivery = async () => {
    if (!selected || submitting) return;

    if (deliverType === "FILE" && !deliverFile) return;
    if (deliverType === "LINK" && !deliverUrl.trim()) return;
    if (deliverType === "NOTE" && !deliverMsg.trim()) return;

    setSubmitting(true);
    try {
      if (deliverType === "FILE") {
        const fd = new FormData();
        fd.append("delivery_type", "FILE");
        fd.append("file", deliverFile);

        await api.post(`/api/resources/admin/requests/${selected.id}/deliveries`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post(`/api/resources/admin/requests/${selected.id}/deliveries`, {
          delivery_type: deliverType,
          external_url: deliverType === "LINK" ? deliverUrl.trim() : undefined,
          message: deliverType === "NOTE" ? deliverMsg.trim() : undefined,
        });
      }

      setDeliverOpen(false);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const cardBase = isDarkMode
    ? "bg-[#0b1220] border-slate-800 text-slate-200"
    : "bg-white border-slate-100 text-slate-900";

  const subtle = isDarkMode ? "text-slate-400" : "text-slate-500";
  const divider = isDarkMode ? "border-slate-800" : "border-slate-100";
  const inputBase = isDarkMode
    ? "bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-600"
    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400";

  return (
    <div className="w-full">
      {/* HEADER */}
      <div className={`rounded-[2rem] md:rounded-[2.5rem] shadow-xl border overflow-hidden mb-6 ${cardBase}`}>
        <div className={`px-6 py-6 border-b ${divider}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl ${isDarkMode ? "bg-slate-900" : "bg-[#0F172A]"} text-white flex items-center justify-center shadow-lg`}>
                <FileStack size={18} />
              </div>
              <div>
                <div className={`text-[9px] font-black uppercase tracking-[0.35em] ${isDarkMode ? "text-slate-500" : "text-slate-300"}`}>
                  Resource Requests
                </div>
                <div className="text-lg font-black tracking-tight leading-none">
                  {statusTab} <span className="text-red-500">Queue</span>
                </div>
              </div>
            </div>

            {selected && (
              <div className="flex items-center gap-2">
                {statusTab === "PENDING" && (
                  <>
                    <button
                      disabled={submitting}
                      onClick={approve}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 disabled:opacity-60"
                    >
                      <CheckCircle2 size={16} />
                      Approve
                    </button>

                    <button
                      disabled={submitting}
                      onClick={openReject}
                      className={`px-4 py-2 rounded-xl border font-black uppercase tracking-widest text-[10px] flex items-center gap-2 disabled:opacity-60 ${
                        isDarkMode ? "border-rose-500/40 text-rose-300 hover:bg-rose-500/10" : "border-rose-200 text-rose-700 hover:bg-rose-50"
                      }`}
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </>
                )}

                <button
                  disabled={submitting}
                  onClick={openDeliver}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 disabled:opacity-60"
                >
                  <FileUp size={16} />
                  Send Back
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className={`rounded-[2rem] shadow-xl border p-8 flex items-center gap-3 ${cardBase}`}>
          <div className={`w-12 h-12 rounded-2xl ${isDarkMode ? "bg-slate-900" : "bg-[#0F172A]"} text-white flex items-center justify-center`}>
            <Loader2 className="animate-spin" size={18} />
          </div>
          <div>
            <div className={`text-[9px] font-black uppercase tracking-[0.35em] ${isDarkMode ? "text-slate-500" : "text-slate-300"}`}>
              Loading
            </div>
            <div className="text-lg font-black tracking-tight leading-none">Resource Requests</div>
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className={`rounded-[2rem] shadow-xl border p-10 text-center ${cardBase}`}>
          <div className={`text-sm font-bold ${subtle}`}>No requests found for this status.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LIST */}
          <motion.div variants={anim.list} initial="hidden" animate="visible" className="lg:col-span-4 flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1">
            {rows.map((r) => {
              const active = selected?.id === r.id;
              return (
                <motion.button
                  key={r.id}
                  variants={anim.item}
                  onClick={() => setSelected(r)}
                  className={`text-left rounded-[1.5rem] border p-5 transition-all ${
                    active
                      ? isDarkMode
                        ? "bg-slate-900/60 border-red-500/30 ring-4 ring-red-500/10"
                        : "bg-white border-red-200 ring-4 ring-red-600/10"
                      : isDarkMode
                      ? "bg-[#0b1220] border-slate-800 hover:bg-slate-900/40"
                      : "bg-white/70 border-slate-200 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${
                      isDarkMode ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}>
                      {r.request_type || "OTHER"}
                    </span>

                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${statusStyles[statusTab] || statusStyles.PENDING}`}>
                      {statusTab}
                    </span>
                  </div>

                  <div className="mt-3 font-black text-sm leading-snug line-clamp-2">
                    {r.requester_name}
                  </div>

                  <div className={`mt-2 text-xs font-semibold line-clamp-2 ${subtle}`}>
                    {r.requested_items}
                  </div>

                  <div className={`mt-3 text-[10px] font-bold ${subtle}`}>
                    {r.tracking_code} • {safeDateTime(r.submitted_at)}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          {/* DETAIL */}
          <div className="lg:col-span-8">
            <div className={`rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border p-6 md:p-10 relative overflow-hidden ${cardBase}`}>
              <div className={`text-[9px] font-black uppercase tracking-[0.35em] ${isDarkMode ? "text-slate-500" : "text-slate-300"}`}>
                Request Details
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xl md:text-2xl font-black">
                  {selected?.requester_name}
                </div>

                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${statusStyles[statusTab] || statusStyles.PENDING}`}>
                  {statusTab}
                </span>
              </div>

              <div className={`mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6 ${divider}`}>
                <InfoRow label="Tracking Code" value={selected?.tracking_code || "—"} subtle={subtle} />
                <InfoRow label="SR Code" value={selected?.sr_code || "NON-STUDENT"} subtle={subtle} />
                <InfoRow label="Department" value={selected?.department || "—"} subtle={subtle} />
                <InfoRow label="Email" value={selected?.email || "—"} subtle={subtle} />
                <InfoRow label="Submitted" value={safeDateTime(selected?.submitted_at)} subtle={subtle} />
              </div>

              <div className={`mt-6 border-t pt-6 ${divider}`}>
                <div className={`text-[9px] font-black uppercase tracking-[0.35em] ${subtle}`}>Requested Items</div>
                <div className="mt-2 text-sm font-semibold leading-relaxed whitespace-pre-wrap">
                  {selected?.requested_items || "—"}
                </div>

                <div className={`mt-5 text-[9px] font-black uppercase tracking-[0.35em] ${subtle}`}>Purpose</div>
                <div className="mt-2 text-sm font-semibold leading-relaxed whitespace-pre-wrap">
                  {selected?.purpose || "—"}
                </div>

                <div className={`mt-5 text-[9px] font-black uppercase tracking-[0.35em] ${subtle}`}>Admin Remarks</div>
                <div className={`mt-2 text-sm font-semibold leading-relaxed whitespace-pre-wrap ${selected?.admin_remarks ? "" : subtle}`}>
                  {selected?.admin_remarks || "No remarks yet."}
                </div>
              </div>

              <div className={`mt-8 border-t pt-6 ${divider}`}>
                <div className={`text-[9px] font-black uppercase tracking-[0.35em] ${subtle}`}>Deliveries</div>
                <DeliveriesPreview trackingCode={selected?.tracking_code} isDarkMode={isDarkMode} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      <AnimatePresence>
        {rejectOpen && (
          <Modal onClose={() => (submitting ? null : setRejectOpen(false))} isDarkMode={isDarkMode} title="Reject Request">
            <div className="space-y-3">
              <div className={`text-sm font-semibold ${subtle}`}>
                Write the reason. This will be visible to the student when tracking.
              </div>

              <textarea
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                rows={4}
                className={`w-full rounded-2xl border px-4 py-3 outline-none text-sm font-semibold ${inputBase}`}
                placeholder="Enter rejection remarks..."
              />

              <div className="flex gap-3 justify-end">
                <button
                  disabled={submitting}
                  onClick={() => setRejectOpen(false)}
                  className={`px-4 py-3 rounded-2xl border font-black uppercase tracking-widest text-[10px] ${isDarkMode ? "border-slate-800 text-slate-300" : "border-slate-200 text-slate-700"} disabled:opacity-60`}
                >
                  Cancel
                </button>
                <button
                  disabled={submitting || !rejectRemarks.trim()}
                  onClick={reject}
                  className="px-4 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-[10px] disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Reject"}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* DELIVER MODAL */}
      <AnimatePresence>
        {deliverOpen && (
          <Modal onClose={() => (submitting ? null : setDeliverOpen(false))} isDarkMode={isDarkMode} title="Send Back (Optional)">
            <div className="space-y-4">
              <div className={`text-sm font-semibold ${subtle}`}>
                Send a file, link, or note to the requester. This appears in their tracking page.
              </div>

              <div className={`grid grid-cols-3 gap-2 p-1 rounded-2xl border ${isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-slate-50"}`}>
                <TypePill label="FILE" active={deliverType === "FILE"} onClick={() => setDeliverType("FILE")} />
                <TypePill label="LINK" active={deliverType === "LINK"} onClick={() => setDeliverType("LINK")} />
                <TypePill label="NOTE" active={deliverType === "NOTE"} onClick={() => setDeliverType("NOTE")} />
              </div>

              {deliverType === "FILE" && (
                <div className={`rounded-2xl border p-4 ${isDarkMode ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white"}`}>
                  <label className={`text-[9px] font-black uppercase tracking-[0.35em] ${subtle}`}>Upload file</label>
                  <div className="mt-3">
                    <input
                      type="file"
                      onChange={(e) => setDeliverFile(e.target.files?.[0] || null)}
                      className={`w-full text-sm ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
                    />
                  </div>
                </div>
              )}

              {deliverType === "LINK" && (
                <div className="space-y-2">
                  <label className={`text-[9px] font-black uppercase tracking-[0.35em] ${subtle}`}>External URL</label>
                  <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${inputBase}`}>
                    <LinkIcon size={16} className="text-red-500" />
                    <input
                      value={deliverUrl}
                      onChange={(e) => setDeliverUrl(e.target.value)}
                      placeholder="Paste Google Drive / OneDrive link..."
                      className="flex-1 bg-transparent outline-none text-sm font-semibold"
                    />
                  </div>
                </div>
              )}

              {deliverType === "NOTE" && (
                <div className="space-y-2">
                  <label className={`text-[9px] font-black uppercase tracking-[0.35em] ${subtle}`}>Note</label>
                  <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${inputBase}`}>
                    <MessageSquare size={16} className="text-red-500 mt-0.5" />
                    <textarea
                      value={deliverMsg}
                      onChange={(e) => setDeliverMsg(e.target.value)}
                      rows={4}
                      placeholder="Type instructions (software link, steps, etc.)"
                      className="flex-1 bg-transparent outline-none text-sm font-semibold resize-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  disabled={submitting}
                  onClick={() => setDeliverOpen(false)}
                  className={`px-4 py-3 rounded-2xl border font-black uppercase tracking-widest text-[10px] ${isDarkMode ? "border-slate-800 text-slate-300" : "border-slate-200 text-slate-700"} disabled:opacity-60`}
                >
                  Cancel
                </button>

                <button
                  disabled={
                    submitting ||
                    (deliverType === "FILE" && !deliverFile) ||
                    (deliverType === "LINK" && !deliverUrl.trim()) ||
                    (deliverType === "NOTE" && !deliverMsg.trim())
                  }
                  onClick={submitDelivery}
                  className="px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] disabled:opacity-60"
                >
                  {submitting ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoRow({ label, value, subtle }) {
  return (
    <div>
      <div className={`text-[9px] font-black uppercase tracking-[0.35em] ${subtle}`}>{label}</div>
      <div className="mt-1 text-sm font-bold">{value}</div>
    </div>
  );
}

function TypePill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition ${
        active ? "bg-red-600 text-white" : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}

function Modal({ title, children, onClose, isDarkMode }) {
  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
    >
      <motion.div
        className={`w-full max-w-xl rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto border ${
          isDarkMode ? "bg-[#0b1220] border-slate-800 text-slate-200" : "bg-white border-slate-100 text-slate-900"
        }`}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={`px-6 py-5 border-b ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
          <div className="text-lg font-black">{title}</div>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function DeliveriesPreview({ trackingCode, isDarkMode }) {
  const [loading, setLoading] = useState(false);
  const [deliveries, setDeliveries] = useState([]);

  const subtle = isDarkMode ? "text-slate-400" : "text-slate-500";
  const card = isDarkMode ? "border-slate-800 bg-slate-900/30" : "border-slate-200 bg-slate-50";

  const load = useCallback(async () => {
    if (!trackingCode) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/api/resources/requests/track/${encodeURIComponent(trackingCode)}`);
      setDeliveries(Array.isArray(data?.deliveries) ? data.deliveries : []);
    } catch {
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  }, [trackingCode]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className={`mt-3 rounded-2xl border p-4 flex items-center gap-2 ${card}`}>
        <Loader2 size={16} className="animate-spin" />
        <span className={`text-sm font-semibold ${subtle}`}>Loading deliveries...</span>
      </div>
    );
  }

  if (!deliveries.length) {
    return <div className={`mt-3 text-sm font-semibold ${subtle}`}>No deliveries yet.</div>;
  }

  return (
    <div className="mt-3 space-y-2">
      {deliveries.map((d) => (
        <div key={d.id} className={`rounded-2xl border p-4 ${card}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-black">
              {d.delivery_type === "FILE" ? d.original_name || "File" : d.delivery_type}
            </div>
            <div className={`text-[10px] font-bold ${subtle}`}>{safeDateTime(d.created_at)}</div>
          </div>

          {d.delivery_type === "NOTE" && (
            <div className={`mt-2 text-sm font-semibold whitespace-pre-wrap ${subtle}`}>{d.message}</div>
          )}

          {d.delivery_type === "LINK" && (
            <a
              href={d.external_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-sm font-black text-red-600 hover:text-red-700"
            >
              <LinkIcon size={16} />
              Open Link
            </a>
          )}

          {d.delivery_type === "FILE" && (
            <a
              href={d.file_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-sm font-black text-red-600 hover:text-red-700"
            >
              <Download size={16} />
              Download File
            </a>
          )}
        </div>
      ))}
    </div>
  );
}