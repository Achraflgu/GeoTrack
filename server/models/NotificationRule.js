import mongoose from 'mongoose';

const notificationRuleSchema = new mongoose.Schema({
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise', required: true },
    alertType: { 
        type: String, 
        enum: ['battery', 'offline', 'geofence', 'speed', 'sos', 'all'],
        required: true 
    },
    severityTarget: {
        type: String,
        enum: ['high', 'medium', 'low', 'all'],
        default: 'all'
    },
    emails: [{ type: String, required: true }],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('NotificationRule', notificationRuleSchema);
