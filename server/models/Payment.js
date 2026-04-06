import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise' },

    // Plan
    plan: { type: String, enum: ['starter', 'pro', 'enterprise'], required: true },
    previousPlan: { type: String, enum: ['starter', 'pro', 'enterprise', ''] , default: '' },

    // Billing
    amount: { type: Number, required: true },
    billingCycle: { type: String, enum: ['monthly', 'biannual', 'annual'], default: 'monthly' },

    // Status
    status: {
        type: String,
        enum: ['paid', 'pending', 'overdue', 'refunded', 'cancelled'],
        default: 'pending'
    },

    // Payment method
    method: {
        type: String,
        enum: ['d17', 'mastercard', 'bank_transfer', ''],
        default: ''
    },

    // Dates
    dueDate: { type: Date },
    paidAt: { type: Date },

    // Invoice
    invoiceRef: { type: String, unique: true },

    // Notes
    adminNotes: { type: String, default: '' },
    description: { type: String, default: '' },
}, { timestamps: true });

// Auto-generate invoice reference
paymentSchema.pre('save', function (next) {
    if (!this.invoiceRef) {
        const date = new Date();
        const y = date.getFullYear().toString().slice(-2);
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.invoiceRef = `INV-${y}${m}-${rand}`;
    }
    next();
});

export default mongoose.model('Payment', paymentSchema);
