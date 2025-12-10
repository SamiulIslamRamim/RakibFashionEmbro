import { z } from "zod";

// --- ENUMS ---
export const RoleEnum = z.enum([
  "PRODUCTION_MANAGER",
  "SUPERVISOR",
  "CUTTING_HELPER",
  "MACHINE_OPERATOR",
  "MACHINE_HELPER",
  "FACTORY_OVERSEER",
]);
export type Role = z.infer<typeof RoleEnum>;

// 1. Profile Schema 
export const ProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  baseSalary: z.preprocess(
      (val) => (val === null || val === undefined || val === "" ? 0 : val),
      z.coerce.number().min(0, "Base salary cannot be negative")
    ).default(0),
  bloodGroup: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  presentAddress: z.string().optional().nullable(),
  permanentAddress: z.string().optional().nullable(),
  joiningDate: z.date().default(new Date()),
});
export type ProfileType = z.infer<typeof ProfileSchema>;

// 2. User Schema 
export const UserSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(3, "First name must be at least 3 characters.").trim(),
  lastName: z.string().min(3, "Last name must be at least 3 characters.").trim(),
  email: z.string().email("Invalid email format."),
  passwordHash: z.string(),
  isVerified: z.boolean().default(false),
  verificationCode: z.string().optional().nullable(), 
  verificationExpiry: z.date().optional().nullable(),
  createdAt: z.date().default(new Date()),
  updatedAt: z.date().default(new Date()),
  role: RoleEnum.default("MACHINE_HELPER"),
  isActive: z.boolean().default(true),
  //relation to Profile
  profile: ProfileSchema.optional().nullable(),
});
export type UserType = z.infer<typeof UserSchema>;


// Note: Public data with hiding sensitive info
export const UserPublicSchema = UserSchema.omit({
  passwordHash: true,
  verificationCode: true,
  verificationExpiry: true,
});
export type UserPublicType = z.infer<typeof UserPublicSchema>;

// Note: minimal user data
export const UserMinimalSchema = UserSchema.pick({
  id: true,
  email: true,
  firstName: true, // Added for slightly more context
  lastName: true,
  role: true, // Added the new role
});
export type UserMinimalType = z.infer<typeof UserMinimalSchema>;

// --- INPUT SCHEMAS ---

// Note: signup input
export const SignupInputSchema = z.object({
  firstName: z.string().trim().min(3, "First name is required."),
  lastName: z.string().trim().min(3, "Last name is required."),
  email: z.string().email("A valid email address is required."),

  // Use 'password' for the plain text input from the user
  password: z.string().min(8, "Password must be at least 8 characters long."),

  // Optional fields on signup
  role: RoleEnum.optional(), // Default is MACHINE_HELPER in Prisma
  isVerified: z.boolean().optional(),
});
export type SignupInputType = z.infer<typeof SignupInputSchema>;

// Note: login input
export const LoginInputSchema = z.object({
  email: z.string().email("A valid email address is required."),
  password: z.string().min(8, "Password is required."),
});
export type LoginInputType = z.infer<typeof LoginInputSchema>;

// Note: verify input
export const VerifyInputSchema = z.object({
  email: z.string().email("A valid email address is required."),
  code: z.string().length(6, "Verification code must be 6 digits."),
});
export type VerifyInputType = z.infer<typeof VerifyInputSchema>;

// --- UPDATE SCHEMAS (CRITICAL CHANGES) ---

const UserUpdatableFields = UserSchema.omit({
  id: true,
  email: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true,
  verificationCode: true,
  verificationExpiry: true,
  // NEW RESTRICTION: Users cannot change their active status
  isActive: true,
});

// 2. Profile Updatable Fields (Model: Profile)
const ProfileUpdatableFields = ProfileSchema.omit({
  id: true,
  userId: true,
  // NEW RESTRICTION: Joining date is set once
  joiningDate: true,
});

// 3. Combined Update Input Schema
// This combines fields from both User and Profile that can be updated.
// We allow updates to User fields AND optional updates to Profile fields.
export const UserUpdateInputSchema = z
  .object({
    // User fields made optional (partial())
    firstName: UserUpdatableFields.shape.firstName.optional(),
    lastName: UserUpdatableFields.shape.lastName.optional(),
    role: UserUpdatableFields.shape.role.optional(),
    isVerified: UserUpdatableFields.shape.isVerified.optional(), // Though usually admin only

    // Profile fields nested under an optional 'profile' object
    profile: z
      .object({
        baseSalary: ProfileUpdatableFields.shape.baseSalary.optional(),
        bloodGroup: ProfileUpdatableFields.shape.bloodGroup
          .optional()
          .nullable(),
        phone: ProfileUpdatableFields.shape.phone.optional().nullable(),
        emergencyContact: ProfileUpdatableFields.shape.emergencyContact
          .optional()
          .nullable(),
        presentAddress: ProfileUpdatableFields.shape.presentAddress
          .optional()
          .nullable(),
        permanentAddress: ProfileUpdatableFields.shape.permanentAddress
          .optional()
          .nullable(),
      })
      .optional(),

    // Note: If you want to allow admin updates to isActive, you'd create an AdminUpdateSchema
  })
  .partial(); // Make all top-level keys optional for PATCH requests

export type UserUpdateInputType = z.infer<typeof UserUpdateInputSchema>;
