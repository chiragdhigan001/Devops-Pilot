import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const features = [
  {
    label: 'System Optimization',
    title: 'Predictive Auto-scaling',
    desc: 'Neural engine anticipates traffic spikes 15 minutes ahead, scaling clusters across multi-cloud regions.',
    icon: 'query_stats',
    color: 'text-primary',
    cols: 'md:col-span-8',
    chart: true,
  },
  {
    label: 'Security Protocol',
    title: 'Zero-Trust AI',
    desc: 'Real-time threat detection that isolates compromised nodes instantly.',
    icon: 'lock_open',
    color: 'text-secondary',
    cols: 'md:col-span-4',
  },
  {
    label: 'Developer Experience',
    title: 'Contextual AI Debugging',
    desc: 'Identifies root causes, links them to specific PRs, and applies the fix.',
    icon: 'bug_report',
    color: 'text-accent-purple',
    cols: 'md:col-span-12',
    code: true,
  },
];

const plans = [
  {
    level: 'Level 01: Pro',
    price: '$49',
    features: ['Up to 10 Nodes', 'AI Log Analysis', 'Basic Monitoring'],
    featured: false,
  },
  {
    level: 'Level 02: Business',
    price: '$199',
    features: ['Unlimited Nodes', 'Predictive Scaling', '24/7 Priority Support'],
    featured: true,
  },
  {
    level: 'Level 03: Enterprise',
    price: 'Custom',
    features: ['Dedicated Clusters', 'On-Premise Models', 'Architect Consultation'],
    featured: false,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-on-surface font-body overflow-x-hidden">
      {/* Nav */}
      <header className="fixed top-0 left-0 w-full flex justify-between items-center px-container-padding py-4 bg-background/40 backdrop-blur-2xl border-b border-primary/10 z-50">
        <div className="flex items-center gap-10">
          <span className="font-headline text-xl font-bold tracking-tighter text-primary flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(0,219,231,1)]" />
            DevOpsPilot AI
          </span>
          <nav className="hidden md:flex gap-8">
            {['Product', 'Solutions', 'Pricing', 'Docs'].map((item) => (
              <a key={item} href="#" className="font-mono text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
                {item}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="hidden lg:block font-mono text-xs uppercase tracking-widest text-on-surface hover:text-primary transition-colors">
            Sign In
          </Link>
          <Link to="/register" className="px-5 py-2 bg-primary text-background font-mono text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white transition-all shadow-[0_0_15px_rgba(0,219,231,0.3)]">
            Launch App
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 px-container-padding hero-mesh bg-grid-tight overflow-hidden">
        <div className="absolute inset-0 opacity-20 mask-radial"
          style={{ maskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)' }} />
        <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center px-3 py-1 mb-8 border border-primary/20 bg-primary/5 text-primary font-mono text-[10px] uppercase tracking-[0.3em] backdrop-blur-md">
            <span className="mr-2 inline-block w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
            System Status: Neural Orchestration Active
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="font-headline text-5xl md:text-7xl font-light text-white text-center leading-[1.1] tracking-tighter max-w-4xl mb-6 drop-shadow-2xl">
            The Invisible <span className="font-bold text-primary drop-shadow-[0_0_15px_rgba(0,219,231,0.4)]">Architect</span> of your Infrastructure.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-body text-lg text-on-surface-variant text-center max-w-2xl mb-12 font-light">
            Autonomous orchestration for the next generation of software. Secure, scale, and optimize with agentic AI precision.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-6 mb-16">
            <Link to="/register" className="px-8 py-4 bg-transparent border border-primary/40 text-primary font-mono text-xs uppercase tracking-[0.2em] hover:bg-primary/10 hover:border-primary transition-all neon-glow backdrop-blur-sm">
              Start Deploying
            </Link>
            <Link to="/login" className="px-8 py-4 bg-white/5 border border-white/10 text-white font-mono text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all backdrop-blur-sm">
              Live Dashboard
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-section-gap px-container-padding max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="font-headline text-3xl font-light text-white mb-4 tracking-tight">
            Technical <span className="text-primary font-bold">Excellence</span>
          </h2>
          <div className="h-px w-20 bg-gradient-to-r from-transparent via-primary/40 to-transparent mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`${f.cols} cipher-card p-8 group`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="font-mono text-[10px] text-primary uppercase tracking-[0.2em] mb-2 block">{f.label}</span>
                  <h3 className="font-headline text-2xl font-light text-white">{f.title}</h3>
                </div>
                <span className={`material-symbols-outlined ${f.color} text-3xl group-hover:scale-110 transition-transform`}>{f.icon}</span>
              </div>
              <p className="font-body text-on-surface-variant font-light mb-8 max-w-md">{f.desc}</p>
              {f.chart && (
                <div className="h-24 flex items-end gap-1.5 px-4 py-2 bg-black/40 border border-primary/10 rounded-lg overflow-hidden">
                  {[30, 45, 70, 90, 50, 40, 65].map((h, i) => (
                    <div key={i} className="flex-1 bg-primary/20 rounded-t-sm"
                      style={{ height: `${h}%`, boxShadow: h > 80 ? '0 0 15px rgba(0,219,231,0.3)' : 'none' }} />
                  ))}
                </div>
              )}
              {f.code && (
                <div className="bg-[#05070a] border border-white/5 p-5 font-mono text-[11px] leading-relaxed relative overflow-hidden rounded-lg">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-purple/40 to-transparent" />
                  <div className="text-white/40 mb-2">// Analyzing pod/api-gateway-v2...</div>
                  <div className="text-primary font-bold">$ devops-pilot analyze --verbose</div>
                  <div className="mt-2 text-on-surface">Scanning memory patterns...</div>
                  <div className="text-red-400 mt-1">[!] MEMORY_LEAK detected in auth-svc.container</div>
                  <div className="text-secondary mt-1">&gt; FIX: Increasing thread pool limit to 200 via Patch #821</div>
                  <div className="mt-4 inline-block px-3 py-1 bg-accent-purple/10 border border-accent-purple/20 text-accent-purple font-bold">Applying Hotfix... [DONE]</div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-section-gap px-container-padding bg-[#070a13] border-y border-primary/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-headline text-3xl font-light text-white mb-2">Predictable <span className="text-secondary font-bold">Pricing</span></h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">Choose your orchestration scale</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div key={plan.level}
                className={`cipher-card p-10 flex flex-col ${plan.featured ? 'border-primary/40 scale-105 shadow-[0_0_40px_rgba(0,219,231,0.05)] bg-[#131722]' : 'hover:-translate-y-1'}`}>
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-background font-mono text-[8px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(0,219,231,0.5)]">
                    Recommended
                  </div>
                )}
                <div className="font-mono text-[10px] text-primary uppercase tracking-[0.3em] mb-6">{plan.level}</div>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="font-headline text-5xl font-light text-white">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="font-mono text-[10px] text-on-surface-variant uppercase">/ Monthly</span>}
                </div>
                <ul className="space-y-4 mb-12 flex-grow font-body text-sm font-light text-on-surface-variant">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-sm">check</span> {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-4 font-mono text-[10px] uppercase tracking-[0.2em] transition-all ${
                  plan.featured
                    ? 'bg-primary text-background font-bold hover:bg-white shadow-[0_0_20px_rgba(0,219,231,0.3)]'
                    : 'border border-white/10 hover:bg-white/5'
                }`}>
                  {plan.featured ? 'Upgrade System' : plan.level.includes('Enterprise') ? 'Contact Sales' : 'Select Tier'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-section-gap px-container-padding text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent-purple/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto cipher-card p-16 relative overflow-hidden">
          <h2 className="font-headline text-4xl font-light text-white mb-6">
            Ready to make your infrastructure <span className="italic text-primary/80">invisible</span>?
          </h2>
          <p className="font-body text-lg text-on-surface-variant font-light mb-12">Join the elite engineering teams orchestrating the future.</p>
          <Link to="/register" className="inline-block px-8 py-4 bg-primary text-background font-mono text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white transition-all shadow-[0_0_20px_rgba(0,219,231,0.2)]">
            Start Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-16 px-container-padding bg-background border-t border-primary/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
          <div className="space-y-4">
            <span className="font-headline text-xl font-bold tracking-tighter text-primary">DevOpsPilot AI</span>
            <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">The Invisible Architect</p>
          </div>
          <div className="flex flex-wrap gap-x-12 gap-y-6 font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
            {['Privacy', 'Terms', 'Security'].map((item) => (
              <a key={item} href="#" className="hover:text-primary transition-colors">{item}</a>
            ))}
            <a href="#" className="flex items-center gap-2 text-primary">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_5px_rgba(0,219,231,1)]" />
              SYSTEM_ONLINE
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
