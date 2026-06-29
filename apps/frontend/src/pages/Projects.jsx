import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { projectsAPI } from '../api/client';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', githubRepo: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError('');
    projectsAPI.getAll().then((r) => setProjects(r.data)).catch((err) => {
      setError(err.response?.data?.message || 'Failed to load projects');
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void load();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await projectsAPI.create(form);
      setForm({ name: '', githubRepo: '', description: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this project?')) return;
    try {
      await projectsAPI.delete(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete project');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <header className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-headline text-2xl text-primary-fixed tracking-tight">Projects</h2>
          <p className="text-on-surface-variant font-body-sm mt-1">Manage your deployed services</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-5 py-3 bg-primary text-background font-mono text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white transition-all neon-glow">
          + New Project
        </button>
      </header>

      {error && (
        <div className="bg-error-container/20 border border-error/30 text-error rounded-lg p-3 text-sm font-mono mb-6">{error}</div>
      )}

      {showForm && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={create}
          className="glass-panel rounded-xl p-6 mb-6 space-y-4">
          <input placeholder="PROJECT NAME" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
            className="w-full bg-surface-high/50 border border-outline/30 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-primary placeholder:text-on-surface-variant/30" />
          <input placeholder="GITHUB REPO (user/repo)" value={form.githubRepo} onChange={(e) => setForm({ ...form, githubRepo: e.target.value })}
            className="w-full bg-surface-high/50 border border-outline/30 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-primary placeholder:text-on-surface-variant/30" />
          <input placeholder="DESCRIPTION" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-surface-high/50 border border-outline/30 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-primary placeholder:text-on-surface-variant/30" />
          <button type="submit" className="px-6 py-3 bg-primary text-background font-mono text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white transition-all">
            Create
          </button>
        </motion.form>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="font-mono text-xs text-on-surface-variant">Loading projects...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <motion.div key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel rounded-xl p-6 group hover:neon-glow transition-all">
              <div className="flex items-start justify-between mb-4">
                <Link to={`/projects/${p._id}`} className="font-headline text-lg text-white group-hover:text-primary transition-colors">{p.name}</Link>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                  p.deploymentStatus === 'running' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                  p.deploymentStatus === 'deploying' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                  p.deploymentStatus === 'failed' ? 'bg-error/10 text-error border-error/20' :
                  'bg-white/5 text-on-surface-variant border-white/10'
                }`}>{p.deploymentStatus}</span>
              </div>
              {p.githubRepo && <p className="font-mono text-[10px] text-on-surface-variant mb-4">{p.githubRepo}</p>}
              <div className="flex gap-3">
                <Link to={`/projects/${p._id}`} className="px-4 py-2 bg-white/5 border border-white/10 font-mono text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                  Deploy
                </Link>
                <button onClick={() => remove(p._id)} className="px-4 py-2 border border-error/30 text-error font-mono text-[10px] uppercase tracking-widest hover:bg-error/10 transition-all">
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="font-mono text-xs text-on-surface-variant">No projects found. Create your first project.</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
