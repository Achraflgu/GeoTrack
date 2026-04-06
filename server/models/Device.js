import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
    imei: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    deviceType: {
        type: String,
        enum: ['tracker', 'gps', 'beacon', 'sensor', 'mobile', 'vehicle', 'asset', 'personal', 'container', 'drone', 'camera'],
        default: 'tracker'
    },
    serialNumber: { type: String, required: true },
    subscriberNumber: String,
    plateId: String,
    assignedTo: String,
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise', required: true },
    enterpriseName: String,

    // Data source: fake (simulated) or real (phone GPS)
    dataSource: { type: String, enum: ['fake', 'real'], default: 'fake' },
    trackingToken: String,  // For real devices - unique token for phone tracking

    // Live data
    status: { type: String, enum: ['online', 'offline', 'moving', 'idle', 'alert', 'stolen', 'lost'], default: 'offline' },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [10.1815, 36.8065] }  // [lng, lat]
    },
    address: { type: String, default: '' },
    speed: { type: Number, default: 0 },
    heading: { type: Number, default: 0 },
    battery: { type: Number, default: 100 },
    signal: { type: Number, default: 100 },

    // Extended GPS fields
    altitude: Number,
    temperature: Number,
    fuelLevel: Number,
    odometer: Number,
    ignition: Boolean,

    // Simulation config (for fake devices)
    simulation: {
        routeId: { type: String, default: 'tunis-ariana' },
        currentIndex: { type: Number, default: 0 },
        direction: { type: Number, default: 1 },
        isRunning: { type: Boolean, default: true }
    },

    lastUpdate: { type: Date, default: Date.now }
}, { timestamps: true });

// Geospatial index for location queries
deviceSchema.index({ location: '2dsphere' });

export default mongoose.model('Device', deviceSchema);
