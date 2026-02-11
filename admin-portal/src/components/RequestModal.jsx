import { motion } from "framer-motion";
import { User, Mail, Calendar as CalendarIcon, FileText, Hash, X, Building2 } from "lucide-react";

export default function RequestModal({
  request,
  onClose,
  statusTab,
  safeDate,
  handleApprove,
  handleReject,
  isDarkMode,
}) {
  if (!request) return null;

  const requesterType = String(request.requester_type || "student").toLowerCase();
  const isStudent = requesterType === "student";

  const codeLabel = isStudent ? "SR-Code / ID Number" : "Tracking / Reference No.";
  const codeValue = isStudent ? request.requester_code : request.tracking_code;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-0 md:p-4 ${
        isDarkMode ? "bg-slate-950/80" : "bg-slate-900/70"
      }`}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={`w-full max-w-lg overflow-hidden shadow-2xl border flex flex-col max-h-[85vh] md:max-h-[90vh] transition-colors duration-300 ${
          isDarkMode
            ? "bg-slate-900 rounded-t-3xl md:rounded-3xl border-slate-800"
            : "bg-white rounded-t-3xl md:rounded-3xl border-white/20"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`px-6 py-5 flex justify-between items-center text-white shrink-0 ${
            isDarkMode ? "bg-[#0f172a] border-b border-slate-800" : "bg-[#1D4477]"
          }`}
        >
          <div className="flex flex-col">
            <span className={`text-[10px] font-black tracking-[0.3em] uppercase ${isDarkMode ? "text-slate-400" : "text-white/70"}`}>
              Management Portal
            </span>
            <h2 className="text-sm font-bold uppercase tracking-tight">Request Profile</h2>
          </div>
          <button onClick={onClose} className="hover:rotate-90 transition-transform bg-white/10 p-1.5 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3 custom-scrollbar pb-10 md:pb-6">
          <DetailRow isDarkMode={isDarkMode} icon={<User size={18} />} label="Full Name" value={request.student_name || request.full_name} />
          <DetailRow isDarkMode={isDarkMode} icon={<Building2 size={18} />} label="College / Department" value={request.department} />
          <DetailRow isDarkMode={isDarkMode} icon={<Hash size={18} />} label={codeLabel} value={codeValue} />
          <DetailRow
            isDarkMode={isDarkMode}
            icon={<FileText size={18} />}
            label="Topic Description"
            value={request.topic || request.description}
            italic
          />
          <DetailRow isDarkMode={isDarkMode} icon={<CalendarIcon size={18} />} label="Preferred Date" value={safeDate(request.needed_date)} />
          <DetailRow isDarkMode={isDarkMode} icon={<Mail size={18} />} label="Contact Email Address" value={request.email} isAccent />

          {statusTab === "PENDING" && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={() => handleApprove(request.id)}
                className="flex-1 bg-[#FF0000] text-white py-4 rounded-xl font-black text-xs tracking-widest uppercase shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
              >
                Approve Request
              </button>
              <button
                onClick={() => handleReject(request.id)}
                className={`flex-1 py-4 rounded-xl font-black text-xs tracking-widest uppercase transition-all border-2 ${
                  isDarkMode 
                    ? "bg-transparent text-slate-400 border-slate-800 hover:bg-red-500/5 hover:text-red-400 hover:border-red-500/20" 
                    : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50"
                }`}
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function DetailRow({ icon, label, value, italic, isAccent, isDarkMode }) {
  return (
    <div className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${
      isDarkMode ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-100"
    }`}>
      <div className={`${isAccent ? "text-[#FF0000]" : isDarkMode ? "text-slate-500" : "text-[#1D4477]"} mt-1 shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-[9px] font-black uppercase tracking-wider mb-0.5 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
          {label}
        </p>
        <p
          className={`text-sm font-bold break-words leading-snug transition-colors ${
            italic
              ? isDarkMode
                ? "italic font-semibold text-slate-400"
                : "italic font-semibold text-slate-600"
              : isDarkMode
              ? "text-slate-200"
              : "text-[#1D4477]"
          } ${isAccent ? "text-[#FF0000]! opacity-90" : ""}`}
        >
          {value || "Not Specified"}
        </p>
      </div>
    </div>
  );
}