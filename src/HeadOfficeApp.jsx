import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { useCallback } from "react";

export default function HeadOfficeApp() {
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
            color: { value: ["#3b82f6", "#6366f1", "#60a5fa"] }, // 藍紫色
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
      <header className="text-center py-20 relative z-10">
        <h1 className="text-5xl font-extrabold tracking-wide mb-4 text-blue-400">
          hi Novapay Hub
        </h1>
        <p className="text-lg text-blue-200 max-w-2xl mx-auto">
          Next-generation SaaS platform for merchants, empowering seamless
          payments, smart analytics, and scalable growth.
        </p>
      </header>

      {/* 公司願景 */}
      <section className="max-w-5xl mx-auto px-6 py-12 relative z-10">
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-300">
          Our Vision
        </h2>
        <p className="text-center text-gray-300 leading-relaxed max-w-3xl mx-auto">
          At <span className="text-blue-400">hi Novapay Hub</span>, we aim to
          redefine digital payments with cutting-edge technology, offering a
          unified ecosystem where merchants can thrive in the global market.
        </p>
      </section>

      {/* 核心價值 */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        {[
          {
            title: "Innovation",
            desc: "AI-driven solutions to empower businesses.",
          },
          {
            title: "Security",
            desc: "Safe and reliable enterprise-grade solutions.",
          },
          {
            title: "Growth",
            desc: "Scalable ecosystem for global expansion.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="p-8 bg-slate-900/70 backdrop-blur rounded-2xl shadow-lg hover:shadow-blue-500/50 transition"
          >
            <h3 className="text-xl font-semibold text-blue-300 mb-4">
              {item.title}
            </h3>
            <p className="text-gray-300">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="text-center py-12 border-t border-blue-800 mt-12 relative z-10">
        <p className="text-gray-400">
          © {new Date().getFullYear()} hi Novapay Hub. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
