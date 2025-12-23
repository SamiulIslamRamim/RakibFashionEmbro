import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.sendgrid.net', // e.g., 'smtp.gmail.com' or SendGrid/Mailgun host
    port: parseInt(process.env.SMTP_PORT || '587', 10), 
    secure: false, // true for 465, false for other ports (like 587)
    auth: {
        user: process.env.SMTP_USER, // (usually your email address or API key name)
        pass: process.env.SMTP_PASS, // Your SMTP password or API key
    },
});

interface SendOtpParams {
    to: string;
    otpCode: string;
    firstName: string;
}

export const sendOtp = async ({ to, otpCode, firstName }: SendOtpParams): Promise<void> => {
    // Development Mode Check (Keeps your log functionality)
    // if (process.env.NODE_ENV !== 'production') {
    //     console.warn(`[DEV] OTP Code for ${to}: ${otpCode}`);
    //     return;
    // }

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Testing | NO-REPLY" <ramimauthor@gmail.com',
            to: to,
            subject: 'Verify Your Email Address',
            html: `
                <p>Hello ${firstName},</p>
                <p>Please use the following code to verify your account:</p>
                <h1 style="color: #333; background: #f0f0f0; padding: 10px; border-radius: 5px; display: inline-block;">${otpCode}</h1>
                <p>This code is valid for 3 minutes.</p>
            `,
        });

    } catch (error) {
        console.error('Error sending OTP email via Nodemailer:', error);
        throw new Error('Could not send verification email.');
    }
};



