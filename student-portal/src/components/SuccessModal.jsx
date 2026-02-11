import { useState } from "react";
import { motion } from "framer-motion";
import { X, CheckCircle2, Copy, ArrowRight } from "lucide-react";

export default function SuccessModal({ code, onClose, onTrack }) {
  const [copied, setCopied] = useState(false);

  if (!code) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const containerVars = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
  };

  const itemVars = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  };

  return (
    <div className="bg-white text-slate-900 font-sans w-full max-w-md mx-auto overflow-hidden rounded-t-[2.5rem] sm:rounded-[2rem]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shadow-lg">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-300">
              Receipt
            </div>
            <div className="text-lg font-black tracking-tight text-[#0F172A] leading-none">
              Sent <span className="text-red-600">Successfully</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 transition"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      <motion.main
        variants={containerVars}
        initial="hidden"
        animate="visible"
        className="px-6 py-8 md:py-10 text-center"
      >
        {/* Icon */}
        <motion.div variants={itemVars} className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-[1.75rem] bg-red-600/10 border border-red-100 flex items-center justify-center shadow-xl">
            <CheckCircle2 size={26} className="text-red-600" />
          </div>
        </motion.div>

        <motion.div variants={itemVars}>
          <h1 className="text-2xl md:text-3xl font-black text-[#0F172A] tracking-tight leading-tight">
            Your request is now in the queue.
          </h1>
          <p className="text-[12px] md:text-sm text-slate-500 font-medium mt-3 max-w-[320px] mx-auto leading-relaxed">
            Save this reference code so you can track the status anytime.
          </p>
        </motion.div>

        {/* Code */}
        <motion.div variants={itemVars} className="mt-7">
          <div className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-300 mb-3">
            Reference Code
          </div>

          <button
            type="button"
            onClick={copy}
            className="w-full rounded-[1.75rem] bg-slate-50 border border-slate-200 px-5 py-5 hover:bg-white transition group active:scale-[0.99]"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="text-left">
                <div className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
                  Tap to copy
                </div>
                <div className="font-mono font-black text-2xl md:text-3xl tracking-tight text-[#0F172A] group-hover:text-red-600 transition-colors">
                  {code}
                </div>
              </div>

              <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 group-hover:text-red-600 group-hover:border-red-200 transition">
                <Copy size={18} />
              </div>
            </div>

            <div className="mt-3 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  copied ? "w-full bg-red-600" : "w-0 bg-red-600"
                }`}
              />
            </div>

            <div
              className={`mt-2 text-[10px] font-black uppercase tracking-widest transition ${
                copied ? "text-emerald-700" : "text-slate-400"
              }`}
            >
              {copied ? "Copied" : "Copy code"}
            </div>
          </button>
        </motion.div>

        {/* Actions */}
        <motion.div variants={itemVars} className="mt-7 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              if (onTrack) onTrack(code);
              onClose();
            }}
            className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-red-600/20 transition flex items-center justify-center gap-2"
          >
            Track Progress
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl border border-slate-200 text-slate-700 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition"
          >
            Submit Another
          </button>
        </motion.div>

        <motion.p
          variants={itemVars}
          className="mt-10 text-[9px] font-black text-slate-300 uppercase tracking-[0.35em] leading-relaxed"
        >
          GIS Applications Development Center
          <br />
          © 2026 • Secure Receipt
        </motion.p>
      </motion.main>
    </div>
  );
}