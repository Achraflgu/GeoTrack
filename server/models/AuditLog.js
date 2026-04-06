import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    action: { type: String, required: true }, // e.g. 'user.login', 'device.create', 'enterprise.update'
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, required: true },
    targetType: { type: String }, // 'device', 'enterprise', 'user', null
    targetId: { type: mongoose.Schema.Types.ObjectId },
    targetName: { type: String },
    ip: { type: String },
    details: { type: mongoose.Schema.Types.Mixed } // Additional metadata
}, { timestamps: true });

// Index for efficient querying
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ userId: 1 });

export default mongoose.model('AuditLog', auditLogSchema);
