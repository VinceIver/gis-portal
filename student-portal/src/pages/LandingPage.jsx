import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useSpring } from "framer-motion";
import {
  Menu,
  X,
  ArrowRight,
  Mail,
  MapPin,
  Phone,
  MessagesSquare,
  GraduationCap,
  FolderTree,
  QrCode,
} from "lucide-react";

const LandingPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // FIX: use hash links (no "/#...")
  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "About", href: "#about" },
    { name: "Programs", href: "#programs" },
    { name: "Services", href: "#services" },
    { name: "Contact", href: "#contact" },
  ];

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-x-hidden scroll-smooth">
      {/* 1. NAVIGATION */}
      <nav
        className={`fixed w-full top-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-white py-3 shadow-md" : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-3 sm:gap-4 group cursor-pointer">
              <div className="relative flex-shrink-0 transition-transform duration-500 group-hover:scale-105">
                <div className="absolute -inset-1 bg-gradient-to-tr from-red-600 to-red-400 rounded-full blur opacity-20 group-hover:opacity-100 transition duration-500"></div>
                <img
                  src="/GIS LOGO.jpg"
                  alt="GADC Logo"
                  className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-full object-cover border-2 border-white shadow-lg"
                />
              </div>
              <div className="flex flex-col text-left">
                <span
                  className={`text-sm sm:text-lg md:text-xl font-black tracking-tighter uppercase leading-none transition-colors duration-300 ${
                    scrolled ? "text-[#0F172A]" : "text-white"
                  }`}
                >
                  GIS Applications Development Center
                </span>
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] text-red-500">
                  Batangas State University - TNEU
                </span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className={`text-[11px] font-black uppercase tracking-widest transition-all hover:text-red-500 ${
                    scrolled ? "text-slate-600" : "text-slate-200"
                  }`}
                >
                  {link.name}
                </a>
              ))}
            </div>

            <button
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-red-600 text-white shadow-lg"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 origin-left"
          style={{ scaleX }}
        />
      </nav>

      {/* MOBILE SIDEBAR */}
      <div
        className={`fixed inset-0 z-[100] lg:hidden transition-all duration-500 ${
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        ></div>

        <div
          className={`absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl flex flex-col p-8 transition-transform duration-500 ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <img
                src="/GIS LOGO.jpg"
                className="h-10 w-10 rounded-full border-2 border-red-500"
                alt="Logo"
              />
              <span className="text-xs font-black uppercase leading-tight text-slate-900">
                GIS Applications Development Center
              </span>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="text-slate-400">
              <X size={28} />
            </button>
          </div>

          <div className="flex flex-col space-y-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="text-2xl font-black uppercase tracking-tighter text-slate-900 hover:text-red-600"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* 2. HERO SECTION */}
      <header id="home" className="relative min-h-screen flex items-center overflow-hidden bg-[#0F172A]">
        <div className="absolute inset-0 z-0">
          <img
            src="/Hero Section Image.png"
            alt="GIS Background"
            className="w-full h-full object-cover opacity-50 sm:opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/80 via-[#0F172A]/40 to-[#0F172A]"></div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 text-center md:text-left"
        >
          <div className="max-w-4xl space-y-6 md:space-y-8">
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white leading-[1.1] tracking-tighter uppercase">
              Collaborative <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">
                GIS Solutions
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-300 font-medium leading-relaxed max-w-xl mx-auto md:mx-0 md:border-l-2 md:border-red-600 md:pl-6 text-center md:text-justify">
              Creating interdisciplinary GIS-technology solutions for research, education, and community.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
              <a
                href="#services"
                className="bg-red-600 text-white px-8 py-4 sm:px-10 sm:py-5 rounded-full font-black hover:bg-red-700 transition-all shadow-xl uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 text-center"
              >
                Our Services <ArrowRight size={16} />
              </a>

              <a
                href="#about"
                className="bg-white/10 border border-white/20 text-white px-8 py-4 sm:px-10 sm:py-5 rounded-full font-black hover:bg-white/20 transition-all uppercase text-[11px] tracking-widest text-center"
              >
                See more
              </a>
            </div>
          </div>
        </motion.div>
      </header>

      {/* 3. ABOUT US SECTION */}
      <section id="about" className="py-24 md:py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-10 md:gap-24">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="w-full lg:w-1/2 group"
            >
              <div className="relative rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl">
                <img
                  src="/About Us Image.png"
                  alt="GADC Facility"
                  className="w-full h-auto aspect-video md:aspect-square object-cover"
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[2rem] md:rounded-[2.5rem]"></div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="w-full lg:w-1/2 space-y-6 md:space-y-10 text-center lg:text-left"
            >
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                  Our <br /> <span className="text-red-600">Purpose</span>
                </h2>
                <div className="h-2 w-24 bg-red-600 rounded-full mx-auto lg:mx-0"></div>
              </div>

              <div className="relative text-left">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-600 to-transparent"></div>
                <p className="text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed font-medium text-justify pl-6 md:pl-8">
                  Geographic Information System Applications Development Center (GIS ADC) aims to create
                  interdisciplinary collaborations for GIS-technology solutions for research, education, and
                  community. The center offers software and hardware for GIS-technology driven research and
                  conducts training to researchers.
                </p>
              </div>

              <div className="flex justify-center lg:justify-start pt-4">
                <a
                  href="#contact"
                  className="group flex items-center gap-4 bg-[#0F172A] text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-red-600 transition-all shadow-lg"
                >
                  Learn More
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. PROGRAMS SECTION */}
      <section id="programs" className="py-24 md:py-32 bg-[#0F172A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4"
          >
            Programs and Initiatives
          </motion.h2>

          <div className="h-1.5 w-24 bg-red-600 mt-4 rounded-full mx-auto mb-20"></div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          >
            {[
              {
                img: "/GIS Training Image.jpg",
                title: "Geographic Information Systems (GIS) Training",
                icon: <GraduationCap />,
                desc: "Analyze geographical data to inform decision-making processes.",
              },
              {
                img: "/HUGIS Image.jpg",
                title:
                  "Harmonized and Unified GIS for Industry Productivity (HUGIS) Project",
                icon: <GraduationCap />,
                desc: "Batangas State University funded research project under the BRIDGES (Building Research and Innovation Developmental Goals for Engineering SUCs) Program",
              },
              {
                img: "/GEDS Project.jpg",
                title: "GIS-based Emergency Displayed persons monitoring Systems (GEDS) Project",
                icon: <GraduationCap />,
                desc: "Collect spatial data for environmental analysis and resource management.",
              },
            ].map((program, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="group bg-white/5 backdrop-blur-sm rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-white/10 transition-all hover:border-red-500/50 shadow-2xl flex flex-col h-full text-left"
              >
                <div className="relative h-48 sm:h-64 overflow-hidden bg-slate-800">
                  <img
                    src={program.img}
                    alt={program.title}
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-4 left-4 bg-red-600 text-white p-3 rounded-xl">
                    {React.cloneElement(program.icon, { size: 18 })}
                  </div>
                </div>

                <div className="p-6 md:p-10 space-y-4 flex-grow flex flex-col">
                  <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight leading-tight min-h-[4rem] flex items-center">
                    {program.title}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed text-justify">
                    {program.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 5. SERVICES SECTION */}
      <section id="services" className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="flex flex-col lg:flex-row justify-between lg:items-end mb-16 gap-6 text-center lg:text-left"
          >
            <div className="space-y-4">
              <h2 className="text-4xl md:text-7xl font-black text-[#0F172A] uppercase tracking-tighter leading-none">
                Services <span className="text-red-600">Offered</span>
              </h2>
              <div className="h-1.5 w-24 bg-red-600 mt-4 rounded-full mx-auto lg:mx-0"></div>
            </div>
            <p className="text-slate-500 font-medium max-w-sm text-sm leading-relaxed border-l-2 border-slate-100 pl-6 text-justify">
              Explore the range of services available at our center to support your objectives.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20"
          >
            {[
              {
                icon: <MessagesSquare size={36} />,
                title: "Consultation",
                desc: "Technical guidance to align GIS technology with your research goals.",
              },
              {
                icon: <GraduationCap size={36} />,
                title: "Training",
                desc: "Certification programs to build proficiency in spatial tools.",
              },
              {
                icon: <FolderTree size={36} />,
                title: "Resources",
                desc: "Access to high-end hardware and software licenses.",
              },
            ].map((service, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="group p-12 rounded-[3rem] bg-[#F8FAFC] border border-slate-100 flex flex-col transition-all hover:bg-white hover:shadow-xl text-left"
              >
                <div className="mb-8 text-red-600 transition-transform group-hover:scale-110">
                  {service.icon}
                </div>
                <h3 className="text-xl md:text-2xl font-black mb-6 uppercase text-[#0F172A] tracking-tight">
                  {service.title}
                </h3>
                <p className="text-slate-600 font-medium leading-relaxed text-justify text-sm md:text-base">
                  {service.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center space-y-6 pt-10 border-t border-slate-100"
          >
            <h4 className="text-lg font-bold text-[#0F172A] uppercase tracking-widest text-center">
              Ready to utilize our expertise?
            </h4>

            {/* FIX: go to old portal route */}
            <Link
              to="/student"
              className="group relative flex items-center gap-4 bg-red-600 text-white px-12 py-5 rounded-full font-black uppercase tracking-[0.2em] text-xs sm:text-sm hover:bg-red-700 transition-all shadow-2xl shadow-red-600/30 active:scale-95"
            >
              Request a Service
              <ArrowRight className="group-hover:translate-x-2 transition-transform" size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 6. CONTACT US SECTION */}
      <section id="contact" className="py-24 md:py-32 bg-[#F8FAFC] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
            <h2 className="text-4xl md:text-7xl font-black text-[#0F172A] uppercase tracking-tighter mb-4">
              Contact <span className="text-red-600 font-black">Us</span>
            </h2>
            <div className="h-1.5 w-24 bg-red-600 mt-4 rounded-full mx-auto mb-6"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm md:text-base max-w-2xl mx-auto mb-16">
              Interested in joining our startup programs? Reach out today!
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="space-y-6 text-left"
            >
              {[
                { icon: <Mail size={20} />, label: "Email Inquiry", value: "gis.center@g.batstate-u.edu.ph" },
                { icon: <Phone size={20} />, label: "Official Line", value: "(043) 425-0139 loc. 2409" },
                {
                  icon: <MapPin size={20} />,
                  label: "Location",
                  value:
                    "2F STEER Hub Bldg., Batangas State University - TNEU Alangilan Campus, Batangas City, Batangas, Philippines 4200",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className="flex items-center gap-6 p-6 bg-white rounded-3xl shadow-sm border border-slate-100 group transition-all hover:shadow-xl"
                >
                  <div className="p-4 bg-slate-50 text-red-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-all">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      {item.label}
                    </p>
                    <p className="text-[#0F172A] font-bold tracking-tight text-sm sm:text-base break-all md:break-normal">
                      {item.value}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, rotate: 5, scale: 0.9 }}
              whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative flex justify-center"
            >
              <div className="absolute -inset-10 bg-red-600/5 rounded-full blur-3xl opacity-50"></div>

              <div className="relative bg-[#0F172A] p-12 md:p-16 rounded-[4rem] shadow-2xl border border-white/5 text-center transition-transform hover:scale-[1.02] duration-500 max-w-sm w-full">
                <div className="bg-white p-6 rounded-[2rem] inline-block shadow-[0_0_50px_-10px_rgba(255,255,255,0.2)]">
                  <img src="/QR CODE.png" alt="GADC QR Code" className="w-40 h-40 md:w-56 md:h-56 object-contain" />
                </div>
                <div className="mt-8 flex justify-center text-red-500">
                  <QrCode size={48} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-[#0F172A] py-20 px-4 text-center border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 1 }} className="mb-10">
            <img
              src="/GIS LOGO.jpg"
              className="h-20 w-20 md:h-24 md:w-24 rounded-full border-4 border-[#1E293B] shadow-2xl"
              alt="GADC Logo"
            />
          </motion.div>

          <h2 className="text-white font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-lg md:text-3xl mb-4 leading-tight text-center">
            GIS Applications <span className="text-red-600">Development Center</span>
          </h2>

          <div className="w-16 h-1 bg-red-600/50 rounded-full mb-8"></div>

          <p className="text-slate-500 font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-[9px] md:text-[10px] text-center">
            ©2026 GIS. All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;