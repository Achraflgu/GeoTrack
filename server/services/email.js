import Mailjet from 'node-mailjet';

const mailjet = process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY 
    ? Mailjet.apiConnect(process.env.MAILJET_API_KEY, process.env.MAILJET_SECRET_KEY)
    : null;

export const sendAlertEmail = async (emails, alert) => {
    if (!mailjet) {
        console.warn(`[Mailjet] API keys missing. Simulated sending email to ${emails.join(', ')} for alert:`, alert.message);
        return;
    }

    try {
        const recipients = emails.map(email => ({ Email: email }));
        const request = await mailjet
            .post('send', { version: 'v3.1' })
            .request({
                Messages: [
                    {
                        From: {
                            Email: process.env.MAILJET_SENDER_EMAIL || 'alerts@geotrack.tn',
                            Name: 'GeoTrack Alerts'
                        },
                        To: recipients,
                        Subject: `[ALERTE] ${alert.deviceName} - ${alert.type}`,
                        HTMLPart: `
                            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                                <h3 style="color: #e53e3e;">🚨 Alerte GeoTrack</h3>
                                <p><strong>Appareil :</strong> ${alert.deviceName}</p>
                                <p><strong>Sévérité :</strong> ${alert.severity}</p>
                                <p><strong>Détail :</strong> ${alert.message}</p>
                                <p style="font-size: 0.9em; color: gray; margin-top: 20px;">
                                    Généré le ${new Date().toLocaleString('fr-FR')}
                                </p>
                            </div>
                            `
                    }
                ]
            });
            
        console.log(`[Mailjet] Alert email sent successfully to ${emails.length} recipients.`);
        return request.body;
    } catch (err) {
        console.error('[Mailjet] Error sending alert email:', err.message || err);
    }
};
