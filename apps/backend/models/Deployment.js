import mongoose from 'mongoose';

const deploymentSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  status: { type: String, enum: ['pending', 'building', 'deploying', 'success', 'failed'], default: 'pending' },
  logs: { type: String, default: '' },
  commitSha: { type: String },
  branch: { type: String, default: 'main' },
  duration: { type: Number },
  imageName: { type: String },
  containerName: { type: String },
  deployedUrl: { type: String },
  localUrl: { type: String },
  repositoryUrl: { type: String },
  containerPort: { type: Number },
  hostPort: { type: Number },
  healthStatus: { type: String, enum: ['pending', 'healthy', 'unhealthy'], default: 'pending' },
  errorMessage: { type: String },
  startedAt: { type: Date },
  finishedAt: { type: Date },
}, { timestamps: true });

const Deployment = mongoose.model('Deployment', deploymentSchema);
export default Deployment;
