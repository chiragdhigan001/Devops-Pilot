import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { monitoringAPI, projectsAPI } from '../api/client';

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ totalDeployments: 0, activeProjects: 0, totalProjects: 0 });
  const [insights, setInsights] = useState([]);
  const [error, setError] = useState('');
  const intervalRef = useRef(null);

  const fetchAll = async (isInitial = false) => {
    try {
      setError('');
      const [metricsRes, statsRes, insightsRes, projectsRes] = await Promise.all([
        monitoringAPI.getMetrics(),
        monitoringAPI.getStats(),
        monitoringAPI.getInsights(),
        isInitial ? projectsAPI.getAll() : Promise.resolve(null),
      ]);
      setMetrics(metricsRes.data);
      setStats(statsRes.data);
      setInsights(insightsRes.data.map((i) => ({ ...i, timeAgo: 'Just now' })));
      if (projectsRes) setProjects(projectsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void fetchAll(true);
    }, 0);
    intervalRef.current = setInterval(() => fetchAll(false), 5000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setInsights((prev) => prev.map((i) => ({ ...i, timeAgo: timeAgo(i.time) })));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const cpu = metrics?.cpu?.[metrics.cpu.length - 1]?.value ?? 0;
  const ram = metrics?.ram?.[metrics.ram.length - 1]?.value ?? 0;

  const statsCards = [
    { title: 'CLUSTER CPU USAGE', value: `${cpu}%`, trend: '-2.4%', trendUp: false, color: 'text-primary', barColor: 'bg-primary', barW: `${Math.min(cpu, 100)}%` },
    { title: 'MEMORY ALLOCATION', value: `${ram}%`, trend: '+5.1%', trendUp: true, color: 'text-secondary', barColor: 'bg-secondary', barW: `${Math.min(ram, 100)}%` },
    { title: 'ACTIVE PROJECTS', value: stats.activeProjects, sub: 'Running', color: 'text-primary-fixed', barColor: 'bg-primary-fixed', barW: stats.totalProjects ? `${(stats.activeProjects / stats.totalProjects) * 100}%` : '0%' },
    { title: 'TOTAL DEPLOYMENTS', value: stats.totalDeployments, sub: 'All time', color: 'text-primary-fixed', barColor: 'bg-primary-fixed', barW: '100%' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="font-headline text-2xl text-primary-fixed tracking-tight">Systems Dashboard</h2>
          <p className="text-on-surface-variant font-body-sm mt-1">Status: Operational. No critical incidents detected.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-high rounded-full border border-outline/30">
            <span className="w-2 h-2 rounded-full bg-primary-fixed shadow-[0_0_8px_#74f5ff] animate-pulse" />
            <span className="font-mono text-[10px] text-primary-fixed uppercase tracking-wider">Live Monitoring</span>
          </div>
          <button className="p-3 glass-panel rounded-xl text-primary hover:neon-glow transition-all">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-error-container/20 border border-error/30 text-error rounded-lg p-3 text-sm font-mono mb-6">{error}</div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-12 gap-gutter mb-6">
        {statsCards.map((s) => (
          <div key={s.title} className="col-span-12 md:col-span-6 lg:col-span-3 glass-panel rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-fixed/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary-fixed/10 transition-all" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">{s.title}</p>
            <div className="flex items-end gap-3">
              <span className={`font-headline text-2xl ${s.color}`}>{s.value}</span>
              {s.trend && (
                <span className={`font-body-sm mb-1 flex items-center text-sm ${s.trendUp ? 'text-secondary' : 'text-primary-fixed-dim'}`}>
                  <span className="material-symbols-outlined text-sm">{s.trendUp ? 'trending_up' : 'trending_down'}</span>
                  {s.trend}
                </span>
              )}
              {s.sub && <span className="font-body-sm text-on-surface-variant mb-1">{s.sub}</span>}
            </div>
            <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full ${s.barColor} rounded-full transition-all duration-1000`} style={{ width: s.barW, boxShadow: '0 0 10px rgba(0,219,231,0.3)' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-12 gap-gutter mb-6">
        <div className="col-span-12 lg:col-span-7 glass-panel rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline text-lg text-primary">Resource Allocation</h3>
            <div className="flex gap-4">
              <span className="flex items-center gap-2 font-mono text-[10px] text-primary">
                <span className="w-2 h-2 rounded-full bg-primary shadow-glow" /> CPU
              </span>
              <span className="flex items-center gap-2 font-mono text-[10px] text-secondary">
                <span className="w-2 h-2 rounded-full bg-secondary shadow-glow" /> RAM
              </span>
            </div>
          </div>
          <div className="h-48 relative">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300">
              <defs>
                <linearGradient id="cpuGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#74f5ff" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#74f5ff" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="ramGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#d0bcff" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#d0bcff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,250 Q100,150 200,200 T400,100 T600,150 T800,50 T1000,120 V300 H0 Z" fill="url(#cpuGrad)" fillOpacity="0.3" />
              <path className="drop-shadow-[0_0_10px_#74f5ff]" d="M0,250 Q100,150 200,200 T400,100 T600,150 T800,50 T1000,120" fill="none" stroke="#74f5ff" strokeWidth="4" />
              <path d="M0,200 Q150,220 300,150 T500,180 T750,100 T1000,80 V300 H0 Z" fill="url(#ramGrad)" fillOpacity="0.2" />
              <path className="drop-shadow-[0_0_10px_#d0bcff]" d="M0,200 Q150,220 300,150 T500,180 T750,100 T1000,80" fill="none" stroke="#d0bcff" strokeWidth="4" />
            </svg>
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
              {[0, 1, 2, 3].map((i) => <div key={i} className="border-t border-white border-dashed w-full" />)}
            </div>
          </div>
        </div>

        {/* AI Insights Live Feed */}
        <div className="col-span-12 lg:col-span-5 glass-panel rounded-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary animate-pulse">psychology</span>
              <h3 className="font-headline text-sm text-white">AI Pilot Insights</h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-primary-fixed/10 text-primary-fixed text-[10px] font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed animate-ping" />
              LIVE FEED
            </span>
          </div>
          <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[300px] no-scrollbar">
            {insights.length === 0 ? (
              <p className="text-on-surface-variant font-mono text-xs">Loading insights...</p>
            ) : insights.map((insight, i) => (
              <div key={i} className="flex gap-4">
                <div className={`mt-1 w-2 h-2 rounded-full ${insight.color} shadow-[0_0_8px_currentColor] shrink-0 animate-pulse`} />
                <div>
                  <p className="font-body-sm text-white leading-relaxed">{insight.text}</p>
                  <span className="font-mono text-[10px] text-on-surface-variant mt-1 block">{insight.timeAgo}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full py-4 text-center text-primary font-mono text-[10px] hover:bg-primary/5 transition-colors uppercase tracking-widest">
            View All Recommendations
          </button>
        </div>
      </div>

      {/* Recent Deployments */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/10 bg-white/5">
          <h3 className="font-headline text-sm text-white">Recent Deployments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-on-surface-variant font-mono text-[10px] uppercase tracking-widest border-b border-white/5">
                <th className="px-6 py-4 font-semibold">Project / Service</th>
                <th className="px-6 py-4 font-semibold">Revision</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Timestamp</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-white">
              {projects.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant font-mono text-xs">No deployments yet. <Link to="/projects" className="text-primary">Create a project</Link></td></tr>
              ) : projects.slice(0, 5).map((p) => (
                <tr key={p._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-semibold">{p.name}</td>
                  <td className="px-6 py-4 font-mono text-on-surface-variant text-xs">#{p._id.slice(-8)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                      p.deploymentStatus === 'running' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      p.deploymentStatus === 'deploying' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      p.deploymentStatus === 'failed' ? 'bg-error/10 text-error border-error/20' :
                      'bg-white/5 text-on-surface-variant border-white/10'
                    }`}>{p.deploymentStatus.toUpperCase()}</span>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant text-xs">{new Date(p.createdAt).toLocaleString('en-GB')}</td>
                  <td className="px-6 py-4">
                    <Link to={`/projects/${p._id}`} className="p-2 hover:text-primary transition-colors inline-block">
                      <span className="material-symbols-outlined text-sm">visibility</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
