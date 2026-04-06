import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    // Client info
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    company: { type: String, default: '' },
    usageType: { type: String, enum: ['personal', 'professional'], default: 'professional' },

    // GPS details
    gpsCount: { type: Number, required: true, min: 1 },
    gpsTypes: [{
        type: { type: String },
        count: { type: Number, default: 0 }
    }],

    // Plan & billing
    plan: { type: String, enum: ['starter', 'pro', 'enterprise'], default: 'starter' },
    billingCycle: { type: String, enum: ['monthly', 'biannual', 'annual'], default: 'monthly' },
    totalDueToday: { type: Number, default: 0 },
    recurringCost: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['online', 'on_installation', ''], default: '' },

    // Source & status
    source: { type: String, enum: ['chatbot', 'popup', 'manual'], default: 'popup' },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'installing', 'active', 'cancelled'],
        default: 'pending'
    },

    // Admin
    adminNotes: { type: String, default: '' },
    confirmedAt: { type: Date },
    installedAt: { type: Date },
    activatedAt: { type: Date },
    cancelledAt: { type: Date },

    // Reference
    orderRef: { type: String, unique: true },
}, { timestamps: true });

// Auto-generate order reference
orderSchema.pre('save', function (next) {
    if (!this.orderRef) {
        const date = new Date();
        const prefix = 'GT';
        const y = date.getFullYear().toString().slice(-2);
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.orderRef = `${prefix}-${y}${m}-${rand}`;
    }
    next();
});

export default mongoose.model('Order', orderSchema);
