"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Map as MapIcon,
  Route,
  Rocket,
  Leaf,
  Gauge,
  Network,
  Truck,
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
  AlertTriangle
} from "lucide-react";

type LandingProps = { onStart?: () => void };

/* Animations */
const vFadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const vFloat: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: "easeOut" } },
};

/* Shared UI helpers */
const blob =
  "absolute pointer-events-none blur-3xl opacity-40 mix-blend-screen";

const Pill: React.FC<React.PropsWithChildren> = ({ children }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90 shadow-sm backdrop-blur">
    <Sparkles className="h-3 w-3" /> {children}
  </span>
);

const SectionHeader: React.FC<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
}> = ({ eyebrow, title, subtitle }) => (
  <div className="mx-auto mb-10 max-w-3xl text-center">
    {eyebrow && (
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={vFadeUp}
        className="mb-3"
      >
        <Pill>{eyebrow}</Pill>
      </motion.div>
    )}
    <motion.h2
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={vFadeUp}
      className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl"
    >
      {title}
    </motion.h2>
    {subtitle && (
      <motion.p
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={vFadeUp}
        className="mt-3 text-sm md:text-base text-slate-300/80"
      >
        {subtitle}
      </motion.p>
    )}
  </div>
);

const Kpi: React.FC<{
  icon: React.ComponentType<any>;
  label: string;
  value: string;
}> = ({ icon: Icon, label, value }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="group relative overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 shadow-sm backdrop-blur transition hover:border-teal-300/40"
  >
    <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-tr from-teal-400/20 to-cyan-400/10 blur-2xl" />
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-slate-800/80 p-2 shadow-inner">
        <Icon className="h-5 w-5 text-teal-300" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
          {label}
        </div>
        <div className="text-lg font-semibold text-slate-50 md:text-xl">
          {value}
        </div>
      </div>
    </div>
  </motion.div>
);

const GlassCard: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="relative overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-900/80 p-6 shadow-xl backdrop-blur-xl">
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-teal-500/5" />
    <div className="relative z-10">{children}</div>
  </div>
);

/* Demo Panel – Phase-1: road routing + delay risk (simulated) */
const DemoPanel: React.FC = () => {
  const [origin, setOrigin] = useState("");
  const [dest, setDest] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    distance: number;
    time: number;
    delayRisk: number;
    co2: number;
  }>(null);

  const disabled = !origin || !dest || loading;

  const compute = () => {
    setLoading(true);
    setResult(null);

    // Simulated output – real app will call FastAPI + OSRM (+ later delay model)
    setTimeout(() => {
      const baseDistance = 320; // km
      const baseTime = 7.5; // hrs
      const delayRisk = 18; // %
      const co2 = 95; // kg (scenario)

      setResult({
        distance: Math.round(baseDistance),
        time: Math.round(baseTime * 10) / 10,
        delayRisk,
        co2,
      });
      setLoading(false);
    }, 800);
  };

  return (
    <GlassCard>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-200">
          <Radar className="h-5 w-5 text-teal-300" />
          <span className="text-sm font-medium">
            Quick road shipment simulation
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-teal-300/40 bg-teal-300/10 px-3 py-1 text-[11px] font-medium text-teal-50 shadow-sm">
          <Truck className="h-3.5 w-3.5" />
          <span>Phase-1 · Road only · Multi-modal later</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <input
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="Origin (e.g., Bengaluru DC)"
          className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-50 placeholder-slate-400 outline-none transition focus:border-teal-300/60"
        />
        <input
          value={dest}
          onChange={(e) => setDest(e.target.value)}
          placeholder="Destination (e.g., Chennai Hub)"
          className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-50 placeholder-slate-400 outline-none transition focus:border-teal-300/60"
        />
        <button
          onClick={compute}
          disabled={disabled}
          className="group inline-flex items-center justify-center gap-2 rounded-xl border border-teal-300/60 bg-teal-400/20 px-4 py-2 text-sm font-medium text-teal-50 shadow-inner backdrop-blur transition hover:bg-teal-400/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Route className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
          {loading ? "Computing…" : "Simulate Route"}
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
            <Kpi
              icon={CloudLightning}
              label="Delay Risk"
              value={`${result.delayRisk}%`}
            />
            <Kpi icon={Leaf} label="CO₂e (scenario)" value={`${result.co2} kg`} />
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
};

