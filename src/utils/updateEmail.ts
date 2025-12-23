// src/utils/emailupdate.ts
import { transporter } from "#utils/email.ts"; // Import your existing config

// Template for the OLD email (Security Alert)
export const sendOldEmailAlert = async (oldEmail: string, newEmail: string) => {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[DEV] OTP Code for ${oldEmail}: ${newEmail}`);
    return;
  }
  const mailOptions = {
    from:
      process.env.EMAIL_FROM || '"Testing | NO-REPLY" <ramimauthor@gmail.com',
    to: oldEmail,
    subject: "Security Alert: Email Change Requested",
    html: `
            <div style="font-family: sans-serif;">
                <h2>Security Alert</h2>
                <p>Hello,</p>
                <p>A request was made to change your account email to <b>${newEmail}</b>.</p>
                <p>If this was not you, please change your password immediately to secure your account.</p>
                <p>No further action is required if you initiated this change.</p>
            </div>
        `,
  };
  return await transporter.sendMail(mailOptions);
};

// Template for the NEW email (Verification Link)
export const sendNewEmailVerification = async (



    
  newEmail: string,
  link: string
) => {
        if (process.env.NODE_ENV !== 'production') {
        console.warn(`[DEV] OTP Code for ${newEmail}: ${link}`);
        return;
    }

  const mailOptions = {
    from:
      process.env.EMAIL_FROM || '"Testing | NO-REPLY" <ramimauthor@gmail.com',
    to: newEmail,
    subject: "Confirm your new email address",
    html: `
            <div style="font-family: sans-serif;">
                <h2>Verify your email</h2>
                <p>Please click the button below to confirm your new email address. This link will expire in 15 minutes.</p>
                <a href="${link}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Verify Email Address
                </a>
                <p>If the button doesn't work, copy and paste this link: <br> ${link}</p>
            </div>
        `,
  };
  return await transporter.sendMail(mailOptions);
};
