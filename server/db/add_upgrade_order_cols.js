import db from './knex.js';

async function main() {
    console.log('Adding notes, enterprise_id, user_id columns to orders table...');
    try {
        const hasNotes = await db.schema.hasColumn('orders', 'notes');
        const hasEid   = await db.schema.hasColumn('orders', 'enterprise_id');
        const hasUid   = await db.schema.hasColumn('orders', 'user_id');

        if (!hasNotes || !hasEid || !hasUid) {
            await db.schema.alterTable('orders', (t) => {
                if (!hasNotes) t.text('notes').nullable();
                if (!hasEid)   t.integer('enterprise_id').nullable();
                if (!hasUid)   t.integer('user_id').nullable();
            });
            console.log('✅ Columns added successfully.');
        } else {
            console.log('ℹ️  All columns already exist — nothing to do.');
        }
    } catch (err) {
        console.error('❌ Migration error:', err.message);
    } finally {
        process.exit(0);
    }
}

main();