const LandingPage: React.FC<LandingProps> = ({ onStart }) => {
const stats = useMemo(
  () => [
    {
      icon: MapIcon,
      label: "Locations Configured",
      value: "8",
    },
    {
      icon: BarChart3,
      label: "Shipments in Dataset",
      value: "2",
    },
    {
      icon: Radar,
      label: "Events Logged",
      value: "16",
    },
    {
      icon: Route,
      label: "Route Plans Created",
      value: "3",
    },
  ],
  []
);



  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-slate-950 text-slate-100 scroll-smooth">
      {/* Background blobs */}
      <div
        className={`${blob} -top-24 left-10 h-72 w-72 rounded-full bg-teal-500/30`}
      />
      <div
        className={`${blob} -bottom-32 right-10 h-80 w-80 rounded-full bg-cyan-400/20`}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_60%)]" />

      {/* Main content wrapper with proper z-index */}
      <div className="relative z-10">
        {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/70 bg-slate-950/70 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">

          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
            <div className="flex items-center gap-2 text-slate-50">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 text-slate-950 shadow-md">
                <Scan className="h-5 w-5" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-tight">
                  Intelligent Route Optimiser
                </span>
                <span className="text-[11px] text-slate-400">
                  Multi-Modal Transport
                </span>
              </div>
            </div>

            <nav className="hidden items-center gap-5 text-[13px] text-slate-300 md:flex relative z-50">
              <a className="hover:text-teal-300 transition" href="#problem">
                Problem
              </a>
              <a className="hover:text-teal-300 transition" href="#uniqueness">
                Uniqueness
              </a>
              <a className="hover:text-teal-300 transition" href="#applications">
                Applications
              </a>
              <a className="hover:text-teal-300 transition" href="#sdg">
                SDG Impact
              </a>
              <a
                className="hover:text-teal-300 transition"
                href="#implementation"
              >
                Implementation
              </a>
              <button
                onClick={onStart}
                className="rounded-xl border border-slate-600 bg-slate-900/80 px-4 py-2 text-[13px] font-medium text-slate-50 shadow-sm hover:border-teal-300/60 hover:text-teal-50"
              >
                Open Dashboard
              </button>
            </nav>
          </div>
        </header>

        {/* HERO */}
        <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 pb-16 pt-10 md:grid-cols-2 md:px-8 md:pb-24 lg:pb-28">
          {/* Left: Text */}
          <motion.div initial="hidden" animate="show" variants={vFadeUp}>
            <Pill>Phase-1 Prototype · Road Routing + Dashboard</Pill>
            <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-slate-50 md:text-5xl lg:text-6xl">
              Intelligent routing for{" "}
              <span className="bg-gradient-to-r from-teal-200 to-cyan-200 bg-clip-text text-transparent">
                multi-modal logistics
              </span>{" "}
              starting with road networks.
            </h1>
            <p className="mt-4 max-w-xl text-sm md:text-base text-slate-300">
              An intelligent routing prototype that helps logistics teams plan cost-, time-, and CO₂-aware shipments across their own depots and hubs. It demonstrates road-network planning and live shipment visibility, with clear scope for delay prediction and future multi-modal expansion.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#demo"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 px-5 py-2.5 text-sm font-medium text-slate-950 shadow-md transition active:scale-[.98]"
              >
                <Rocket className="h-4 w-4" /> Try dashboard demo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#problem"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-5 py-2.5 text-sm text-slate-100 shadow-sm backdrop-blur hover:border-teal-300/60"
              >
                <MapIcon className="h-4 w-4 text-teal-300" /> Why we built this
              </a>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((s) => (
                <Kpi key={s.label} icon={s.icon} label={s.label} value={s.value} />
              ))}
            </div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-3xl border border-slate-700/70 bg-gradient-to-br from-slate-900/80 via-slate-900 to-slate-950 p-4 shadow-2xl backdrop-blur-xl">
              <div className="grid grid-cols-12 gap-1.5 md:gap-2">
                {[...Array(48)].map((_, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.02 * idx }}
                    className="aspect-square rounded-md bg-gradient-to-br from-slate-800/60 to-slate-900/70"
                  />
                ))}
              </div>
              {/* “Route” overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <svg
                  className="pointer-events-none absolute left-0 top-0 h-full w-full"
                  viewBox="0 0 800 400"
                  fill="none"
                >
                  <defs>
                    <linearGradient id="routeGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#2dd4bf" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M30 320 C 200 280, 180 80, 400 120 S 620 320, 770 200"
                    stroke="url(#routeGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </motion.div>
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={vFloat}
                className="absolute left-6 top-[72%]"
              >
                <div className="flex items-center gap-2 rounded-xl bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-100 shadow-sm">
                  <Truck className="h-3.5 w-3.5 text-teal-300" /> Vehicle: VR-102 ·
                  On time
                </div>
              </motion.div>
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={vFloat}
                className="absolute right-6 top-[28%]"
              >
                <div className="flex items-center gap-2 rounded-xl bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-100 shadow-sm">
                  <Gauge className="h-3.5 w-3.5 text-cyan-300" /> ETA: 7.5 hrs
                </div>
              </motion.div>
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={vFloat}
                className="absolute right-6 bottom-6"
              >
                <div className="flex items-center gap-2 rounded-xl bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-100 shadow-sm">
                  <Leaf className="h-3.5 w-3.5 text-emerald-300" /> CO₂e: 95 kg
                  (sim.)
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

      {/* PROBLEM STATEMENT */}
