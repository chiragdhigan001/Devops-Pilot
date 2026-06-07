import Deployment from '../models/Deployment.js';
import Project from '../models/Project.js';
import { getIO } from '../socket/index.js';

export const getDeployments = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.projectId, ownerId: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const deployments = await Deployment.find({ projectId: req.params.projectId }).sort('-createdAt');
    res.json(deployments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createDeployment = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.projectId, ownerId: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const deployment = await Deployment.create({ projectId: project._id, status: 'pending' });
    project.deploymentStatus = 'deploying';
    await project.save();
    getIO().to(`project:${project._id}`).emit('deployment:created', deployment);
    simulateDeployment(deployment, project);
    res.status(201).json(deployment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const simulateDeployment = async (deployment, project) => {
  const steps = [
    { status: 'building', log: 'Building application...', delay: 2000 },
    { status: 'deploying', log: 'Deploying to container...', delay: 3000 },
    { status: 'success', log: 'Deployment successful!', delay: 2000 },
  ];
  for (const step of steps) {
    await new Promise((r) => setTimeout(r, step.delay));
    deployment.status = step.status;
    deployment.logs += `[${new Date().toISOString()}] ${step.log}\n`;
    await deployment.save();
    getIO().to(`project:${project._id}`).emit('deployment:update', deployment);
  }
  project.deploymentStatus = 'running';
  await project.save();
};
