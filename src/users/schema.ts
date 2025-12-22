import { stat } from "fs";
import { z } from "zod";

export const isActiveEnum = z.enum([
  "ACTIVE", 
  "INACTIVE", 
  "SUSPENDED"
]);
export type IsActiveType = z.infer<typeof isActiveEnum>;

export const RoleEnum = z.enum([
  "PRODUCTION_MANAGER",
  "SUPERVISOR",
  "CUTTING_HELPER",
  "MACHINE_OPERATOR",
  "MACHINE_HELPER",
  "FACTORY_OVERSEER",
]);
export type Role = z.infer<typeof RoleEnum>;

export const bloodGroupEnum = z.enum([
  "A_POSITIVE",
  "A_NEGATIVE",
  "B_POSITIVE",
  "B_NEGATIVE",
  "AB_POSITIVE",
  "AB_NEGATIVE",
  "O_POSITIVE",
  "O_NEGATIVE",
]);
export type BloodGroup = z.infer<typeof bloodGroupEnum>;

//INFO: userType
export const UserSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(3, "First name must be at least 3 characters."),
  lastName: z.string().min(3, "Last name must be at least 3 characters."),
  email: z.string().email("Invalid email format."),
  password: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  role: RoleEnum.default("MACHINE_HELPER"),
  isActive: isActiveEnum.default("ACTIVE"),
  isVerified: z.boolean(),
  verificationCode: z.string().min(6, "Verification code is required."),
  verificationExpiry: z.date(),
  //personal info
  baseSalary: z
    .preprocess(
      (val) => (val === null || val === undefined || val === "" ? 0 : val),
      z.coerce.number().min(0, "Base salary cannot be negative")
    )
    .default(0),
  bloodGroup: bloodGroupEnum.optional().nullable(),
  phone: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  presentAddress: z.string().optional().nullable(),
  permanentAddress: z.string().optional().nullable(),
  joiningDate: z.date().default(new Date()),
  dateOfBirth: z.date().optional().nullable(),
});
export type UserType = z.infer<typeof UserSchema>;

//INFO: Public data with hiding sensitive info

export const UserPublicSchema = UserSchema.omit({
  password: true,
  verificationCode: true,
  verificationExpiry: true,
});

export type UserPublicType = z.infer<typeof UserPublicSchema>;

//INFO: minimal user data (hudai)
export const UserMinimalSchema = UserSchema.pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
});

export type UserMinimalType = z.infer<typeof UserMinimalSchema>;

//INFO: signup input
export const SignupInputSchema = z.object({
  firstName: z.string().trim().min(3, "First name is required."),
  lastName: z.string().trim().min(3, "Last name is required."),
  email: z.string().email("A valid email address is required."),
  isVerified: z.boolean().optional(),
  password: z.string().min(8, "Password must be at least 8 characters long."),

  bloodGroup: bloodGroupEnum.optional().nullable(),
  phone: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  presentAddress: z.string().optional().nullable(),
  permanentAddress: z.string().optional().nullable(),
  dateOfBirth: z.date().optional().nullable(),
});

export type SignupInputType = z.infer<typeof SignupInputSchema>;

//INFO: login input
export const LoginInputSchema = z.object({
  email: z.string().email("A valid email address is required."),
  password: z.string().min(8, "Password is required."),
});

export type LoginInputType = z.infer<typeof LoginInputSchema>;

//INFO: verify input
export const VerifyInputSchema = z.object({
  email: z.string().email("A valid email address is required."),
  code: z.string().length(6, "Verification code must be 6 digits."),
});

export type VerifyInputType = z.infer<typeof VerifyInputSchema>;

//INFO: update partial data
const UserUpdatableFields = UserSchema.omit({
  id: true,
  email: true,
  password: true,
  createdAt: true,
  updatedAt: true,
  role: true,
  isActive: true,
  isVerified: true,
  verificationCode: true,
  verificationExpiry: true,
  baseSalary: true,
  joiningDate: true,
});

export const UserUpdateInputSchema = UserUpdatableFields.partial();
export type UserUpdateInputType = z.infer<typeof UserUpdateInputSchema>;

//todo: fix from here. then add update password update email routes and delete account route.

export const ForgotPasswordInputSchema = z.object({
  email: z.string().email("A valid email address is required."),
});
export type ForgotPasswordInputType = z.infer<typeof ForgotPasswordInputSchema>;

export const ResetPasswordInputSchema = z.object({
  token: z.string().min(3, "Token is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});
export type ResetPasswordInputType = z.infer<typeof ResetPasswordInputSchema>;

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters."),
    confirmNewPassword: z.string().min(8, "Please confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match.",
    path: ["confirmNewPassword"],
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;



export const UpdateStatusSchema = z.object({
  isActive: isActiveEnum,
});