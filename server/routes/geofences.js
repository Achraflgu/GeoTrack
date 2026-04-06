import express from 'express';
import db from '../db/knex.js';

const router = express.Router();

// GET all geofences
router.get('/', async (req, res) => {
    try {
        let query = db('geofences');
        if (req.query.enterpriseId) query = query.where('enterprise_id', req.query.enterpriseId);
        if (req.query.userId) query = query.where('created_by', req.query.userId);
        const geofences = await query.orderBy('created_at', 'desc');

        // Populate devices for each geofence
        const result = await Promise.all(geofences.map(async (g) => {
            const deviceIds = await db('geofence_devices').where('geofence_id', g.id).select('device_id');
            const devices = deviceIds.length > 0
                ? await db('devices').whereIn('id', deviceIds.map(d => d.device_id))
                    .select('id', 'name', 'imei', 'status', 'location_lat', 'location_lng', 'device_type')
                : [];

            return {
                _id: g.id, id: g.id,
                name: g.name,
                enterpriseId: g.enterprise_id,
                type: g.type,
                center: g.center_lat ? { lat: g.center_lat, lng: g.center_lng } : undefined,
                radius: g.radius,
                polygon: typeof g.polygon === 'string' ? JSON.parse(g.polygon) : g.polygon,
                color: g.color,
                devices: devices.map(d => ({
                    _id: d.id, id: d.id, name: d.name, imei: d.imei, status: d.status,
                    deviceType: d.device_type,
                    location: { type: 'Point', coordinates: [d.location_lng, d.location_lat] }
                })),
                alertOnExit: g.alert_on_exit,
                alertOnEntry: g.alert_on_entry,
                isActive: g.is_active,
                createdBy: g.created_by,
                createdAt: g.created_at,
                updatedAt: g.updated_at,
            };
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single geofence
router.get('/:id', async (req, res) => {
    try {
        const g = await db('geofences').where('id', req.params.id).first();
        if (!g) return res.status(404).json({ error: 'Geofence not found' });

        const deviceIds = await db('geofence_devices').where('geofence_id', g.id).select('device_id');
        const devices = deviceIds.length > 0
            ? await db('devices').whereIn('id', deviceIds.map(d => d.device_id))
            : [];

        res.json({
            ...g, _id: g.id,
            polygon: typeof g.polygon === 'string' ? JSON.parse(g.polygon) : g.polygon,
            devices
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE geofence
router.post('/', async (req, res) => {
    try {
        const { devices, ...data } = req.body;
        const [geofence] = await db('geofences').insert({
            name: data.name,
            enterprise_id: data.enterpriseId,
            type: data.type,
            center_lat: data.center?.lat,
            center_lng: data.center?.lng,
            radius: data.radius,
            polygon: JSON.stringify(data.polygon || []),
            color: data.color || '#00E599',
            alert_on_exit: data.alertOnExit ?? true,
            alert_on_entry: data.alertOnEntry ?? false,
            is_active: data.isActive ?? true,
            created_by: data.createdBy || null,
        }).returning('*');

        // Insert device associations
        if (devices?.length > 0) {
            await db('geofence_devices').insert(
                devices.map(deviceId => ({ geofence_id: geofence.id, device_id: deviceId }))
            );
        }

        // Return populated
        const populatedDevices = devices?.length > 0
            ? await db('devices').whereIn('id', devices)
                .select('id', 'name', 'imei', 'status', 'location_lat', 'location_lng', 'device_type')
            : [];

        res.status(201).json({
            ...geofence, _id: geofence.id,
            polygon: typeof geofence.polygon === 'string' ? JSON.parse(geofence.polygon) : geofence.polygon,
            center: geofence.center_lat ? { lat: geofence.center_lat, lng: geofence.center_lng } : undefined,
            devices: populatedDevices.map(d => ({
                _id: d.id, id: d.id, name: d.name, imei: d.imei, status: d.status,
                deviceType: d.device_type,
                location: { type: 'Point', coordinates: [d.location_lng, d.location_lat] }
            }))
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// UPDATE geofence
router.put('/:id', async (req, res) => {
    try {
        const { devices, ...data } = req.body;
        const updates = {};
        if (data.name !== undefined) updates.name = data.name;
        if (data.type !== undefined) updates.type = data.type;
        if (data.center) { updates.center_lat = data.center.lat; updates.center_lng = data.center.lng; }
        if (data.radius !== undefined) updates.radius = data.radius;
        if (data.polygon !== undefined) updates.polygon = JSON.stringify(data.polygon);
        if (data.color !== undefined) updates.color = data.color;
        if (data.alertOnExit !== undefined) updates.alert_on_exit = data.alertOnExit;
        if (data.alertOnEntry !== undefined) updates.alert_on_entry = data.alertOnEntry;
        if (data.isActive !== undefined) updates.is_active = data.isActive;
        updates.updated_at = new Date();

        const [geofence] = await db('geofences').where('id', req.params.id).update(updates).returning('*');
        if (!geofence) return res.status(404).json({ error: 'Geofence not found' });

        // Update device associations
        if (devices !== undefined) {
            await db('geofence_devices').where('geofence_id', req.params.id).del();
            if (devices.length > 0) {
                await db('geofence_devices').insert(
                    devices.map(deviceId => ({ geofence_id: req.params.id, device_id: deviceId }))
                );
            }
        }

        const deviceIds = await db('geofence_devices').where('geofence_id', req.params.id).select('device_id');
        const populatedDevices = deviceIds.length > 0
            ? await db('devices').whereIn('id', deviceIds.map(d => d.device_id))
                .select('id', 'name', 'imei', 'status', 'location_lat', 'location_lng', 'device_type')
            : [];

        res.json({
            ...geofence, _id: geofence.id,
            polygon: typeof geofence.polygon === 'string' ? JSON.parse(geofence.polygon) : geofence.polygon,
            center: geofence.center_lat ? { lat: geofence.center_lat, lng: geofence.center_lng } : undefined,
            devices: populatedDevices.map(d => ({
                _id: d.id, id: d.id, name: d.name, imei: d.imei, status: d.status,
                deviceType: d.device_type,
                location: { type: 'Point', coordinates: [d.location_lng, d.location_lat] }
            }))
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE geofence
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await db('geofences').where('id', req.params.id).del();
        if (!deleted) return res.status(404).json({ error: 'Geofence not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CHECK geofences
router.post('/check', async (req, res) => {
    try {
        const geofences = await db('geofences').where('is_active', true);
        let alertsCreated = 0;

        for (const zone of geofences) {
            const deviceIds = await db('geofence_devices').where('geofence_id', zone.id).select('device_id');
            if (deviceIds.length === 0) continue;

            const devices = await db('devices').whereIn('id', deviceIds.map(d => d.device_id));

            for (const device of devices) {
                const lat = device.location_lat;
                const lng = device.location_lng;
                if (!lat || !lng) continue;

                let isInside = false;
                if (zone.type === 'circle' && zone.center_lat && zone.radius) {
                    const dist = haversine(lat, lng, zone.center_lat, zone.center_lng);
                    isInside = dist <= zone.radius;
                } else if (zone.type === 'polygon') {
                    const polygon = typeof zone.polygon === 'string' ? JSON.parse(zone.polygon) : zone.polygon;
                    if (polygon?.length >= 3) isInside = pointInPolygon(lat, lng, polygon);
                }

                if (!isInside && zone.alert_on_exit) {
                    await db('alerts').insert({
                        device_id: device.id, device_name: device.name,
                        enterprise_id: device.enterprise_id, type: 'geofence', severity: 'high',
                        message: `${device.name} a quitté la zone "${zone.name}"`
                    });
                    alertsCreated++;
                }
                if (isInside && zone.alert_on_entry) {
                    await db('alerts').insert({
                        device_id: device.id, device_name: device.name,
                        enterprise_id: device.enterprise_id, type: 'geofence', severity: 'medium',
                        message: `${device.name} est entré dans la zone "${zone.name}"`
                    });
                    alertsCreated++;
                }
            }
        }

        res.json({ checked: geofences.length, alertsCreated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helpers
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pointInPolygon(lat, lng, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat, yi = polygon[i].lng;
        const xj = polygon[j].lat, yj = polygon[j].lng;
        const intersect = ((yi > lng) !== (yj > lng)) &&
            (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

export default router;
