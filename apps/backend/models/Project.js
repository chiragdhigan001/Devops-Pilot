import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  githubRepo: { type: String, trim: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deploymentStatus: { type: String, enum: ['idle', 'deploying', 'running', 'failed'], default: 'idle' },
  description: { type: String, trim: true },
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);
export default Project;
