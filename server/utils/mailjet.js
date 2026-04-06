// Mailjet email utility for sending verification codes
import Mailjet from 'node-mailjet';

// Mailjet configuration
const mailjetClient = Mailjet.apiConnect(
    '5d56417321ba91f9b5abc5c045006546', // API Key
    'a18f3ac5bb5a8e88ed7354b33f351cb7'  // Secret Key
);

const SENDER_EMAIL = 'achrafgu92@gmail.com';
const SENDER_NAME = 'GeoTrack Platform';

/**
 * Generate a random 6-digit verification code
 * @returns {string} 6-digit code
 */
export function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send verification code email via Mailjet
 * @param {string} recipientEmail - Email address to send to
 * @param {string} recipientName - Name of recipient
 * @param {string} code - 6-digit verification code
 * @returns {Promise<boolean>} Success status
 */
export async function sendVerificationEmail(recipientEmail, recipientName, code) {
    try {
        const result = await mailjetClient
            .post('send', { version: 'v3.1' })
            .request({
                Messages: [
                    {
                        From: {
                            Email: SENDER_EMAIL,
                            Name: SENDER_NAME
                        },
                        To: [
                            {
                                Email: recipientEmail,
                                Name: recipientName || recipientEmail
                            }
                        ],
                        Subject: 'Vérification de votre email - GeoTrack',
                        TextPart: `Votre code de vérification est: ${code}. Ce code expire dans 10 minutes.`,
                        HTMLPart: `
                            <div style="background-color: #0A0D14; padding: 40px 20px; width: 100%; box-sizing: border-box;">
                                <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #121620; border-radius: 16px; border: 1px solid rgba(0,229,153,0.2); overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
                                    <!-- Header -->
                                    <div style="text-align: center; padding: 40px 20px; background: linear-gradient(180deg, rgba(0,229,153,0.1) 0%, rgba(18,22,32,0) 100%); border-bottom: 1px solid rgba(255,255,255,0.05);">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px;">
                                            <span style="color: #00E599;">Geo</span>Track
                                        </h1>
                                        <p style="color: #8b949e; margin-top: 8px; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">Plateforme de Géolocalisation Pro</p>
                                    </div>
                                    
                                    <!-- Body -->
                                    <div style="padding: 40px 30px; text-align: center;">
                                        <h2 style="color: #ffffff; margin-top: 0; font-size: 22px; font-weight: 600;">Validation de votre email</h2>
                                        <p style="color: #a1a1aa; line-height: 1.6; font-size: 16px; margin-bottom: 30px; margin-top: 20px;">
                                            Bonjour <strong style="color: #ffffff;">${recipientName || 'Utilisateur'}</strong>,<br><br>
                                            Merci de rejoindre GeoTrack. Pour activer et sécuriser votre compte, veuillez utiliser le code d'accès ci-dessous :
                                        </p>
                                        
                                        <div style="background: rgba(0, 229, 153, 0.1); border: 1px solid rgba(0, 229, 153, 0.3); color: #00E599; font-size: 38px; font-weight: bold; text-align: center; padding: 25px; border-radius: 12px; letter-spacing: 12px; margin: 35px auto; width: fit-content; text-shadow: 0 0 15px rgba(0,229,153,0.4);">
                                            ${code}
                                        </div>
                                        
                                        <p style="color: #58a6ff; font-size: 14px; margin-top: 30px; background: rgba(88, 166, 255, 0.1); padding: 12px; border-radius: 8px; display: inline-block;">
                                            ⏳ Ce code expirera dans <strong>10 minutes</strong>
                                        </p>
                                    </div>
                                    
                                    <!-- Footer -->
                                    <div style="padding: 25px; text-align: center; background-color: #0A0D14; border-top: 1px solid rgba(255,255,255,0.05);">
                                        <p style="color: #6e7681; font-size: 12px; line-height: 1.6; margin: 0;">
                                            Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email.<br>
                                            © 2026 GeoTrack Technologies - Tous droits réservés.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        `
                    }
                ]
            });
        
        return result.body.Messages[0].Status === 'success';
    } catch (error) {
        console.error('Mailjet Verification Error:', error.message);
        return false;
    }
}

