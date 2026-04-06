import mongoose from 'mongoose';

const deviceHistorySchema = new mongoose.Schema({
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], required: true }
    },
    speed: Number,
    heading: Number,
    battery: Number,
    signal: Number,
    address: String,
    status: String,
    timestamp: { type: Date, default: Date.now }
});

// Index for efficient history queries
deviceHistorySchema.index({ deviceId: 1, timestamp: -1 });
deviceHistorySchema.index({ location: '2dsphere' });

export default mongoose.model('DeviceHistory', deviceHistorySchema);
