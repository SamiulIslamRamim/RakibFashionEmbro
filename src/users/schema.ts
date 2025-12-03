import { z } from "zod";
//Note: userType
export const UserSchema = z.object({
    id: z.string().uuid(),
    firstName: z.string().min(3, "First name must be at least 3 characters."),
    lastName: z.string().min(3, "Last name must be at least 3 characters."),
    email: z.string().email("Invalid email format."),
    passwordHash: z.string(), 
    isVerified: z.boolean(),
    verificationCode: z.string().min(6, "Verification code is required."),
    verificationExpiry: z.date(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type UserType = z.infer<typeof UserSchema>;



//Note: Public data with hiding sensitive info

export const UserPublicSchema = UserSchema.omit({
    passwordHash: true,
    verificationCode: true,
    verificationExpiry: true,
});

export type UserPublicType = z.infer<typeof UserPublicSchema>;

//Note: minimal user data
export const UserMinimalSchema = UserSchema.pick({
    id: true,
    email: true,
});


//Note: signup input
export const SignupInputSchema = z.object({
    firstName: z.string().trim().min(3, "First name is required."),
    lastName: z.string().trim().min(3, "Last name is required."),
    email: z.string().email("A valid email address is required."),
    isVerified: z.boolean().optional(),
    // Validate the PLAIN password before hashing
   passwordHash: z.string().min(8, "Password must be at least 8 characters long."),
});  

export type SignupInputType = z.infer<typeof SignupInputSchema>;


//Note: login input
export const LoginInputSchema = z.object({
    email: z.string().email("A valid email address is required."),
    passwordHash: z.string().min(8, "Password is required."),
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
    passwordHash: true, // Handled by a separate 'change password' flow
    createdAt: true,
    updatedAt: true,
    verificationCode: true,
    verificationExpiry: true,
});

// 2. Make the remaining fields optional for updates
export const UserUpdateInputSchema = UserUpdatableFields.partial(); 

export type UserUpdateInputType = z.infer<typeof UserUpdateInputSchema>;