import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, Phone, Building2, FileText, Calendar, Shield } from "lucide-react";
import { api } from "../services/api";

export default function SubmitRequest({ isModal = false, onClose, onSubmitted }) {
  const [loading, setLoading] = useState(false);

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const [form, setForm] = useState({
    requester_type: "student",
    requester_code: "",
    request_type: "", 
    full_name: "",
    email: "",
    contact_number: "",
    department: "",
    description: "",
    needed_date: "",
  });

  const onChange = (key) => (e) => {
    const value = e.target.value;
    setForm((s) => ({
      ...s,
      [key]: value,
      ...(key === "requester_type" && value !== "student" ? { requester_code: "" } : {}),
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.needed_date && form.needed_date < todayStr) return alert("Date cannot be in the past.");
    if (form.requester_type === "student" && !form.requester_code.trim()) return alert("SR Code is required.");

    setLoading(true);
    try {
      const payload = {
        ...form,
        request_type: String(form.request_type || "").trim(), // ✅ keep clean
        requester_code: form.requester_type === "student" ? form.requester_code : null,
        department: form.requester_type === "outsider" ? null : form.department || null,
      };

      const { data } = await api.post("/api/requests", payload);

      if (onSubmitted) onSubmitted(data?.tracking);
      else alert(`Success! Tracking Code: ${data?.tracking}`);
    } catch (err) {
      alert(err?.response?.data?.message || "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`bg-white text-slate-900 font-sans w-full flex flex-col overflow-hidden shadow-2xl ${
        isModal ? "h-[90vh] rounded-[2.5rem]" : "min-h-screen"
      }`}
    >
      {/* HEADER */}
      <header className="flex-shrink-0 bg-white border-b border-slate-100 z-20 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shadow-lg shadow-slate-200">
              <Shield size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Service Request</p>
              <h1 className="text-xl font-black tracking-tight text-[#0F172A]">Digital Form</h1>
            </div>
          </div>

          {isModal && (
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <h2 className="text-3xl font-black tracking-tighter text-[#0F172A]">
          Submit <span className="text-red-600">Request</span>
        </h2>
      </header>

      {/* SCROLLABLE BODY */}
      <motion.main layout className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar bg-slate-50/30">
        <form id="request-form" onSubmit={submit} className="max-w-3xl mx-auto space-y-8">
          {/* TYPE SELECTOR CARD */}
          <motion.div layout className="bg-[#0F172A] rounded-[2.5rem] p-6 md:p-8 text-white shadow-xl shadow-slate-900/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Requester Type</label>
                <select
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-4 text-sm font-bold outline-none focus:border-red-500 transition-colors cursor-pointer"
                  value={form.requester_type}
                  onChange={onChange("requester_type")}
                >
                  <option value="student" className="text-slate-900">Student</option>
                  <option value="faculty" className="text-slate-900">Faculty</option>
                  <option value="outsider" className="text-slate-900">Outsider</option>
                </select>
              </div>

              {/* ✅ CHANGED: Request Type select -> text input */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Request Type</label>
                <input
                  className="w-full rounded-2xl bg-white/10 border border-white/10 px-5 py-4 text-sm font-bold placeholder:text-white/20 outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                  value={form.request_type}
                  onChange={onChange("request_type")}
                  placeholder="e.g. Consultation, Training, Document Request, etc."
                  required
                />
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              {form.requester_type === "student" && (
                <motion.div
                  key="sr-code"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="pt-6 mt-6 border-t border-white/5"
                >
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Student SR Code</label>
                  <input
                    className="mt-3 w-full rounded-2xl bg-white/10 border border-white/5 px-5 py-4 text-sm font-bold placeholder:text-white/20 outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                    value={form.requester_code}
                    onChange={onChange("requester_code")}
                    placeholder="22-00000"
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* SHARED FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FieldItem icon={User} label="Full Name">
              <input
                className="w-full rounded-2xl bg-white border border-slate-200 px-5 py-4 text-sm font-bold outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/5 transition-all"
                value={form.full_name}
                onChange={onChange("full_name")}
                placeholder="Juan Dela Cruz"
                required
              />
            </FieldItem>

            <FieldItem icon={Calendar} label="Preferred Date">
              <input
                type="date"
                min={todayStr}
                className="w-full rounded-2xl bg-white border border-slate-200 px-5 py-4 text-sm font-bold outline-none focus:border-red-600 transition-all"
                value={form.needed_date}
                onChange={onChange("needed_date")}
                required
              />
            </FieldItem>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FieldItem icon={Mail} label="Email Address">
              <input
                type="email"
                className="w-full rounded-2xl bg-white border border-slate-200 px-5 py-4 text-sm font-bold outline-none focus:border-red-600 transition-all"
                value={form.email}
                onChange={onChange("email")}
                placeholder="name@email.com"
                required
              />
            </FieldItem>

            <FieldItem icon={Phone} label="Contact Number">
              <input
                className="w-full rounded-2xl bg-white border border-slate-200 px-5 py-4 text-sm font-bold outline-none focus:border-red-600 transition-all"
                value={form.contact_number}
                onChange={onChange("contact_number")}
                placeholder="09XXXXXXXXX"
              />
            </FieldItem>
          </div>

          <AnimatePresence mode="popLayout">
            {form.requester_type !== "outsider" && (
              <motion.div
                key="dept-field"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <FieldItem icon={Building2} label="Department / Office">
                  <input
                    className="w-full rounded-2xl bg-white border border-slate-200 px-5 py-4 text-sm font-bold outline-none focus:border-red-600 transition-all"
                    value={form.department}
                    onChange={onChange("department")}
                    placeholder="e.g. CICS Department"
                    required
                  />
                </FieldItem>
              </motion.div>
            )}
          </AnimatePresence>

          <FieldItem icon={FileText} label="Detailed Description">
            <textarea
              className="w-full rounded-[2rem] bg-white border border-slate-200 px-6 py-5 text-sm font-bold outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/5 transition-all min-h-[150px] resize-none"
              value={form.description}
              onChange={onChange("description")}
              placeholder="Please describe your request in detail..."
              required
            />
          </FieldItem>
        </form>
      </motion.main>

      {/* STICKY FOOTER */}
      <footer className="flex-shrink-0 p-8 bg-white border-t border-slate-50">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          <motion.button
            type="submit"
            form="request-form"
            whileHover={{ scale: 1.01, backgroundColor: "#b91c1c" }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full py-5 rounded-2xl bg-red-600 text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-red-200 disabled:opacity-50 transition-all"
          >
            {loading ? "Processing Submission..." : "Complete Request"}
          </motion.button>

          {isModal && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Go Back / Cancel
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

function FieldItem({ icon: Icon, label, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 ml-1">
        <div className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center">
          <Icon size={12} className="text-red-600" />
        </div>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</label>
      </div>
      {children}
    </div>
  );
}