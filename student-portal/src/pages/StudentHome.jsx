import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  GraduationCap,
  FolderOpen,
  Search,
  ArrowLeft,
} from "lucide-react";

import SubmitRequest from "./SubmitRequests";
import SuccessModal from "../components/SuccessModal";
import TrainingsPage from "../components/TrainingsPage";
import TrackRequests from "../components/TrackRequests";
import Resources from "../components/Resources";

const anim = {
  container: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  },
  card: {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 260, damping: 20 },
    },
  },
};

export default function StudentHome() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("CONSULTATIONS");
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [successCode, setSuccessCode] = useState(null);

  const tabs = [
    { id: "CONSULTATIONS", label: "Consultation", Icon: ClipboardList },
    { id: "TRAININGS", label: "Training", Icon: GraduationCap },
    { id: "RESOURCES", label: "Resources", Icon: FolderOpen },
    { id: "TRACK", label: "Track Status", Icon: Search },
  ];

  const titleMap = {
    CONSULTATIONS: { a: "Technical", b: "Consultation" },
    TRAININGS: { a: "Available", b: "Training/s" },
    RESOURCES: { a: "Resource", b: "Request" },
    TRACK: { a: "Track", b: "Request" },
  };

  const subMap = {
    TRACK: "View real-time updates on your active requests.",
    default:
      "Access your GIS technical services and academic resources in one place.",
  };

  const NavItem = ({ Icon, label, id, mobile = false }) => {
    const isActive = activeTab === id;

    if (mobile) {
      return (
        <button
          onClick={() => setActiveTab(id)}
          className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${
            isActive ? "text-red-500" : "text-slate-400"
          }`}
        >
          <Icon size={18} />
          <span className="text-[8px] font-black uppercase tracking-widest mt-1">
            {label}
          </span>
          {isActive && (
            <motion.div
              layoutId="mobileDot"
              className="w-1 h-1 bg-red-500 rounded-full mt-1"
            />
          )}
        </button>
      );
    }

    return (
      <button
        onClick={() => setActiveTab(id)}
        className="relative flex items-center gap-2 px-6 py-4 rounded-xl transition-all shrink-0"
      >
        <span
          className={`transition-colors ${
            isActive ? "text-red-500" : "text-slate-400"
          }`}
        >
          <Icon size={18} />
        </span>
        <span
          className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
            isActive ? "text-white" : "text-slate-400"
          }`}
        >
          {label}
        </span>
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 shadow-[0_-4px_12px_rgba(220,38,38,0.5)] hidden md:block"
          />
        )}
      </button>
    );
  };

  const t = titleMap[activeTab] || titleMap.CONSULTATIONS;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex flex-col">
      {/* TOP BAR */}
      <nav className="fixed w-full top-0 z-50 bg-[#0F172A] border-b border-white/10 shadow-2xl h-16 md:h-20 flex items-center">
        <div className="max-w-7xl mx-auto px-4 md:px-8 w-full flex justify-between items-center text-white">
          <div className="flex items-center gap-3 sm:gap-4 group shrink overflow-hidden">
            <div className="relative flex-shrink-0 transition-transform duration-500 group-hover:scale-105">
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-red-600/30 to-red-400/10 rounded-full blur-md group-hover:opacity-100 transition duration-500 opacity-40" />
              <img
                src="/GIS LOGO.jpg"
                alt="GADC Logo"
                className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-full object-cover border-2 border-white/20 shadow-lg"
              />
            </div>
            <div className="flex flex-col text-left truncate">
              <span className="text-sm sm:text-lg md:text-xl font-black tracking-tighter uppercase leading-none text-white">
                GIS Applications Development Center
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] text-red-500 mt-1">
                Batangas State University - TNEU
              </span>
            </div>
          </div>

          {/* BACK BUTTON */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest transition"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>
      </nav>

      {/* DESKTOP TABS */}
      <div className="hidden md:block pt-20 bg-[#0F172A] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 flex justify-start">
          <div className="flex gap-4 py-2">
            {tabs.map((tab) => (
              <NavItem
                key={tab.id}
                Icon={tab.Icon}
                label={tab.label}
                id={tab.id}
              />
            ))}
          </div>
        </div>
      </div>

      {/* HERO */}
      <div className="pt-20 md:pt-0 py-10 md:py-16 bg-[#0F172A] text-center shrink-0">
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-white text-center">
          <motion.h2
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-6xl font-black uppercase tracking-tighter leading-none"
          >
            {t.a} <span className="text-red-600">{t.b}</span>
          </motion.h2>
          <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] mt-4 md:mt-6 opacity-80">
            Official Technical Service Portal
          </p>
        </div>
      </div>

      {/* MAIN */}
      <main className="px-4 md:px-8 py-10 md:py-16 pb-24 md:pb-10 flex-grow flex items-start justify-center">
        <div className="w-full max-w-7xl">
          <header className="mb-8 md:mb-10">
            <div className="h-1 w-16 bg-red-600/60 rounded-full mb-4" />
            <p className="text-slate-500 font-medium max-w-2xl text-xs md:text-base">
              {activeTab === "TRACK" ? subMap.TRACK : subMap.default}
            </p>
          </header>

          <div className="w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={anim.container}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -10 }}
              >
                {activeTab === "CONSULTATIONS" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <motion.div
                      variants={anim.card}
                      className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl p-8 border border-slate-100 relative overflow-hidden"
                    >
                      <ClipboardList
                        className="absolute -right-10 -top-10 text-slate-50"
                        size={170}
                      />
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                          <span className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-[10px] font-black border border-red-100 uppercase tracking-widest">
                            Active Service
                          </span>
                        </div>

                        <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest mb-1">
                          System Status
                        </p>
                        <h3 className="text-[#0F172A] text-xl font-black tracking-tight">
                          Standard Consultation
                        </h3>

                        <div className="mt-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-500 text-sm font-medium">
                          Ready to accept thesis consultations or training
                          requests.
                        </div>

                        <div className="mt-6">
                          <button
                            onClick={() => setIsSubmitOpen(true)}
                            className="w-full bg-[#0F172A] hover:bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all"
                          >
                            Create Request
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}

                {activeTab === "TRACK" && <TrackRequests />}

                {activeTab === "TRAININGS" && <TrainingsPage />}

                {activeTab === "RESOURCES" && <Resources />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0F172A] border-t border-white/10 z-50 px-2 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
        <div className="flex justify-around items-center">
          {tabs.map((tab) => (
            <NavItem
              key={tab.id}
              Icon={tab.Icon}
              label={tab.label.split(" ")[0]}
              id={tab.id}
              mobile
            />
          ))}
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {isSubmitOpen && (
          <ModalShell onClose={() => setIsSubmitOpen(false)}>
            <SubmitRequest
              key="form-modal"
              isModal
              onClose={() => setIsSubmitOpen(false)}
              onSubmitted={(code) => {
                setIsSubmitOpen(false);
                setSuccessCode(code);
              }}
            />
          </ModalShell>
        )}

        {successCode && (
          <ModalShell onClose={() => setSuccessCode(null)}>
            <SuccessModal
              code={successCode}
              onClose={() => setSuccessCode(null)}
              onTrack={() => setActiveTab("TRACK")}
            />
          </ModalShell>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="bg-[#0F172A] py-12 px-4 text-center border-t border-white/5 mt-auto text-white pb-32 md:pb-12">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[9px]">
            ©2026 GIS ADC. All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
}

function ModalShell({ children, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
    >
      <motion.div
        className="w-full max-w-2xl bg-white rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl max-h-[95vh] overflow-y-auto border border-white/10"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}