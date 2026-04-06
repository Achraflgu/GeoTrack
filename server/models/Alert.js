import mongoose from 'mongoose';
import NotificationRule from './NotificationRule.js';
import { sendAlertEmail } from '../services/email.js';

const alertSchema = new mongoose.Schema({
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
    deviceName: { type: String, required: true },
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise', required: true },
    type: {
        type: String,
        enum: ['battery', 'offline', 'geofence', 'speed', 'sos'],
        required: true
    },
    severity: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
    },
    message: { type: String, required: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

alertSchema.post('save', async function(doc) {
    try {
        // Find rules matching this enterprise
        const rules = await NotificationRule.find({ 
            enterpriseId: doc.enterpriseId,
            isActive: true
        });

        const activeRules = rules.filter(rule => {
            const matchesType = rule.alertType === 'all' || rule.alertType === doc.type;
            const matchesSeverity = rule.severityTarget === 'all' || rule.severityTarget === doc.severity;
            return matchesType && matchesSeverity;
        });

        // Collect unique emails
        const emailsToNotify = new Set();
        activeRules.forEach(r => r.emails.forEach(e => emailsToNotify.add(e)));

        if (emailsToNotify.size > 0) {
            await sendAlertEmail(Array.from(emailsToNotify), doc);
        }
    } catch (err) {
        console.error('[AlertHook] Error processing email rules:', err);
    }
});

export default mongoose.model('Alert', alertSchema);
