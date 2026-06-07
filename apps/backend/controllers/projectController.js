import Project from '../models/Project.js';
import { getRedis } from '../config/redis.js';

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ ownerId: req.user._id }).sort('-createdAt');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const { name, githubRepo, description } = req.body;
    const project = await Project.create({ name, githubRepo, description, ownerId: req.user._id });
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
