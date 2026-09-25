import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  Activity,
  ShieldAlert,
  Sliders,
  DollarSign,
  Cpu,
  Flame,
  Power,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BatteryCharging,
  Layers,
  ChevronRight,
  Info,
  Server,
  Radio,
  Tv,
  Thermometer,
  ShieldCheck,
  Sparkles,
  Droplets,
  PlugZap,
  ZapOff,
  AlertOctagon,
  LifeBuoy
} from 'lucide-react';
import {
  AreaChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface Appliance {
  id: string;
  name: string;
  category: 'HVAC' | 'Entertainment' | 'Kitchen' | 'EV / High Load' | 'IT / Standby';
  baseWatts: number;
  standbyWatts: number;
  isActive: boolean;
  isStandby: boolean;
  isMitigated: boolean;
  powerFactor: number;
  signatureWave: string;
}

interface TelemetryPoint {
  time: string;
  watts: number;
  amps: number;
  volts: number;
  powerFactor: number;
  isAnomaly: boolean;
}

interface AnomalyLog {
  id: string;
  timestamp: string;
  type: 'Arc Fault' | 'Voltage Sag' | 'Current Spike' | 'Standby Leak' | 'Phase Imbalance';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
  mitigated: boolean;
}

const INITIAL_APPLIANCES: Appliance[] = [
  {
    id: 'app_1',
    name: 'Inverter Refrigerator',
    category: 'Kitchen',
    baseWatts: 180,
    standbyWatts: 15,
    isActive: true,
    isStandby: false,
    isMitigated: false,
    powerFactor: 0.92,
    signatureWave: 'Inductive Motor Peak (5.2A startup)'
  },
  {
    id: 'app_2',
    name: 'Dual Inverter Split AC',
    category: 'HVAC',
    baseWatts: 1650,
    standbyWatts: 12,
    isActive: true,
    isStandby: false,
    isMitigated: false,
    powerFactor: 0.96,
    signatureWave: 'Continuous PWM Inverter Flow'
  },
  {
    id: 'app_3',
    name: 'High-End Gaming Rig & Mon',
    category: 'IT / Standby',
    baseWatts: 580,
    standbyWatts: 54,
    isActive: false,
    isStandby: true,
    isMitigated: false,
    powerFactor: 0.88,
    signatureWave: 'SMPS Capacitive High Ripple'
  },
  {
    id: 'app_4',
    name: 'OLED Smart TV & Soundbar',
    category: 'Entertainment',
    baseWatts: 190,
    standbyWatts: 38,
    isActive: false,
    isStandby: true,
    isMitigated: false,
    powerFactor: 0.82,
    signatureWave: 'Sleep State Optical Receiver Bleed'
  },
  {
    id: 'app_5',
    name: 'EV Level 2 Fast Charger',
    category: 'EV / High Load',
    baseWatts: 3300,
    standbyWatts: 8,
    isActive: false,
    isStandby: false,
    isMitigated: false,
    powerFactor: 0.99,
    signatureWave: 'High-Ampere Continuous DC Rectified'
  },
  {
    id: 'app_6',
    name: 'Microwave Convection Oven',
    category: 'Kitchen',
    baseWatts: 1200,
    standbyWatts: 18,
    isActive: false,
    isStandby: true,
    isMitigated: false,
    powerFactor: 0.89,
    signatureWave: 'Magnetron Half-Wave Signature'
  }
];

const INITIAL_ANOMALIES: AnomalyLog[] = [
  {
    id: 'ano_1',
    timestamp: '10:42:15 AM',
    type: 'Standby Leak',
    severity: 'WARNING',
    description: 'Continuous phantom load detected in Master Bedroom Gaming PC (54W for >6 hrs).',
    mitigated: false
  },
  {
    id: 'ano_2',
    timestamp: '09:18:02 AM',
    type: 'Voltage Sag',
    severity: 'INFO',
    description: 'Grid voltage dipped to 212V during localized neighborhood transformer surge.',
    mitigated: true
  }
];

export default function VoltGuardApp() {
  const [activeTab, setActiveTab] = useState<'live' | 'nilm' | 'tariff' | 'safety'>('live');
  const [appliances, setAppliances] = useState<Appliance[]>(INITIAL_APPLIANCES);
  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyLog[]>(INITIAL_ANOMALIES);
  const [isSimulatingFault, setIsSimulatingFault] = useState(false);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [monthlyKwh, setMonthlyKwh] = useState(182.4);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  const activeWattage = useMemo(() => {
    let total = 0;
    appliances.forEach((app) => {
      if (app.isMitigated) return;
      if (app.isActive) {
        total += app.baseWatts;
      } else if (app.isStandby) {
        total += app.standbyWatts;
      }
    });
    total += 45;
    if (isSimulatingFault) total += 2400;
    return total;
  }, [appliances, isSimulatingFault]);

  const liveVolts = useMemo(() => {
    if (isSimulatingFault) return 198.5 + (Math.random() * 4 - 2);
    return 230 + (Math.random() * 3.5 - 1.75);
  }, [isSimulatingFault]);

  const liveAmps = useMemo(() => {
    return parseFloat((activeWattage / (liveVolts * 0.95)).toFixed(2));
  }, [activeWattage, liveVolts]);

  const vampireTotalWatts = useMemo(() => {
    return appliances.reduce((sum, app) => {
      if (!app.isActive && app.isStandby && !app.isMitigated) {
        return sum + app.standbyWatts;
      }
      return sum;
    }, 0);
  }, [appliances]);

  const dailyEstimatedCost = useMemo(() => {
    const kwhPerDay = (activeWattage * 24) / 1000;
    return (kwhPerDay * 0.18).toFixed(2);
  }, [activeWattage]);

  useEffect(() => {
    const initialPoints: TelemetryPoint[] = [];
    const now = new Date();
    for (let i = 15; i >= 0; i--) {
      const pastTime = new Date(now.getTime() - i * 3000);
      initialPoints.push({
        time: pastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        watts: Math.max(200, activeWattage + (Math.random() * 80 - 40)),
        amps: Math.max(0.9, (activeWattage + (Math.random() * 80 - 40)) / (230 * 0.95)),
        volts: 230 + (Math.random() * 2 - 1),
        powerFactor: 0.94 + (Math.random() * 0.04 - 0.02),
        isAnomaly: false
      });
    }
    setHistory(initialPoints);
  }, []);

  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const newPoint: TelemetryPoint = {
        time: timeStr,
        watts: Math.max(50, activeWattage + (Math.random() * 40 - 20)),
        amps: parseFloat(liveAmps.toFixed(2)),
        volts: parseFloat(liveVolts.toFixed(1)),
        powerFactor: parseFloat((0.93 + Math.random() * 0.05).toFixed(2)),
        isAnomaly: isSimulatingFault
      };

      setHistory((prev) => [...prev.slice(1), newPoint]);
      setMonthlyKwh((prev) => prev + (activeWattage / 3600000) * 15);
    }, 1500);

    return () => clearInterval(interval);
  }, [isLiveStreaming, activeWattage, liveAmps, liveVolts, isSimulatingFault]);

  const toggleApplianceState = (id: string, newMode: 'ON' | 'STANDBY' | 'OFF') => {
    setAppliances((prev) =>
      prev.map((app) => {
        if (app.id !== id) return app;
        if (newMode === 'ON') {
          return { ...app, isActive: true, isStandby: false, isMitigated: false };
        } else if (newMode === 'STANDBY') {
          return { ...app, isActive: false, isStandby: true, isMitigated: false };
        } else {
          return { ...app, isActive: false, isStandby: false, isMitigated: true };
        }
      })
    );
  };

  const mitigateAllVampireLoads = () => {
    setAppliances((prev) =>
      prev.map((app) => (app.isStandby ? { ...app, isMitigated: true, isStandby: false } : app))
    );
    showToast('⚡ Instant Smart Cutoff: Disconnected all inactive standby loads!');

    const newLog: AnomalyLog = {
      id: `ano_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'Standby Leak',
      severity: 'INFO',
      description: `Auto-mitigated ${vampireTotalWatts}W of active vampire load across smart plugs.`,
      mitigated: true
    };
    setAnomalies((prev) => [newLog, ...prev]);
  };

  const triggerFaultSimulation = () => {
    setIsSimulatingFault(true);
    showToast('⚠️ WARNING: Simulated Arcing / Ground Spike Triggered!');

    const newLog: AnomalyLog = {
      id: `ano_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'Arc Fault',
      severity: 'CRITICAL',
      description: 'Micro-arcing fault signature detected on Sub-panel 2! Instant cutoff isolation recommended.',
      mitigated: false
    };
    setAnomalies((prev) => [newLog, ...prev]);

    setTimeout(() => {
      setIsSimulatingFault(false);
    }, 8000);
  };

  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 4000);
  };

  const slabLimit1 = 100;
  const slabLimit2 = 200;
  const currentSlabTier = monthlyKwh <= slabLimit1 ? 1 : monthlyKwh <= slabLimit2 ? 2 : 3;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Dynamic Toast Alert */}
      {notificationToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-500 text-slate-950 px-5 py-3 rounded-xl shadow-2xl font-semibold border border-emerald-300 animate-bounce">
          <Sparkles className="w-5 h-5 animate-spin" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
         <img
  src="/logo.png"
  alt="VoltGuard AI Shield Logo"
  className="h-11 w-11 object-contain rounded-xl drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]"
/>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                VoltGuard AI
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full tracking-wider uppercase">
                IoT Edge v3.4
              </span>
            </div>
            <p className="text-xs text-slate-400">Smart Grid & Phantom-Load Breaker Intelligence</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-3">
          <nav className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === 'live' ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Live Telemetry</span>
            </button>
            <button
              onClick={() => setActiveTab('nilm')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === 'nilm' ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>NILM & Vampire</span>
            </button>
            <button
              onClick={() => setActiveTab('tariff')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === 'tariff' ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Tariff Slab</span>
            </button>
            <button
              onClick={() => setActiveTab('safety')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === 'safety' ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Fault Safety</span>
            </button>
          </nav>

          <div className="hidden sm:flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${isSimulatingFault ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
            <span className="font-mono text-slate-300">{isSimulatingFault ? 'FAULT DETECTED' : '1.5s STREAM'}</span>
            <button onClick={() => setIsLiveStreaming(!isLiveStreaming)} className="ml-1 text-slate-400 hover:text-white">
              <RefreshCw className={`w-3.5 h-3.5 ${isLiveStreaming ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Simulation Bar */}
        <section className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Live Household Appliance Simulation Rig
              </h2>
              <p className="text-xs text-slate-400">Toggle live appliance loads to simulate AI decomposition & grid response.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => toggleApplianceState('app_2', appliances.find(a => a.id === 'app_2')?.isActive ? 'OFF' : 'ON')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                appliances.find(a => a.id === 'app_2')?.isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Thermometer className="w-3.5 h-3.5" />
              Heavy AC (1.65 kW)
            </button>

            <button
              onClick={() => toggleApplianceState('app_5', appliances.find(a => a.id === 'app_5')?.isActive ? 'OFF' : 'ON')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                appliances.find(a => a.id === 'app_5')?.isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <BatteryCharging className="w-3.5 h-3.5" />
              EV Charger (3.3 kW)
            </button>

            <button
              onClick={() => toggleApplianceState('app_3', appliances.find(a => a.id === 'app_3')?.isStandby ? 'OFF' : 'STANDBY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                appliances.find(a => a.id === 'app_3')?.isStandby
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              PC Vampire (54W)
            </button>

            <button
              onClick={triggerFaultSimulation}
              disabled={isSimulatingFault}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 transition-all shadow-lg"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              {isSimulatingFault ? 'Simulating Fault...' : 'Inject Arc Fault'}
            </button>
          </div>
        </section>

        {/* 4 Critical Metric Gauges */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Real Power</span>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono">{activeWattage.toLocaleString()}</span>
              <span className="text-sm font-bold text-emerald-400">Watts</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <TrendingUp className="w-3 h-3" /> NILM Parsed
              </span>
              <span>• Cos φ: 0.96</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">RMS Current Draw</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono">{liveAmps}</span>
              <span className="text-sm font-bold text-cyan-400">Amperes</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span>Main Limit: 40.0A</span>
              <span className="font-mono text-cyan-300 font-semibold">{((liveAmps / 40) * 100).toFixed(0)}% Load</span>
            </div>
          </div>

          <div className={`bg-slate-900 border rounded-2xl p-5 transition-all ${isSimulatingFault ? 'border-rose-500/60 bg-rose-950/20' : 'border-slate-800'}`}>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Grid RMS Voltage</span>
              <Radio className={`w-4 h-4 ${isSimulatingFault ? 'text-rose-400 animate-spin' : 'text-teal-400'}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black font-mono ${isSimulatingFault ? 'text-rose-400' : 'text-white'}`}>
                {liveVolts.toFixed(1)}
              </span>
              <span className="text-sm font-bold text-teal-400">Volts</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span>{isSimulatingFault ? 'Sag Condition' : 'Nominal 50.0 Hz'}</span>
              <span>Tolerance ±5%</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Vampire Waste</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-400 font-mono">{vampireTotalWatts}</span>
              <span className="text-sm font-bold text-slate-300">W (${dailyEstimatedCost}/d)</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="text-amber-300/80">{appliances.filter(a => a.isStandby).length} idle vampire devices</span>
              <button onClick={mitigateAllVampireLoads} className="text-xs text-amber-400 hover:underline font-bold">Auto-Cut</button>
            </div>
          </div>
        </section>

        {/* TAB 1: Live Telemetry */}
        {activeTab === 'live' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Real-Time High-Frequency Power Stream
                </h3>
                <p className="text-xs text-slate-400 mb-4">Edge telemetry streamed dynamically at 1.5s intervals</p>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="watts" name="Active Watts" stroke="#10B981" strokeWidth={2.5} fill="url(#powerGrad)" />
                      <Line type="monotone" dataKey={(d) => d.amps * 100} name="Amperes (x100)" stroke="#06B6D4" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                <span>Sampling: <strong>1000 Hz Edge FFT</strong></span>
                <span>Current Distortion (THD): <strong className="text-emerald-400">1.8%</strong></span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  NILM Current Breakdown
                </h3>
                <p className="text-xs text-slate-400 mb-4">Transient current wave disaggregation:</p>
                <div className="space-y-3">
                  {appliances.map((app) => {
                    const power = app.isActive ? app.baseWatts : app.isStandby && !app.isMitigated ? app.standbyWatts : 0;
                    const percentage = activeWattage > 0 ? ((power / activeWattage) * 100).toFixed(0) : '0';
                    return (
                      <div key={app.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-200">{app.name}</span>
                          <span className="font-mono text-slate-300 font-bold">{power} W ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full ${app.isActive ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Unmetered Base: <strong>45 W</strong></span>
                <button onClick={() => setActiveTab('nilm')} className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold">
                  Details <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NILM & Vampire */}
        {activeTab === 'nilm' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  Phantom Load Neutralizer
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Devices drawing continuous quiescent current in standby state. Auto-mitigate disconnects smart breakers to prevent billing leakage.
                </p>
              </div>
              <button
                onClick={mitigateAllVampireLoads}
                disabled={vampireTotalWatts === 0}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-2 shadow-lg disabled:opacity-50 active:scale-95 transition-all"
              >
                <Power className="w-4 h-4" />
                Instant Auto-Mitigate ({vampireTotalWatts}W)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appliances.map((app) => (
                <div key={app.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{app.category}</span>
                        <h4 className="text-base font-bold text-white">{app.name}</h4>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${app.isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : app.isStandby ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        {app.isActive ? 'ACTIVE' : app.isStandby ? 'VAMPIRE STANDBY' : 'OFFLINE'}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5 mb-4">
                      <div className="flex justify-between text-slate-400"><span>Signature:</span><span className="text-slate-200">{app.signatureWave}</span></div>
                      <div className="flex justify-between text-slate-400"><span>Standby Draw:</span><span className="font-bold text-amber-400">{app.standbyWatts} W</span></div>
                      <div className="flex justify-between text-slate-400"><span>Active Draw:</span><span className="font-bold text-emerald-400">{app.baseWatts} W</span></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleApplianceState(app.id, app.isActive ? 'OFF' : 'ON')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${app.isActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                      {app.isActive ? 'Turn Off' : 'Turn On'}
                    </button>
                    <button onClick={() => toggleApplianceState(app.id, app.isStandby ? 'OFF' : 'STANDBY')} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200">
                      Standby
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Tariff Slab */}
        {activeTab === 'tariff' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    Monthly Tariff Slab Forecaster
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">Real-time quota monitoring to prevent progressive billing tier step-ups.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-mono">Current Month</span>
                  <p className="text-2xl font-black text-white font-mono">{monthlyKwh.toFixed(2)} kWh</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>0 kWh (Base: $0.12)</span>
                  <span>Slab 1: 100 kWh ($0.18)</span>
                  <span>Slab 2: 200 kWh ($0.28)</span>
                  <span>300+ kWh ($0.45)</span>
                </div>
                <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800 p-0.5">
                  <div className="h-full bg-emerald-500 rounded-l-full" style={{ width: `${Math.min(33.3, (monthlyKwh / 300) * 100)}%` }} />
                  <div className="h-full bg-amber-400" style={{ width: `${monthlyKwh > slabLimit1 ? Math.min(33.3, ((monthlyKwh - slabLimit1) / 300) * 100) : 0}%` }} />
                  <div className="h-full bg-rose-500 rounded-r-full" style={{ width: `${monthlyKwh > slabLimit2 ? Math.min(33.3, ((monthlyKwh - slabLimit2) / 300) * 100) : 0}%` }} />
                </div>
              </div>

              <div className="mt-5 p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span><strong>AI Strategy:</strong> Shift EV charging past <strong>8:00 PM</strong> to avoid entering Slab 3 tier penalty.</span>
                </div>
                <button onClick={() => showToast('📅 Smart Schedule Applied!')} className="px-3 py-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-lg font-bold">Apply</button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Hourly TOU Pricing vs Projected Demand
              </h4>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { hour: '12 AM', tariff: 0.12, load: 0.4 },
                    { hour: '6 AM', tariff: 0.15, load: 1.1 },
                    { hour: '12 PM', tariff: 0.22, load: 2.3 },
                    { hour: '6 PM (Peak)', tariff: 0.42, load: 3.8 },
                    { hour: '9 PM', tariff: 0.24, load: 1.9 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                    <Bar dataKey="tariff" name="Tariff ($/kWh)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="load" name="Load (kW)" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Fault Safety */}
        {activeTab === 'safety' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Electrical Anomaly & Arc-Fault Hub
                </h3>
                <p className="text-xs text-slate-400">Isolates micro-arcing and loose terminal faults before physical circuit breakers trip.</p>
              </div>
              <button onClick={triggerFaultSimulation} className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all">
                Test Injection
              </button>
            </div>

            <div className="space-y-3">
              {anomalies.map((ano) => (
                <div key={ano.id} className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${ano.severity === 'CRITICAL' && !ano.mitigated ? 'bg-rose-950/30 border-rose-500/50 animate-pulse' : 'bg-slate-900 border-slate-800'}`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{ano.type}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">{ano.severity}</span>
                        <span className="text-xs text-slate-500 font-mono">{ano.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">{ano.description}</p>
                    </div>
                  </div>
                  <div>
                    {ano.mitigated ? (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                        <CheckCircle2 className="w-4 h-4" /> Mitigated
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setAnomalies(prev => prev.map(a => a.id === ano.id ? { ...a, mitigated: true } : a));
                          showToast('✅ Circuit safely isolated and protected!');
                        }}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all active:scale-95 shadow-md shadow-emerald-500/20"
                      >
                        Isolate Fault
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- ELECTRICAL SAFETY RULES SECTION --- */}
        <section className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/30 text-amber-400">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>⚠️ Household Electrical Safety Rules</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">Standard NFPA 70E</span>
                </h3>
                <p className="text-xs text-slate-400">Essential precautions to prevent electric shocks, circuit overloads, and fire hazards.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {/* Rule 1 */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 hover:border-cyan-500/40 transition-all group">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 group-hover:scale-105 transition-all">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-cyan-300">1. Keep Water Away</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Never touch switches, sockets, or plugs with wet hands. Keep electrical appliances away from sinks, bathtubs, and damp floors.
                  </p>
                </div>
              </div>
            </div>

            {/* Rule 2 */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 hover:border-amber-500/40 transition-all group">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 group-hover:scale-105 transition-all">
                  <PlugZap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-300">2. Avoid Socket Overload</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Do not plug multiple heavy appliances (AC, heater, iron) into one multi-plug adapter or single extension cord.
                  </p>
                </div>
              </div>
            </div>

            {/* Rule 3 */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 hover:border-rose-500/40 transition-all group">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 group-hover:scale-105 transition-all">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-300">3. Unplug Heating Appliances</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Always turn off and unplug clothes irons, room heaters, toaster ovens, and water geysers right after use.
                  </p>
                </div>
              </div>
            </div>

            {/* Rule 4 */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 hover:border-red-500/40 transition-all group">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 group-hover:scale-105 transition-all">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-300">4. Do Not Use Broken Wires</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Never use cracked, frayed, cut, or tape-covered cords. Exposed copper wires create dangerous arc faults. Replace them immediately.
                  </p>
                </div>
              </div>
            </div>

            {/* Rule 5 */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 hover:border-emerald-500/40 transition-all group">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 group-hover:scale-105 transition-all">
                  <Power className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-300">5. Pull the Plug, Not Wire</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Always grip the hard plastic head of the plug to remove it from the wall outlet. Yanking the cable loosens internal terminals.
                  </p>
                </div>
              </div>
            </div>

            {/* Rule 6 */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 hover:border-purple-500/40 transition-all group">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400 group-hover:scale-105 transition-all">
                  <ZapOff className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-purple-300">6. Emergency Action (MCB)</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    In case of visible sparks, burning smell, smoke, or electric shock, immediately switch off the Main MCB Breaker on your distribution board.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 px-4 lg:px-8 py-4 text-xs text-slate-500 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Server className="w-3.5 h-3.5 text-emerald-400" />
          <span>VoltGuard AI • Production Smart Grid Node</span>
        </div>
        <span>© {new Date().getFullYear()} VoltGuard AI. All rights reserved.</span>
      </footer>
    </div>
  );
}