import httpProxy from 'http-proxy';
import Project from '../models/Project.js';
import Deployment from '../models/Deployment.js';
import { extractSubdomainFromHost } from '../services/projectDomainService.js';

// Create proxy only once
const proxy = httpProxy.createProxyServer({
  ws: true,
  xfwd: true,
});

export const subdomainProxy = async (req, res, next) => {
  const host = req.headers.host || '';

  // ============================
  // Skip proxy for API routes
  // ============================
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/metrics') ||
    req.path.startsWith('/test')
  ) {
    return next();
  }

  // ============================
  // Skip proxy for main app
  // ============================
  if (
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1') ||
    host === 'devops-pilot.onrender.com'
  ) {
    return next();
  }

  // ============================
  // Get subdomain
  // ============================
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

    if (!project) {
      return res
        .status(404)
        .send(`No project found for subdomain "${subdomain}"`);
    }

    const deployment = await Deployment.findById(
      project.activeDeploymentId
    ).select('hostPort status');

    if (!deployment) {
      return res.status(404).send('Deployment not found.');
    }

    if (deployment.status !== 'success') {
      return res.status(503).send('Deployment is not ready yet.');
    }

    if (!deployment.hostPort) {
      return res.status(503).send('Deployment port not available.');
    }

    const target = `http://127.0.0.1:${deployment.hostPort}`;

    console.log(`[Proxy] ${host} -> ${target}`);

    proxy.web(req, res, { target }, (err) => {
      console.error('[PROXY ERROR]', err);

      if (!res.headersSent) {
        res.status(502).send('Bad Gateway');
      }
    });
  } catch (err) {
    console.error('[SUBDOMAIN PROXY ERROR]', err);
    next(err);
  }
};

// WebSocket support
proxy.on('error', (err) => {
  console.error('[PROXY WS ERROR]', err);
});

export default subdomainProxy;
