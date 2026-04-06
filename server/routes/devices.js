import express from 'express';
import db from '../db/knex.js';
import { broadcast } from '../simulation/engine.js';
import { logAudit } from '../utils/auditLogger.js';
import crypto from 'crypto';

const router = express.Router();

// Helper: convert snake_case DB row to frontend-compatible format
function formatDevice(d) {
    return {
        _id: d.id, id: d.id, imei: d.imei, name: d.name,
        deviceType: d.device_type, serialNumber: d.serial_number,
        subscriberNumber: d.subscriber_number, plateId: d.plate_id,
        assignedTo: d.assigned_to, enterpriseId: d.enterprise_id,
        enterpriseName: d.enterprise_name, dataSource: d.data_source,
        trackingToken: d.tracking_token, status: d.status, lastUpdate: d.last_update,
        location: { type: 'Point', coordinates: [d.location_lng, d.location_lat] },
        address: d.address, speed: d.speed, heading: d.heading, battery: d.battery,
        signal: d.signal, altitude: d.altitude, temperature: d.temperature,
        fuelLevel: d.fuel_level, odometer: d.odometer, ignition: d.ignition,
        simulation: { isRunning: d.sim_is_running, routeId: d.sim_route_id }
    };
}

// Get all devices
router.get('/', async (req, res) => {
    try {
        const { enterpriseId, status } = req.query;
        let query = db('devices');
        if (enterpriseId) query = query.where('enterprise_id', enterpriseId);
        if (status && status !== 'all') query = query.where('status', status);

        const devices = await query.orderBy('updated_at', 'desc');

        const formatted = devices.map(d => ({
            id: d.id,
            imei: d.imei,
            name: d.name,
            deviceType: d.device_type,
            serialNumber: d.serial_number,
            subscriberNumber: d.subscriber_number,
            plateId: d.plate_id,
            assignedTo: d.assigned_to,
            enterpriseId: d.enterprise_id,
            enterpriseName: d.enterprise_name,
            dataSource: d.data_source,
            trackingToken: d.tracking_token,
            status: d.status,
            lastUpdate: d.last_update,
            location: {
                lat: d.location_lat,
                lng: d.location_lng,
                address: d.address
            },
            speed: d.speed,
            heading: d.heading,
            battery: d.battery,
            signal: d.signal,
            altitude: d.altitude,
            temperature: d.temperature,
            fuelLevel: d.fuel_level,
            odometer: d.odometer,
            ignition: d.ignition
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single device
router.get('/:id', async (req, res) => {
    try {
        const device = await db('devices').where('id', req.params.id).first();
        if (!device) return res.status(404).json({ error: 'Device not found' });
        res.json(device);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create device
router.post('/', async (req, res) => {
    try {
        let deviceData = {
            name: req.body.name,
            imei: req.body.imei,
            device_type: req.body.deviceType || 'tracker',
            serial_number: req.body.serialNumber,
            subscriber_number: req.body.subscriberNumber,
            plate_id: req.body.plateId,
            assigned_to: req.body.assignedTo,
            enterprise_id: req.body.enterpriseId,
            enterprise_name: req.body.enterpriseName,
            data_source: req.body.dataSource || 'fake',
            location_lng: req.body.location?.lng || 10.1815,
            location_lat: req.body.location?.lat || 36.8065,
            address: req.body.location?.address || '',
        };

        // Auto-Generate IDs if Enterprise is provided
        if (deviceData.enterprise_id) {
            const enterprise = await db('enterprises').where('id', deviceData.enterprise_id).first();
            if (enterprise) {
                const newSerialCounter = (enterprise.last_serial_counter || 0) + 1;
                const newImeiCounter = (enterprise.last_imei_counter || 0) + 1;
                const newSubCounter = (enterprise.last_subscriber_counter || 0) + 1;

                deviceData.serial_number = `${enterprise.serial_prefix || 'GT'}${newSerialCounter.toString().padStart(4, '0')}`;
                deviceData.imei = `${enterprise.imei_prefix || '35907'}${newImeiCounter.toString().padStart(3, '0')}`;
                deviceData.subscriber_number = `${enterprise.subscriber_prefix || '500'}${newSubCounter}`;

                await db('enterprises').where('id', deviceData.enterprise_id).update({
                    last_serial_counter: newSerialCounter,
                    last_imei_counter: newImeiCounter,
                    last_subscriber_counter: newSubCounter,
                });
            }
        }

        if (deviceData.data_source === 'real') {
            deviceData.tracking_token = crypto.randomBytes(16).toString('hex');
        }

        const [device] = await db('devices').insert(deviceData).returning('*');

        await logAudit('device.create', 'Admin', {
            targetType: 'device', targetId: device.id, targetName: device.name
        });

        res.status(201).json(formatDevice(device));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update device
router.put('/:id', async (req, res) => {
    try {
        const updates = {};
        // Map camelCase body to snake_case columns
        if (req.body.name !== undefined) updates.name = req.body.name;
        if (req.body.status !== undefined) updates.status = req.body.status;
        if (req.body.deviceType !== undefined) updates.device_type = req.body.deviceType;
        if (req.body.assignedTo !== undefined) updates.assigned_to = req.body.assignedTo;
        if (req.body.plateId !== undefined) updates.plate_id = req.body.plateId;
        if (req.body.enterpriseId !== undefined) updates.enterprise_id = req.body.enterpriseId;
        if (req.body.enterpriseName !== undefined) updates.enterprise_name = req.body.enterpriseName;
        if (req.body.location) {
            updates.location_lng = req.body.location.lng;
            updates.location_lat = req.body.location.lat;
            updates.address = req.body.location.address;
        }
        updates.updated_at = new Date();

        const [device] = await db('devices').where('id', req.params.id).update(updates).returning('*');
        if (!device) return res.status(404).json({ error: 'Device not found' });

        // If status changed to stolen or lost, create alert
        if (updates.status === 'stolen' || updates.status === 'lost') {
            const message = updates.status === 'stolen'
                ? `🚨 ALERTE VOL : L'appareil "${device.name}" a été déclaré volé !`
                : `⚠️ ALERTE PERTE : L'appareil "${device.name}" a été déclaré perdu !`;

            const [alert] = await db('alerts').insert({
                device_id: device.id,
                device_name: device.name,
                enterprise_id: device.enterprise_id,
                type: 'sos',
                severity: 'high',
                message
            }).returning('*');
            broadcast('alert-new', alert, device.enterprise_id);
        }

        await logAudit('device.update', 'Admin', {
            targetType: 'device', targetId: device.id, targetName: device.name
        });

        // Return in format similar to Mongoose doc
        res.json(formatDevice(device));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete device
router.delete('/:id', async (req, res) => {
    try {
        const device = await db('devices').where('id', req.params.id).first();
        if (!device) return res.status(404).json({ error: 'Device not found' });

        await db('devices').where('id', req.params.id).del();

        await logAudit('device.delete', 'Admin', {
            targetType: 'device', targetId: device.id, targetName: device.name
        });

        res.json({ message: 'Device deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get device history
router.get('/:id/history', async (req, res) => {
    try {
        const { start, end, limit = 1000 } = req.query;
        let query = db('device_history').where('device_id', req.params.id);

        if (start) query = query.where('timestamp', '>=', new Date(start));
        if (end) query = query.where('timestamp', '<=', new Date(end));

        const history = await query.orderBy('timestamp', 'desc').limit(parseInt(limit));

        // Map to same format as MongoDB response
        const formatted = history.map(h => ({
            _id: h.id,
            deviceId: h.device_id,
            location: {
                type: 'Point',
                coordinates: [h.location_lng, h.location_lat]
            },
            speed: h.speed,
            heading: h.heading,
            battery: h.battery,
            signal: h.signal,
            address: h.address,
            status: h.status,
            timestamp: h.timestamp,
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
