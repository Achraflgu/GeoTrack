import db from '../db/knex.js';
import { routes, routeAddresses } from './routes.js';

let simulationInterval = null;
let wsClients = new Set();
let simulationCycleCount = 0;

// Cooldown map to prevent alert spam (deviceId -> { type -> timestamp })
const alertCooldowns = new Map();
const ALERT_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes between same alert type

// Track device zone state to detect transitions (enter/exit)
const deviceZoneState = new Map();

// Check if we should create an alert (respects cooldown)
function shouldCreateAlert(deviceId, alertType) {
    const key = `${deviceId}_${alertType}`;
    const now = Date.now();
    const lastAlert = alertCooldowns.get(key);

    if (!lastAlert || (now - lastAlert) > ALERT_COOLDOWN_MS) {
        alertCooldowns.set(key, now);
        return true;
    }
    return false;
}

// Register WebSocket client for real-time updates
export function registerClient(ws) {
    wsClients.add(ws);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'identify') {
                ws.user = data.data;  // { role, enterpriseId, userId }
                console.log(`[WebSocket] Client identified as ${ws.user.role} for enterprise ${ws.user.enterpriseId || 'global'}`);
            }
        } catch (e) {
            console.error('[WebSocket] Identify error:', e.message);
        }
    });

    ws.on('close', () => wsClients.delete(ws));
}

// Broadcast message to authorized clients
export function broadcast(type, data, enterpriseId = null) {
    const message = JSON.stringify({ type, data });
    wsClients.forEach(client => {
        if (client.readyState !== 1) return;
        const user = client.user;
        if (!user) return;

        // Admins & supervisors get everything
        if (user.role === 'admin' || user.role === 'supervisor') {
            client.send(message);
            return;
        }

        // Enterprise-scoped messages
        if (enterpriseId && user.enterpriseId === enterpriseId.toString()) {
            client.send(message);
            return;
        }

        // Operator device-update: filter to their enterprise only
        if (type === 'devices-update' && Array.isArray(data)) {
            const filteredData = data.filter(d =>
                (d.enterprise_id || d.enterpriseId)?.toString() === user.enterpriseId
            );
            if (filteredData.length > 0) {
                client.send(JSON.stringify({ type, data: filteredData }));
            }
        }
    });
}

// Broadcast support message: reaches ticket owner + all admins/supervisors
export function broadcastSupportMessage(type, data, ticketUserId = null, ticketEnterpriseId = null) {
    const message = JSON.stringify({ type, data });
    wsClients.forEach(client => {
        if (client.readyState !== 1) return;
        const user = client.user;
        if (!user) return;

        // Always send to admins/supervisors
        if (user.role === 'admin' || user.role === 'supervisor') {
            client.send(message);
            return;
        }

        // Send to the specific operator who owns the ticket
        if (ticketUserId && user.userId === ticketUserId.toString()) {
            client.send(message);
            return;
        }

        // Fallback: send to same enterprise
        if (ticketEnterpriseId && user.enterpriseId === ticketEnterpriseId.toString()) {
            client.send(message);
        }
    });
}

// Create an alert in the database and broadcast it
async function createAlert(device, type, severity, message) {
    try {
        if (!shouldCreateAlert(device.id.toString(), type)) {
            return;
        }

        const [alert] = await db('alerts').insert({
            device_id: device.id,
            device_name: device.name,
            enterprise_id: device.enterprise_id,
            type,
            severity,
            message
        }).returning('*');

        broadcast('alert-new', {
            _id: alert.id, id: alert.id,
            deviceId: alert.device_id, deviceName: alert.device_name,
            enterpriseId: alert.enterprise_id, type: alert.type,
            severity: alert.severity, message: alert.message,
            createdAt: alert.created_at
        }, device.enterprise_id);

        console.log(`[Alert] Created ${type} alerte for ${device.name}: ${message}`);
    } catch (error) {
        console.error('[Alert] Failed to create alert:', error.message);
    }
}

// Calculate realistic speed based on route segment
function calculateSpeed(route, currentIndex) {
    let baseSpeed = 40 + Math.random() * 20;

    if (currentIndex > 0 && currentIndex < route.length - 1) {
        const prev = route[currentIndex - 1];
        const curr = route[currentIndex];
        const next = route[currentIndex + 1];

        const angle1 = Math.atan2(curr[1] - prev[1], curr[0] - prev[0]);
        const angle2 = Math.atan2(next[1] - curr[1], next[0] - curr[0]);
        const angleDiff = Math.abs(angle2 - angle1);

        if (angleDiff > 0.3) {
            baseSpeed *= 0.6;
        }
    }

    if (Math.random() < 0.05) {
        baseSpeed = 0;
    }

    return Math.round(baseSpeed);
}

