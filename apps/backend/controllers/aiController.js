import { generateDockerfile, generateWorkflow, analyzeLogs } from '../services/aiService.js';

export const generateDockerfileHandler = async (req, res) => {
  try {
    const { techStack, ports } = req.body;
    if (!techStack) return res.status(400).json({ message: 'techStack is required' });
    const dockerfile = await generateDockerfile(techStack, ports);
    res.json({ dockerfile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateWorkflowHandler = async (req, res) => {
  try {
    const { techStack, deployTarget } = req.body;
    if (!techStack) return res.status(400).json({ message: 'techStack is required' });
    const workflow = await generateWorkflow(techStack, deployTarget);
    res.json({ workflow });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const analyzeLogsHandler = async (req, res) => {
  try {
    const { logs } = req.body;
    if (!logs) return res.status(400).json({ message: 'logs are required' });
    const analysis = await analyzeLogs(logs);
    res.json({ analysis });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
