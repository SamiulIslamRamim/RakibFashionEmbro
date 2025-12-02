import prisma from "#utils/db.ts";
import * as bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendOtp } from "#utils/email.ts";
import { signToken } from "#utils/jwt.ts";
import type { SignupInputType } from "#users/schema.ts";

// SIGNUP SERVICE 
export const registerUserService = async (data: SignupInputType) => {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
        throw new Error("Email already registered."); 
    }
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationExpiry = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

    const newUser = await prisma.user.create({
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            passwordHash: passwordHash,
            verificationCode: verificationCode,
            verificationExpiry: verificationExpiry,
        },
        select: { id: true, email: true, firstName: true, passwordHash: true } 
    
    });

    // Send the verification email (fire and forget)
    await sendOtp({ to: newUser.email, otpCode: verificationCode, firstName: newUser.firstName });

    return newUser;
};


// LOGIN SERVICE
export const loginUserService = async (email: string, password: string) => {
    // 1. Find the user by email
    const user = await prisma.user.findUnique({ 
        where: { email },
        // IMPORTANT: Select the passwordHash explicitly
        select: { 
            id: true, 
            email: true, 
            firstName: true, 
            passwordHash: true, // MUST include hash for verification
            isVerified: true 
        } 
    });

    if (!user) {
        // Use generic message to prevent user enumeration attacks
        throw new Error("Invalid credentials."); 
    }

    // 2. Verify Password
    const passwordMatch = await bcrypt.compare(user.passwordHash, password);

    if (!passwordMatch) {
        throw new Error("Invalid credentials.");
    }

    // 3. (Optional but recommended) Check if email is verified
    if (!user.isVerified) {
        throw new Error("Account not verified. Please check your email.");
    }

    // 4. Generate JWT
    const token = signToken(user.id);
    return { user, token };
};

// VERIFY SERVICE
export const verifyUserService = async (email: string, code: string) => {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw new Error("Invalid email or code.");
    }

    // 1. Check if the code is correct
    if (user.verificationCode !== code || user.verificationCode === null) {
        throw new Error("Invalid email or code.");
    }
    
    // 2. Check if the code is expired
    if (user.verificationExpiry === null || user.verificationExpiry < new Date()) {
        throw new Error("Verification code has expired.");
    }

    // 3. Update user status: Set isVerified to true and clear temporary fields
    const verifiedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
            isVerified: true,
            verificationCode: null, // Critical: Clear the one-time code
            verificationExpiry: null,
        },
        select: { id: true, email: true, firstName: true } 
    });

    return verifiedUser;
};

