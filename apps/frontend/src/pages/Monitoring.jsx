import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';

export default function Monitoring() {
  const [metrics, setMetrics] = useState({ cpu: [], ram: [], network: { inbound: 0, peak: 10, unit: 'Mbps', status: 'Stable' } });
  const [logs, setLogs] = useState([]);
  const logTail = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token },
    });
    socket.on('monitoring:metrics', setMetrics);
    socket.on('monitoring:logs', setLogs);
    socket.on('connect_error', () => {});
    return () => { socket.removeAllListeners(); socket.disconnect(); };
  }, []);

  const cpu = metrics.cpu[metrics.cpu.length - 1]?.value ?? 0;
  const ram = metrics.ram[metrics.ram.length - 1]?.value ?? 0;
  const net = metrics.network ?? { inbound: 0, peak: 10, unit: 'Mbps', status: 'Stable' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <header className="mb-8">
        <h2 className="font-headline text-2xl text-primary-fixed">System Monitoring</h2>
        <p className="text-on-surface-variant font-body-sm">Global infrastructure health and real-time metrics.</p>
      </header>

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 lg:col-span-9 grid grid-cols-3 gap-gutter">
          {[
            { title: 'CLUSTER CPU', value: `${cpu.toFixed(1)}%`, color: 'text-primary', barW: `${cpu}%` },
            { title: 'MEMORY', value: `${ram.toFixed(1)}%`, color: 'text-secondary', barW: `${ram}%` },
            { title: 'NETWORK INBOUND', value: `${net.inbound} ${net.unit}`, sub: net.status, color: 'text-primary', barW: `${net.peak > 0 ? (net.inbound / net.peak) * 100 : 0}%` },
          ].map((s, i) => (
            <div key={i} className="glass-panel rounded-xl p-6">
              <p className="font-mono text-[10px] uppercase text-on-surface-variant mb-2">{s.title}</p>
              <div className="flex items-end gap-3">
                <span className={`font-headline text-2xl ${s.color}`}>{s.value}</span>
                {s.sub && <span className="text-on-surface-variant text-sm">{s.sub}</span>}
              </div>
              <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: s.barW }} />
              </div>
            </div>
          ))}
        </div>

        <div className="col-span-12 glass-panel rounded-xl p-6 mt-6">
          <p className="font-mono text-xs text-on-surface-variant mb-4">Live System Logs</p>
          <div ref={logTail} className="font-mono text-[11px] h-32 overflow-y-auto opacity-80 space-y-1">
            {logs.map((line, i) => <p key={i}>{line}</p>)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}