/**
 * Send password reset code email via Mailjet
 * @param {string} recipientEmail - Email address to send to
 * @param {string} recipientName - Name of recipient
 * @param {string} code - 6-digit reset code
 * @returns {Promise<boolean>} Success status
 */
export async function sendPasswordResetEmail(recipientEmail, recipientName, code) {
    try {
        const result = await mailjetClient
            .post('send', { version: 'v3.1' })
            .request({
                Messages: [
                    {
                        From: {
                            Email: SENDER_EMAIL,
                            Name: SENDER_NAME
                        },
                        To: [
                            {
                                Email: recipientEmail,
                                Name: recipientName || recipientEmail
                            }
                        ],
                        Subject: 'Réinitialisation de votre mot de passe - GeoTrack',
                        TextPart: `Votre code de réinitialisation est: ${code}. Ce code expire dans 10 minutes.`,
                        HTMLPart: `
                            <div style="background-color: #0A0D14; padding: 40px 20px; width: 100%; box-sizing: border-box;">
                                <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #121620; border-radius: 16px; border: 1px solid rgba(0,229,153,0.2); overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
                                    <!-- Header -->
                                    <div style="text-align: center; padding: 40px 20px; background: linear-gradient(180deg, rgba(0,229,153,0.1) 0%, rgba(18,22,32,0) 100%); border-bottom: 1px solid rgba(255,255,255,0.05);">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px;">
                                            <span style="color: #00E599;">Geo</span>Track
                                        </h1>
                                        <p style="color: #8b949e; margin-top: 8px; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">Sécurité du compte</p>
                                    </div>
                                    
                                    <!-- Body -->
                                    <div style="padding: 40px 30px; text-align: center;">
                                        <h2 style="color: #ffffff; margin-top: 0; font-size: 22px; font-weight: 600;">Réinitialisation du mot de passe</h2>
                                        <p style="color: #a1a1aa; line-height: 1.6; font-size: 16px; margin-bottom: 30px; margin-top: 20px;">
                                            Bonjour <strong style="color: #ffffff;">${recipientName || 'Utilisateur'}</strong>,<br><br>
                                            Nous avons reçu une demande pour modifier votre mot de passe. Veuillez utiliser ce code de sécurité pour créer un nouveau mot de passe :
                                        </p>
                                        
                                        <div style="background: rgba(0, 229, 153, 0.1); border: 1px solid rgba(0, 229, 153, 0.3); color: #00E599; font-size: 38px; font-weight: bold; text-align: center; padding: 25px; border-radius: 12px; letter-spacing: 12px; margin: 35px auto; width: fit-content; text-shadow: 0 0 15px rgba(0,229,153,0.4);">
                                            ${code}
                                        </div>
                                        
                                        <p style="color: #ff7b72; font-size: 14px; margin-top: 30px; background: rgba(255, 123, 114, 0.1); padding: 12px; border-radius: 8px; display: inline-block;">
                                            ⏰ Ce code est à usage unique et expire dans <strong>10 minutes</strong>
                                        </p>
                                    </div>
                                    
                                    <!-- Footer -->
                                    <div style="padding: 25px; text-align: center; background-color: #0A0D14; border-top: 1px solid rgba(255,255,255,0.05);">
                                        <p style="color: #6e7681; font-size: 12px; line-height: 1.6; margin: 0;">
                                            Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.<br>
                                            Votre mot de passe restera inchangé.<br><br>
                                            © 2026 GeoTrack Technologies - Tous droits réservés.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        `
                    }
                ]
            });

        console.log(`[📧 EMAIL] Verification code sent to ${recipientEmail}`);
        return true;
    } catch (error) {
        console.error('[📧 EMAIL ERROR]', error.message);
        return false;
    }
}

