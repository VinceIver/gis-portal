import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  X,
  Loader2,
  Users,
  GraduationCap,
  Info,
} from "lucide-react";
import { api } from "../services/api";

const anim = {
  container: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  },
  card: {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 260, damping: 22 },
    },
  },
};

export default function TrainingsPage() {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedTraining, setSelectedTraining] = useState(null);
  const [registrantName, setRegistrantName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const loadTrainings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/trainings");
      setTrainings(Array.isArray(data) ? data : data?.rows || []);
    } catch {
      setTrainings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrainings();
  }, [loadTrainings]);

  const formatDateTime = (t) => {
    const raw =
      t?.training_datetime ||
      t?.datetime ||
      t?.date_time ||
      t?.date ||
      t?.schedule;
    if (!raw) return "TBA";
    const d = new Date(raw);
    return isNaN(d.getTime())
      ? "TBA"
      : d.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
  };

  const getSeatData = (t) => {
    const cap = Number(t?.capacity ?? 0);
    const filled = Number(t?.attendees_count ?? t?.attendees ?? 0);
    return { cap, filled, isFull: cap > 0 && filled >= cap };
  };

  const closeModal = () => {
    if (submitting) return;
    setSelectedTraining(null);
    setRegistrantName("");
    setErrMsg("");
  };

  const submitRegistration = async () => {
    const name = registrantName.trim();
    if (!name) return setErrMsg("Please enter your name.");

    const { isFull } = getSeatData(selectedTraining);
    if (isFull) return setErrMsg("Training is already full.");

    setSubmitting(true);
    setErrMsg("");
    try {
      const { data } = await api.post(
        `/api/trainings/${selectedTraining.id}/register`,
        { name }
      );

      setTrainings((prev) =>
        prev.map((tr) =>
          tr.id === selectedTraining.id
            ? { ...tr, attendees_count: data.attendees_count }
            : tr
        )
      );

      alert("Registered successfully!");
      closeModal();
    } catch (err) {
      setErrMsg(err?.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && selectedTraining && closeModal();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [selectedTraining, submitting]);

  const headerStats = useMemo(() => {
    const total = trainings.length;
    const full = trainings.filter((t) => getSeatData(t).isFull).length;
    const open = Math.max(total - full, 0);
    return { total, open, full };
  }, [trainings]);

  if (loading) {
    return (
      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-100 p-8 md:p-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shadow-lg">
            <Loader2 className="animate-spin" size={18} />
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-300">
              Loading
            </div>
            <div className="text-lg font-black tracking-tight text-[#0F172A] leading-none">
              Trainings
            </div>
          </div>
        </div>
        <div className="mt-6 h-2 w-40 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-red-600/30 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* HEADER CARD */}
      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden mb-6 md:mb-10">
        <div className="px-6 pt-6 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shadow-lg">
              <GraduationCap size={18} />
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-300">
                Workshops
              </div>
              <div className="text-lg font-black tracking-tight text-[#0F172A] leading-none">
                Available <span className="text-red-600">Training/s</span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-slate-500 text-[11px] md:text-sm font-medium max-w-2xl">
            Browse upcoming trainings and register. Slots update automatically after you enroll.
          </div>
        </div>

        <div className="px-6 py-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <div className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-400">
              Total
            </div>
            <div className="text-xl md:text-2xl font-black text-[#0F172A] mt-1">
              {headerStats.total}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <div className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-400">
              Open
            </div>
            <div className="text-xl md:text-2xl font-black text-[#0F172A] mt-1">
              {headerStats.open}
            </div>
          </div>
          <div className="rounded-2xl bg-red-50 border border-red-100 p-4">
            <div className="text-[9px] font-black uppercase tracking-[0.35em] text-red-600">
              Full
            </div>
            <div className="text-xl md:text-2xl font-black text-[#0F172A] mt-1">
              {headerStats.full}
            </div>
          </div>
        </div>
      </div>

      {/* GRID */}
      {trainings.length === 0 ? (
        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-100 p-10 md:p-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 mx-auto flex items-center justify-center text-slate-400">
            <Info size={22} />
          </div>
          <h3 className="mt-5 text-xl font-black text-[#0F172A] uppercase">
            No trainings yet
          </h3>
          <p className="text-slate-500 text-sm mt-2">
            When the admin posts trainings, they will appear here.
          </p>
        </div>
      ) : (
        <motion.div
          variants={anim.container}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6"
        >
          {trainings.map((t) => {
            const { cap, filled, isFull } = getSeatData(t);

            return (
              <motion.div
                key={t.id}
                variants={anim.card}
                className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden"
              >
                <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-red-600/5 blur-2xl" />
                <div className="absolute -left-20 -bottom-24 w-72 h-72 rounded-full bg-[#0F172A]/5 blur-2xl" />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-black text-[#0F172A] leading-snug">
                      {t.title}
                    </h3>

                    <span
                      className={`shrink-0 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                        isFull
                          ? "bg-red-50 text-red-600 border-red-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-100"
                      }`}
                    >
                      {cap ? (isFull ? "FULL" : "OPEN") : "OPEN"}
                    </span>
                  </div>

                  <p className="text-slate-600 text-[12px] leading-relaxed mt-3 line-clamp-3">
                    “{t.objectives || "View details for training objectives."}”
                  </p>

                  <div className="mt-6 space-y-3 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-slate-400 text-[9px] font-black uppercase tracking-[0.35em]">
                        <Calendar size={14} className="text-red-600" />
                        Date
                      </span>
                      <span className="text-[#0F172A] font-bold text-xs bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl whitespace-nowrap">
                        {formatDateTime(t)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-slate-400 text-[9px] font-black uppercase tracking-[0.35em]">
                        <MapPin size={14} className="text-red-600" />
                        Venue
                      </span>
                      <span className="text-slate-700 font-semibold text-xs truncate max-w-[170px] text-right">
                        {t.location || "TBA"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-slate-400 text-[9px] font-black uppercase tracking-[0.35em]">
                        <Users size={14} className="text-red-600" />
                        Seats
                      </span>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-xl border ${
                          cap && isFull
                            ? "bg-red-50 text-red-600 border-red-100"
                            : cap
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {cap ? `${filled}/${cap}` : "Unlimited"}
                      </span>
                    </div>
                  </div>

                  <button
                    disabled={isFull}
                    onClick={() => setSelectedTraining(t)}
                    className={`mt-7 w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl transition active:scale-[0.99] ${
                      isFull
                        ? "bg-slate-200 text-slate-500 cursor-not-allowed shadow-none"
                        : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20"
                    }`}
                  >
                    {isFull ? "Training Full" : "Register Now"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* MODAL */}
      <AnimatePresence>
        {selectedTraining && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sm:hidden w-12 h-1 bg-slate-200 rounded-full mx-auto mt-4" />

              <div className="px-6 pt-6 pb-5 border-b border-slate-100 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shadow-lg">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-300">
                      Enrollment
                    </div>
                    <div className="text-lg font-black tracking-tight text-[#0F172A] leading-tight">
                      {selectedTraining.title}
                    </div>
                  </div>
                </div>

                <button
                  onClick={closeModal}
                  disabled={submitting}
                  className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 transition flex items-center justify-center"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Schedule</span>
                    <span className="text-[#0F172A]">
                      {formatDateTime(selectedTraining)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mt-2">
                    <span className="text-slate-400">Status</span>
                    <span
                      className={
                        getSeatData(selectedTraining).isFull
                          ? "text-red-600"
                          : "text-emerald-700"
                      }
                    >
                      {getSeatData(selectedTraining).cap
                        ? `${Math.max(
                            getSeatData(selectedTraining).cap -
                              getSeatData(selectedTraining).filled,
                            0
                          )} slots left`
                        : "Registration Open"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[9px] font-black uppercase tracking-[0.35em] text-slate-400">
                    Full Name
                  </label>
                  <input
                    autoFocus
                    value={registrantName}
                    onChange={(e) => setRegistrantName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-4 text-sm font-semibold outline-none focus:ring-4 focus:ring-red-600/10 focus:border-red-600 transition"
                  />
                </div>

                {errMsg && (
                  <div className="text-sm font-semibold text-red-700 bg-red-50 p-4 rounded-2xl border border-red-100">
                    {errMsg}
                  </div>
                )}
              </div>

              <div className="px-6 pb-8 sm:pb-6 flex gap-3">
                <button
                  disabled={submitting}
                  onClick={closeModal}
                  className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-700 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting}
                  onClick={submitRegistration}
                  className="flex-1 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] transition flex items-center justify-center gap-2 shadow-2xl shadow-red-600/20 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Submitting
                    </>
                  ) : (
                    "Confirm"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}