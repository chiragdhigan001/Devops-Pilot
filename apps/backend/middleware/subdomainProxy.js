import http from 'http';
import Project from '../models/Project.js';
import Deployment from '../models/Deployment.js';
import { extractSubdomainFromHost } from '../services/projectDomainService.js';

const ROUTER_TARGET_HOST = process.env.DEPLOY_ROUTER_TARGET_HOST || '127.0.0.1';

const hopByHopHeaders = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const createProxyHeaders = (headers, targetHost, targetPort) => {
  const filteredHeaders = { ...headers };

  for (const header of hopByHopHeaders) {
    delete filteredHeaders[header];
  }

  filteredHeaders.host = `${targetHost}:${targetPort}`;
  filteredHeaders['x-forwarded-host'] = headers.host;
  filteredHeaders['x-forwarded-proto'] = headers['x-forwarded-proto'] || 'http';

  return filteredHeaders;
};

export const subdomainProxy = async (req, res, next) => {
  const subdomain = extractSubdomainFromHost(req.headers.host);
  if (!subdomain) {
    next();
    return;
  }

  try {
    const project = await Project.findOne({
      subdomain,
      deploymentStatus: 'running',
      activeDeploymentId: { $ne: null },
    }).select('activeDeploymentId name');

    if (!project?.activeDeploymentId) {
      res.status(404).json({ message: `No active deployment found for subdomain ${subdomain}` });
      return;
    }

    const deployment = await Deployment.findById(project.activeDeploymentId).select('hostPort status');
    if (!deployment?.hostPort || deployment.status !== 'success') {
      res.status(503).json({ message: `Deployment for ${subdomain} is not ready yet` });
      return;
    }

    const proxyRequest = http.request({
      hostname: ROUTER_TARGET_HOST,
      port: deployment.hostPort,
      method: req.method,
      path: req.originalUrl,
      headers: createProxyHeaders(req.headers, ROUTER_TARGET_HOST, deployment.hostPort),
    }, (proxyResponse) => {
      res.status(proxyResponse.statusCode || 502);

      for (const [header, value] of Object.entries(proxyResponse.headers)) {
        if (value !== undefined && !hopByHopHeaders.has(header.toLowerCase())) {
          res.setHeader(header, value);
        }
      }

      proxyResponse.pipe(res);
    });

    proxyRequest.on('error', (error) => {
      if (!res.headersSent) {
        res.status(502).json({ message: `Failed to reach deployed app for ${subdomain}`, details: error.message });
      }
    });

    req.pipe(proxyRequest);
  } catch (error) {
    next(error);
  }
};
