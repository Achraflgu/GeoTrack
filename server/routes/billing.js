import express from 'express';
import db from '../db/knex.js';

const router = express.Router();

const PLAN_PRICING = {
    starter: { monthly: 29, biannual: 156, annual: 278 },
    pro:     { monthly: 39, biannual: 210, annual: 374 },
};

function generateInvoiceRef() {
    const d = new Date();
    const y = d.getFullYear().toString().slice(-2);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const r = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `INV-${y}${m}-${r}`;
}

/** Calculate next due date from a base date + cycle */
function nextDueFromCycle(baseDate, billingCycle) {
    const d = new Date(baseDate);
    if (billingCycle === 'annual')   d.setFullYear(d.getFullYear() + 1);
    else if (billingCycle === 'biannual') d.setMonth(d.getMonth() + 6);
    else                             d.setMonth(d.getMonth() + 1);
    return d;
}

/** Calculate next due date from mode + value */
function calcNextDue(mode, value, billingCycle, currentDue) {
    const now = new Date();
    // If we're adding to existing date, base it on current due date if it's in the future, otherwise now
    const baseDate = (currentDue && new Date(currentDue) > now) ? new Date(currentDue) : new Date();
    
    if (mode === 'add_days') {
        baseDate.setDate(baseDate.getDate() + (value || 30));
        return baseDate;
    }
    if (mode === 'add_months') {
        baseDate.setMonth(baseDate.getMonth() + (value || 1));
        return baseDate;
    }
    if (mode === 'set_days') {
        const d = new Date();
        d.setDate(d.getDate() + (value || 0));
        return d;
    }
    // mode === 'cycle' or fallback: use billing cycle
    return nextDueFromCycle(now, billingCycle || 'monthly');
}

// ── Format payment → camelCase ─────────────────────────────────
function formatPayment(p) {
    return {
        _id: p.id, id: p.id,
        userId: p.user_id,
        userName: p.user_name,
        enterpriseId: p.enterprise_id,
        plan: p.plan,
        previousPlan: p.previous_plan,
        amount: p.amount,
        billingCycle: p.billing_cycle,
        status: p.status,
        method: p.method,
        dueDate: p.due_date,
        paidAt: p.paid_at,
        invoiceRef: p.invoice_ref,
        adminNotes: p.admin_notes,
        description: p.description,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
    };
}

// ── Format plan info ───────────────────────────────────────────
function formatPlanInfo(user, lastPayment) {
    const currentPlan = user.plan || 'starter';
    return {
        plan: currentPlan,
        pricing: PLAN_PRICING[currentPlan] || PLAN_PRICING.starter,
        lastPayment: lastPayment ? formatPayment(lastPayment) : null,
        nextDueDate: user.billing_next_due || lastPayment?.due_date || null,
        savedPaymentMethod: user.saved_payment_method || '',
        savedBillingCycle: user.saved_billing_cycle || 'monthly',
        cancelAtPeriodEnd: user.cancel_at_period_end || false,
        billingStatus: user.billing_status || 'active',
        billingNextDue: user.billing_next_due || null,
        billingWarnedAt: user.billing_warned_at || null,
    };
}

// ═══════════════════════════════════════════════════════════════
//  PUBLIC ENDPOINTS
// ═══════════════════════════════════════════════════════════════

router.get('/prices', (req, res) => res.json(PLAN_PRICING));

