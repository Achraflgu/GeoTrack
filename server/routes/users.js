import express from 'express';
import db from '../db/knex.js';
import bcrypt from 'bcryptjs';
import { logAudit } from '../utils/auditLogger.js';
import { generateVerificationCode, sendVerificationEmail } from '../utils/mailjet.js';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await db('users').orderBy('created_at', 'desc');
        const formatted = users.map(u => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            plan: u.plan || 'starter',
            enterpriseId: u.enterprise_id,
            enterpriseName: u.enterprise_name,
            avatar: u.avatar,
            emailVerified: u.email_verified,
            lastLogin: u.last_login,
            createdAt: u.created_at,
            billingStatus: u.billing_status || 'active',
            billingNextDue: u.billing_next_due || null,
            savedBillingCycle: u.saved_billing_cycle || 'monthly',
            savedPaymentMethod: u.saved_payment_method || '',
        }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single user
router.get('/:id', async (req, res) => {
    try {
        const user = await db('users').where('id', req.params.id).first();
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            plan: user.plan || 'starter',
            enterpriseId: user.enterprise_id,
            enterpriseName: user.enterprise_name,
            avatar: user.avatar,
            emailVerified: user.email_verified,
            lastLogin: user.last_login,
            createdAt: user.created_at,
            billingStatus: user.billing_status || 'active',
            billingNextDue: user.billing_next_due || null,
            billingWarnedAt: user.billing_warned_at || null,
            savedBillingCycle: user.saved_billing_cycle || 'monthly',
            savedPaymentMethod: user.saved_payment_method || '',
            cancelAtPeriodEnd: user.cancel_at_period_end || false,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get comprehensive user profile (admin)
router.get('/:id/profile', async (req, res) => {
    try {
        const user = await db('users').where('id', req.params.id).first();
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Payments history
        const payments = await db('payments')
            .where('user_id', req.params.id)
            .orderBy('created_at', 'desc')
            .limit(10);

        // Device count for enterprise
        let deviceCount = 0;
        if (user.enterprise_id) {
            const [{ count }] = await db('devices').where('enterprise_id', user.enterprise_id).count('id as count');
            deviceCount = parseInt(count);
        }

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            plan: user.plan || 'starter',
            enterpriseId: user.enterprise_id,
            enterpriseName: user.enterprise_name,
            avatar: user.avatar,
            emailVerified: user.email_verified,
            lastLogin: user.last_login,
            createdAt: user.created_at,
            billingStatus: user.billing_status || 'active',
            billingNextDue: user.billing_next_due || null,
            billingWarnedAt: user.billing_warned_at || null,
            savedBillingCycle: user.saved_billing_cycle || 'monthly',
            savedPaymentMethod: user.saved_payment_method || '',
            cancelAtPeriodEnd: user.cancel_at_period_end || false,
            deviceCount,
            payments: payments.map(p => ({
                id: p.id,
                invoiceRef: p.invoice_ref,
                plan: p.plan,
                previousPlan: p.previous_plan,
                amount: p.amount,
                billingCycle: p.billing_cycle,
                status: p.status,
                method: p.method,
                dueDate: p.due_date,
                paidAt: p.paid_at,
                description: p.description,
                createdAt: p.created_at,
            })),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create user
router.post('/', async (req, res) => {
    try {
        const password = req.body.password || 'demo123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [user] = await db('users').insert({
            email: req.body.email,
            password: hashedPassword,
            name: req.body.name,
            role: req.body.role || 'operator',
            plan: req.body.plan || 'starter',
            enterprise_id: req.body.enterpriseId || null,
            enterprise_name: req.body.enterpriseName || null,
            avatar: req.body.avatar || null,
            email_verified: false,
        }).returning('*');

        await logAudit('user.create', 'Admin', {
            targetType: 'user', targetId: user.id, targetName: user.name
        });

        res.status(201).json({
            id: user.id, email: user.email, name: user.name, role: user.role, emailVerified: user.email_verified
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Send verification code
router.post('/send-verification', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const user = await db('users').where('email', email).first();
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.email_verified) return res.json({ message: 'Email already verified', verified: true });

        const code = generateVerificationCode();
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

        await db('users').where('id', user.id).update({
            verification_code: code,
            verification_code_expiry: expiry
        });

        const emailSent = await sendVerificationEmail(user.email, user.name, code);
        if (emailSent) {
            console.log(`[🔑 VERIFY] Code sent to ${email}: ${code}`);
            res.json({ message: 'Verification code sent', sent: true });
        } else {
            res.status(500).json({ error: 'Failed to send email' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify email with code
router.post('/verify-email', async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

        const user = await db('users').where('email', email).first();
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.email_verified) return res.json({ message: 'Email already verified', verified: true });
        if (user.verification_code !== code) return res.status(400).json({ error: 'Invalid verification code' });
        if (new Date(user.verification_code_expiry) < new Date()) return res.status(400).json({ error: 'Verification code expired' });

        await db('users').where('id', user.id).update({
            email_verified: true,
            verification_code: null,
            verification_code_expiry: null
        });

        await logAudit('user.email_verified', user.name, {
            targetType: 'user', targetId: user.id, targetName: user.email
        });

        console.log(`[✅ VERIFIED] ${email} email verified successfully`);
        res.json({ message: 'Email verified successfully', verified: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const updates = {};
        if (req.body.name !== undefined) updates.name = req.body.name;
        if (req.body.role !== undefined) updates.role = req.body.role;
        if (req.body.plan !== undefined) updates.plan = req.body.plan;
        if (req.body.enterpriseId !== undefined) updates.enterprise_id = req.body.enterpriseId;
        if (req.body.enterpriseName !== undefined) updates.enterprise_name = req.body.enterpriseName;
        if (req.body.avatar !== undefined) updates.avatar = req.body.avatar;
        if (req.body.email !== undefined) updates.email = req.body.email;
        updates.updated_at = new Date();

        const [user] = await db('users').where('id', req.params.id).update(updates).returning('*');
        if (!user) return res.status(404).json({ error: 'User not found' });

        await logAudit('user.update', 'Admin', {
            targetType: 'user', targetId: user.id, targetName: user.name
        });

        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const user = await db('users').where('id', req.params.id).first();
        if (!user) return res.status(404).json({ error: 'User not found' });

        await db('users').where('id', req.params.id).del();

        await logAudit('user.delete', 'Admin', {
            targetType: 'user', targetId: user.id, targetName: user.name
        });

        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
