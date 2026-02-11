  import { useState } from "react";
  import { useNavigate } from "react-router-dom";
  import { api } from "../services/api";
  import { User, Lock, Loader2, Eye, EyeOff } from "lucide-react";
  import { motion, AnimatePresence } from "framer-motion";

  export default function Login() {
    const [username, setUsername] = useState("GIS Admin");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const onSubmit = async (e) => {
      e.preventDefault();
      setErr("");
      setLoading(true);

      try {
        const { data } = await api.post("/api/admin/login", {
          username,
          password,
        });
        localStorage.setItem("admin_token", data.token);
        navigate("/admin");
      } catch (e) {
        setErr(e?.response?.data?.message || "Invalid credentials. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div
        className="min-h-screen w-full flex items-center justify-center bg-cover bg-center px-4 py-8 relative"
        style={{ backgroundImage: "url('/bg-building.jpg')" }}
      >
        {/* Dark Overlay with Blur */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-full max-w-[420px]"
        >
          {/* Main Glass Container */}
          <div className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-1.5 border border-white/20 shadow-2xl">
            <div className="bg-[#1e3a8a]/90 rounded-[2.3rem] p-6 sm:p-10 flex flex-col items-center">
              
              {/* Logo & Title */}
              <motion.div 
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                className="flex flex-col items-center mb-8"
              >
                <div className="p-1.5 bg-white rounded-full shadow-2xl mb-4 group">
                  <img
                    src="/logo.jpg"
                    alt="GIS ADC Logo"
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover transition-transform group-hover:rotate-12"
                  />
                </div>
                <h1 className="text-white font-black tracking-[0.2em] text-center text-sm sm:text-base uppercase">
                  GIS ADC Admin Portal
                </h1>
                <div className="h-1.5 w-10 bg-cyan-400 mt-3 rounded-full shadow-lg shadow-cyan-500/50" />
              </motion.div>

              {/* Login Form */}
              <form onSubmit={onSubmit} className="w-full space-y-5">
                <AnimatePresence mode="wait">
                  {err && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-[11px] font-bold text-center uppercase tracking-wider"
                    >
                      {err}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  {/* Username */}
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type="text"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 sm:py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white/10 transition-all text-sm"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                  {/* Password */}
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-3.5 sm:py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white/10 transition-all text-sm"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  className="w-full mt-2 bg-cyan-400 hover:bg-cyan-300 text-[#1e3a8a] font-black py-4 rounded-2xl shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.15em] text-xs sm:text-sm"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Login"
                  )}
                </motion.button>
              </form>

              <p className="text-center text-white/30 text-[9px] sm:text-[10px] mt-10 uppercase tracking-[0.25em] font-medium">
                Secured Admin Access Point
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }