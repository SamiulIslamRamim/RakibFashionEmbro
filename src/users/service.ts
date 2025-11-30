import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import crypto from "crypto";
import { SignupInputSchema, type SignupInputType } from "#users/schema.js"; // Note .js

const prisma = new PrismaClient();

export const registerUser = async (data: SignupInputType) => {
// 1. Check existence
const existing = await prisma.user.findUnique({ where: { email: data.email } });
if (existing) throw new Error("Email already taken");

// 2. Hash
const hashedPassword = await argon2.hash(data.password);

// 3. Create OTP
const otp = crypto.randomInt(100000, 999999).toString();
const expiry = new Date(Date.now() + 3 * 60 * 1000);

// 4. Save
return await prisma.user.create({
data: {
email: data.email,
password: hashedPassword,
verificationCode: otp,
verificationExpiry: expiry,
},
});
};