// Calculate heading from two points
function calculateHeading(from, to) {
    const dLng = to[0] - from[0];
    const dLat = to[1] - from[1];
    let heading = Math.atan2(dLng, dLat) * (180 / Math.PI);
    if (heading < 0) heading += 360;
    return Math.round(heading);
}

// Get address for current position
function getAddress(routeId, index) {
    const addresses = routeAddresses[routeId];
    if (!addresses || addresses.length === 0) return 'Position inconnue';
    const addressIndex = Math.floor((index / routes[routeId].length) * addresses.length);
    return addresses[Math.min(addressIndex, addresses.length - 1)];
}

// Device type behavior profiles
const DEVICE_BEHAVIORS = {
    vehicle: { movingChance: 0.85, stopDurationMin: 2, stopDurationMax: 8, moveDurationMin: 20, moveDurationMax: 60 },
    gps: { movingChance: 0.75, stopDurationMin: 3, stopDurationMax: 10, moveDurationMin: 15, moveDurationMax: 40 },
    tracker: { movingChance: 0.60, stopDurationMin: 5, stopDurationMax: 20, moveDurationMin: 10, moveDurationMax: 30 },
    mobile: { movingChance: 0.50, stopDurationMin: 10, stopDurationMax: 30, moveDurationMin: 5, moveDurationMax: 20 },
    personal: { movingChance: 0.40, stopDurationMin: 15, stopDurationMax: 60, moveDurationMin: 5, moveDurationMax: 15 },
    asset: { movingChance: 0.10, stopDurationMin: 50, stopDurationMax: 200, moveDurationMin: 3, moveDurationMax: 10 },
    container: { movingChance: 0.15, stopDurationMin: 60, stopDurationMax: 300, moveDurationMin: 20, moveDurationMax: 60 },
    beacon: { movingChance: 0.05, stopDurationMin: 100, stopDurationMax: 500, moveDurationMin: 2, moveDurationMax: 5 },
    sensor: { movingChance: 0.02, stopDurationMin: 200, stopDurationMax: 1000, moveDurationMin: 1, moveDurationMax: 3 },
    drone: { movingChance: 0.30, stopDurationMin: 30, stopDurationMax: 120, moveDurationMin: 10, moveDurationMax: 30 },
    camera: { movingChance: 0.01, stopDurationMin: 500, stopDurationMax: 2000, moveDurationMin: 1, moveDurationMax: 2 },
};

// Update a single fake device - all devices always move
async function updateFakeDevice(device, settingsCache) {
    try {
        const routeId = device.sim_route_id || 'tunis-ariana';
        const route = routes[routeId];

        if (!route || route.length < 2) {
            return;
        }

        let currentIndex = device.sim_current_index || 0;
        let direction = device.sim_direction || 1;

        // Determine device role based on device ID hash (~30% parked, ~70% moving)
        const deviceIdHash = device.id.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const isParkedDevice = deviceIdHash % 10 < 3;

        let speed = 0;
        let status = 'online';

        if (isParkedDevice) {
            speed = 0;
            status = 'online';
        } else {
            currentIndex = Math.max(0, Math.min(currentIndex, route.length - 1));
            currentIndex += direction;

            if (currentIndex >= route.length - 1) {
                direction = -1;
                currentIndex = route.length - 1;
            } else if (currentIndex <= 0) {
                direction = 1;
                currentIndex = 0;
            }

            speed = calculateSpeed(route, currentIndex);
            speed = Math.max(5, speed + Math.floor((Math.random() - 0.5) * 10));
            status = speed > 15 ? 'moving' : 'idle';
        }

        const currentPos = route[currentIndex];
        if (!currentPos) return;

        const prevIndex = Math.max(0, Math.min(currentIndex - direction, route.length - 1));
        const prevPos = route[prevIndex] || currentPos;

        const heading = calculateHeading(prevPos, currentPos);

        const batteryDrain = speed > 0 ? 0.3 + Math.random() * 0.4 : 0.05;
        const newBattery = Math.max(5, device.battery - batteryDrain);

        // Speed spike: 10% chance for moving devices
        if (!isParkedDevice && Math.random() < 0.1) {
            speed = 80 + Math.floor(Math.random() * 40);
        }

        const signalBase = device.signal || 85;
        const signal = Math.max(50, Math.min(100, signalBase + (Math.random() - 0.5) * 5));

        // Update device in PostgreSQL
        await db('devices').where('id', device.id).update({
            location_lng: currentPos[0],
            location_lat: currentPos[1],
            address: getAddress(routeId, currentIndex),
            speed,
            heading,
            battery: Math.round(newBattery * 10) / 10,
            signal: Math.round(signal),
            status: speed > 70 ? 'moving' : status,
            last_update: new Date(),
            sim_current_index: currentIndex,
            sim_direction: direction,
        });

        // Save to history (every 3rd update)
        if (currentIndex % 3 === 0) {
            await db('device_history').insert({
                device_id: device.id,
                location_lng: currentPos[0],
                location_lat: currentPos[1],
                speed,
                heading,
                battery: Math.round(newBattery),
                signal: Math.round(signal),
                address: getAddress(routeId, currentIndex),
                status,
                timestamp: new Date(),
            });
        }

        // === AUTOMATIC ALERT DETECTION ===
        const alertSettings = settingsCache?.get(device.enterprise_id?.toString()) || {};

        // 1. Low battery alert
        const batteryConfig = alertSettings.battery || { enabled: true, threshold: 30 };
        if (batteryConfig.enabled && newBattery < batteryConfig.threshold) {
            const severity = newBattery < (batteryConfig.threshold / 2) ? 'high' : 'medium';
            await createAlert(device, 'battery', severity,
                `🔋 Batterie faible: ${device.name} (${Math.round(newBattery)}%)`);
        }

        // 2. Speeding alert
        const speedConfig = alertSettings.speed || { enabled: true, threshold: 70 };
        if (speedConfig.enabled && speed > speedConfig.threshold) {
            await createAlert(device, 'speed', speed > (speedConfig.threshold * 1.3) ? 'high' : 'medium',
                `🏎️ Vitesse excessive: ${device.name} (${Math.round(speed)} km/h)`);
        }

        // 3. Low signal alert
        const signalConfig = alertSettings.signal || { enabled: true, threshold: 55 };
        if (signalConfig.enabled && signal < signalConfig.threshold) {
            await createAlert(device, 'signal', 'medium',
                `📶 Signal faible: ${device.name} (${Math.round(signal)}%)`);
        }

        // 4. SOS alert
        const sosConfig = alertSettings.sos || { enabled: true };
        if (sosConfig.enabled && !isParkedDevice && speed > 20 && Math.random() < 0.01) {
            await createAlert(device, 'sos', 'high',
                `🆘 Alerte SOS: ${device.name} - Bouton SOS activé`);
        }

    } catch (error) {
        console.error(`[Simulation] Error updating device ${device.name}:`, error.message);
    }
}

