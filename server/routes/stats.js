import express from 'express';
import db from '../db/knex.js';

const router = express.Router();

// Get dashboard statistics
router.get('/', async (req, res) => {
    try {
        const { enterpriseId } = req.query;
        
        let devicesQuery = db('devices');
        let usersQuery = db('users');
        if (enterpriseId) {
            devicesQuery = devicesQuery.where('enterprise_id', enterpriseId);
            usersQuery = usersQuery.where('enterprise_id', enterpriseId);
        }

        const [
            [{ count: deviceCount }],
            [{ count: enterpriseCount }],
            [{ count: userCount }],
            [{ count: onlineDevices }],
            [{ count: movingDevices }],
            [{ count: offlineDevices }]
        ] = await Promise.all([
            devicesQuery.clone().count('id as count'),
            enterpriseId
                ? db('enterprises').where('id', enterpriseId).count('id as count')
                : db('enterprises').count('id as count'),
            usersQuery.clone().count('id as count'),
            devicesQuery.clone().whereIn('status', ['online', 'moving']).count('id as count'),
            devicesQuery.clone().where('status', 'moving').count('id as count'),
            devicesQuery.clone().where('status', 'offline').count('id as count'),
        ]);

        let recentQuery = db('devices');
        if (enterpriseId) recentQuery = recentQuery.where('enterprise_id', enterpriseId);
        const recentDevices = await recentQuery.orderBy('updated_at', 'desc').limit(5);

        res.json({
            stats: {
                total: parseInt(deviceCount),
                online: parseInt(onlineDevices),
                moving: parseInt(movingDevices),
                offline: parseInt(offlineDevices),
                alerts: 0,
                enterprises: parseInt(enterpriseCount),
                users: parseInt(userCount)
            },
            recentDevices: recentDevices.map(d => ({
                id: d.id, name: d.name, status: d.status, lastUpdate: d.last_update
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
