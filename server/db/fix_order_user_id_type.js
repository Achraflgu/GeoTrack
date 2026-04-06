import db from './knex.js';

async function main() {
    console.log('Migrating user_id column to TEXT in orders table...');
    try {
        // Check current column type
        const result = await db.raw(`
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'orders' AND column_name = 'user_id'
        `);
        const currentType = result.rows[0]?.data_type;
        console.log('Current user_id type:', currentType);

        if (currentType === 'integer') {
            // Change integer → text (allows UUID strings)
            await db.raw(`ALTER TABLE orders ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT`);
            console.log('✅ user_id changed to TEXT successfully.');
        } else {
            console.log('ℹ️  user_id is already TEXT or does not exist — skipping.');
        }
    } catch (err) {
        console.error('❌ Migration error:', err.message);
    } finally {
        process.exit(0);
    }
}

main();