// Mark devices as offline if they haven't sent updates recently
async function checkOfflineDevices(settingsCache) {
    try {
        const threshold = new Date(Date.now() - 10 * 1000); // 10 seconds ago

        const inactiveDevices = await db('devices')
            .whereNot('status', 'offline')
            .where('last_update', '<', threshold);

        if (inactiveDevices.length > 0) {
            for (const device of inactiveDevices) {
                await db('devices').where('id', device.id).update({ status: 'offline' });

                const alertSettings = settingsCache?.get(device.enterprise_id?.toString()) || {};
                const offlineConfig = alertSettings.offline || { enabled: true };
                
                if (offlineConfig.enabled) {
                    await createAlert(device, 'offline', 'high',
                        'Appareil hors ligne - Aucune mise à jour depuis plus de 10 secondes');
                }
            }
        }
    } catch (error) {
        console.error('[Health] Error checking offline devices:', error.message);
    }
}

// Convert PostgreSQL snake_case row to frontend-compatible camelCase format
function formatDeviceForFrontend(d) {
    return {
        _id: d.id,
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
            type: 'Point',
            coordinates: [d.location_lng, d.location_lat]
        },
        address: d.address,
        speed: d.speed,
        heading: d.heading,
        battery: d.battery,
        signal: d.signal,
        altitude: d.altitude,
        temperature: d.temperature,
        fuelLevel: d.fuel_level,
        odometer: d.odometer,
        ignition: d.ignition,
        simulation: {
            isRunning: d.sim_is_running,
            routeId: d.sim_route_id,
            currentIndex: d.sim_current_index,
            direction: d.sim_direction
        }
    };
}

// Run one simulation cycle
async function runSimulationCycle() {
    try {
        simulationCycleCount++;
        
        const enterprises = await db('enterprises').select('id', 'alert_settings');
        const settingsCache = new Map(enterprises.map(e => [
            e.id?.toString(),
            (typeof e.alert_settings === 'string' ? JSON.parse(e.alert_settings) : e.alert_settings) || {}
        ]));

        await checkOfflineDevices(settingsCache);

        // Get all fake devices that are running simulation
        const fakeDevices = await db('devices')
            .where('data_source', 'fake')
            .where('sim_is_running', true);

        // Update each fake device
        await Promise.all(fakeDevices.map(d => updateFakeDevice(d, settingsCache)));

        // Get all devices for broadcast — format for frontend compatibility
        const allDevices = await db('devices');
        const formatted = allDevices.map(formatDeviceForFrontend);
        broadcast('devices-update', formatted);

        // Log simulation cycle
        const enterpriseIds = new Set(allDevices.map(d => d.enterprise_id?.toString()));
        if (fakeDevices.length > 0) {
            console.log(`[Simulation] Updated ${fakeDevices.length} devices | ${enterpriseIds.size} enterprises | ${allDevices.length} total`);
        }

        // Check geofence boundaries
        await checkGeofences(allDevices, settingsCache);
    } catch (error) {
        console.error('[Simulation] Error:', error.message);
    }
}

