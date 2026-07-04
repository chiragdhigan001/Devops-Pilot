import Deployment from '../models/Deployment.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { getIO } from '../socket/index.js';
import { appendDeploymentLog, buildAndRunDeployment, removeContainer } from '../services/deploymentService.js';
import { ensureProjectDomainFields } from '../services/projectDomainService.js';

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
    await ensureProjectDomainFields(project);
    if (!project.githubRepo) {
      return res.status(400).json({ message: 'Add a GitHub repository before deploying' });
    }
    if (project.deploymentStatus === 'deploying') {
      return res.status(409).json({ message: 'A deployment is already in progress for this project' });
    }

    const previousActiveDeploymentId = project.activeDeploymentId;
    const deployment = await Deployment.create({
      projectId: project._id,
      status: 'pending',
      startedAt: new Date(),
      repositoryUrl: project.githubRepo,
    });

    project.deploymentStatus = 'deploying';
    project.activeDeploymentId = deployment._id;
    project.lastDeploymentError = undefined;
    await project.save();
    getIO().to(`project:${project._id}`).emit('deployment:created', deployment);
    executeDeployment(deployment._id, project._id, req.user._id, previousActiveDeploymentId).catch((err) => {
      console.error(`Deployment execution error for ${deployment._id}:`, err.message);
    });
    res.status(201).json(deployment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const emitDeploymentUpdate = (projectId, deployment) => {
  getIO().to(`project:${projectId}`).emit('deployment:update', deployment);
};

const executeDeployment = async (deploymentId, projectId, userId, previousDeploymentId) => {
  const deployment = await Deployment.findById(deploymentId);
  const project = await Project.findById(projectId);
  const user = await User.findById(userId).select('githubToken');

  if (!deployment || !project) {
    return;
  }

  const saveAndEmit = async () => {
    await deployment.save();
    emitDeploymentUpdate(project._id, deployment);
  };

  const log = async (message, status) => {
    if (!message) return;
    appendDeploymentLog(deployment, message);
    if (status) {
      deployment.status = status;
    }
    await saveAndEmit();
  };

  try {
    await log('Starting deployment workflow', 'building');

    const result = await buildAndRunDeployment({
      project,
      deployment,
      githubToken: user?.githubToken,
      onLog: (message) => {
        if (!message) return;
        appendDeploymentLog(deployment, message);
        // Add this line to stream logs to the UI in real-time
        emitDeploymentUpdate(project._id, deployment); 
      },
    });

    deployment.status = 'deploying';
    // ... (keep the rest of your success block the same)
    deployment.commitSha = result.commitSha;
    deployment.imageName = result.imageName;
    deployment.containerName = result.containerName;
    deployment.deployedUrl = result.deployedUrl;
    deployment.localUrl = result.localUrl;
    deployment.repositoryUrl = result.repositoryUrl;
    deployment.containerPort = result.containerPort;
    deployment.hostPort = result.hostPort;
    deployment.healthStatus = 'healthy';
    await saveAndEmit();

    deployment.finishedAt = new Date();
    deployment.duration = deployment.startedAt ? deployment.finishedAt.getTime() - new Date(deployment.startedAt).getTime() : undefined;
    await log(`Deployment successful. Service available at ${result.deployedUrl}`, 'success');

    if (previousDeploymentId) {
      const previousDeployment = await Deployment.findById(previousDeploymentId).select('containerName');
      await removeContainer(previousDeployment?.containerName);
    }

    project.deploymentStatus = 'running';
    project.publicUrl = result.deployedUrl;
    project.deployedUrl = result.deployedUrl;
    project.activeDeploymentId = deployment._id;
    project.lastDeploymentError = undefined;
    await project.save();
  } catch (error) {
    deployment.healthStatus = 'unhealthy';
    deployment.errorMessage = error.message;
    deployment.finishedAt = new Date();
    deployment.duration = deployment.startedAt ? deployment.finishedAt.getTime() - new Date(deployment.startedAt).getTime() : undefined;
    await log(`Deployment failed: ${error.message}`, 'failed');

    project.deploymentStatus = 'failed';
    project.lastDeploymentError = error.message;
    await project.save();
  }
};
