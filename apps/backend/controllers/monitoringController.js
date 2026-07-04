import si from 'systeminformation';
import Deployment from '../models/Deployment.js';
import Project from '../models/Project.js';

let cpuHistory = [];
let ramHistory = [];
let networkHistory = { inbound: 0, peak: 10, unit: 'Mbps', status: 'Stable' };
const HISTORY_LIMIT = 20;

setInterval(async () => {
  try {
    const time = new Date().toISOString();
    const cpuLoad = await si.currentLoad();
    cpuHistory.push({ time, value: Math.round(cpuLoad.currentLoad * 100) / 100 });

    const mem = await si.mem();
    ramHistory.push({ time, value: Math.round((mem.active / mem.total) * 100 * 100) / 100 });

    const defaultIface = await si.networkInterfaceDefault();
    const networkStats = await si.networkStats(defaultIface); 
    
    if (networkStats && networkStats.length > 0) {
      const inboundMbps = (networkStats[0].rx_sec * 8) / 1000000;
      networkHistory.inbound = parseFloat(inboundMbps.toFixed(1));
      
      if (networkHistory.inbound > networkHistory.peak) {
        networkHistory.peak = networkHistory.inbound;
      }
      networkHistory.status = networkHistory.inbound > (networkHistory.peak * 0.7) ? 'Heavy Load' : 'Stable';
    }

    if (cpuHistory.length > HISTORY_LIMIT) cpuHistory.shift();
    if (ramHistory.length > HISTORY_LIMIT) ramHistory.shift();
  } catch (err) { console.error(err); }
}, 3000);

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
    const containers = await si.dockerContainers();
    const logs = containers.map(c => `[${new Date().toLocaleTimeString()}] INFO: Container ${c.name} is tracking state [${c.state}]`);
    res.json(logs.length > 0 ? logs : [`[${new Date().toLocaleTimeString()}] INFO: Orchestrator idle.`]);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getInsights = async (req, res) => {
  res.json([{ text: 'System infrastructure operational.', time: new Date().toISOString(), color: 'bg-primary' }]);
};