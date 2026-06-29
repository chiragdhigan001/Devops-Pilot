import { useState } from 'react';
import { motion } from 'framer-motion';
import { aiAPI } from '../api/client';

export default function AITools() {
  const [dockerStack, setDockerStack] = useState('');
  const [dockerPorts, setDockerPorts] = useState('3000');
  const [workflowStack, setWorkflowStack] = useState('');
  const [workflowTarget, setWorkflowTarget] = useState('docker');
  const [dockerResult, setDockerResult] = useState('');
  const [workflowResult, setWorkflowResult] = useState('');
  const [loadingDocker, setLoadingDocker] = useState(false);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);
  const [dockerError, setDockerError] = useState('');
  const [workflowError, setWorkflowError] = useState('');

  const genDockerfile = async (e) => {
    e.preventDefault();
    if (!dockerStack.trim()) return;
    setLoadingDocker(true);
    setDockerError('');
    try {
      const { data } = await aiAPI.generateDockerfile({ techStack: dockerStack, ports: parseInt(dockerPorts) || 3000 });
      setDockerResult(data.dockerfile);
    } catch (err) {
      setDockerError(err.response?.data?.message || 'Failed to generate Dockerfile');
    } finally { setLoadingDocker(false); }
  };

  const genWorkflow = async (e) => {
    e.preventDefault();
    if (!workflowStack.trim()) return;
    setLoadingWorkflow(true);
    setWorkflowError('');
    try {
      const { data } = await aiAPI.generateWorkflow({ techStack: workflowStack, deployTarget: workflowTarget });
      setWorkflowResult(data.workflow);
    } catch (err) {
      setWorkflowError(err.response?.data?.message || 'Failed to generate workflow');
    } finally { setLoadingWorkflow(false); }
  };

  const copy = (text) => navigator.clipboard.writeText(text);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <header className="mb-8">
        <h2 className="font-headline text-2xl text-primary-fixed tracking-tight">AI Configuration Generator</h2>
        <p className="text-on-surface-variant font-body-sm mt-1">Generate Dockerfiles and CI/CD workflows using AI.</p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={genDockerfile} className="glass-panel rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">deployed_code</span>
            <h3 className="font-headline text-sm text-white">Generate Dockerfile</h3>
          </div>
          <input placeholder="TECH STACK (e.g., Node.js, Python, Go)" value={dockerStack} onChange={(e) => setDockerStack(e.target.value)} required
            className="w-full bg-surface-high/50 border border-outline/30 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-primary placeholder:text-on-surface-variant/30" />
          <input placeholder="PORT (default: 3000)" value={dockerPorts} onChange={(e) => setDockerPorts(e.target.value)}
            className="w-full bg-surface-high/50 border border-outline/30 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-primary placeholder:text-on-surface-variant/30" />
          <button type="submit" disabled={loadingDocker}
            className="px-6 py-3 bg-primary text-background font-mono text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white transition-all disabled:opacity-50">
            {loadingDocker ? 'GENERATING...' : 'Generate Dockerfile'}
          </button>
          {dockerError && <div className="bg-error-container/20 border border-error/30 text-error rounded-lg p-3 text-sm font-mono">{dockerError}</div>}
          {dockerResult && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">Result</span>
                <button onClick={() => copy(dockerResult)} className="font-mono text-[10px] text-primary hover:underline">Copy</button>
              </div>
              <pre className="font-mono text-[11px] text-on-surface-variant/80 bg-background border border-white/5 rounded-lg p-4 max-h-80 overflow-auto">{dockerResult}</pre>
            </div>
          )}
        </form>
        <form onSubmit={genWorkflow} className="glass-panel rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">cycle</span>
            <h3 className="font-headline text-sm text-white">Generate GitHub Actions Workflow</h3>
          </div>
          <input placeholder="TECH STACK (e.g., Node.js, Python)" value={workflowStack} onChange={(e) => setWorkflowStack(e.target.value)} required
            className="w-full bg-surface-high/50 border border-outline/30 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-primary placeholder:text-on-surface-variant/30" />
          <select value={workflowTarget} onChange={(e) => setWorkflowTarget(e.target.value)}
            className="w-full bg-surface-high/50 border border-outline/30 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-primary">
            <option value="docker">Docker</option>
            <option value="kubernetes">Kubernetes</option>
            <option value="ecs">AWS ECS</option>
          </select>
          <button type="submit" disabled={loadingWorkflow}
            className="px-6 py-3 bg-primary text-background font-mono text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white transition-all disabled:opacity-50">
            {loadingWorkflow ? 'GENERATING...' : 'Generate Workflow'}
          </button>
          {workflowError && <div className="bg-error-container/20 border border-error/30 text-error rounded-lg p-3 text-sm font-mono">{workflowError}</div>}
          {workflowResult && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">Result</span>
                <button onClick={() => copy(workflowResult)} className="font-mono text-[10px] text-primary hover:underline">Copy</button>
              </div>
              <pre className="font-mono text-[11px] text-on-surface-variant/80 bg-background border border-white/5 rounded-lg p-4 max-h-80 overflow-auto">{workflowResult}</pre>
            </div>
          )}
        </form>
      </div>
    </motion.div>
  );
}
