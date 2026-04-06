// Audit logging helper for CRUD operations — PostgreSQL version
import db from '../db/knex.js';

const getActionEmoji = (action) => {
    if (action.includes('create')) return '➕ CREATE';
    if (action.includes('update')) return '✏️ UPDATE';
    if (action.includes('delete')) return '🗑️ DELETE';
    if (action.includes('login')) return '🔐 LOGIN';
    if (action.includes('logout')) return '🚪 LOGOUT';
    return '📋 ACTION';
};

/**
 * Create an audit log entry
 * @param {string} action - Action type (e.g., 'device.create', 'user.login')
 * @param {string} userName - Name of user performing the action
 * @param {Object} options - Optional target info
 */
export async function logAudit(action, userName, options = {}) {
    try {
        await db('audit_logs').insert({
            action,
            user_name: userName || 'System',
            target_type: options.targetType || null,
            target_id: options.targetId || null,
            target_name: options.targetName || null,
            ip: options.ip || 'server',
            details: options.details ? JSON.stringify(options.details) : null
        });

        const emoji = getActionEmoji(action);
        const targetInfo = options.targetName ? ` | Target: ${options.targetName}` : '';
        const typeInfo = options.targetType ? ` (${options.targetType})` : '';
        console.log(`[${emoji}] ${userName} | ${action}${typeInfo}${targetInfo}`);
    } catch (error) {
        console.error('[Audit] Failed to create log:', error.message);
    }
}

export default logAudit;
