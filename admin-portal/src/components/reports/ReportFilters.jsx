// src/components/reports/ReportFilters.jsx

export default function ReportFilters({
  isDarkMode,
  surfaceCard,
  muted,
  title,
  chip,
  rangePreset,
  setRangePreset,
  fromStr,
  toStr,
  setFromStr,
  setToStr,
  requesterType,
  setRequesterType,
  requesterTypeOptions,
  department,
  setDepartment,
  departmentOptions,
  requestType,
  setRequestType,
  requestTypeOptions,
  statuses,
  setStatuses,
  handledBy,
  setHandledBy,
  handledByOptions,
}) {
  const inputBase = isDarkMode
    ? "bg-slate-950/40 text-slate-200 border-slate-800"
    : "bg-slate-50 text-[#1D4477] border-slate-200";

  return (
    <div className={`p-2 rounded-2xl ${surfaceCard} grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2`}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isDarkMode ? "bg-slate-950/40" : "bg-slate-50"}`}>
        <span className={`text-[10px] font-black uppercase tracking-widest ${muted} whitespace-nowrap`}>Period:</span>
        <div className="flex gap-1.5 w-full">
          {["7d", "month", "quarter", "ytd", "custom"].map((p) => (
            <button
              key={p}
              onClick={() => setRangePreset(p)}
              className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${chip(rangePreset === p)}`}
              title={p}
            >
              {p === "7d" ? "7D" : p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isDarkMode ? "bg-slate-950/40" : "bg-slate-50"}`}>
        <span className={`text-[10px] font-black uppercase tracking-widest ${muted} whitespace-nowrap`}>From:</span>
        <input
          type="date"
          value={fromStr}
          onChange={(e) => setFromStr(e.target.value)}
          className={`w-full text-sm font-bold outline-none cursor-pointer border rounded-xl px-3 py-2 ${inputBase}`}
        />
      </div>

      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isDarkMode ? "bg-slate-950/40" : "bg-slate-50"}`}>
        <span className={`text-[10px] font-black uppercase tracking-widest ${muted} whitespace-nowrap`}>To:</span>
        <input
          type="date"
          value={toStr}
          onChange={(e) => setToStr(e.target.value)}
          className={`w-full text-sm font-bold outline-none cursor-pointer border rounded-xl px-3 py-2 ${inputBase}`}
        />
      </div>

      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isDarkMode ? "bg-slate-950/40" : "bg-slate-50"}`}>
        <span className={`text-[10px] font-black uppercase tracking-widest ${muted} whitespace-nowrap`}>Type:</span>
        <select
          value={requesterType}
          onChange={(e) => setRequesterType(e.target.value)}
          className={`w-full bg-transparent text-sm font-bold outline-none cursor-pointer ${isDarkMode ? "text-slate-200" : "text-[#1D4477]"}`}
        >
          {requesterTypeOptions.map((opt) => (
            <option key={opt} value={opt} className={isDarkMode ? "bg-slate-900" : "bg-white"}>
              {opt === "all" ? "All Requester Types" : opt.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isDarkMode ? "bg-slate-950/40" : "bg-slate-50"}`}>
        <span className={`text-[10px] font-black uppercase tracking-widest ${muted} whitespace-nowrap`}>Dept:</span>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className={`w-full bg-transparent text-sm font-bold outline-none cursor-pointer ${isDarkMode ? "text-slate-200" : "text-[#1D4477]"}`}
        >
          {departmentOptions.map((opt) => (
            <option key={opt} value={opt} className={isDarkMode ? "bg-slate-900" : "bg-white"}>
              {opt === "all" ? "All Departments" : opt}
            </option>
          ))}
        </select>
      </div>

      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isDarkMode ? "bg-slate-950/40" : "bg-slate-50"}`}>
        <span className={`text-[10px] font-black uppercase tracking-widest ${muted} whitespace-nowrap`}>Req:</span>
        <select
          value={requestType}
          onChange={(e) => setRequestType(e.target.value)}
          className={`w-full bg-transparent text-sm font-bold outline-none cursor-pointer ${isDarkMode ? "text-slate-200" : "text-[#1D4477]"}`}
        >
          {requestTypeOptions.map((opt) => (
            <option key={opt} value={opt} className={isDarkMode ? "bg-slate-900" : "bg-white"}>
              {opt === "all" ? "All Request Types" : opt}
            </option>
          ))}
        </select>
      </div>

      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isDarkMode ? "bg-slate-950/40" : "bg-slate-50"}`}>
        <span className={`text-[10px] font-black uppercase tracking-widest ${muted} whitespace-nowrap`}>Status:</span>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {["pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setStatuses((st) => ({ ...st, [s]: !st[s] }))}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${chip(statuses[s])}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className={`md:col-span-2 xl:col-span-1 flex items-center gap-3 px-4 py-3 rounded-xl ${isDarkMode ? "bg-slate-950/40" : "bg-slate-50"}`}>
        <span className={`text-[10px] font-black uppercase tracking-widest ${muted} whitespace-nowrap`}>Admin:</span>
        <select
          value={handledBy}
          onChange={(e) => setHandledBy(e.target.value)}
          className={`w-full bg-transparent text-sm font-bold outline-none cursor-pointer ${isDarkMode ? "text-slate-200" : "text-[#1D4477]"}`}
        >
          {handledByOptions.map((opt) => (
            <option key={opt} value={opt} className={isDarkMode ? "bg-slate-900" : "bg-white"}>
              {opt === "all" ? "All Handlers" : opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}