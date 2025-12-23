import prisma from "#utils/db.ts";
import * as bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendOtp } from "#utils/email.ts";
import { sendResetLink } from "#utils/resetPassEmail.ts";
import { signAccessToken, signRefreshToken } from "#utils/jwt.ts";
import { sendOldEmailAlert, sendNewEmailVerification, } from "#utils/updateEmail.ts";
import type { SignupInputType, UserUpdateInputType } from "#users/schema.ts";
import jwt from "jsonwebtoken";


const saltRounds = 10;

// SIGNUP SERVICE
export const registerUserService = async (data: SignupInputType) => {
  //console.log("Registering user with data:", data);
  const password = await bcrypt.hash(data.password, saltRounds);
  const verificationCode = crypto.randomInt(100000, 999999).toString();
  const verificationExpiry = new Date(Date.now() + 3 * 60 * 1000);

  const newUser = await prisma.user.create({
    data: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      password: password,
      verificationCode: verificationCode,
      verificationExpiry: verificationExpiry,
    },
    select: { id: true, email: true, firstName: true },
  });

  // Send the verification email (fire and forget)
  await sendOtp({
    to: newUser.email,
    otpCode: verificationCode,
    firstName: newUser.firstName,
  });

  return newUser;
};

// LOGIN SERVICE
export const loginUserService = async (email: string, password: string) => {
  // 1. Find user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      password: true,
      isVerified: true,
    },
  });
  //todo: will delete later
  if (!user) {
    throw new Error("Invalid credentials");
  }

  // 2. Compare password
  const passwordMatch = await bcrypt.compare(password, user.password);
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
export const verifyUserService = async (
  email: string,
  verificationCode: string
) => {
  const user = await prisma.user.findUnique({ where: { email } });

  //todo: will delete later
  if (!user) {
    throw new Error("Invalid email or code.");
  }

  // 1. Check if the code is correct
  if (
    user.verificationCode !== verificationCode ||
    user.verificationCode === null
  ) {
    throw new Error("Invalid email or code.");
  }

  // 2. Check if the code is expired
  if (
    user.verificationExpiry === null ||
    user.verificationExpiry < new Date()
  ) {
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
    select: { id: true, email: true },
  });
  console.log("User verified: from service & done with service", verifiedUser);
  return verifiedUser;
};

//UPDATE SERVICE

export const updateUserService = async (
  userId: string,
  data: UserUpdateInputType
) => {
  // 1. Prisma update operation
  console.log("userId in service:", userId);
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: data, // Prisma handles partial updates beautifully
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });
  console.log("Updated user in service");
  return updatedUser;
};

export const adminUpdateUserService = async (
  userId: string,
  data: UserUpdateInputType
) => {
  // 1. Prisma update operation
  console.log("userId in service:", userId);
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: data, // Prisma handles partial updates beautifully
    // select: { // Select only public fields for the response
    //     id: true,
    //     firstName: true,
    //     lastName: true,
    // },
  });
  console.log("Updated user in service", updatedUser);
  return updatedUser;
};

//todo: need to go through this again
export const forgotPasswordService = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const passresttoken = crypto.randomBytes(20).toString("hex");
  const expiry = new Date(Date.now() + 3600000); //todo: now(1 Hour) will change to 10 min later

  await prisma.user.update({
    where: { id: user.id },
    data: { verificationCode: passresttoken, verificationExpiry: expiry },
  });

  //TODO: check for frontend reset page
  const resetLink = `http://localhost:5173/reset-password/${passresttoken}`;
  await sendResetLink({ to: email, resetLink, firstName: user.firstName });
};

export const checkResetTokenService = async (
  passresettoken: string
): Promise<boolean> => {
  const user = await prisma.user.findFirst({
    where: { verificationCode: passresettoken, verificationExpiry: { gt: new Date() } },
  });
  return !!user;
};

export const resetPasswordService = async (
  passresettoken: string,
  newPassword: string
) => {
  const user = await prisma.user.findFirst({
    where: { verificationCode: passresettoken, verificationExpiry: { gt: new Date() } },
  });

  if (!user) throw new Error("Invalid or expired passresettoken.");

  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      verificationCode: null,
      verificationExpiry: null,
    },
  });
};

export const changePasswordService = async (
  userId: string,
  currentPass: string,
  newPass: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found.");

  const isMatch = await bcrypt.compare(currentPass, user.password);
  if (!isMatch) {
    throw new Error("Incorrect current password");
  }

  const hashedNewPassword = await bcrypt.hash(newPass, saltRounds);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  });
};

export const userSelfDeactivateService = async (userId: string) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { isActive: "INACTIVE" },
  });
};





export const requestEmailUpdateService = async (
  userId: string,
  newEmail: string
) => {
  const existing = await prisma.user.findUnique({ where: { email: newEmail } });
  if (existing) throw new Error("Email already in use");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const emailUpdatetoken = jwt.sign(
    { userId, newEmail },
    process.env.JWT_EMAIL_CHANGE_SECRET!,
    { expiresIn: "15m" }
  );
  const link = `http://localhost:5173/confirm-email/${emailUpdatetoken}`;

  await sendOldEmailAlert(user.email, newEmail); 
  await sendNewEmailVerification(newEmail, link); 

  return true;
};

export const confirmEmailUpdateService = async (emailUpdatetoken: string) => {
  const decoded = jwt.verify(emailUpdatetoken, process.env.JWT_EMAIL_CHANGE_SECRET!) as {
    userId: string;
    newEmail: string;
  };

  return await prisma.user.update({
    where: { id: decoded.userId },
    data: { email: decoded.newEmail },
  });
};
















//note: need to move to admin panel later
export const adminUpdateStatusService = async (
  targetUserId: string,
  newStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED"
) => {
  return await prisma.user.update({
    where: { id: targetUserId },
    data: { isActive: newStatus },
  });
};

export const adminHardDeleteService = async (targetUserId: string) => {
  return await prisma.user.delete({
    where: { id: targetUserId },
  });
};
