import httpProxy from 'http-proxy';
import Project from '../models/Project.js';
import Deployment from '../models/Deployment.js';
import { extractSubdomainFromHost } from '../services/projectDomainService.js';

// Create the proxy server instance once
const proxy = httpProxy.createProxyServer({
  ws: true, // Crucial: Enables WebSockets for React/Vite apps
  xfwd: true, // Automatically adds x-forwarded-for/host headers
});

export const subdomainProxy = async (req, res, next) => {
  const host = req.headers.host || '';
  
  // 1. Bypass proxy for main dashboard (localhost)
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
    return next();
  }

  // 2. Extract subdomain (ensure your extraction logic handles ports like test.lvh.me:5000)
  const subdomain = extractSubdomainFromHost(host);
  if (!subdomain) {
    return next();
  }

  try {
    const project = await Project.findOne({
      subdomain,
      deploymentStatus: 'running',
      activeDeploymentId: { $ne: null },
    }).select('activeDeploymentId name');

    if (!project?.activeDeploymentId) {
      return res.status(404).send(`No active deployment found for subdomain ${subdomain}`);
    }

    const deployment = await Deployment.findById(project.activeDeploymentId).select('hostPort status');
    
    if (!deployment?.hostPort || deployment.status !== 'success') {
      return res.status(503).send(`Deployment for ${subdomain} is not ready yet`);
    }

    // 3. Proxy the request to the running Docker container
    const target = `http://127.0.0.1:${deployment.hostPort}`;
    
    proxy.web(req, res, { target }, (err) => {
      console.error(`[PROXY ERROR] Failed to route to ${subdomain}:`, err.message);
      if (!res.headersSent) {
        res.status(502).send('Bad Gateway: Container might be down or restarting.');
      }
    });

  } catch (error) {
    console.error('[PROXY DATABASE ERROR]', error);
    next(error);
  }
};