router.get('/payments', async (req, res) => {
    try {
        let query = db('payments');
        if (req.query.userId) query = query.where('user_id', req.query.userId);
        const payments = await query.orderBy('created_at', 'desc');
        res.json(payments.map(formatPayment));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/plan/:userId', async (req, res) => {
    try {
        const user = await db('users')
            .where('id', req.params.userId)
            .select('plan', 'name', 'email', 'enterprise_id',
                'saved_payment_method', 'saved_billing_cycle', 'cancel_at_period_end',
                'billing_status', 'billing_next_due', 'billing_warned_at')
            .first();
        if (!user) return res.status(404).json({ error: 'User not found' });

        const lastPayment = await db('payments')
            .where('user_id', req.params.userId)
            .orderBy('created_at', 'desc')
            .first();

        res.json(formatPlanInfo(user, lastPayment));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Operator upgrade (existing) ────────────────────────────────
router.post('/upgrade', async (req, res) => {
    try {
        const { userId, targetPlan, billingCycle, method } = req.body;
        if (!userId || !targetPlan || !billingCycle || !method)
            return res.status(400).json({ error: 'Missing required fields' });

        const user = await db('users').where('id', userId).first();
        if (!user) return res.status(404).json({ error: 'User not found' });

        const previousPlan = user.plan || 'starter';
        const pricing = PLAN_PRICING[targetPlan];
        if (!pricing) return res.status(400).json({ error: 'Invalid plan' });

        const amount = pricing[billingCycle] || pricing.monthly;
        const dueDate = nextDueFromCycle(new Date(), billingCycle);

        const [payment] = await db('payments').insert({
            user_id: userId, user_name: user.name, enterprise_id: user.enterprise_id,
            plan: targetPlan, previous_plan: previousPlan, amount, billing_cycle: billingCycle,
            method, status: 'pending', due_date: dueDate,
            invoice_ref: generateInvoiceRef(),
            description: previousPlan === targetPlan
                ? `Cycle change to ${billingCycle} (${targetPlan})`
                : `Upgrade from ${previousPlan} to ${targetPlan} (${billingCycle})`,
        }).returning('*');

        await db('users').where('id', userId).update({
            plan: targetPlan, saved_payment_method: method,
            saved_billing_cycle: billingCycle, cancel_at_period_end: false,
            billing_next_due: dueDate, billing_status: 'active',
        });

        res.json({ success: true, payment: formatPayment(payment), newPlan: targetPlan });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Cancel / Resume / Remove method (existing) ─────────────────
router.post('/cancel-plan', async (req, res) => {
    try {
        const { userId } = req.body;
        await db('users').where('id', userId).update({ cancel_at_period_end: true });
        await db('payments').where({ user_id: userId, status: 'pending' })
            .update({ status: 'cancelled', description: 'Cancelled along with plan downgrade' });
        res.json({ success: true, cancelAtPeriodEnd: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/resume-plan', async (req, res) => {
    try {
        const { userId } = req.body;
        await db('users').where('id', userId).update({ cancel_at_period_end: false });
        res.json({ success: true, cancelAtPeriodEnd: false });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/remove-method', async (req, res) => {
    try {
        const { userId } = req.body;
        await db('users').where('id', userId).update({ saved_payment_method: '' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/payments/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const update = { status };
        if (status === 'paid') update.paid_at = new Date();
        const [payment] = await db('payments').where('id', req.params.id).update(update).returning('*');
        if (!payment) return res.status(404).json({ error: 'Payment not found' });
        res.json(formatPayment(payment));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════
//  ADMIN ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// ── Check billing due dates (cron-like) ────────────────────────
router.get('/check-due', async (req, res) => {
    try {
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

        // 1. Warning: billing_next_due is within 3 days AND status is still 'active'
        const warned = await db('users')
            .where('role', 'operator')
            .where('billing_status', 'active')
            .whereNotNull('billing_next_due')
            .where('billing_next_due', '<=', threeDaysFromNow)
            .where('billing_next_due', '>', now)
            .update({ billing_status: 'warning', billing_warned_at: now });

        // 2. Suspend: billing_next_due has passed AND status is 'warning' or 'active'
        const suspended = await db('users')
            .where('role', 'operator')
            .whereIn('billing_status', ['active', 'warning'])
            .whereNotNull('billing_next_due')
            .where('billing_next_due', '<', now)
            .update({ billing_status: 'suspended' });

        console.log(`[Billing] Check-due: ${warned} warned, ${suspended} suspended`);
        res.json({ success: true, warned, suspended });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Admin: record a payment for a user ─────────────────────────
router.post('/admin-pay', async (req, res) => {
    try {
        const { userId, amount, dueMode, dueValue, method, adminId, adminName } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId required' });

        const user = await db('users').where('id', userId).first();
        if (!user) return res.status(404).json({ error: 'User not found' });

        const plan = user.plan || 'starter';
        const cycle = user.saved_billing_cycle || 'monthly';
        const pricing = PLAN_PRICING[plan] || PLAN_PRICING.starter;
        const finalAmount = amount !== undefined ? amount : (pricing[cycle] || pricing.monthly);
        const nextDue = calcNextDue(dueMode || 'cycle', dueValue, cycle, user.billing_next_due);

        // Create payment record
        const [payment] = await db('payments').insert({
            user_id: userId, user_name: user.name, enterprise_id: user.enterprise_id,
            plan, previous_plan: plan, amount: finalAmount, billing_cycle: cycle,
            method: method || user.saved_payment_method || 'admin',
            status: 'paid', paid_at: new Date(), due_date: nextDue,
            invoice_ref: generateInvoiceRef(),
            description: `Admin payment — next due: ${nextDue.toISOString().slice(0, 10)}`,
        }).returning('*');

        // Update user
        await db('users').where('id', userId).update({
            billing_status: 'active',
            billing_next_due: nextDue,
            billing_warned_at: null,
        });

        // Audit log
        await db('audit_logs').insert({
            action: 'billing.admin_pay',
            user_name: adminName || 'Admin',
            target_type: 'user',
            target_id: userId,
            target_name: user.name,
            details: { amount: finalAmount, nextDue, dueMode, dueValue }
        });

        res.json({ success: true, payment: formatPayment(payment), billingNextDue: nextDue, billingStatus: 'active' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Admin: change user plan ────────────────────────────────────
router.post('/admin-change-plan', async (req, res) => {
    try {
        const { userId, plan, billingCycle, adminName } = req.body;
        if (!userId || !plan) return res.status(400).json({ error: 'userId and plan required' });

        const user = await db('users').where('id', userId).first();
        if (!user) return res.status(404).json({ error: 'User not found' });

        const previousPlan = user.plan || 'starter';
        const cycle = billingCycle || user.saved_billing_cycle || 'monthly';
        const nextDue = nextDueFromCycle(new Date(), cycle);
        const pricing = PLAN_PRICING[plan] || PLAN_PRICING.starter;
        const amount = pricing[cycle] || pricing.monthly;

        // Create billing event record
        const [payment] = await db('payments').insert({
            user_id: userId, user_name: user.name, enterprise_id: user.enterprise_id,
            plan, previous_plan: previousPlan, amount, billing_cycle: cycle,
            method: 'admin', status: 'paid', paid_at: new Date(), due_date: nextDue,
            invoice_ref: generateInvoiceRef(),
            description: previousPlan === plan
                ? `Admin: cycle changed to ${cycle}`
                : `Admin: plan changed ${previousPlan} → ${plan} (${cycle})`,
        }).returning('*');

        // Update user
        await db('users').where('id', userId).update({
            plan,
            saved_billing_cycle: cycle,
            billing_next_due: nextDue,
            billing_status: 'active',
            billing_warned_at: null,
        });

        // Audit log
        await db('audit_logs').insert({
            action: 'billing.admin_change_plan',
            user_name: adminName || 'Admin',
            target_type: 'user',
            target_id: userId,
            target_name: user.name,
            details: { previousPlan, newPlan: plan, billingCycle: cycle, nextDue }
        });

        res.json({
            success: true, payment: formatPayment(payment),
            newPlan: plan, billingCycle: cycle, billingNextDue: nextDue,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Admin: unblock a suspended user ────────────────────────────
router.post('/admin-unblock', async (req, res) => {
    try {
        const { userId, graceDays, adminName, preserveDue } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId required' });

        const user = await db('users').where('id', userId).first();
        if (!user) return res.status(404).json({ error: 'User not found' });

        const days = graceDays || 0;
        let nextDue = user.billing_next_due;

        if (!preserveDue) {
            nextDue = new Date();
            nextDue.setDate(nextDue.getDate() + days);
        }

        // Create audit / payment record
        await db('payments').insert({
            user_id: userId, user_name: user.name, enterprise_id: user.enterprise_id,
            plan: user.plan || 'starter', previous_plan: user.plan || 'starter',
            amount: 0, billing_cycle: user.saved_billing_cycle || 'monthly',
            method: 'admin', status: 'paid', paid_at: new Date(), due_date: nextDue,
            invoice_ref: generateInvoiceRef(),
            description: preserveDue 
                ? `Admin: account unblocked — échéance conservée` 
                : `Admin: account unblocked — grace period ${days} days`,
        });

        await db('users').where('id', userId).update({
            billing_status: 'active',
            billing_next_due: nextDue,
            billing_warned_at: null,
        });

        // Audit log
        await db('audit_logs').insert({
            action: 'billing.admin_unblock',
            user_name: adminName || 'Admin',
            target_type: 'user',
            target_id: userId,
            target_name: user.name,
            details: { graceDays: days, nextDue }
        });

        res.json({ success: true, billingStatus: 'active', billingNextDue: nextDue });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Admin: manually block a user ───────────────────────────────
router.post('/admin-block', async (req, res) => {
    try {
        const { userId, adminName, reason } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId required' });

        const user = await db('users').where('id', userId).first();
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (reason === 'payment') {
            await db('users').where('id', userId).update({
                billing_status: 'suspended',
                billing_next_due: new Date(), // Reset due date to now
            });
        } else {
            // personal / generic intervention
            await db('users').where('id', userId).update({
                billing_status: 'suspended',
                // Keep the existing billing_next_due
            });
        }

        // Audit log
        await db('audit_logs').insert({
            action: 'billing.admin_block',
            user_name: adminName || 'Admin',
            target_type: 'user',
            target_id: userId,
            target_name: user.name,
            details: { reason }
        });

        res.json({ success: true, billingStatus: 'suspended' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
