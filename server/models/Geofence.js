import mongoose from 'mongoose';

const geofenceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise', required: true },

    // Zone shape
    type: { type: String, enum: ['circle', 'polygon'], required: true },

    // Circle fields
    center: {
        lat: { type: Number },
        lng: { type: Number }
    },
    radius: { type: Number }, // meters

    // Polygon fields
    polygon: [{
        lat: { type: Number },
        lng: { type: Number }
    }],

    // Display
    color: { type: String, default: '#00E599' },

    // Assigned devices
    devices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }],

    // Alert settings
    alertOnExit: { type: Boolean, default: true },
    alertOnEntry: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Geofence', geofenceSchema);
