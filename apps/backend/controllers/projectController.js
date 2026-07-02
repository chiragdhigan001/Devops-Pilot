import Project from '../models/Project.js';
import { getRedis } from '../config/redis.js';
import { buildPublicUrl, ensureProjectDomainFields, generateUniqueSubdomain } from '../services/projectDomainService.js';

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ ownerId: req.user._id }).sort('-createdAt');
    await Promise.all(projects.map((project) => ensureProjectDomainFields(project)));
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await ensureProjectDomainFields(project);
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const { name, githubRepo, description, subdomain } = req.body;
    const resolvedSubdomain = await generateUniqueSubdomain(subdomain || name || 'project');
    const publicUrl = buildPublicUrl(resolvedSubdomain);
    const project = await Project.create({
      name,
      githubRepo,
      description,
      subdomain: resolvedSubdomain,
      publicUrl,
      ownerId: req.user._id,
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, ownerId: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
