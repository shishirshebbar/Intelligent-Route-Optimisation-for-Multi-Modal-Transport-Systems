import React, { useMemo, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Map as MapIcon,
  Route,
  Rocket,
  Leaf,
  Gauge,
  Network,
  Ship,
  Train,
  Truck,
  Plane,
  CloudLightning,
  ShieldCheck,
  Database,
  Radar,
  ArrowRight,
  Sparkles,
  Scan,
  BarChart3,
  Github,
  Linkedin,
  Mail,
} from "lucide-react";

type LandingProps = { onStart?: () => void };

/* Variants */
const vFadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};
const vFloat: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 1, ease: "easeOut" } },
};

/* Helpers */
const blob = "absolute pointer-events-none blur-3xl opacity-40 mix-blend-screen";

const Pill: React.FC<React.PropsWithChildren> = ({ children }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90 shadow-sm backdrop-blur">
    <Sparkles className="h-3 w-3" /> {children}
  </span>
);

const SectionHeader: React.FC<{ eyebrow?: string; title: string; subtitle?: string }> = ({
  eyebrow,
  title,
  subtitle,
}) => (
  <div className="mx-auto mb-10 max-w-3xl text-center">
    {eyebrow && (
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={vFadeUp} className="mb-3">
        <Pill>{eyebrow}</Pill>
      </motion.div>
    )}
    <motion.h2
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={vFadeUp}
      className="text-3xl font-semibold tracking-tight text-white md:text-4xl"
    >
      {title}
    </motion.h2>
    {subtitle && (
      <motion.p
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={vFadeUp}
        className="mt-3 text-white/70"
      >
        {subtitle}
      </motion.p>
    )}
  </div>
);

