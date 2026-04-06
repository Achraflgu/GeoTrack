import express from 'express';
import db from '../db/knex.js';

const router = express.Router();

// Receive GPS update from phone tracker
router.post('/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { lat, lng, speed, heading, battery, altitude, accuracy } = req.body;

        const device = await db('devices')
            .where({ tracking_token: token, data_source: 'real' })
            .first();

        if (!device) {
            console.log(`[Track] ❌ Invalid token: ${token.substring(0, 8)}...`);
            return res.status(404).json({ error: 'Device not found or invalid token' });
        }

        await db('devices').where('id', device.id).update({
            location_lng: lng,
            location_lat: lat,
            speed: speed || 0,
            heading: heading || 0,
            battery: battery || device.battery,
            altitude: altitude,
            status: req.body.status || (speed > 5 ? 'moving' : 'online'),
            last_update: new Date(),
        });

        await db('device_history').insert({
            device_id: device.id,
            location_lng: lng,
            location_lat: lat,
            speed: speed || 0,
            heading: heading || 0,
            battery: battery,
            address: req.body.address || device.address,
            status: req.body.status || (speed > 5 ? 'moving' : 'online'),
            timestamp: new Date(),
        });

        console.log(`[Track] 📱 ${device.name} | ${lat.toFixed(5)}, ${lng.toFixed(5)} | ${speed || 0} km/h | 🔋 ${battery || '--'}%`);

        res.json({
            success: true,
            deviceId: device.id,
            deviceName: device.name
        });
    } catch (error) {
        console.error('[Track] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get tracking info
router.get('/:token/info', async (req, res) => {
    try {
        const device = await db('devices')
            .where({ tracking_token: req.params.token, data_source: 'real' })
            .first();

        if (!device) return res.status(404).json({ error: 'Invalid tracking token' });

        res.json({
            deviceName: device.name,
            enterpriseName: device.enterprise_name,
            lastUpdate: device.last_update
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
