import RequestsPanel from "../components/RequestPanel";

export default function AdminConsultations({ statusTab, isDarkMode }) {
  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Optional Branded Header for the specific section */}
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-1 h-6 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-[#FF0000]'}`} />
        <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDarkMode ? 'text-slate-500' : 'text-[#1D4477] opacity-70'}`}>
          Advisory & Consultation Queue
        </p>
      </div>

      <RequestsPanel
        type="consultation"
        statusTab={statusTab}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}