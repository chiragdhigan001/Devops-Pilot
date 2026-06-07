import { useState } from 'react';
import { motion } from 'framer-motion';
import { aiAPI } from '../api/client';

export default function LogAnalyzer() {
  const [logs, setLogs] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async (e) => {
    e.preventDefault();
    if (!logs.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await aiAPI.analyzeLogs({ logs });
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <header className="mb-8">
        <h2 className="font-headline text-2xl text-primary-fixed tracking-tight">AI Log Analyzer</h2>
        <p className="text-on-surface-variant font-body-sm mt-1">Paste deployment or application logs for AI-powered error detection and root cause analysis.</p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={analyze} className="space-y-4">
          <div className="glass-panel rounded-xl p-6">
            <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-3 block">Logs</label>
            <textarea value={logs} onChange={(e) => setLogs(e.target.value)} rows={14} required
              placeholder="PASTE YOUR LOGS HERE..."
              className="w-full bg-surface-high/50 border border-outline/30 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/30 resize-none" />
            <button type="submit" disabled={loading}
              className="mt-4 px-6 py-3 bg-primary text-background font-mono text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white transition-all disabled:opacity-50">
              {loading ? 'ANALYZING...' : 'Analyze Logs'}
            </button>
          </div>
        </form>
        <div className="glass-panel rounded-xl p-6">
          <h3 className="font-headline text-sm text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">psychology</span>
            Analysis Result
          </h3>
          {error && <div className="bg-error-container/20 border border-error/30 text-error rounded-lg p-3 text-sm font-mono mb-4">{error}</div>}
          <div className="font-mono text-[12px] text-on-surface-variant/90 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
            {analysis || <span className="text-on-surface-variant/50">Submit logs to see analysis...</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
