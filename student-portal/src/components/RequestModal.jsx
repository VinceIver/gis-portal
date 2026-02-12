import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, PackagePlus, Send, Loader2, CheckCircle2, Copy, ClipboardCheck } from "lucide-react";
import { api } from "../services/api";

export default function RequestModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState("FORM");
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    requester_type: "STUDENT",
    full_name: "",
    sr_code: "",
    email: "",
    department: "",
    needed_date: "",
    resource_type: "SOFTWARE",
    items_needed: "",
    purpose: "",
    notes: "",
  });

  const update = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    setErrMsg("");

    const srTrim = String(form.sr_code || "").trim();

    if (!form.full_name.trim()) return setErrMsg("Full Name is required.");
    if (form.requester_type === "STUDENT" && !srTrim)
      return setErrMsg("SR Code is required.");
    if (!form.items_needed.trim())
      return setErrMsg("Please list the items you need.");
    if (!form.purpose.trim()) return setErrMsg("Purpose is required.");

    setSubmitting(true);

    try {
      const { data } = await api.post("/api/resources/requests", {
        requester_type: form.requester_type,
        requester_name: form.full_name,
        sr_code: form.requester_type === "STUDENT" ? srTrim : null,
        email: form.email || null,
        department: form.department || null,
        needed_date: form.needed_date || null,
        request_type: form.resource_type,
        requested_items: form.items_needed,
        purpose: form.purpose,
        notes: form.notes || null,
      });

      // Student -> show SR code
      // External -> show backend tracking code
      const displayCode =
        form.requester_type === "STUDENT"
          ? srTrim
          : data?.tracking || data?.tracking_code || "";

      if (!displayCode) {
        throw new Error("Tracking code not returned from server.");
      }

      setGeneratedCode(displayCode);
      onSuccess(displayCode);
      setStep("SUCCESS");
    } catch (err) {
      setErrMsg(err?.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep("FORM");
    setGeneratedCode("");
    setCopied(false);
    setForm({
      requester_type: "STUDENT",
      full_name: "",
      sr_code: "",
      email: "",
      department: "",
      needed_date: "",
      resource_type: "SOFTWARE",
      items_needed: "",
      purpose: "",
      notes: "",
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={handleClose}
          />

          <motion.div
            className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {step === "FORM" ? (
              <>
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-lg">
                      <PackagePlus size={20} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      Resource Request
                    </h2>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form
                  onSubmit={submitRequest}
                  className="p-8 max-h-[70vh] overflow-y-auto space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <SelectField
                      label="Requester Type"
                      value={form.requester_type}
                      onChange={update("requester_type")}
                      options={[
                        { v: "STUDENT", l: "Student" },
                        { v: "EXTERNAL", l: "External / Guest" },
                      ]}
                    />

                    <Field
                      label="Full Name"
                      value={form.full_name}
                      onChange={update("full_name")}
                      placeholder="Juan Dela Cruz"
                    />

                    {form.requester_type === "STUDENT" && (
                      <Field
                        label="SR Code"
                        value={form.sr_code}
                        onChange={update("sr_code")}
                        placeholder="22-00000"
                      />
                    )}

                    <Field
                      label="Email Address"
                      type="email"
                      value={form.email}
                      onChange={update("email")}
                      placeholder="juan@example.com"
                    />

                    <Field
                      label="Department"
                      value={form.department}
                      onChange={update("department")}
                      placeholder="CICS"
                    />

                    <SelectField
                      label="Request Type"
                      value={form.resource_type}
                      onChange={update("resource_type")}
                      options={[
                        { v: "SOFTWARE", l: "Software" },
                        { v: "DATASET", l: "Dataset" },
                        { v: "FILE", l: "File" },
                        { v: "OTHER", l: "Other" },
                      ]}
                    />

                    <Field
                      label="Needed Date"
                      type="date"
                      value={form.needed_date}
                      onChange={update("needed_date")}
                      min={today}
                    />
                  </div>

                  <TextArea
                    label="Requested Items"
                    value={form.items_needed}
                    onChange={update("items_needed")}
                    placeholder="List softwares, shapefiles, or documents..."
                  />

                  <TextArea
                    label="Purpose"
                    value={form.purpose}
                    onChange={update("purpose")}
                    placeholder="Thesis, Project, Research, etc."
                  />

                  {errMsg && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">
                      {errMsg}
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-700 transition-all disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <>
                          <Send size={16} /> Submit
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={40} />
                </div>

                <h2 className="text-2xl font-black text-slate-900 mb-2">
                  Request Submitted
                </h2>

                <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                  Save this reference code to track your request.
                </p>

                <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-8 mb-8">
                  <div className="text-4xl font-black text-slate-900 tracking-wider mb-6">
                    {generatedCode}
                  </div>

                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-red-600 hover:text-red-600 transition-all mx-auto"
                  >
                    {copied ? (
                      <>
                        <ClipboardCheck size={16} /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={16} /> Copy Code
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={handleClose}
                  className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", ...props }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...props}
        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-red-600/5 focus:border-red-600 outline-none transition-all"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-red-600/5 focus:border-red-600 outline-none transition-all cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
        {label}
      </label>
      <textarea
        rows={3}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-red-600/5 focus:border-red-600 outline-none transition-all resize-none"
      />
    </div>
  );
}