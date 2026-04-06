import mongoose from 'mongoose';

const enterpriseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contactEmail: { type: String, required: true },
    contactPhone: String,
    phone: String,
    address: String,
    plan: { type: String, enum: ['starter', 'pro', 'enterprise'], default: 'starter' },
    status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' },

    // Sequential Generation Counters
    serialPrefix: { type: String, default: 'GT' },
    lastSerialCounter: { type: Number, default: 0 },

    imeiPrefix: { type: String, default: '35907' },
    lastImeiCounter: { type: Number, default: 0 },

    subscriberPrefix: { type: String, default: '500' },
    lastSubscriberCounter: { type: Number, default: 8000 }
}, { timestamps: true });

export default mongoose.model('Enterprise', enterpriseSchema);