export async function sendStatusUpdateEmail(recipientEmail, recipientName, orderRef, newStatus) {
    let subject = '';
    let headline = '';
    let message = '';
    let icon = '';

    switch (newStatus) {
        case 'pending':
            subject = 'Demande de traceurs reçue - GeoTrack';
            headline = 'Demande en attente';
            icon = '⏳';
            message = 'Nous avons bien reçu votre demande d\'abonnement pour nos traceurs GPS. Notre équipe traitera votre demande sous peu et nous vous contacterons par téléphone très prochainement pour confirmer les détails avec vous.';
            break;
        case 'confirmed':
            subject = 'Votre commande est confirmée ! - GeoTrack';
            headline = 'Commande Confirmée';
            icon = '✅';
            message = 'Excellente nouvelle ! Votre commande de traceurs GPS a été validée par notre équipe. Nous préparons actuellement l\'étape d\'installation physique. Notre équipe technique vous contactera très prochainement.';
            break;
        case 'installing':
            subject = 'Installation de vos équipements en cours - GeoTrack';
            headline = 'Installation en cours';
            icon = '🔧';
            message = 'Votre commande est maintenant à l\'étape d\'installation. Nos techniciens procèdent à la configuration et à la pose de vos appareils. Vous recevrez vos identifiants d\'accès dès que l\'activation finale sera complétée.';
            break;
        case 'cancelled':
            subject = 'Annulation de votre commande - GeoTrack';
            headline = 'Commande Annulée';
            icon = '❌';
            message = 'Votre demande d\'abonnement a été annulée. Si vous pensez qu\'il s\'agit d\'une erreur ou si vous souhaitez obtenir plus de détails, n\'hésitez pas à nous contacter.';
            break;
        default:
            return false; // active is handled elsewhere or ignored
    }

    try {
        await mailjetClient
            .post('send', { version: 'v3.1' })
            .request({
                Messages: [
                    {
                        From: {
                            Email: SENDER_EMAIL,
                            Name: SENDER_NAME
                        },
                        To: [
                            {
                                Email: recipientEmail,
                                Name: recipientName || recipientEmail
                            }
                        ],
                        Subject: subject,
                        HTMLPart: `
                            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                <div style="background: linear-gradient(135deg, #0A0D14 0%, #1A2130 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                                    <h1 style="color: #00E599; margin: 0; font-size: 28px;">🛰️ GeoTrack</h1>
                                    <p style="color: rgba(255,255,255,0.7); margin-top: 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Mise à jour de commande</p>
                                </div>
                                <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; border: 1px solid #eaeaea; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                                    <div style="text-align: center; margin-bottom: 25px;">
                                        <span style="font-size: 48px;">${icon}</span>
                                        <h2 style="color: #111; margin: 15px 0 5px 0; font-size: 24px;">${headline}</h2>
                                        <p style="color: #666; font-size: 15px; margin: 0;">Référence : <strong>${orderRef}</strong></p>
                                    </div>
                                    
                                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #00E599; margin-bottom: 30px;">
                                        <p style="color: #333; line-height: 1.6; margin: 0; font-size: 15px;">
                                            Bonjour ${recipientName || 'Client'},<br><br>
                                            ${message}
                                        </p>
                                    </div>

                                    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eaeaea;">
                                        <p style="color: #999; font-size: 13px; margin: 0 0 10px 0;">
                                            Besoin d'aide ? Appelez-nous au <strong>+216 71 000 000</strong>
                                        </p>
                                        <p style="color: #999; font-size: 13px; margin: 0;">
                                            © ${new Date().getFullYear()} GeoTrack - Tous droits réservés
                                        </p>
                                    </div>
                                </div>
                            </div>
                        `
                    }
                ]
            });

        console.log(`[📧 EMAIL] Status update (${newStatus}) sent to ${recipientEmail}`);
        return true;
    } catch (error) {
        console.error('[📧 EMAIL ERROR]', error.statusCode, error.message);
        return false;
    }
}


