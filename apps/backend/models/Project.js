import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  githubRepo: { type: String, trim: true },
  subdomain: { type: String, required: true, unique: true, lowercase: true, trim: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deploymentStatus: { type: String, enum: ['idle', 'deploying', 'running', 'failed'], default: 'idle' },
  description: { type: String, trim: true },
  publicUrl: { type: String, trim: true },
  deployedUrl: { type: String, trim: true },
  activeDeploymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deployment' },
  lastDeploymentError: { type: String },
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);
export default Project;
