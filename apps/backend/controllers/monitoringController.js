import Deployment from '../models/Deployment.js';
import Project from '../models/Project.js';

export const getMetrics = async (req, res) => {
  const metrics = {
    cpu: Array.from({ length: 20 }, (_, i) => ({
      time: new Date(Date.now() - (19 - i) * 5000).toISOString(),
      value: Math.round((30 + Math.random() * 60) * 100) / 100,
    })),
    ram: Array.from({ length: 20 }, (_, i) => ({
      time: new Date(Date.now() - (19 - i) * 5000).toISOString(),
      value: Math.round((40 + Math.random() * 50) * 100) / 100,
      total: 8192,
    })),
  };
  res.json(metrics);
};

export const getDeploymentHistory = async (req, res) => {
  const history = Array.from({ length: 10 }, (_, i) => ({
    date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
    count: Math.floor(Math.random() * 8) + 1,
    success: Math.floor(Math.random() * 5) + 1,
    failed: Math.floor(Math.random() * 3),
  }));
  res.json(history);
};

export const getStats = async (req, res) => {
  const totalDeployments = await Deployment.countDocuments();
  const activeProjects = await Project.countDocuments({ deploymentStatus: 'running' });
  const totalProjects = await Project.countDocuments({ ownerId: req.user._id });
  res.json({ totalDeployments, activeProjects, totalProjects });
};

const LOG_LEVELS = ['INFO', 'WARN', 'DEBUG', 'ERROR'];
const LOG_MESSAGES = [
  'Scaling operation started for namespace production',
  'Created pod worker-v2-xf79 on node aws-us-east-1a-02',
  'Prometheus scrape successful for endpoint /metrics',
  'Node k8s-node-04 reporting high memory pressure (89%)',
  'AI Pilot: Shifting traffic from node-04 to healthy instances',
  'Load balancer config updated. 0% drop rate.',
  'Container image pulled: nginx:1.27-alpine',
  'Health check passed for service api-gateway (200 OK)',
  'SSL certificate renewed for *.devopspilot.io',
  'Database connection pool expanded to 25 connections',
  'Cache hit ratio for redis-cluster: 94.2%',
  'Pod eviction triggered on node-07 due to disk pressure',
  'New deployment registered: frontend-v3.2.1',
  'AI anomaly detection: traffic pattern normal',
  'Rolling update completed for service-auth-v2',
];

export const getLogs = async (req, res) => {
  const count = Math.min(parseInt(req.query.count) || 5, 20);
  const logs = Array.from({ length: count }, () => {
    const level = LOG_LEVELS[Math.floor(Math.random() * LOG_LEVELS.length)];
    const message = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
    const now = new Date();
    const sec = String(now.getSeconds()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    return `[${hour}:${min}:${sec}] ${level}: ${message}`;
  });
  res.json(logs);
};

export const getInsights = async (req, res) => {
  const now = Date.now();
  const insights = [
    { text: 'Auto-scaled service-auth-v2 to 4 instances due to traffic surge.', time: new Date(now - 120000).toISOString(), color: 'bg-primary' },
    { text: 'Optimized database query performance for prod-db-01. Latency reduced 15%.', time: new Date(now - 900000).toISOString(), color: 'bg-secondary' },
    { text: 'Blocked unauthorized access attempt from IP 192.168.1.104.', time: new Date(now - 2700000).toISOString(), color: 'bg-error' },
    { text: 'Weekly maintenance report generated. 0 Critical bugs found.', time: new Date(now - 3600000).toISOString(), color: 'bg-primary' },
  ];
  res.json(insights);
};
