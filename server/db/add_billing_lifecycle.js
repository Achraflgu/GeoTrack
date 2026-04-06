import db from './knex.js';

async function main() {
    console.log('═══ Adding billing lifecycle columns to users table ═══');

    const cols = {
        billing_status:    { type: 'text',      default: "'active'" },
        billing_next_due:  { type: 'timestamp',  default: null },
        billing_warned_at: { type: 'timestamp',  default: null },
    };

    for (const [col, spec] of Object.entries(cols)) {
        const exists = await db.schema.hasColumn('users', col);
        if (exists) {
            console.log(`[--] Column "${col}" already exists — skipping`);
        } else {
            await db.schema.alterTable('users', (t) => {
                if (spec.type === 'text') {
                    t.text(col).defaultTo(spec.default ? spec.default.replace(/'/g, '') : 'active');
                } else {
                    t.timestamp(col).nullable().defaultTo(null);
                }
            });
            console.log(`[✅] Column "${col}" added`);
        }
    }

    // Set billing_next_due for existing operators who have payments
    const operators = await db('users').where('role', 'operator').whereNull('billing_next_due');
    for (const op of operators) {
        const lastPayment = await db('payments').where('user_id', op.id).orderBy('created_at', 'desc').first();
        if (lastPayment?.due_date) {
            await db('users').where('id', op.id).update({ billing_next_due: lastPayment.due_date });
            console.log(`[✅] Set due date for ${op.email} → ${lastPayment.due_date}`);
        } else {
            // Set default: 30 days from now for operators without payment history
            const defaultDue = new Date();
            defaultDue.setDate(defaultDue.getDate() + 30);
            await db('users').where('id', op.id).update({ billing_next_due: defaultDue });
            console.log(`[✅] Set default due date for ${op.email} → ${defaultDue.toISOString().slice(0,10)}`);
        }
    }

    console.log('\n✅ Migration complete!');
    process.exit(0);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