// Start simulation engine
export function startSimulation(intervalMs = 5000) {
    if (simulationInterval) {
        console.log('[Simulation] Already running');
        return;
    }

    console.log(`[Simulation] Starting with ${intervalMs}ms interval`);
    simulationInterval = setInterval(runSimulationCycle, intervalMs);
    runSimulationCycle();
}

// Stop simulation
export function stopSimulation() {
    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
        console.log('[Simulation] Stopped');
    }
}

// ─── Geofence boundary checking ────────────────────────────────────
function haversineDistance(lat1, lon1, lat2, lon2) {
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

async function checkGeofences(allDevices, settingsCache) {
    try {
        const geofences = await db('geofences').where('is_active', true);
        if (geofences.length === 0) return;

        // Fetch geofence assigned devices
        const deviceMap = new Map(allDevices.map(d => [d.id.toString(), d]));
        const geofenceDevices = await db('geofence_devices');
        const geofenceToDevices = {};
        geofenceDevices.forEach(gd => {
            const zId = gd.geofence_id.toString();
            if (!geofenceToDevices[zId]) geofenceToDevices[zId] = [];
            geofenceToDevices[zId].push(gd.device_id.toString());
        });

        for (const zone of geofences) {
            const devicesInZone = geofenceToDevices[zone.id.toString()] || [];
            if (devicesInZone.length === 0) continue;

            for (const deviceId of devicesInZone) {
                const device = deviceMap.get(deviceId);
                if (!device || device.location_lng == null) continue;

                const alertSettings = settingsCache?.get(device.enterprise_id?.toString()) || {};
                const geofenceConfig = alertSettings.geofence || { enabled: true };
                if (!geofenceConfig.enabled) continue;

                const lat = device.location_lat;
                const lng = device.location_lng;
                let isInside = false;

                if (zone.type === 'circle' && zone.center_lat && zone.radius) {
                    const dist = haversineDistance(lat, lng, zone.center_lat, zone.center_lng);
                    isInside = dist <= zone.radius;
                } else if (zone.type === 'polygon') {
                    const polygon = typeof zone.polygon === 'string' ? JSON.parse(zone.polygon) : zone.polygon;
                    if (polygon?.length >= 3) {
                        isInside = pointInPolygon(lat, lng, polygon);
                    }
                }

                const stateKey = `${device.id}_${zone.id}`;
                const wasInside = deviceZoneState.get(stateKey);

                // Detect EXIT transition
                if (wasInside === true && !isInside && zone.alert_on_exit) {
                    const cooldownKey = `geofence_exit_${zone.id}`;
                    if (shouldCreateAlert(device.id, cooldownKey)) {
                        const msg = `⚠️ Sortie de zone: ${device.name} a quitté la zone "${zone.name}"`;
                        await db('alerts').insert({
                            device_id: device.id,
                            device_name: device.name,
                            enterprise_id: device.enterprise_id,
                            type: 'geofence',
                            severity: 'high',
                            message: msg
                        });
                        broadcast('alert-new', {
                            deviceId: device.id, deviceName: device.name,
                            type: 'geofence', severity: 'high', message: msg
                        }, device.enterprise_id);
                        console.log(`[Geofence] SORTIE: ${device.name} a quitté "${zone.name}"`);
                    }
                }

                // Detect ENTRY transition
                if (wasInside === false && isInside && zone.alert_on_entry) {
                    const cooldownKey = `geofence_entry_${zone.id}`;
                    if (shouldCreateAlert(device.id, cooldownKey)) {
                        const msg = `📍 Entrée de zone: ${device.name} est entré dans la zone "${zone.name}"`;
                        await db('alerts').insert({
                            device_id: device.id,
                            device_name: device.name,
                            enterprise_id: device.enterprise_id,
                            type: 'geofence',
                            severity: 'medium',
                            message: msg
                        });
                        broadcast('alert-new', {
                            deviceId: device.id, deviceName: device.name,
                            type: 'geofence', severity: 'medium', message: msg
                        }, device.enterprise_id);
                        console.log(`[Geofence] ENTRÉE: ${device.name} est entré dans "${zone.name}"`);
                    }
                }

                deviceZoneState.set(stateKey, isInside);
            }
        }
    } catch (error) {
        console.error('[Geofence] Error checking boundaries:', error.message);
    }
}
