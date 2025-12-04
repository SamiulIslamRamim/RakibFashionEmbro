import prisma from "#utils/db.ts";
import * as bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendOtp } from "#utils/email.ts";
import { signAccessToken, signRefreshToken, } from "#utils/jwt.ts";
import type { SignupInputType,
              UserUpdateInputType
 } from "#users/schema.ts";

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
    // 1. Find user
    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            firstName: true,
            passwordHash: true,
            isVerified: true
        }
    });

    if (!user) {
        throw new Error("Invalid credentials");
    }

    // 2. Compare password
    const passwordMatch = await bcrypt.compare(passwordHash, user.passwordHash);
    if (!passwordMatch) {
        throw new Error("Invalid credentials");
    }

    // 3. Check verified
    if (!user.isVerified) {
        throw new Error("Account not verified. Please check your email.");
    }

    // 4. Generate tokens
    const accessToken = signAccessToken(user.id.toString());
    const refreshToken = signRefreshToken(user.id.toString());

    return { user, accessToken, refreshToken };
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



export const updateUserService = async (
    userId: string, 
    data: UserUpdateInputType
) => {
    // 1. Prisma update operation
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: data, // Prisma handles partial updates beautifully
        select: { // Select only public fields for the response
            id: true,
            firstName: true,
            lastName: true,
        },
    });

    // 2. Return the clean public data
    return updatedUser;
};