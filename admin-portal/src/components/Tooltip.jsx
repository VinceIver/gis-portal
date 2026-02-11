import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Tooltip({ children, text, dark }) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative flex flex-col items-center group"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onTouchStart={() => setShow(true)}
      onTouchEnd={() => setTimeout(() => setShow(false), 1000)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className={`absolute bottom-full mb-2 z-[100] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-xl pointer-events-none whitespace-nowrap border ${
              dark ? "bg-slate-800 text-white border-white/10" : "bg-slate-900 text-white border-none"
            }`}
          >
            {text}
            <div
              className={`absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent ${
                dark ? "border-t-slate-800" : "border-t-slate-900"
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}