<section
  id="problem"
  className="scroll-mt-24 border-t border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900"
>
  <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
    <SectionHeader
      eyebrow="Problem Statement"
      title="Why a normal map is not enough"
      subtitle="Logistics teams don’t just need directions; they need network-level planning under real-world constraints."
    />

    <div className="mx-auto max-w-5xl">
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/80 p-6 md:p-8 shadow-xl backdrop-blur-xl">
        {/* soft glow */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-400/5 via-transparent to-cyan-400/5" />

        <div className="relative z-10 grid gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
          {/* Left: quick summary */}
          <div className="space-y-4 border-b border-slate-800 pb-6 md:border-b-0 md:border-r md:pb-0 md:pr-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/90 px-3 py-1 text-[11px] font-medium text-teal-200 ring-1 ring-teal-400/40">
              <AlertTriangle className="h-3.5 w-3.5" />
              Core pain point
            </div>
            <p className="text-sm font-medium text-slate-100">
              Existing map tools optimise a single trip. Real logistics needs{" "}
              <span className="text-teal-200">fleet-level, constraint-aware planning</span>.
            </p>
            <ul className="space-y-2 text-xs md:text-sm text-slate-300 list-disc list-inside">
              <li>Many vehicles, many shipments, multiple depots at once.</li>
              <li>Time windows, depot cut-offs, driver hours, fuel and toll cost.</li>
              <li>Need to balance cost, time and CO₂ — not just shortest ETA.</li>
            </ul>
          </div>

          {/* Right: your detailed explanation */}
          <div className="space-y-4 text-sm leading-relaxed text-slate-200/90">
            <p>
              Tools like Google Maps are excellent for{" "}
              <span className="font-medium">
                one driver going from point A to point B
              </span>
              . Real operations are different: companies must coordinate{" "}
              <span className="font-medium">
                many vehicles, many shipments, and multiple depots
              </span>{" "}
              at the same time.
            </p>
            <p>
              They face questions such as: Which vehicle should serve which
              customers? In what order? Can we respect{" "}
              <span className="font-medium">
                time windows, depot cut-offs, driver hours, and fuel cost
              </span>{" "}
              while also reducing CO₂ emissions?
            </p>
            <p>
              Our project targets this gap. It provides a backend and
              dashboard that represent an organisation’s{" "}
              <span className="font-medium">
                own depots, hubs, and constraints
              </span>{" "}
              and computes routes that are meaningful at{" "}
              <span className="font-medium">network level</span>, not just for
              a single trip.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>


        {/* UNIQUENESS */}
        <section
          id="uniqueness"
          className="scroll-mt-24 border-t border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900"
        >
          <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
            <SectionHeader
              eyebrow="Uniqueness"
              title="How this differs from Google Maps and similar tools"
              subtitle="Custom logistics graph, multi-objective routing, ML hooks, and full control over how routes are chosen."
            />
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 text-sm text-slate-200/90 md:grid-cols-2">
              <GlassCard>
                <h3 className="mb-3 text-base font-semibold text-slate-50">
                  Key differentiators
                </h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li>
                    <span className="font-medium">Org-specific data:</span>{" "}
                    depots, hubs, and private roads stored in PostgreSQL +
                    PostGIS, not just generic public maps.
                  </li>
                  <li>
                    <span className="font-medium">Multi-objective cost:</span>{" "}
                    explicit modelling of cost, time, and CO₂e instead of only
                    travel time.
                  </li>
                  <li>
                    <span className="font-medium">Multi-modal ready:</span>{" "}
                    data model supports road, rail, sea, and air with transfer
                    nodes (even though Phase-1 uses road only).
                  </li>
                  <li>
                    <span className="font-medium">Open and self-hostable:</span>{" "}
                    built with FastAPI, Postgres/PostGIS, OSRM, and React, so
                    SMEs can keep data on-prem if needed.
                  </li>
                </ul>
              </GlassCard>
              <GlassCard>
                <h3 className="mb-3 text-base font-semibold text-slate-50">
                  Why not just use Google Maps?
                </h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li>
                    Google Maps optimises a{" "}
                    <span className="font-medium">single route</span>, not a{" "}
                    fleet with many stops, capacity limits, and time windows.
                  </li>
                  <li>
                    It does not expose your organisation’s{" "}
                    <span className="font-medium">cost model</span> (fuel, tolls,
                    labour) or CO₂ trade-offs for experimentation.
                  </li>
                  <li>
                    Internal shipment data, SLAs, and{" "}
                    <span className="font-medium">
                      what-if simulations
                    </span>{" "}
                    cannot be tightly integrated inside the Google Maps UI.
                  </li>
                  <li>
                    Our system is designed to plug in{" "}
                    <span className="font-medium">ML models</span> for delay
                    prediction and optimisation in a transparent and
                    controllable way.
                  </li>
                </ul>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* APPLICATIONS */}
        <section
          id="applications"
          className="scroll-mt-24 border-t border-slate-800/80 bg-slate-950"
        >
          <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
            <SectionHeader
              eyebrow="Applications"
              title="Industries and use cases"
              subtitle="Any organisation that moves goods between multiple locations can use this system."
            />
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 text-sm text-slate-200/90 md:grid-cols-2">
              <GlassCard>
                <h3 className="mb-3 text-base font-semibold text-slate-50">
                  Where it can be used
                </h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Third-party logistics (3PL) and courier companies</li>
                  <li>E-commerce last-mile delivery networks</li>
                  <li>Manufacturing and warehouse supply chains</li>
                  <li>
                    Cold-chain and healthcare logistics (medicines, vaccines)
                  </li>
                  <li>
                    Public distribution systems and government supply networks
                  </li>
                </ul>
              </GlassCard>
              <GlassCard>
                <h3 className="mb-3 text-base font-semibold text-slate-50">
                  Example scenarios
                </h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li>
                    Planning daily grocery or milk delivery routes across urban
                    areas.
                  </li>
                  <li>
                    Moving components between factories and central/regional
                    warehouses.
                  </li>
                  <li>
                    Routing temperature-sensitive medicines with strict time
                    windows and priority orders.
                  </li>
                  <li>
                    Analysing how changes in routing impact cost, service
                    levels, and CO₂ emissions for SMEs.
                  </li>
                </ul>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* SDG IMPACT */}
        <section
          id="sdg"
          className="scroll-mt-24 border-t border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900"
        >
          <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
            <SectionHeader
              eyebrow="Sustainable Development"
              title="SDG goals supported by the project"
              subtitle="Optimised logistics contributes to innovation, sustainable cities, efficient production, and climate action."
            />
            <div className="mx-auto max-w-4xl text-sm text-slate-200/90">
              <GlassCard>
                <ul className="space-y-3 list-disc list-inside">
                  <li>
                    <span className="font-medium">
                      SDG 9 – Industry, Innovation and Infrastructure:
                    </span>{" "}
                    data-driven route optimisation improves utilisation of
                    transport infrastructure and encourages innovation in SME
                    logistics.
                  </li>
                  <li>
                    <span className="font-medium">
                      SDG 11 – Sustainable Cities and Communities:
                    </span>{" "}
                    more efficient routes can reduce congestion, noise, and
                    local pollution in urban deliveries.
                  </li>
                  <li>
                    <span className="font-medium">
                      SDG 12 – Responsible Consumption and Production:
                    </span>{" "}
                    better planning reduces empty runs, wastage, and spoilage in
                    supply chains.
                  </li>
                  <li>
                    <span className="font-medium">
                      SDG 13 – Climate Action:
                    </span>{" "}
                    by surfacing CO₂ alongside cost and time, the system helps
                    decision makers consciously choose lower-emission options.
                  </li>
                </ul>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* IMPLEMENTATION */}
        <section
          id="implementation"
          className="scroll-mt-24 border-t border-slate-800/80 bg-slate-950"
        >
          <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
            <SectionHeader
              eyebrow="Technical Implementation"
              title="How the system is built"
              subtitle="A modular full-stack architecture with clear separation between data, routing, backend APIs, and the dashboard."
            />
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 text-sm text-slate-200/90 md:grid-cols-2">
              <GlassCard>
                <h3 className="mb-3 text-base font-semibold text-slate-50">
                  Architecture layers
                </h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li>
                    <span className="font-medium">Data Layer:</span>{" "}
                    PostgreSQL + PostGIS store locations, depots, shipments,
                    and route geometries with spatial indexes.
                  </li>
                  <li>
                    <span className="font-medium">Routing Layer:</span> OSRM
                    (Docker) provides shortest-path queries over the road
                    network using OpenStreetMap data.
                  </li>
                  <li>
                    <span className="font-medium">Backend Layer:</span> FastAPI
                    orchestrates DB access, calls OSRM, and exposes REST
                    endpoints for the frontend and ML services.
                  </li>
                  <li>
                    <span className="font-medium">Frontend Layer:</span> React +
                    TypeScript dashboard visualises routes on a map and shows
                    KPIs and events for operators.
                  </li>
                </ul>
              </GlassCard>
              <GlassCard>
                <h3 className="mb-3 text-base font-semibold text-slate-50">
                  ML and future extensions
                </h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li>
                    Phase-1 ML: Random Forest-based delay prediction model that
                    uses route features and shipment metadata.
                  </li>
                  <li>
                    Phase-2 ML: vehicle routing / re-routing using heuristics or
                    RL (e.g. DQN) on top of the same graph and APIs.
                  </li>
                  <li>
                    Deployed using Docker Compose, with optional monitoring via
                    Prometheus and Grafana for observability.
                  </li>
                  <li>
                    The dashboard and API contracts are designed so new models
                    can be plugged in without changing the UI.
                  </li>
                </ul>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* DEMO */}
        <section
          id="demo"
          className="scroll-mt-24 border-t border-slate-800/80 bg-slate-950/80"
        >
          <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
            <SectionHeader
              eyebrow="Interactive"
              title="Try the Phase-1 dashboard behaviour"
              subtitle="This UI demo simulates what the real dashboard shows once it is wired to FastAPI, PostgreSQL/PostGIS and OSRM."
            />
            <DemoPanel />
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-slate-800/80 bg-slate-950/90">
          <div className="mx-auto max-w-7xl px-5 pb-10 pt-6 md:px-8">
            <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-slate-300 backdrop-blur md:flex-row">
              <div className="flex items-center gap-2 text-slate-50">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 text-slate-950 shadow-md">
                  <Scan className="h-5 w-5" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold tracking-tight">
                    Intelligent Route Optimiser
                  </span>
                  
                </div>
              </div>
              <div className="text-center text-xs md:text-left">
                Built on focusing an intelligent
                multi-modal logistics planning with cost–time–CO₂ trade-offs.
              </div>
              
            </div>
          
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