const Kpi: React.FC<{ icon: React.ComponentType<any>; label: string; value: string }> = ({
  icon: Icon,
  label,
  value,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur transition hover:border-white/20"
  >
    <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-tr from-teal-400/20 to-cyan-400/10 blur-2xl" />
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-white/10 p-2">
        <Icon className="h-5 w-5 text-teal-300" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-white/60">{label}</div>
        <div className="text-lg font-semibold text-white md:text-2xl">{value}</div>
      </div>
    </div>
  </motion.div>
);

const ModeTag: React.FC<{
  icon: React.ComponentType<any>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ icon: Icon, label, active = false, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition active:scale-[.98] ${
      active ? "border-teal-300/50 bg-teal-300/10 text-white" : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
    }`}
  >
    <Icon className="h-4 w-4" />
    {label}
  </button>
);

const GlassCard: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl">
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
    <div className="relative z-10">{children}</div>
  </div>
);

/* Demo Panel */
const DemoPanel: React.FC = () => {
  const [mode, setMode] = useState<"road" | "rail" | "sea" | "air">("road");
  const [origin, setOrigin] = useState("");
  const [dest, setDest] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { distance: number; time: number; co2: number; hops: number }>(null);

  const disabled = !origin || !dest || loading;

  const compute = () => {
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const factor = mode === "air" ? 0.7 : mode === "sea" ? 0.9 : mode === "rail" ? 0.8 : 1;
      setResult({
        distance: Math.round(680 * factor),
        time: Math.round(72 * factor),
        co2: Math.round(280 * factor),
        hops: mode === "sea" ? 2 : 1,
      });
      setLoading(false);
    }, 900);
  };

  return (
    <GlassCard>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-white/80">
          <Radar className="h-5 w-5" />
          <span className="text-sm">Try a quick demo</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <ModeTag icon={Truck} label="Road" active={mode === "road"} onClick={() => setMode("road")} />
          <ModeTag icon={Train} label="Rail" active={mode === "rail"} onClick={() => setMode("rail")} />
          <ModeTag icon={Ship} label="Sea" active={mode === "sea"} onClick={() => setMode("sea")} />
          <ModeTag icon={Plane} label="Air" active={mode === "air"} onClick={() => setMode("air")} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <input
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="Origin (e.g., Hamburg Port)"
          className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white placeholder-white/50 outline-none focus:border-teal-300/50"
        />
        <input
          value={dest}
          onChange={(e) => setDest(e.target.value)}
          placeholder="Destination (e.g., Warsaw DC)"
          className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white placeholder-white/50 outline-none focus:border-teal-300/50"
        />
        <button
          onClick={compute}
          disabled={disabled}
          className="group inline-flex items-center justify-center gap-2 rounded-xl border border-teal-300/40 bg-teal-400/20 px-4 py-2 font-medium text-teal-50 shadow-inner backdrop-blur transition hover:bg-teal-400/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Route className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
          {loading ? "Computing…" : "Compute Route"}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4"
          >
            <Kpi icon={MapIcon} label="Distance" value={`${result.distance} km`} />
            <Kpi icon={Gauge} label="ETA" value={`${result.time} hrs`} />
            <Kpi icon={Leaf} label="CO₂e" value={`${result.co2} kg`} />
            <Kpi icon={Network} label="Hops" value={`${result.hops}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
};

const Feature: React.FC<{ icon: React.ComponentType<any>; title: string; desc: string }> = ({
  icon: Icon,
  title,
  desc,
}) => (
  <motion.div
    initial="hidden"
    whileInView="show"
    viewport={{ once: true }}
    variants={vFadeUp}
    className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
  >
    <div className="mb-3 inline-flex rounded-xl bg-white/10 p-2">
      <Icon className="h-5 w-5 text-teal-300" />
    </div>
    <div className="text-lg font-semibold text-white">{title}</div>
    <p className="mt-1 text-sm text-white/70">{desc}</p>
  </motion.div>
);

const PipelineStep: React.FC<{ step: number; title: string; desc: string }> = ({ step, title, desc }) => (
  <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={vFloat} className="relative">
    <div className="absolute -left-5 top-1 hidden h-full w-px bg-gradient-to-b from-teal-300/50 to-transparent md:block" />
    <div className="flex items-start gap-4">
      <div className="grid h-8 w-8 place-items-center rounded-xl bg-teal-400/20 text-sm font-semibold text-teal-50 ring-1 ring-inset ring-teal-300/40">
        {step}
      </div>
      <div>
        <div className="font-medium text-white">{title}</div>
        <div className="text-sm text-white/70">{desc}</div>
      </div>
    </div>
  </motion.div>
);

/* Page */
const LandingPage: React.FC<LandingProps> = ({ onStart }) => {
  const stats = useMemo(
    () => [
      { icon: BarChart3, label: "Shipments Optimised", value: "2.4M+" },
      { icon: Leaf, label: "Avg. CO₂e Saved", value: "18%" },
      { icon: Gauge, label: "Faster ETAs", value: "~27%" },
      { icon: Database, label: "Live Feeds", value: "30+" },
    ],
    []
  );

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className={`${blob} -top-20 left-10 h-72 w-72 rounded-full bg-teal-500/30`} />
      <div className={`${blob} -bottom-32 right-10 h-80 w-80 rounded-full bg-cyan-400/20`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_60%)]" />

      {/* Nav */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 text-white">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 text-black">
            <Scan className="h-5 w-5" />
          </div>
          <div className="text-lg font-semibold tracking-tight">OmniRoute</div>
        </div>
        <div className="hidden items-center gap-6 text-white/80 md:flex">
          <a className="hover:text-white" href="#features">Features</a>
          <a className="hover:text-white" href="#pipeline">Pipeline</a>
          <a className="hover:text-white" href="#demo">Demo</a>
          <a className="hover:text-white" href="#contact">Contact</a>
          <button
            onClick={onStart}
            className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-white backdrop-blur hover:border-white/20"
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Hero */}
      <header className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 pb-20 pt-6 md:grid-cols-2 md:pb-28">
        <motion.div initial="hidden" animate="show" variants={vFadeUp}>
          <Pill>Intelligent Route Optimisation</Pill>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-white md:text-6xl">
            Orchestrate multimodal transport with{" "}
            <span className="bg-gradient-to-r from-teal-200 to-cyan-200 bg-clip-text text-transparent">cost–time–CO₂</span>{" "}
            parity.
          </h1>
          <p className="mt-4 max-w-xl text-white/70">
            Build a fully functional backend pipeline capable of basic route computation, database operations, and live data ingestion — everything that enables intelligent optimization later.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <a
              href="#demo"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 px-5 py-3 font-medium text-slate-950 shadow-sm transition focus:outline-none active:scale-[.98]"
            >
              <Rocket className="h-4 w-4" /> Try Interactive Demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-white backdrop-blur hover:border-white/20"
            >
              <MapIcon className="h-4 w-4" /> Explore Features
            </a>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <Kpi key={s.label} icon={s.icon} label={s.label} value={s.value} />
            ))}
          </div>
        </motion.div>

        {/* Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-4 shadow-2xl backdrop-blur">
            <div className="grid grid-cols-12 gap-2">
              {[...Array(48)].map((_, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.02 * idx }}
                  className="aspect-square rounded-md bg-gradient-to-br from-slate-700/40 to-slate-800/40"
                />
              ))}
            </div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}>
              <svg className="absolute left-0 top-0 h-full w-full" viewBox="0 0 800 400" fill="none">
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2dd4bf" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
                <path d="M30 320 C 200 280, 180 80, 400 120 S 620 320, 770 200" stroke="url(#g)" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </motion.div>
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={vFloat} className="absolute left-6 top-[72%]">
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-2 py-1 text-xs text-white">
                <Truck className="h-3.5 w-3.5" /> Origin: DC-34
              </div>
            </motion.div>
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={vFloat} className="absolute right-6 top-[30%]">
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-2 py-1 text-xs text-white">
                <Plane className="h-3.5 w-3.5" /> Hub: H-AIR
              </div>
            </motion.div>
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={vFloat} className="absolute right-6 bottom-6">
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-2 py-1 text-xs text-white">
                <Ship className="h-3.5 w-3.5" /> Port: S-BAL
              </div>
            </motion.div>
          </div>
        </motion.div>
      </header>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeader
          eyebrow="Capabilities"
          title="Everything you need before advanced optimisation"
          subtitle="Start with a rock-solid foundation: compute routes, persist state, and ingest live signals from carriers, sensors, and partners."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Feature icon={Route} title="Basic Route Engine" desc="Deterministic shortest–path with modal constraints. Ready to swap in heuristics or MILP later." />
          <Feature icon={Database} title="Database Ops" desc="Locations, shipments, events, KPIs — all first-class with secure persistence and querying." />
          <Feature icon={CloudLightning} title="Live Data Ingestion" desc="Stream GTFS, AIS, ADS-B, and carrier updates to keep ETAs and routes fresh." />
          <Feature icon={ShieldCheck} title="Secure by Design" desc="API auth, rate limits, audit logs, and PII-safe defaults." />
          <Feature icon={Network} title="Multimodal Graph" desc="Road, rail, sea, air — plus transfers and dwell times baked in." />
          <Feature icon={Leaf} title="Sustainability Metrics" desc="CO₂e and energy cost surfaced alongside time and price." />
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeader
          eyebrow="Interactive"
          title="Play with a lightweight demo"
          subtitle="This UI-only demo simulates results. Connect it to your backend to go live in minutes."
        />
        <DemoPanel />
      </section>

      {/* Pipeline */}
      <section id="pipeline" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeader
          eyebrow="Backend"
          title="A pragmatic pipeline you can ship today"
          subtitle="Plug your data sources, compute initial routes, store results, and iterate into intelligence."
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <GlassCard>
            <div className="mb-4 flex items-center gap-2 text-white">
              <Radar className="h-4 w-4" /> Reference Flow
            </div>
            <div className="space-y-5">
              <PipelineStep step={1} title="Ingest" desc="Connect GTFS, AIS/ADS-B, carrier APIs, and webhooks. Normalize and validate." />
              <PipelineStep step={2} title="Store" desc="Persist locations, shipments, and events in a relational DB with indexes for routing." />
              <PipelineStep step={3} title="Compute" desc="Run baseline routing with modal constraints and objective weights (cost/time/CO₂e)." />
              <PipelineStep step={4} title="Expose" desc="Serve results via REST/GraphQL and stream updates via SSE/WebSocket." />
              <PipelineStep step={5} title="Optimise" desc="Iterate with heuristics, LP/MILP, or RL as data maturity grows." />
            </div>
          </GlassCard>
          <GlassCard>
            <div className="mb-4 flex items-center gap-2 text-white">
              <ShieldCheck className="h-4 w-4" /> Production Readiness
            </div>
            <ul className="space-y-3 text-white/80">
              <li className="flex items-start gap-3"><Database className="mt-0.5 h-4 w-4 text-teal-300" /> Postgres + PostGIS, vector tiles optional</li>
              <li className="flex items-start gap-3"><CloudLightning className="mt-0.5 h-4 w-4 text-teal-300" /> Kafka / Redpanda for streams, Debezium for CDC</li>
              <li className="flex items-start gap-3"><Radar className="mt-0.5 h-4 w-4 text-teal-300" /> OpenTelemetry, Prometheus, Grafana</li>
              <li className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 text-teal-300" /> OAuth2.1 / OIDC, RBAC, audit trails</li>
            </ul>
          </GlassCard>
        </div>
      </section>

      {/* CTA */}
      <section id="get-started" className="mx-auto max-w-7xl px-6 py-16">
        <GlassCard>
          <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-center md:justify-between md:text-left">
            <div>
              <div className="text-2xl font-semibold text-white">Ready to ship your baseline optimiser?</div>
              <p className="text-white/70">Wire this UI into your existing endpoints and iterate fast.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onStart}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 px-5 py-3 font-medium text-slate-950"
              >
                <Rocket className="h-4 w-4" /> Start a Pilot
              </button>
              <a href="#" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-white hover:border-white/20">
                <Github className="h-4 w-4" /> View Templates
              </a>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Footer */}
      <footer id="contact" className="mx-auto max-w-7xl px-6 pb-12">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80 backdrop-blur md:flex-row">
          <div className="flex items-center gap-2 text-white">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 text-black">
              <Scan className="h-5 w-5" />
            </div>
            <div className="text-lg font-semibold tracking-tight">OmniRoute</div>
          </div>
          <div className="text-center text-sm md:text-left">Built with React, Tailwind, Framer Motion, and lucide-react. No shadcn/ui.</div>
          <div className="flex items-center gap-4">
            <a className="inline-flex items-center gap-1 hover:text-white" href="#" ><Mail className="h-4 w-4" /> Email</a>
            <a className="inline-flex items-center gap-1 hover:text-white" href="#"><Github className="h-4 w-4" /> GitHub</a>
            <a className="inline-flex items-center gap-1 hover:text-white" href="#"><Linkedin className="h-4 w-4" /> LinkedIn</a>
          </div>
        </div>
        <div className="py-6 text-center text-xs text-white/50">© {new Date().getFullYear()} OmniRoute Labs. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default LandingPage;
