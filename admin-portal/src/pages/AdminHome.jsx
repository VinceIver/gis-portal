import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  LogOut,
  LayoutDashboard,
  Moon,
  Sun,
  Users,
  BookOpen,
  FileStack,
} from "lucide-react";

import AdminTrainings from "../components/AdminTrainings";
import Tooltip from "../components/Tooltip";
import RequestsPanel from "../components/RequestPanel";
import AdminDashboard from "../components/AdminDashboard";
import AdminConsultations from "../components/AdminConsultations";
import AdminResources from "../components/AdminResources";
import { api } from "../services/api";

export default function AdminHome() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("DASHBOARD");
  const [statusTab, setStatusTab] = useState("PENDING");
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [isRemoveMode, setIsRemoveMode] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("admin_theme") === "dark";
  });

  const tabIcons = {
    DASHBOARD: <LayoutDashboard size={20} />,
    CONSULTATIONS: <Users size={20} />,
    TRAININGS: <BookOpen size={20} />,
    RESOURCES: <FileStack size={20} />,
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newVal = !prev;
      localStorage.setItem("admin_theme", newVal ? "dark" : "light");
      return newVal;
    });
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    delete api.defaults.headers.common.Authorization;
    navigate("/", { replace: true });
  };

  // Resources now has its own admin component, so no need to map it to RequestsPanel
  const typeMap = {
    CONSULTATIONS: "consultation",
  };

  const tabs = ["DASHBOARD", "CONSULTATIONS", "TRAININGS", "RESOURCES"];
  const statuses = ["PENDING", "APPROVED", "REJECTED"];

  return (
    <div
      className={`flex flex-col md:flex-row h-screen font-sans overflow-hidden transition-colors duration-300 ${
        isDarkMode
          ? "bg-[#020617] text-slate-200"
          : "bg-[#F1F5F9] text-[#1D4477]"
      }`}
    >
      {/* Sidebar */}
      <aside
        className={`w-72 flex flex-col shrink-0 hidden md:flex transition-colors duration-300 ${
          isDarkMode
            ? "bg-[#0f172a] border-r border-slate-800"
            : "bg-[#1D4477]"
        }`}
      >
        <div
          className={`p-8 flex items-center gap-4 border-b ${
            isDarkMode ? "border-white/5" : "border-white/10"
          }`}
        >
          <img
            src="/logo.jpg"
            alt="Logo"
            className="w-12 h-12 rounded-full border-2 border-white shadow-inner"
          />
          <div>
            <h1 className="text-white font-black text-lg tracking-tight leading-none">
              GIS ADC
            </h1>
            <p className="text-white text-xs font-bold tracking-widest uppercase opacity-80">
              GIS Applications Development Center
            </p>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-3 mt-4">
          {tabs.map((tab) => (
            <motion.button
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setIsRemoveMode(false);
              }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl font-bold text-sm tracking-wide transition-all ${
                activeTab === tab
                  ? "bg-[#FF0000] text-white shadow-lg"
                  : isDarkMode
                  ? "text-slate-400 hover:bg-white/5 hover:text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tabIcons[tab]}
              {tab}
            </motion.button>
          ))}
        </nav>

        <div
          className={`p-6 border-t ${
            isDarkMode ? "border-white/5" : "border-white/10"
          }`}
        >
          <button
            onClick={logout}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl text-sm font-bold transition-colors uppercase tracking-widest ${
              isDarkMode
                ? "text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                : "text-white hover:bg-white/10"
            }`}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header
          className={`h-20 flex items-center justify-between px-6 md:px-10 shrink-0 z-10 transition-colors duration-300 border-b ${
            isDarkMode
              ? "bg-[#0f172a]/50 backdrop-blur-md border-slate-800"
              : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center gap-4 md:gap-6">
            <h2
              className={`font-black text-sm md:text-lg tracking-widest uppercase truncate ${
                isDarkMode ? "text-white" : "text-[#1D4477]"
              }`}
            >
              {activeTab}
            </h2>

            <div
              className={`h-6 w-[2px] hidden sm:block ${
                isDarkMode ? "bg-slate-800" : "bg-slate-100"
              }`}
            />

            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition-all ${
                isDarkMode
                  ? "bg-slate-800 text-yellow-400 hover:bg-slate-700"
                  : "bg-slate-100 text-[#1D4477] hover:bg-slate-200"
              }`}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <AnimatePresence mode="wait">
              {activeTab === "TRAININGS" ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex gap-2"
                >
                  <button
                    onClick={() => setIsTrainingModalOpen(true)}
                    className="flex items-center gap-2 bg-[#FF0000] text-white font-bold px-3 py-2 md:px-6 md:py-2.5 rounded-lg text-[10px] md:text-xs tracking-widest uppercase shadow-md active:scale-95 transition-transform"
                  >
                    <Plus size={16} />{" "}
                    <span className="hidden sm:inline">Add New</span>
                  </button>

                  <button
                    onClick={() => setIsRemoveMode(!isRemoveMode)}
                    className={`px-3 py-2 md:px-6 md:py-2.5 rounded-lg text-[10px] md:text-xs font-bold tracking-widest uppercase transition-colors border-2 ${
                      isRemoveMode
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-transparent text-[#FF0000] border-[#FF0000]"
                    }`}
                  >
                    {isRemoveMode ? "Done" : "Remove"}
                  </button>
                </motion.div>
              ) : activeTab === "DASHBOARD" ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex gap-1 p-1 md:p-1.5 rounded-lg md:rounded-xl border transition-colors ${
                    isDarkMode
                      ? "bg-slate-900 border-slate-800"
                      : "bg-slate-100 border-slate-200"
                  }`}
                >
                  {statuses.map((s) => (
                    <Tooltip key={s} text={s} dark={isDarkMode}>
                      <button
                        onClick={() => setStatusTab(s)}
                        className={`px-3 py-1.5 md:px-6 md:py-2 rounded-md md:rounded-lg font-bold text-[10px] transition-all ${
                          statusTab === s
                            ? isDarkMode
                              ? "bg-slate-800 text-white shadow-md border border-white/5"
                              : "bg-[#1D4477] text-white shadow-md"
                            : isDarkMode
                            ? "text-slate-500 hover:text-slate-300"
                            : "text-slate-500 hover:text-[#1D4477]"
                        }`}
                      >
                        <span className="hidden sm:inline">{s}</span>
                        <span className="sm:hidden">{s.substring(0, 3)}</span>
                      </button>
                    </Tooltip>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-24 md:pb-10">
          {activeTab === "DASHBOARD" ? (
            <AdminDashboard isDarkMode={isDarkMode} />
          ) : activeTab === "TRAININGS" ? (
            <AdminTrainings
              isDarkMode={isDarkMode}
              isModalOpen={isTrainingModalOpen}
              setIsModalOpen={setIsTrainingModalOpen}
              isRemoveMode={isRemoveMode}
            />
          ) : activeTab === "CONSULTATIONS" ? (
            <AdminConsultations statusTab={statusTab} isDarkMode={isDarkMode} />
          ) : activeTab === "RESOURCES" ? (
            <AdminResources statusTab={statusTab} isDarkMode={isDarkMode} />
          ) : (
            <RequestsPanel
              type={typeMap[activeTab] || "consultation"}
              statusTab={statusTab}
              isDarkMode={isDarkMode}
            />
          )}
        </div>

        {/* Mobile Nav */}
        <nav
          className={`md:hidden fixed bottom-0 left-0 right-0 border-t px-6 py-4 flex justify-around items-center z-30 transition-colors ${
            isDarkMode
              ? "bg-[#0f172a] border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
              : "bg-[#1D4477] border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]"
          }`}
        >
          {tabs.map((tab) => (
            <Tooltip key={tab} text={tab} dark={isDarkMode}>
              <button
                onClick={() => {
                  setActiveTab(tab);
                  setIsRemoveMode(false);
                }}
                className={`flex flex-col items-center gap-1 transition-all ${
                  activeTab === tab
                    ? "text-white"
                    : isDarkMode
                    ? "text-slate-600"
                    : "text-white/40"
                }`}
              >
                {tabIcons[tab]}
                <span className="text-[8px] font-black uppercase tracking-widest">
                  {tab.substring(0, 4)}
                </span>
              </button>
            </Tooltip>
          ))}

          <button
            onClick={logout}
            className="flex flex-col items-center gap-1 text-red-500"
          >
            <LogOut size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">
              EXIT
            </span>
          </button>
        </nav>
      </main>
    </div>
  );
}