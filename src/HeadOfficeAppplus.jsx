import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { useCallback } from "react";
import Logo from "./components/logo";



export default function HeadOfficeAppplus() {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <div className="relative h-auto min-h-screen bg-black text-white overflow-hidden">
      {/* 粒子背景 */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          background: { color: "transparent" },
          fpsLimit: 60,
          interactivity: {
            events: {
              onHover: { enable: true, mode: "repulse" },
            },
            modes: {
              repulse: { distance: 120 },
            },
          },
          particles: {
            color: { value: ["#3b82f6", "#6366f1", "#60a5fa"] },
            links: {
              enable: true,
              color: "#3b82f6",
              distance: 150,
              opacity: 0.3,
            },
            move: { enable: true, speed: 1 },
            number: { value: 70, density: { enable: true, area: 800 } },
            opacity: { value: 0.6 },
            size: { value: { min: 1, max: 4 } },
          },
          detectRetina: true,
        }}
        className="absolute inset-0 z-0"
      />

      {/* Hero 區塊 */}
            <Logo />
      <header className="text-center py-20 relative z-10 px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide mb-4 text-blue-400">
          NovaFix Mobile
        </h1>
        <p className="text-base md:text-lg text-blue-200 max-w-2xl mx-auto mb-8">
          Sydney on-demand phone & device repair. <br />
          We come to your home, office, or café – fast, transparent, and recorded for your peace of mind.
        </p>

        {/* 兩顆主要 CTA 按鈕 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  
          <a
            href="https://forms.gle/hjsaFLeiVnTBdfU89"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-lg hover:shadow-blue-500/50 transition"
          >
            Book a Repair (Google Form)
          </a>
          <a
            href="tel:0477549939"
            className="px-8 py-3 rounded-full border border-blue-400 text-blue-300 hover:bg-blue-900/40 font-semibold transition"
          >
            Call / SMS: 0477 549 939
          </a>
        </div>

        <p className="mt-4 text-xs text-gray-400">
          Average response time: 5–10 minutes · Service area: Sydney Inner West & CBD
        </p>
      </header>

      {/* 核心特色 */}
      <section className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        {[
          {
            title: "On-Site & Flexible",
            desc: "We come to you – home, office or café. No waiting in line, no leaving your device at a shop.",
          },
          {
            title: "Transparent & Recorded",
            desc: "Repairs can be recorded from start to finish for quality, safety and peace of mind.",
          },
          {
            title: "Premium Parts & Warranty",
            desc: "OEM-grade or Tier-1 parts only, with workmanship warranty on every repair.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="p-8 bg-slate-900/70 backdrop-blur rounded-2xl shadow-lg hover:shadow-blue-500/50 transition"
          >
            <h3 className="text-xl font-semibold text-blue-300 mb-4">
              {item.title}
            </h3>
            <p className="text-gray-300 text-sm md:text-base">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* 服務介紹 */}
      <section className="max-w-5xl mx-auto px-6 py-10 relative z-10">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-blue-300">
          What We Repair
        </h2>
        <p className="text-center text-gray-300 leading-relaxed max-w-3xl mx-auto mb-8 text-sm md:text-base">
          iPhone · Samsung · iPad · MacBook · other smartphones and tablets.
          We focus on fast, high quality repairs with honest communication.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Screen Replacement",
              desc: "Cracked or shattered screens – most models fixed same day.",
            },
            {
              title: "Battery & Charging",
              desc: "Battery draining fast or not charging? We can replace batteries and charging ports.",
            },
            {
              title: "Camera & Others",
              desc: "Camera, speaker, mic, water damage diagnostics and more.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-6 bg-slate-900/70 rounded-2xl shadow-md border border-slate-800"
            >
              <h3 className="text-lg font-semibold text-blue-200 mb-3">
                {item.title}
              </h3>
              <p className="text-gray-300 text-sm md:text-base">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 簡單流程 */}
      <section className="max-w-4xl mx-auto px-6 py-10 relative z-10">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-blue-300">
          How It Works
        </h2>
        <ol className="space-y-4 text-gray-300 text-sm md:text-base">
          <li>
            <span className="text-blue-400 font-semibold">1. Fill out the Google Form</span> – tell us your device, issue, and location.
          </li>
          <li>
            <span className="text-blue-400 font-semibold">2. We confirm price & time</span> – you&apos;ll get an SMS or WhatsApp within 5–10 minutes.
          </li>
          <li>
            <span className="text-blue-400 font-semibold">3. Technician comes to you</span> – repair is completed on-site, with optional recording.
          </li>
        </ol>
      </section>

      {/* Footer */}
      <footer className="text-center py-12 border-t border-blue-800 mt-12 relative z-10 px-4">
        <p className="text-gray-400 text-sm">
          © {new Date().getFullYear()} NovaFix Hub. All rights reserved.
        </p>
        <p className="text-gray-500 text-xs mt-2">
           Sydney, NSW · On-site mobile repair service
        </p>
      </footer>
    </div>
  );
}
