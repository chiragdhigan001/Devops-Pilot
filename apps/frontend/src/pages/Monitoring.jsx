import { useState, useEffect, useRef, useEffectEvent } from 'react';
import { motion } from 'framer-motion';
import { monitoringAPI } from '../api/client';

const CHART_WIDTH = 520;
const CHART_HEIGHT = 150;

export default function Monitoring() {
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [insights, setInsights] = useState([]);
  const [alertTick, setAlertTick] = useState(0);
  const [uptimeData, setUptimeData] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [chartPath, setChartPath] = useState('');
  const [displayStats, setDisplayStats] = useState({ networkInbound: '1.0 Gbps', networkBarWidth: '30%', alertCount: 1, uptimeAverage: '99.500% AVG', queryRateTop: '4.0k', queryRateMid: '2.0k' });
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const logTail = useRef(null);

  const generateUptime = () =>
    Array.from({ length: 24 }, () => Math.round(70 + Math.random() * 30));

  const generateHeatmap = () =>
    Array.from({ length: 144 }, () => Math.random());

  const generateChartPath = () => {
    const points = Array.from({ length: 30 }, (_, i) => ({
      x: Math.round((i / 29) * CHART_WIDTH),
      y: Math.round(CHART_HEIGHT - Math.random() * CHART_HEIGHT),
    }));
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
    return `${d} L${CHART_WIDTH} ${CHART_HEIGHT} L0 ${CHART_HEIGHT} Z`;
  };

  const refreshMonitoring = useEffectEvent(async () => {
    try {
      setError('');
      const [mRes, lRes, iRes] = await Promise.all([
        monitoringAPI.getMetrics(),
        monitoringAPI.getLogs(3),
        monitoringAPI.getInsights(),
      ]);
      setMetrics(mRes.data);
      setInsights(iRes.data);
      setLogs((prev) => {
        const next = [...prev, ...lRes.data];
        return next.length > 30 ? next.slice(next.length - 30) : next;
      });
      setUptimeData(generateUptime());
      setHeatmap(generateHeatmap());
      setChartPath(generateChartPath());
      setDisplayStats({
        networkInbound: `${(1 + Math.random() * 0.5).toFixed(1)} Gbps`,
        networkBarWidth: `${Math.round(30 + Math.random() * 20)}%`,
        alertCount: 1 + Math.floor(Math.random() * 3),
        uptimeAverage: `${(99.5 + Math.random() * 0.5).toFixed(3)}% AVG`,
        queryRateTop: `${(Math.random() * 2 + 4).toFixed(1)}k`,
        queryRateMid: `${(Math.random() * 2 + 2).toFixed(1)}k`,
      });
      setCurrentTime(Date.now());
      setAlerts([{
        severity: alertTick % 3 === 0 ? 'Critical' : alertTick % 3 === 1 ? 'Warning' : 'Info',
        title: alertTick % 3 === 0
          ? `Pod 'api-gateway-${Math.floor(Math.random() * 100)}' crash loop`
          : alertTick % 3 === 1
            ? `High Latency in ${['EU-WEST-1', 'US-EAST-2', 'AP-SOUTHEAST-1'][alertTick % 3]}`
            : `Scaling initiated: workers-v${Math.floor(Math.random() * 5)}`,
        desc: alertTick % 3 === 0
          ? 'Exit code 137 (OOMKilled) detected.'
          : alertTick % 3 === 1
            ? `Response times exceeded ${400 + Math.floor(Math.random() * 100)}ms.`
            : 'AI predicted load spike. Scaling to 12 nodes.',
        border: alertTick % 3 === 0 ? 'border-error' : alertTick % 3 === 1 ? 'border-secondary' : 'border-primary-fixed',
        text: alertTick % 3 === 0 ? 'text-error' : alertTick % 3 === 1 ? 'text-secondary' : 'text-primary-fixed',
      }]);
      setAlertTick((t) => t + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load monitoring data');
    }
  });

  useEffect(() => {
    const runRefresh = async () => {
      await refreshMonitoring();
    };

    const timeoutId = setTimeout(() => {
      void runRefresh();
    }, 0);
    const interval = setInterval(runRefresh, 3000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (logTail.current) logTail.current.scrollTop = logTail.current.scrollHeight;
  }, [logs]);

  const cpu = metrics?.cpu ?? [];
  const ram = metrics?.ram ?? [];
  const lastCpu = cpu[cpu.length - 1]?.value ?? 0;
  const lastRam = ram[ram.length - 1]?.value ?? 0;
  const lowCpu = cpu.length > 0 ? Math.min(...cpu.map((c) => c.value)) : 0;
  const highCpu = cpu.length > 0 ? Math.max(...cpu.map((c) => c.value)) : 0;

  const cpuTrend = lowCpu > 0 ? (((lastCpu - lowCpu) / lowCpu) * 100).toFixed(1) : '0.0';
  const ramTrend = lastRam > 0 ? (((lastRam - ram[0]?.value || lastRam) / (ram[0]?.value || lastRam)) * 100).toFixed(1) : '0.0';
  const logColors = (line) => {
    const parts = line.split(' ');
    const level = parts[1]?.replace(':', '');
    switch (level) {
      case 'INFO': return { level: 'text-secondary', time: 'text-primary-fixed-dim' };
      case 'WARN': return { level: 'text-warning', time: 'text-primary-fixed-dim' };
      case 'ERROR': return { level: 'text-error', time: 'text-primary-fixed-dim' };
      case 'SUCCESS': return { level: 'text-primary-fixed', time: 'text-primary-fixed-dim' };
      case 'DEBUG': return { level: 'text-primary-fixed', time: 'text-primary-fixed-dim' };
      default: return { level: 'text-on-surface-variant', time: 'text-primary-fixed-dim' };
    }
  };

  return (
    <motion.div key={alertTick} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="font-headline text-2xl text-primary-fixed tracking-tight">System Monitoring</h2>
          <p className="text-on-surface-variant font-body-sm mt-1">Global infrastructure health and AI-predicted anomalies.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 glass-panel rounded-lg border border-outline/30">
          <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse" />
          <span className="font-mono text-[10px] text-primary-fixed uppercase tracking-wider">Live Data Feed — 3s</span>
        </div>
      </header>

      {error && (
        <div className="bg-error-container/20 border border-error/30 text-error rounded-lg p-3 text-sm font-mono mb-6">{error}</div>
      )}

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 lg:col-span-9 grid grid-cols-3 gap-gutter">
          {[
            { title: 'CLUSTER CPU USAGE', value: `${lastCpu.toFixed(1)}%`, trend: `${cpuTrend.startsWith('-') ? '' : '+'}${cpuTrend}%`, trendUp: cpuTrend > 0, color: 'text-primary', barW: `${lastCpu}%` },
            { title: 'MEMORY ALLOCATION', value: `${lastRam.toFixed(1)}%`, trend: `${ramTrend.startsWith('-') ? '' : '+'}${ramTrend}%`, trendUp: ramTrend > 0, color: 'text-secondary', barW: `${lastRam}%` },
            { title: 'NETWORK INBOUND', value: displayStats.networkInbound, sub: 'Stable', color: 'text-primary', barW: displayStats.networkBarWidth, pulse: true },
          ].map((s, i) => (
            <div key={i} className="glass-panel rounded-xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-fixed/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary-fixed/10 transition-all" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">{s.title}</p>
              <div className="flex items-end gap-3">
                <span className={`font-headline text-2xl ${s.color}`}>{s.value}</span>
                {s.trend && <span className={`font-body-sm mb-1 flex items-center text-sm ${s.trendUp ? 'text-secondary' : 'text-primary-fixed-dim'}`}>
                  <span className="material-symbols-outlined text-sm">{s.trendUp ? 'trending_up' : 'trending_down'}</span>{s.trend}
                </span>}
                {s.sub && <span className="font-body-sm text-on-surface-variant mb-1">{s.sub}</span>}
              </div>
              <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r from-primary-fixed-dim to-primary rounded-full ${s.pulse ? 'animate-pulse' : ''}`}
                  style={{ width: s.barW, boxShadow: '0 0 10px rgba(0,219,231,0.3)' }} />
              </div>
              <div className="mt-3 flex justify-between font-mono text-[9px] text-on-surface-variant/40">
                <span>Min: {i === 0 ? `${lowCpu.toFixed(0)}%` : i === 1 ? `${(lastRam - 10).toFixed(0)}%` : '0.8 Gbps'}</span>
                <span>Max: {i === 0 ? `${highCpu.toFixed(0)}%` : i === 1 ? `${Math.min(lastRam + 10, 100).toFixed(0)}%` : '1.8 Gbps'}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="col-span-12 lg:col-span-3 glass-panel rounded-xl flex flex-col">
          <div className="p-6 border-b border-outline/10">
            <h3 className="font-headline text-sm text-primary flex items-center justify-between">
              Live Alerts <span className="bg-error-container/20 text-error px-2 py-0.5 rounded text-[10px] uppercase font-bold animate-pulse">{displayStats.alertCount} Active</span>
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
            {alerts.map((a, i) => (
              <motion.div key={`${alertTick}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
                className={`p-4 rounded-xl bg-white/5 border-l-4 ${a.border}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-mono text-[10px] uppercase tracking-widest ${a.text}`}>{a.severity}</span>
                  <span className="font-mono text-[10px] text-on-surface-variant">just now</span>
                </div>
                <p className="font-body-sm text-white font-semibold">{a.title}</p>
                <p className="font-body-sm text-on-surface-variant text-[12px] mt-1">{a.desc}</p>
              </motion.div>
            ))}
            {insights.slice(0, 2).map((ins, i) => (
              <motion.div key={`ins-${alertTick}-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-3 rounded-xl bg-white/[0.02] border border-outline/10">
                <p className="font-body-sm text-on-surface-variant text-[12px]">{ins.text}</p>
                <span className="font-mono text-[9px] text-primary-fixed-dim/50 mt-1 block">
                  {Math.floor((currentTime - new Date(ins.time).getTime()) / 60000)}m ago
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9 glass-panel rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline text-lg text-primary flex items-center gap-2">
              <span className="material-symbols-outlined">bolt</span> Uptime Monitor
            </h3>
            <span className="font-mono text-xs text-primary-fixed-dim">{displayStats.uptimeAverage}</span>
          </div>
          <div className="h-40 flex items-end gap-1 px-2">
            {uptimeData.map((h, i) => (
              <div key={i} className={`flex-1 rounded-t-sm transition-all duration-300 cursor-pointer ${
                h < 50 ? 'bg-error-container/60 hover:bg-error' : 'bg-primary-fixed/40 hover:bg-primary-fixed'
              }`} style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="flex justify-between mt-4 border-t border-outline/10 pt-4 px-2">
            <span className="font-mono text-[10px] text-on-surface-variant/50">24h AGO</span>
            <span className="font-mono text-[10px] text-on-surface-variant/50">NOW (SYNCED)</span>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 glass-panel rounded-xl p-6">
          <h3 className="font-headline text-sm text-primary mb-4">Traffic Latency Heatmap</h3>
          <div className="grid grid-cols-[repeat(24,1fr)] gap-1 h-40">
            {heatmap.map((opacity, i) => (
              <div key={i} className="rounded-sm transition-transform hover:scale-125" style={{ backgroundColor: `rgba(0, 219, 231, ${opacity})` }} />
            ))}
          </div>
          <div className="flex justify-between mt-4">
            {['00:00', '06:00', '12:00', '18:00', '23:59'].map((t) => (
              <span key={t} className="font-mono text-[10px] text-on-surface-variant">{t}</span>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 glass-panel rounded-xl p-6">
          <h3 className="font-headline text-sm text-primary mb-4">Prometheus: Query Rate</h3>
          <div className="relative h-40 border-l border-b border-outline/30 overflow-hidden">
            <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#00dbe7" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#00dbe7" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={chartPath} fill="url(#chartGrad)" stroke="#00dbe7" strokeWidth="2" className="transition-all duration-500" />
            </svg>
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[8px] text-on-surface-variant font-mono pointer-events-none pl-1">
              <span>{displayStats.queryRateTop}</span>
              <span>{displayStats.queryRateMid}</span>
              <span>0</span>
            </div>
          </div>
        </div>

        <div className="col-span-12 glass-panel rounded-xl p-6 bg-surface-low/80">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-error-container animate-pulse" />
              <div className="w-3 h-3 rounded-full bg-secondary-container" />
              <div className="w-3 h-3 rounded-full bg-primary-fixed-dim" />
            </div>
            <span className="font-mono text-xs text-on-surface-variant ml-4">Live Orchestration Logs: cluster-main-01</span>
            <span className="ml-auto font-mono text-[9px] text-primary-fixed-dim/50">{logs.length} entries</span>
          </div>
          <div ref={logTail} className="font-mono text-[11px] space-y-0.5 h-32 overflow-y-auto no-scrollbar opacity-80">
            {logs.map((line, i) => {
              const parts = line.split(' ');
              const time = parts[0];
              const level = parts[1];
              const msg = parts.slice(2).join(' ');
              const colors = logColors(line);
              return (
                <motion.p key={`${i}-${line}`} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-on-surface-variant">
                  <span className={colors.time}>{time}</span>{' '}
                  <span className={colors.level}>{level}</span> {msg}
                </motion.p>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
