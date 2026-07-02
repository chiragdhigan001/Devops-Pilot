import { useState, useEffect, useEffectEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { projectsAPI, deploymentsAPI } from '../api/client';

const requestProjectData = async (projectId) => {
  const [projectResponse, deploymentsResponse] = await Promise.all([
    projectsAPI.get(projectId),
    deploymentsAPI.getByProject(projectId),
  ]);

  return {
    project: projectResponse.data,
    deployments: deploymentsResponse.data,
  };
};

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [error, setError] = useState('');
  const [deploying, setDeploying] = useState(false);

  const loadProjectData = useEffectEvent(async (projectId = id) => {
    try {
      const data = await requestProjectData(projectId);
      setProject(data.project);
      setDeployments(data.deployments);
      setDeploying(data.project.deploymentStatus === 'deploying');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project');
    }
  });

  useEffect(() => {
    const fetchCurrentProject = async () => {
      await loadProjectData(id);
    };

    const timeoutId = setTimeout(() => {
      void fetchCurrentProject();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [id]);

  useEffect(() => {
    if (!deploying) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      void loadProjectData(id);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [deploying, id]);

  const deploy = async () => {
    try {
      setError('');
      setDeploying(true);
      await deploymentsAPI.create(id);
      const data = await requestProjectData(id);
      setProject(data.project);
      setDeployments(data.deployments);
      setDeploying(data.project.deploymentStatus === 'deploying');
    } catch (err) {
      setDeploying(false);
      setError(err.response?.data?.message || 'Failed to start deployment');
    }
  };

  if (!project && !error) return <div className="flex items-center justify-center h-64 text-on-surface-variant font-mono">Loading...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Link to="/projects" className="font-mono text-xs text-on-surface-variant hover:text-primary transition-colors mb-6 inline-flex items-center gap-2">
        <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Projects
      </Link>
      <header className="flex items-start justify-between mb-8 mt-4">
        <div>
          <h1 className="font-headline text-2xl text-primary-fixed tracking-tight">{project.name}</h1>
          {project.githubRepo && <p className="font-mono text-xs text-on-surface-variant mt-1">{project.githubRepo}</p>}
          {project.subdomain && <p className="font-mono text-xs text-primary mt-2">{project.subdomain}</p>}
          {project.publicUrl && !project.deployedUrl && (
            <p className="font-mono text-xs text-on-surface-variant mt-1">Reserved URL: {project.publicUrl}</p>
          )}
          {project.deployedUrl && (
            <a href={project.deployedUrl} target="_blank" rel="noreferrer" className="font-mono text-xs text-primary mt-2 inline-block hover:underline">
              Live URL: {project.deployedUrl}
            </a>
          )}
        </div>
        <div className="flex gap-3">
          <Link to="/ai" className="px-5 py-3 glass-panel font-mono text-[10px] uppercase tracking-widest text-primary hover:neon-glow transition-all">
            AI Config
          </Link>
          <button onClick={deploy} disabled={deploying} className="px-5 py-3 bg-primary text-background font-mono text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white transition-all neon-glow disabled:opacity-60 disabled:cursor-not-allowed">
            {deploying ? 'Deploying...' : 'Deploy'}
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-error-container/20 border border-error/30 text-error rounded-lg p-3 text-sm font-mono mb-6">{error}</div>
      )}

      {project?.lastDeploymentError && (
        <div className="bg-error-container/20 border border-error/30 text-error rounded-lg p-3 text-sm font-mono mb-6">{project.lastDeploymentError}</div>
      )}

      {project && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-xl p-6">
          <h2 className="font-headline text-sm text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">rocket_launch</span>
            Deployments
          </h2>
          {deployments.length === 0 ? (
            <p className="text-on-surface-variant font-mono text-xs">No deployments yet.</p>
          ) : deployments.map((d) => (
            <div key={d._id} className="border-b border-white/5 py-4 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-white">Deploy #{d._id.slice(-8)}</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                  d.status === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                  d.status === 'failed' ? 'bg-error/10 text-error border-error/20' :
                  d.status === 'building' || d.status === 'deploying' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                  'bg-white/5 text-on-surface-variant border-white/10'
                }`}>{d.status.toUpperCase()}</span>
              </div>
              <p className="font-mono text-[10px] text-on-surface-variant">{new Date(d.createdAt).toLocaleString()}</p>
              {d.deployedUrl && (
                <a href={d.deployedUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block font-mono text-[10px] text-primary hover:underline">
                  {d.deployedUrl}
                </a>
              )}
              {d.localUrl && (
                <p className="mt-2 font-mono text-[10px] text-on-surface-variant">Container URL: {d.localUrl}</p>
              )}
              {d.errorMessage && (
                <p className="mt-2 font-mono text-[10px] text-error">{d.errorMessage}</p>
              )}
              {d.logs && (
                <pre className="mt-3 font-mono text-[11px] text-on-surface-variant/80 bg-background rounded-lg p-3 max-h-32 overflow-auto border border-white/5">
                  {d.logs}
                </pre>
              )}
            </div>
          ))}
        </div>
        <div className="glass-panel rounded-xl p-6">
          <h2 className="font-headline text-sm text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">psychology</span>
            AI Log Analysis
          </h2>
          <p className="text-on-surface-variant font-mono text-xs mb-4">Analyze deployment logs with AI to detect errors and get suggested fixes.</p>
          <Link to="/ai/logs" className="px-5 py-3 glass-panel font-mono text-[10px] uppercase tracking-widest text-primary hover:neon-glow transition-all inline-block">
            Analyze Logs
          </Link>
        </div>
        </div>
      )}
    </motion.div>
  );
}
