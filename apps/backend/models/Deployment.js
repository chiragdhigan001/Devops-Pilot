import mongoose from 'mongoose';

const deploymentSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  status: { type: String, enum: ['pending', 'building', 'deploying', 'success', 'failed'], default: 'pending' },
  logs: { type: String, default: '' },
  commitSha: { type: String },
  branch: { type: String, default: 'main' },
  duration: { type: Number },
}, { timestamps: true });

const Deployment = mongoose.model('Deployment', deploymentSchema);
export default Deployment;
