import { z } from "zod";

export const RoleEnum = z.enum([
  "PRODUCTION_MANAGER",
  "SUPERVISOR",
  "CUTTING_HELPER",
  "MACHINE_OPERATOR",
  "MACHINE_HELPER",
  "FACTORY_OVERSEER",
]);
export type Role = z.infer<typeof RoleEnum>;


//Note: userType
export const UserSchema = z.object({
    id: z.string().uuid(),
    firstName: z.string().min(3, "First name must be at least 3 characters."),
    lastName: z.string().min(3, "Last name must be at least 3 characters."),
    email: z.string().email("Invalid email format."),
    password: z.string(), 
    createdAt: z.date(),
    updatedAt: z.date(),
    role: RoleEnum.default("MACHINE_HELPER"),
    isActive: z.boolean().default(true),
    isVerified: z.boolean(),
    verificationCode: z.string().min(6, "Verification code is required."),
    verificationExpiry: z.date(),
    //personal info
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
    dateOfBirth: z.date().optional().nullable(),

});
export type UserType = z.infer<typeof UserSchema>;



//Note: Public data with hiding sensitive info

export const UserPublicSchema = UserSchema.omit({
    password: true,
    verificationCode: true,
    verificationExpiry: true,
});

export type UserPublicType = z.infer<typeof UserPublicSchema>;

//Note: minimal user data
export const UserMinimalSchema = UserSchema.pick({
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
});

export type UserMinimalType = z.infer<typeof UserMinimalSchema>;

//todo: fix from here. then fix service and controller. then add update password update email routes and delete account route.

//Note: signup input
export const SignupInputSchema = z.object({
    firstName: z.string().trim().min(3, "First name is required."),
    lastName: z.string().trim().min(3, "Last name is required."),
    email: z.string().email("A valid email address is required."),
    isVerified: z.boolean().optional(),
    // Validate the PLAIN password before hashing
   password: z.string().min(8, "Password must be at least 8 characters long."),
});  

export type SignupInputType = z.infer<typeof SignupInputSchema>;


//Note: login input
export const LoginInputSchema = z.object({
    email: z.string().email("A valid email address is required."),
    password: z.string().min(8, "Password is required."),
});

export type LoginInputType = z.infer<typeof LoginInputSchema>;


//Note: verify input
export const VerifyInputSchema = z.object({
    email: z.string().email("A valid email address is required."),
    code: z.string().length(6, "Verification code must be 6 digits."),
});

export type VerifyInputType = z.infer<typeof VerifyInputSchema>;





//Note: updae partial data
// 1. Omit the mandatory database fields
const UserUpdatableFields = UserSchema.omit({
    id: true, 
    email: true, // Email is usually updated via a different, secure flow
    password: true, // Handled by a separate 'change password' flow
    createdAt: true,
    updatedAt: true,
    verificationCode: true,
    verificationExpiry: true,
});

// 2. Make the remaining fields optional for updates
export const UserUpdateInputSchema = UserUpdatableFields.partial(); 

export type UserUpdateInputType = z.infer<typeof UserUpdateInputSchema>;