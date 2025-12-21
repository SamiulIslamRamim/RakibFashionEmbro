// src/utils/passwordResetMail.ts
import { transporter } from '#utils/email.ts'; // Import the shared transporter
import dotenv from 'dotenv';

dotenv.config();

interface SendResetLinkParams {
    to: string;
    resetLink: string;
    firstName: string;
}

export const sendResetLink = async ({ to, resetLink, firstName }: SendResetLinkParams): Promise<void> => {
    // Development Mode Check
    if (process.env.NODE_ENV !== 'production') {
        console.warn(`[DEV] Password Reset Link for ${to}: ${resetLink}`);
        return;
    }

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Secure App" <noreply@yourdomain.com>',
            to: to,
            subject: 'Reset Your Password',
            html: `
                <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
                    <h2>Hello ${firstName},</h2>
                    <p>We received a request to reset your password. Click the button below to choose a new one:</p>
                    <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
                    <p>This link is valid for 1 hour. If you didn't request this, you can safely ignore this email.</p>
                    <hr />
                    <p style="font-size: 0.8em; color: #777;">If the button above doesn't work, copy and paste this link into your browser:</p>
                    <p style="font-size: 0.8em; color: #777;">${resetLink}</p>
                </div>
            `,
        });
    } catch (error) {
        console.error('Error sending Password Reset email:', error);
        throw new Error('Could not send reset email.');
    }
};