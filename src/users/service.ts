import prisma from "#utils/db.ts";
import * as bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendOtp } from "#utils/email.ts";
import { signToken } from "#utils/jwt.ts";
import type { SignupInputType } from "#users/schema.ts";

// SIGNUP SERVICE 
export const registerUserService = async (data: SignupInputType) => {
  //console.log("Registering user with data:", data);
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(data.passwordHash, saltRounds);
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationExpiry = new Date(Date.now() + 3 * 60 * 1000);

    const newUser = await prisma.user.create({
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            // isVerified: data.isVerified || false,
            passwordHash: passwordHash,
            verificationCode: verificationCode,
            verificationExpiry: verificationExpiry,
        },
        select: { id: true, email: true, firstName: true }
    });

    // Send the verification email (fire and forget)
    await sendOtp({ to: newUser.email, otpCode: verificationCode, firstName: newUser.firstName });

    return newUser;
};


// LOGIN SERVICE
export const loginUserService = async (email: string, passwordHash: string) => {
    // 1. Find the user by email
    const user = await prisma.user.findUnique({ 
        
        where: { email },
        // IMPORTANT: Select the passwordHash explicitly
        select: { 
            id: true, 
            email: true, 
            firstName: true, 
            passwordHash: true,
            isVerified: true 
        } 
    });
    console.log('finding user by email in: service');

    if (!user) {
        throw new Error("Invalid credentials."); 
    }

    // 2. Verify Password
    const passwordMatch = await bcrypt.compare(user.passwordHash, passwordHash);
    console.log("comparing password in: service");
    if (!passwordMatch) {
        console.log("not matched password in: service");
        throw new Error("Invalid credentials.");
    }
    console.log("matched password in: service");
    // 3. (Optional but recommended) Check if email is verified
    if (!user.isVerified) {
        throw new Error("Account not verified. Please check your email.");
        //info: add resend verification code logic
    }

    // 4. JWT
    const token = signToken(user.id);
    console.log("created jwt & end of service: loginUserService");
    return { user, token };
};

// VERIFY SERVICE
export const verifyUserService = async (email: string, verificationCode: string) => {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw new Error("Invalid email or code.");
    }

    // 1. Check if the code is correct
    if (user.verificationCode !== verificationCode || user.verificationCode === null) {
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
            verificationCode: null,
            verificationExpiry: null,
        },
        select: { id: true, email: true} 
    });
    console.log("User verified: from service & done with service");
    return verifiedUser;
};