export async function sendUpgradeConfirmEmail(recipientEmail, recipientName, orderRef, deviceCount, plan) {
    const planLabel = { starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' }[plan] || plan;
    try {
        await mailjetClient
            .post('send', { version: 'v3.1' })
            .request({
                Messages: [{
                    From: { Email: SENDER_EMAIL, Name: SENDER_NAME },
                    To: [{ Email: recipientEmail, Name: recipientName || recipientEmail }],
                    Subject: `Commande d'extension reçue — GeoTrack (${orderRef})`,
                    HTMLPart: `
                        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                            <div style="background:linear-gradient(135deg,#0A0D14 0%,#1A2130 100%);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
                                <h1 style="color:#00E599;margin:0;font-size:28px;">🛰️ GeoTrack</h1>
                                <p style="color:rgba(255,255,255,0.7);margin-top:8px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Demande d'extension reçue</p>
                            </div>
                            <div style="background:#ffffff;padding:40px 30px;border-radius:0 0 12px 12px;border:1px solid #eaeaea;box-shadow:0 4px 20px rgba(0,0,0,0.05);">
                                <div style="text-align:center;margin-bottom:25px;">
                                    <span style="font-size:48px;">📦</span>
                                    <h2 style="color:#111;margin:15px 0 5px 0;font-size:24px;">Commande enregistrée</h2>
                                    <p style="color:#666;font-size:15px;margin:0;">Référence : <strong style="color:#00E599;">${orderRef}</strong></p>
                                </div>

                                <div style="background:#f8f9fa;padding:20px;border-radius:8px;border-left:4px solid #00E599;margin-bottom:25px;">
                                    <p style="color:#333;line-height:1.7;margin:0;font-size:15px;">
                                        Bonjour <strong>${recipientName || 'Client'}</strong>,<br><br>
                                        Nous avons bien reçu votre demande d'extension de parc GPS.
                                        Votre commande de <strong>${deviceCount} appareil${deviceCount > 1 ? 's' : ''}</strong>
                                        (abonnement <strong>${planLabel}</strong>) est en cours de traitement.<br><br>
                                        Notre équipe commerciale vous contactera très prochainement par téléphone
                                        pour confirmer les détails et organiser l'installation.
                                    </p>
                                </div>

                                <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin-bottom:25px;">
                                    <p style="color:#15803d;font-weight:bold;margin:0 0 12px 0;font-size:14px;">📋 Récapitulatif de votre demande</p>
                                    <table style="width:100%;font-size:14px;color:#333;border-collapse:collapse;">
                                        <tr><td style="padding:4px 0;color:#666;">Référence commande</td><td style="text-align:right;font-weight:bold;font-family:monospace;">${orderRef}</td></tr>
                                        <tr><td style="padding:4px 0;color:#666;">Nombre d'appareils</td><td style="text-align:right;font-weight:bold;">${deviceCount} unité${deviceCount > 1 ? 's' : ''}</td></tr>
                                        <tr><td style="padding:4px 0;color:#666;">Abonnement</td><td style="text-align:right;font-weight:bold;">${planLabel}</td></tr>
                                    </table>
                                </div>

                                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin-bottom:25px;">
                                    <p style="color:#1d4ed8;font-size:13px;margin:0;">
                                        <strong>💡 Bon à savoir :</strong> En tant que client GeoTrack, vos nouveaux appareils
                                        seront directement associés à votre compte existant.
                                        Vous les retrouverez dans votre espace <em>Mes Appareils</em> dès l'activation.
                                    </p>
                                </div>

                                <div style="text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #eaeaea;">
                                    <p style="color:#999;font-size:13px;margin:0 0 6px 0;">
                                        Questions ? Appelez-nous au <strong>+216 71 000 000</strong>
                                    </p>
                                    <p style="color:#bbb;font-size:12px;margin:0;">© ${new Date().getFullYear()} GeoTrack — Tous droits réservés</p>
                                </div>
                            </div>
                        </div>
                    `
                }]
            });
        console.log(`[📧 EMAIL] Upgrade order confirmation sent to ${recipientEmail} (${orderRef})`);
        return true;
    } catch (error) {
        console.error('[📧 EMAIL ERROR]', error.statusCode, error.message);
        return false;
    }
}

export default { generateVerificationCode, sendVerificationEmail, sendStatusUpdateEmail, sendUpgradeConfirmEmail };
