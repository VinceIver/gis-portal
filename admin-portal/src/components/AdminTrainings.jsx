import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Calendar,
  MapPin,
  Target,
  Plus,
  Users,
  X,
  Loader2,
  UserCheck,
  Pencil,
} from "lucide-react";
import { api } from "../services/api";

export default function AdminTrainings({
  isModalOpen,
  setIsModalOpen,
  isRemoveMode,
  isDarkMode, 
}) {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Registration viewer state
  const [viewingRegistrations, setViewingRegistrations] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [fetchingAttendees, setFetchingAttendees] = useState(false);

  // EDIT state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTraining, setEditingTraining] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    objectives: "",
    datetime: "",
    location: "",
    capacity: "",
  });

  const formatDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const toDatetimeLocalValue = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const resetForm = () => {
    setFormData({
      title: "",
      objectives: "",
      datetime: "",
      location: "",
      capacity: "",
    });
    setIsEditMode(false);
    setEditingTraining(null);
  };

  const loadTrainings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/trainings");
      const rows = Array.isArray(data) ? data : data?.rows || [];
      setTrainings(rows);
    } catch (err) {
      console.error("Error loading trainings:", err);
      setTrainings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainings();
  }, []);

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (training) => {
    const when =
      training.training_datetime ||
      training.datetime ||
      training.training_date ||
      training.date;

    setIsEditMode(true);
    setEditingTraining(training);

    setFormData({
      title: String(training.title || "").toUpperCase(),
      objectives: String(training.objectives || ""),
      datetime: toDatetimeLocalValue(when),
      location: String(training.location || ""),
      capacity: String(training.capacity ?? ""),
    });

    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: String(formData.title || "").trim(),
        objectives: String(formData.objectives || "").trim(),
        datetime: formData.datetime,
        location: String(formData.location || "").trim(),
        capacity: Number(formData.capacity),
      };

      if (isEditMode && editingTraining?.id) {
        await api.patch(`/api/trainings/${editingTraining.id}`, payload);
      } else {
        await api.post("/api/trainings", payload);
      }

      setIsModalOpen(false);
      resetForm();
      loadTrainings();
    } catch (err) {
      console.error(isEditMode ? "Edit training error:" : "Add training error:", err?.response?.data || err);
      alert(err?.response?.data?.message || (isEditMode ? "Failed to update training" : "Failed to add training"));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to cancel and remove this training session?")) return;
    try {
      await api.delete(`/api/trainings/${id}`);
      loadTrainings();
    } catch (err) {
      console.error(err);
      alert("Error deleting training");
    }
  };

  const handleViewRegistrations = async (training) => {
    if (isRemoveMode) return;
    setViewingRegistrations(training);
    setAttendees([]);
    setFetchingAttendees(true);
    try {
      const { data } = await api.get(`/api/trainings/${training.id}/attendees`);
      setAttendees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch attendees error:", err);
      setAttendees([]);
    } finally {
      setFetchingAttendees(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className={`col-span-full text-center py-20 font-black animate-pulse uppercase tracking-widest ${isDarkMode ? "text-slate-700" : "text-gray-400"}`}>
            Fetching GIS Trainings...
          </div>
        ) : (
          <AnimatePresence>
            {trainings.map((t, i) => {
              const attendeesCount = t.attendees_count ?? t.attendees ?? 0;
              const when = t.training_datetime || t.datetime || t.training_date || t.date;
              const capacity = Number(t.capacity ?? 0) || 0;
              const pct = Math.min((attendeesCount / (capacity || 1)) * 100, 100);

              return (
                <motion.div
                  key={t.id || i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                  onClick={() => handleViewRegistrations(t)}
                  className={`rounded-[2rem] p-6 shadow-sm border relative overflow-hidden transition-all cursor-pointer ${
                    isDarkMode 
                      ? `bg-slate-900 border-slate-800 ${isRemoveMode ? "ring-2 ring-red-900/50" : "hover:shadow-2xl hover:border-red-900/30"}` 
                      : `bg-white border-gray-100 ${isRemoveMode ? "ring-2 ring-red-100" : "hover:shadow-xl hover:border-[#1D4477]"}`
                  }`}
                >
                  <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                    {!isRemoveMode && (
                      <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(t);
                        }}
                        className={`p-2.5 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform border ${
                          isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-gray-200 text-gray-700"
                        }`}
                        title="Edit training"
                      >
                        <Pencil size={16} />
                      </motion.button>
                    )}

                    <AnimatePresence>
                      {isRemoveMode && (
                        <motion.button
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(t.id);
                          }}
                          className="bg-[#FF0000] text-white p-2.5 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform"
                          title="Delete training"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className={`${isDarkMode ? "bg-slate-950/50" : "bg-[#1D4477]"} -mx-6 -mt-6 p-6 mb-6 border-b ${isDarkMode ? "border-slate-800" : "border-transparent"}`}>
                    <h3 className="text-white font-black text-sm uppercase tracking-widest leading-tight">
                      {t.title || "GIS Training"}
                    </h3>
                  </div>

                  <div className="space-y-4 text-[12px]">
                    <div className="flex gap-3">
                      <Target size={14} className="text-[#FF0000] shrink-0 mt-1" />
                      <div className="flex-1">
                        <span className={`font-black text-[9px] uppercase block mb-1 ${isDarkMode ? "text-slate-600" : "text-gray-400"}`}>
                          Objectives
                        </span>
                        <p className={`${isDarkMode ? "text-slate-400" : "text-gray-600"} line-clamp-2`}>
                          {t.objectives}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar size={14} className={isDarkMode ? "text-slate-600" : "text-[#1D4477]"} />
                      <p className={`font-bold ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}>
                        {formatDateTime(when)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin size={14} className={isDarkMode ? "text-slate-600" : "text-[#1D4477]"} />
                      <p className={`font-bold ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}>{t.location}</p>
                    </div>

                    <div className="pt-2">
                      <div className={`w-full h-2 rounded-full overflow-hidden mt-4 ${isDarkMode ? "bg-slate-800" : "bg-gray-100"}`}>
                        <div
                          className="bg-[#FF0000] h-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <span className="flex items-center gap-1 text-[#FF0000] font-black text-[9px] uppercase tracking-widest">
                          <Users size={10} />
                          View List
                        </span>

                        <p className={`font-black text-[9px] uppercase tracking-widest ${isDarkMode ? "text-slate-600" : "text-gray-400"}`}>
                          {attendeesCount} / {capacity} Seats
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Attendees Modal */}
      <AnimatePresence>
        {viewingRegistrations && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingRegistrations(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border ${
                isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-transparent"
              }`}
            >
              <div className={`${isDarkMode ? "bg-slate-800" : "bg-[#1D4477]"} p-8 text-white relative`}>
                <button
                  onClick={() => setViewingRegistrations(null)}
                  className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF0000] mb-2">
                  Registered Attendees
                </p>
                <h3 className="text-xl font-black leading-tight uppercase">
                  {viewingRegistrations.title}
                </h3>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto">
                {fetchingAttendees ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 className="animate-spin text-[#FF0000]" size={32} />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Loading Records...
                    </p>
                  </div>
                ) : attendees.length > 0 ? (
                  <div className="space-y-3">
                    {attendees.map((person, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
                          isDarkMode ? "bg-slate-950/50 border-slate-800" : "bg-gray-50 border-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white bg-[#FF0000]`}>
                            <UserCheck size={16} />
                          </div>
                          <p className={`font-bold text-sm ${isDarkMode ? "text-slate-300" : "text-gray-800"}`}>
                            {person.registrant_name}
                          </p>
                        </div>
                        <span className={`text-[10px] font-black ${isDarkMode ? "text-slate-700" : "text-gray-300"}`}>
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Users size={40} className={`mx-auto mb-3 ${isDarkMode ? "text-slate-800" : "text-gray-200"}`} />
                    <p className={`text-sm font-bold ${isDarkMode ? "text-slate-600" : "text-gray-400"}`}>
                      No students registered yet.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 backdrop-blur-md z-[100] flex items-center justify-center p-4 ${isDarkMode ? "bg-slate-950/90" : "bg-[#1D4477]/60"}`}
            onClick={() => {
              setIsModalOpen(false);
              resetForm();
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`rounded-[2.5rem] w-full max-w-lg p-10 relative shadow-2xl border ${
                isDarkMode ? "bg-slate-900 border-slate-800" : "bg-[#1D4477] border-white/10"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="absolute top-8 right-10 text-white/50 hover:text-white transition-colors"
              >
                ✕
              </button>

              <div className="text-center mb-8">
                <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg transition-colors ${isDarkMode ? "bg-slate-800" : "bg-white"}`}>
                  {isEditMode ? (
                    <Pencil className={isDarkMode ? "text-[#FF0000]" : "text-[#1D4477]"} size={30} strokeWidth={3} />
                  ) : (
                    <Plus className={isDarkMode ? "text-[#FF0000]" : "text-[#1D4477]"} size={32} strokeWidth={3} />
                  )}
                </div>

                <h2 className="text-white font-black tracking-widest text-xs uppercase">
                  {isEditMode ? "Edit Training Session" : "Configure Training Session"}
                </h2>

                {isEditMode && (
                  <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mt-2">
                    Updating: {editingTraining?.title}
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <p className="ml-2 font-black text-[9px] text-white/40 uppercase tracking-widest">
                    Training Title
                  </p>
                  <input
                    required
                    placeholder="E.G. GIS ADVANCED COURSE"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm font-bold placeholder:text-white/20 focus:ring-2 focus:ring-[#FF0000] outline-none transition-all"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        title: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <p className="ml-2 font-black text-[9px] text-white/40 uppercase tracking-widest">
                    Objectives
                  </p>
                  <textarea
                    required
                    placeholder="DESCRIBE GOALS..."
                    rows="3"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm font-bold placeholder:text-white/20 focus:ring-2 focus:ring-[#FF0000] outline-none transition-all"
                    value={formData.objectives}
                    onChange={(e) =>
                      setFormData({ ...formData, objectives: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="ml-2 font-black text-[9px] text-white/40 uppercase tracking-widest">
                      Date & Time
                    </p>
                    <input
                      type="datetime-local"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm font-bold focus:ring-2 focus:ring-[#FF0000] outline-none"
                      value={formData.datetime}
                      onChange={(e) =>
                        setFormData({ ...formData, datetime: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <p className="ml-2 font-black text-[9px] text-white/40 uppercase tracking-widest">
                      Max Capacity
                    </p>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm font-bold placeholder:text-white/20 focus:ring-2 focus:ring-[#FF0000] outline-none"
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData({ ...formData, capacity: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="ml-2 font-black text-[9px] text-white/40 uppercase tracking-widest">
                    Location
                  </p>
                  <input
                    required
                    placeholder="VENUE OR LINK"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm font-bold placeholder:text-white/20 focus:ring-2 focus:ring-[#FF0000] outline-none"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#FF0000] text-white font-black py-4 rounded-xl mt-6 shadow-[0_5px_20px_rgba(255,0,0,0.3)] uppercase tracking-widest text-[10px] hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  {isEditMode ? "Save Changes" : "Publish to Portal"}
                </button>

                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="w-full bg-white/10 text-white font-black py-3 rounded-xl uppercase tracking-widest text-[10px] hover:bg-white/15 active:scale-[0.98] transition-all"
                  >
                    Cancel Editing
                  </button>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}