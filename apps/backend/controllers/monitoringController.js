import si from 'systeminformation';
import Deployment from '../models/Deployment.js';
import Project from '../models/Project.js';
import { getIO } from '../socket/index.js';

let cpuHistory = [];
let ramHistory = [];
let networkHistory = { inbound: 0, peak: 10, unit: 'Mbps', status: 'Stable' };
let lastCpu = 0;
let lastRam = 0;
let lastNetInbound = 0;
let lastLogCount = 0;
const HISTORY_LIMIT = 20;

async function getRecentLogs() {
  const deployments = await Deployment.find()
    .sort({ createdAt: -1 })
    .limit(20)
    .select('status errorMessage createdAt')
    .lean();
  return deployments.map(d => {
    const time = new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const icon = d.status === 'success' ? 'OK' : d.status === 'failed' ? 'FAIL' : 'INFO';
    const msg = d.errorMessage || `Deployment ${d.status}`;
    return `[${time}] ${icon}: ${msg}`;
  });
}

setInterval(async () => {
  try {
    const time = new Date().toISOString();
    const cpuLoad = await si.currentLoad();
    const cpuVal = Math.round(cpuLoad.currentLoad * 100) / 100;
    cpuHistory.push({ time, value: cpuVal });

    const mem = await si.mem();
    const ramVal = Math.round((mem.active / mem.total) * 100 * 100) / 100;
    ramHistory.push({ time, value: ramVal });

    let defaultIface;
    try { defaultIface = await si.networkInterfaceDefault(); } catch {}
    if (!defaultIface) {
      const allIfaces = await si.networkInterfaces();
      defaultIface = allIfaces.find(i => !i.internal)?.iface;
    }
    if (defaultIface) {
      const networkStats = await si.networkStats(defaultIface);
      if (networkStats?.[0]) {
        const inboundMbps = (networkStats[0].rx_sec * 8) / 1000000;
        networkHistory.inbound = parseFloat(inboundMbps.toFixed(1));
        if (networkHistory.inbound > networkHistory.peak) {
          networkHistory.peak = networkHistory.inbound;
        }
        networkHistory.status = networkHistory.inbound > (networkHistory.peak * 0.7) ? 'Heavy Load' : 'Stable';
      }
    }

    if (cpuHistory.length > HISTORY_LIMIT) cpuHistory.shift();
    if (ramHistory.length > HISTORY_LIMIT) ramHistory.shift();

    const io = getIO();
    if (!io) return;

    const cpuChanged = Math.abs(cpuVal - lastCpu) > 1;
    const ramChanged = Math.abs(ramVal - lastRam) > 1;
    const netChanged = Math.abs(networkHistory.inbound - lastNetInbound) > 0.1;

    const currentLogCount = await Deployment.countDocuments();
    const logsChanged = currentLogCount !== lastLogCount;

    if (cpuChanged || ramChanged || netChanged) {
      io.emit('monitoring:metrics', { cpu: cpuHistory, ram: ramHistory, network: networkHistory });
      lastCpu = cpuVal;
      lastRam = ramVal;
      lastNetInbound = networkHistory.inbound;
    }

    if (logsChanged) {
      const logs = await getRecentLogs();
      io.emit('monitoring:logs', logs);
      lastLogCount = currentLogCount;
    }
  } catch (err) { console.error(err); }
}, 3000);

export const getLatestMetrics = () => ({ cpu: [...cpuHistory], ram: [...ramHistory], network: { ...networkHistory } });
export const getLatestLogs = async () => getRecentLogs();

export const getMetrics = async (req, res) => {
  res.json({ cpu: cpuHistory, ram: ramHistory, network: networkHistory });
};

export const getDeploymentHistory = async (req, res) => {
  try {
    const history = await Deployment.aggregate([
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$startedAt" } }, count: { $sum: 1 }, success: { $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] } }, failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } } } },
      { $sort: { _id: -1 } }, { $limit: 10 }
    ]);
    res.json(history);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getStats = async (req, res) => {
  try {
    const totalDeployments = await Deployment.countDocuments();
    const activeProjects = await Project.countDocuments({ deploymentStatus: 'running' });
    const totalProjects = await Project.countDocuments({ ownerId: req.user._id });
    res.json({ totalDeployments, activeProjects, totalProjects });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getLogs = async (req, res) => {
  try {
    const deployments = await Deployment.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select('status errorMessage createdAt')
      .lean();
    const logs = deployments.map(d => {
      const time = new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      const icon = d.status === 'success' ? 'OK' : d.status === 'failed' ? 'FAIL' : 'INFO';
      const msg = d.errorMessage || `Deployment ${d.status}`;
      return `[${time}] ${icon}: ${msg}`;
    });
    res.json(logs.length > 0 ? logs : [`[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}] INFO: No recent deployment activity.`]);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getInsights = async (req, res) => {
  res.json([{ text: 'System infrastructure operational.', time: new Date().toISOString(), color: 'bg-primary' }]);
};