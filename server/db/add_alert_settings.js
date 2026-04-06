import db from './knex.js';

async function main() {
    console.log('Adding alert_settings column to enterprises...');
    try {
        const hasCol = await db.schema.hasColumn('enterprises', 'alert_settings');
        if (!hasCol) {
            await db.schema.alterTable('enterprises', (t) => {
                t.jsonb('alert_settings').defaultTo(JSON.stringify({
                    battery: { enabled: true, threshold: 30 },
                    speed: { enabled: true, threshold: 70 },
                    signal: { enabled: true, threshold: 55 },
                    sos: { enabled: true },
                    offline: { enabled: true },
                    geofence: { enabled: true }
                }));
            });
            console.log('Success: Column added!');
        } else {
            console.log('Column already exists.');
        }
    } catch (err) {
        console.error('Migration error:', err.message);
    } finally {
        process.exit(0);
    }
}
main();
