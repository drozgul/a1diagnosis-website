// Netlify Function to generate unique access code and send via email
// Uses SendGrid for email delivery

const sgMail = require('@sendgrid/mail');

// Generate a unique access code
function generateAccessCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (0,O,1,I)
    let code = 'INV-';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code += '-';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code; // Format: INV-XXXX-XXXX
}

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parse form data
        const params = new URLSearchParams(event.body);
        const firstName = params.get('firstName');
        const lastName = params.get('lastName');
        const email = params.get('email');
        const phone = params.get('phone');
        const company = params.get('company') || 'Not provided';
        const message = params.get('message');

        // Validate required fields
        if (!firstName || !lastName || !email || !phone || !message) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        // Generate unique access code
        const accessCode = generateAccessCode();
        const timestamp = new Date().toISOString();

        // Initialize SendGrid
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        // Email to the investor with their access code
        const investorEmail = {
            to: email,
            from: {
                email: 'ozgul@a1diagnosis.com',
                name: 'A1 Diagnosis Investor Relations'
            },
            subject: 'Your A1 Diagnosis Investor Portal Access Code',
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); padding: 40px; border-radius: 16px 16px 0 0; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">A1 DIAGNOSIS</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">Investor Portal Access</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #1e293b; font-size: 18px; margin: 0 0 20px;">Dear ${firstName},</p>

                            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                                Thank you for your interest in A1 Diagnosis. Your request for access to our confidential investor materials has been approved.
                            </p>

                            <!-- Access Code Box -->
                            <div style="background: linear-gradient(135deg, #f0fdfa 0%, #f0f9ff 100%); border: 2px solid #14b8a6; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                                <p style="color: #0f766e; font-size: 14px; margin: 0 0 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Personal Access Code</p>
                                <p style="color: #0f766e; font-size: 32px; font-weight: 800; margin: 0; letter-spacing: 3px; font-family: 'Courier New', monospace;">${accessCode}</p>
                            </div>

                            <!-- Instructions -->
                            <div style="background: #f8fafc; border-radius: 8px; padding: 24px; margin: 30px 0;">
                                <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 15px;">How to Access:</h3>
                                <ol style="color: #475569; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                    <li>Visit <a href="https://a1diagnosis.com/investor-login.html" style="color: #0f766e; text-decoration: none; font-weight: 600;">a1diagnosis.com/investor-login.html</a></li>
                                    <li>Enter your email address: <strong>${email}</strong></li>
                                    <li>Enter your access code shown above</li>
                                    <li>Click "Access Investor Materials"</li>
                                </ol>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="https://a1diagnosis.com/investor-login.html" style="display: inline-block; background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 16px; font-weight: 700;">Access Investor Portal</a>
                            </div>

                            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 30px 0 0;">
                                <strong>Note:</strong> This access code is unique to you and should not be shared. If you have any questions, please don't hesitate to reach out.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background: #f8fafc; padding: 30px 40px; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
                            <table role="presentation" width="100%">
                                <tr>
                                    <td>
                                        <p style="color: #1e293b; font-size: 14px; font-weight: 700; margin: 0;">A1 Diagnosis</p>
                                        <p style="color: #64748b; font-size: 13px; margin: 5px 0 0;">Proactive Vision Risk Analysis Platform</p>
                                    </td>
                                    <td style="text-align: right;">
                                        <p style="color: #64748b; font-size: 13px; margin: 0;">
                                            <a href="mailto:ozgul@a1diagnosis.com" style="color: #0f766e; text-decoration: none;">ozgul@a1diagnosis.com</a><br>
                                            <a href="tel:+19493811966" style="color: #0f766e; text-decoration: none;">(949) 381-1966</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <!-- Legal Footer -->
                <p style="color: #94a3b8; font-size: 11px; margin: 20px 0 0; text-align: center; max-width: 500px;">
                    This email contains confidential investor information. This test has not been cleared or approved by the US FDA.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
            `
        };

        // Notification email to A1 Diagnosis team
        const teamEmail = {
            to: 'ozgul@a1diagnosis.com',
            from: {
                email: 'noreply@a1diagnosis.com',
                name: 'A1 Diagnosis Investor Portal'
            },
            subject: `New Investor Access Request: ${firstName} ${lastName}`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <h2 style="color: #0f766e; margin: 0 0 20px; border-bottom: 2px solid #14b8a6; padding-bottom: 15px;">New Investor Access Request</h2>

        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 10px 0; color: #64748b; font-size: 14px; width: 120px;">Name:</td>
                <td style="padding: 10px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${firstName} ${lastName}</td>
            </tr>
            <tr>
                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Email:</td>
                <td style="padding: 10px 0; color: #1e293b; font-size: 14px;"><a href="mailto:${email}" style="color: #0f766e;">${email}</a></td>
            </tr>
            <tr>
                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Phone:</td>
                <td style="padding: 10px 0; color: #1e293b; font-size: 14px;"><a href="tel:${phone}" style="color: #0f766e;">${phone}</a></td>
            </tr>
            <tr>
                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Company:</td>
                <td style="padding: 10px 0; color: #1e293b; font-size: 14px;">${company}</td>
            </tr>
            <tr>
                <td style="padding: 10px 0; color: #64748b; font-size: 14px; vertical-align: top;">Message:</td>
                <td style="padding: 10px 0; color: #1e293b; font-size: 14px;">${message}</td>
            </tr>
            <tr>
                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Access Code:</td>
                <td style="padding: 10px 0; color: #0f766e; font-size: 16px; font-weight: 700; font-family: monospace;">${accessCode}</td>
            </tr>
            <tr>
                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Timestamp:</td>
                <td style="padding: 10px 0; color: #1e293b; font-size: 14px;">${timestamp}</td>
            </tr>
        </table>

        <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 13px; margin: 0;">The investor has been sent their access code automatically.</p>
        </div>
    </div>
</body>
</html>
            `
        };

        // Send both emails
        await Promise.all([
            sgMail.send(investorEmail),
            sgMail.send(teamEmail)
        ]);

        // Store the access code (in a simple JSON format for now)
        // In production, you'd use Supabase or another database
        // For now, we'll validate codes by checking if they match the pattern
        // and store valid codes in Netlify environment or a database

        console.log(`Access code generated for ${email}: ${accessCode}`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                message: 'Access code sent successfully'
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to process request',
                details: error.message
            })
        };
    }
};
