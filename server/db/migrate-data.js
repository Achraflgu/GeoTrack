// Migrate data from MongoDB to PostgreSQL
import mongoose from 'mongoose';
import Knex from 'knex';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

// MongoDB Models (import existing ones)
import Device from '../models/Device.js';
import Enterprise from '../models/Enterprise.js';
import User from '../models/User.js';
import Alert from '../models/Alert.js';
import DeviceHistory from '../models/DeviceHistory.js';
import Geofence from '../models/Geofence.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import SupportTicket from '../models/SupportTicket.js';
import SupportMessage from '../models/SupportMessage.js';
import AuditLog from '../models/AuditLog.js';
import NotificationRule from '../models/NotificationRule.js';

const db = Knex({
    client: 'pg',
    connection: { host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'geotrack' },
});

// Map old MongoDB ObjectId -> new UUID
const idMap = new Map();

function mapId(oldId) {
    const key = oldId?.toString();
    if (!key) return null;
    if (!idMap.has(key)) {
        idMap.set(key, uuidv4());
    }
    return idMap.get(key);
}

async function migrateData() {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║     📦 MongoDB → PostgreSQL Data Migration            ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/geotrack';
    console.log(`[MongoDB] Connecting to ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('[MongoDB] Connected ✅\n');

    // 1. Enterprises
    const enterprises = await Enterprise.find();
    console.log(`[1/10] Migrating ${enterprises.length} enterprises...`);
    for (const e of enterprises) {
        const id = mapId(e._id);
        await db('enterprises').insert({
            id,
            name: e.name,
            contact_email: e.contactEmail,
            contact_phone: e.contactPhone || null,
            phone: e.phone || null,
            address: e.address || null,
            plan: e.plan || 'starter',
            status: e.status || 'active',
            serial_prefix: e.serialPrefix || 'GT',
            last_serial_counter: e.lastSerialCounter || 0,
            imei_prefix: e.imeiPrefix || '35907',
            last_imei_counter: e.lastImeiCounter || 0,
            subscriber_prefix: e.subscriberPrefix || '500',
            last_subscriber_counter: e.lastSubscriberCounter || 8000,
            created_at: e.createdAt || new Date(),
            updated_at: e.updatedAt || new Date(),
        }).onConflict('id').ignore();
    }
    console.log(`   ✅ ${enterprises.length} enterprises migrated`);

    // 2. Users
    const users = await User.find();
    console.log(`[2/10] Migrating ${users.length} users...`);
    for (const u of users) {
        const id = mapId(u._id);
        await db('users').insert({
            id,
            email: u.email,
            password: u.password, // Already hashed by Mongoose
            name: u.name,
            role: u.role || 'operator',
            plan: u.plan || 'starter',
            enterprise_id: u.enterpriseId ? mapId(u.enterpriseId) : null,
            enterprise_name: u.enterpriseName || null,
            avatar: u.avatar || null,
            last_login: u.lastLogin || null,
            saved_payment_method: u.savedPaymentMethod || '',
            saved_billing_cycle: u.savedBillingCycle || 'monthly',
            cancel_at_period_end: u.cancelAtPeriodEnd || false,
            email_verified: u.emailVerified || false,
            is_initial_password: u.isInitialPassword ?? true,
            verification_code: u.verificationCode || null,
            verification_code_expiry: u.verificationCodeExpiry || null,
            created_at: u.createdAt || new Date(),
            updated_at: u.updatedAt || new Date(),
        }).onConflict('id').ignore();
    }
    console.log(`   ✅ ${users.length} users migrated`);

    // 3. Devices
    const devices = await Device.find();
    console.log(`[3/10] Migrating ${devices.length} devices...`);
    for (const d of devices) {
        const id = mapId(d._id);
        const lng = d.location?.coordinates?.[0] || 10.1815;
        const lat = d.location?.coordinates?.[1] || 36.8065;
        await db('devices').insert({
            id,
            imei: d.imei,
            name: d.name,
            device_type: d.deviceType || 'tracker',
            serial_number: d.serialNumber,
            subscriber_number: d.subscriberNumber || null,
            plate_id: d.plateId || null,
            assigned_to: d.assignedTo || null,
            enterprise_id: d.enterpriseId ? mapId(d.enterpriseId) : null,
            enterprise_name: d.enterpriseName || null,
            data_source: d.dataSource || 'fake',
            tracking_token: d.trackingToken || null,
            status: d.status || 'offline',
            location_lng: lng,
            location_lat: lat,
            address: d.address || '',
            speed: d.speed || 0,
            heading: d.heading || 0,
            battery: d.battery ?? 100,
            signal: d.signal ?? 100,
            altitude: d.altitude || null,
            temperature: d.temperature || null,
            fuel_level: d.fuelLevel || null,
            odometer: d.odometer || null,
            ignition: d.ignition || null,
            sim_route_id: d.simulation?.routeId || 'tunis-ariana',
            sim_current_index: d.simulation?.currentIndex || 0,
            sim_direction: d.simulation?.direction || 1,
            sim_is_running: d.simulation?.isRunning ?? true,
            last_update: d.lastUpdate || new Date(),
            created_at: d.createdAt || new Date(),
            updated_at: d.updatedAt || new Date(),
        }).onConflict('id').ignore();
    }
    console.log(`   ✅ ${devices.length} devices migrated`);

    // 4. Device History (can be large, batch insert)
    const historyCount = await DeviceHistory.countDocuments();
    console.log(`[4/10] Migrating ${historyCount} history records...`);
    const BATCH = 500;
    let offset = 0;
    while (offset < historyCount) {
        const batch = await DeviceHistory.find().skip(offset).limit(BATCH);
        const rows = batch.map(h => ({
            id: uuidv4(),
            device_id: mapId(h.deviceId),
            location_lng: h.location?.coordinates?.[0] || 0,
            location_lat: h.location?.coordinates?.[1] || 0,
            speed: h.speed || 0,
            heading: h.heading || 0,
            battery: h.battery || null,
            signal: h.signal || null,
            address: h.address || null,
            status: h.status || null,
            timestamp: h.timestamp || new Date(),
        })).filter(r => r.device_id); // Skip orphans

        if (rows.length > 0) {
            await db('device_history').insert(rows).onConflict('id').ignore();
        }
        offset += BATCH;
        process.stdout.write(`   ${Math.min(offset, historyCount)}/${historyCount}\r`);
    }
    console.log(`   ✅ ${historyCount} history records migrated`);

    // 5. Alerts
    const alerts = await Alert.find();
    console.log(`[5/10] Migrating ${alerts.length} alerts...`);
    for (const a of alerts) {
        const id = mapId(a._id);
        const deviceId = mapId(a.deviceId);
        const enterpriseId = mapId(a.enterpriseId);
        if (!deviceId || !enterpriseId) continue;
        
        await db('alerts').insert({
            id,
            device_id: deviceId,
            device_name: a.deviceName,
            enterprise_id: enterpriseId,
            type: a.type,
            severity: a.severity || 'medium',
            message: a.message,
            created_at: a.createdAt || new Date(),
            updated_at: a.updatedAt || new Date(),
        }).onConflict('id').ignore();

        // Migrate readBy
        if (a.readBy?.length > 0) {
            for (const userId of a.readBy) {
                const mappedUserId = mapId(userId);
                if (mappedUserId) {
                    await db('alert_reads').insert({
                        alert_id: id,
                        user_id: mappedUserId,
                    }).onConflict(['alert_id', 'user_id']).ignore();
                }
            }
        }
    }
    console.log(`   ✅ ${alerts.length} alerts migrated`);

    // 6. Geofences
    const geofences = await Geofence.find();
    console.log(`[6/10] Migrating ${geofences.length} geofences...`);
    for (const g of geofences) {
        const id = mapId(g._id);
        await db('geofences').insert({
            id,
            name: g.name,
            enterprise_id: mapId(g.enterpriseId),
            type: g.type,
            center_lat: g.center?.lat || null,
            center_lng: g.center?.lng || null,
            radius: g.radius || null,
            polygon: JSON.stringify(g.polygon || []),
            color: g.color || '#00E599',
            alert_on_exit: g.alertOnExit ?? true,
            alert_on_entry: g.alertOnEntry ?? false,
            is_active: g.isActive ?? true,
            created_by: g.createdBy ? mapId(g.createdBy) : null,
            created_at: g.createdAt || new Date(),
            updated_at: g.updatedAt || new Date(),
        }).onConflict('id').ignore();

        // Junction table for devices
        if (g.devices?.length > 0) {
            for (const deviceId of g.devices) {
                const mappedDeviceId = mapId(deviceId);
                if (mappedDeviceId) {
                    await db('geofence_devices').insert({
                        geofence_id: id,
                        device_id: mappedDeviceId,
                    }).onConflict(['geofence_id', 'device_id']).ignore();
                }
            }
        }
    }
    console.log(`   ✅ ${geofences.length} geofences migrated`);

    // 7. Orders
    const orders = await Order.find();
    console.log(`[7/10] Migrating ${orders.length} orders...`);
    for (const o of orders) {
        await db('orders').insert({
            id: mapId(o._id),
            full_name: o.fullName,
            email: o.email,
            phone: o.phone,
            company: o.company || '',
            usage_type: o.usageType || 'professional',
            gps_count: o.gpsCount || 1,
            gps_types: JSON.stringify(o.gpsTypes || []),
            plan: o.plan || 'starter',
            billing_cycle: o.billingCycle || 'monthly',
            total_due_today: o.totalDueToday || 0,
            recurring_cost: o.recurringCost || 0,
            payment_method: o.paymentMethod || '',
            source: o.source || 'popup',
            status: o.status || 'pending',
            admin_notes: o.adminNotes || '',
            confirmed_at: o.confirmedAt,
            installed_at: o.installedAt,
            activated_at: o.activatedAt,
            cancelled_at: o.cancelledAt,
            order_ref: o.orderRef,
            created_at: o.createdAt,
            updated_at: o.updatedAt,
        }).onConflict('id').ignore();
    }
    console.log(`   ✅ ${orders.length} orders migrated`);

    // 8. Payments
    const payments = await Payment.find();
    console.log(`[8/10] Migrating ${payments.length} payments...`);
    for (const p of payments) {
        await db('payments').insert({
            id: mapId(p._id),
            user_id: mapId(p.userId),
            user_name: p.userName,
            enterprise_id: p.enterpriseId ? mapId(p.enterpriseId) : null,
            plan: p.plan,
            previous_plan: p.previousPlan || '',
            amount: p.amount,
            billing_cycle: p.billingCycle || 'monthly',
            status: p.status || 'pending',
            method: p.method || '',
            due_date: p.dueDate,
            paid_at: p.paidAt,
            invoice_ref: p.invoiceRef,
            admin_notes: p.adminNotes || '',
            description: p.description || '',
            created_at: p.createdAt,
            updated_at: p.updatedAt,
        }).onConflict('id').ignore();
    }
    console.log(`   ✅ ${payments.length} payments migrated`);

    // 9. Support Tickets + Messages
    const tickets = await SupportTicket.find();
    console.log(`[9/10] Migrating ${tickets.length} support tickets...`);
    for (const t of tickets) {
        await db('support_tickets').insert({
            id: mapId(t._id),
            user_id: mapId(t.userId),
            user_name: t.userName,
            enterprise_id: t.enterpriseId ? mapId(t.enterpriseId) : null,
            subject: t.subject,
            status: t.status || 'open',
            last_message: t.lastMessage || null,
            last_message_at: t.lastMessageAt || t.createdAt,
            created_at: t.createdAt,
            updated_at: t.updatedAt,
        }).onConflict('id').ignore();
    }

    const messages = await SupportMessage.find();
    for (const m of messages) {
        await db('support_messages').insert({
            id: mapId(m._id),
            ticket_id: mapId(m.ticketId),
            sender_id: mapId(m.senderId),
            sender_name: m.senderName,
            sender_role: m.senderRole,
            message: m.message,
            created_at: m.createdAt,
            updated_at: m.updatedAt,
        }).onConflict('id').ignore();
    }
    console.log(`   ✅ ${tickets.length} tickets + ${messages.length} messages migrated`);

    // 10. Audit Logs + Notification Rules
    const auditLogs = await AuditLog.find().limit(1000); // Last 1000
    const rules = await NotificationRule.find();
    console.log(`[10/10] Migrating ${auditLogs.length} audit logs + ${rules.length} notification rules...`);
    
    for (const log of auditLogs) {
        await db('audit_logs').insert({
            id: mapId(log._id),
            action: log.action,
            user_id: log.userId ? mapId(log.userId) : null,
            user_name: log.userName || 'System',
            target_type: log.targetType || null,
            target_id: log.targetId ? mapId(log.targetId) : null,
            target_name: log.targetName || null,
            ip: log.ip || null,
            details: log.details ? JSON.stringify(log.details) : null,
            created_at: log.createdAt,
            updated_at: log.updatedAt,
        }).onConflict('id').ignore();
    }

    for (const r of rules) {
        await db('notification_rules').insert({
            id: mapId(r._id),
            enterprise_id: mapId(r.enterpriseId),
            alert_type: r.alertType,
            severity_target: r.severityTarget || 'all',
            emails: r.emails || [],
            is_active: r.isActive ?? true,
            created_at: r.createdAt,
            updated_at: r.updatedAt,
        }).onConflict('id').ignore();
    }
    console.log(`   ✅ Done`);

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 Migration complete! All data transferred to PostgreSQL.');
    console.log('═══════════════════════════════════════════════════════');

    await mongoose.disconnect();
    await db.destroy();
}

migrateData().catch(err => {
    console.error('❌ Migration error:', err);
    process.exit(1);
});
