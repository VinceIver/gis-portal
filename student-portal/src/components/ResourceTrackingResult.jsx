import { Download, Paperclip, BadgeCheck, Clock, XCircle } from "lucide-react";

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

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const s = String(dateStr).trim();

  let d;
  // Date-only (YYYY-MM-DD) -> local noon to avoid timezone shifting
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, day] = s.split("-").map(Number);
    d = new Date(y, m - 1, day, 12, 0, 0);
  } else {
    d = new Date(s.includes(" ") ? s.replace(" ", "T") : s);
  }

  return isNaN(d.getTime())
    ? "-"
    : d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};


const getRemarks = (r) =>
  r?.remarks ??
  r?.admin_remarks ??
  r?.adminRemarks ??
  r?.remark ??
  r?.notes ??
  r?.comment ??
  "";

export default function ResourceTrackingResult({
  request,
  deliveries,
  toBackendUrl,
}) {
  if (!request) return null;

  const r = request;
  const files = Array.isArray(deliveries) ? deliveries : [];
  const remarks = getRemarks(r);

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden mb-8">
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

        {/*  Admin Remarks */}
        {remarks ? (
          <div className="mt-6 bg-slate-50 p-6 rounded-[1.75rem] border border-slate-200 relative">
            <div className="absolute top-6 left-0 w-1 h-10 bg-red-600 rounded-r-full" />
            <label className="text-[9px] font-black text-red-600 uppercase tracking-[0.35em] mb-2 block">
              Admin Remarks
            </label>
            <p className="text-sm font-medium text-slate-700 leading-relaxed">
              {remarks}
            </p>
          </div>
        ) : (
          <div className="mt-6 bg-slate-50 p-6 rounded-[1.75rem] border border-slate-200">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.35em] mb-2 block">
              Admin Remarks
            </label>
            <p className="text-sm font-medium text-slate-500">No remarks yet.</p>
          </div>
        )}

        {files.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">
              Available Downloads
            </div>

            <div className="flex flex-wrap gap-3">
              {files.map((d) => (
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
              If your browser opens the file instead of downloading, your backend
              should send the file with Content-Disposition: attachment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniInfoCard({ label, value }) {
  return (
    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
      <div className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
        {label}
      </div>
      <div className="text-sm font-bold text-slate-900 truncate">
        {value || "-"}
      </div>
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