// import { z } from "zod";

// export const RoleEnum = z.enum([
//   "PRODUCTION_MANAGER",
//   "SUPERVISOR",
//   "CUTTING_HELPER",
//   "MACHINE_OPERATOR",
//   "MACHINE_HELPER",
//   "FACTORY_OVERSEER",
// ]);
// export type Role = z.infer<typeof RoleEnum>;



// // INFO: Profile Schema 
// export const ProfileSchema = z.object({
//   id: z.string().uuid(),
//   userId: z.string().uuid(),
//   baseSalary: z.preprocess(
//       (val) => (val === null || val === undefined || val === "" ? 0 : val),
//       z.coerce.number().min(0, "Base salary cannot be negative")
//     ).default(0),
//   bloodGroup: z.string().optional().nullable(),
//   phone: z.string().optional().nullable(),
//   emergencyContact: z.string().optional().nullable(),
//   presentAddress: z.string().optional().nullable(),
//   permanentAddress: z.string().optional().nullable(),
//   joiningDate: z.date().default(new Date()),
// });
// export type ProfileType = z.infer<typeof ProfileSchema>;

// // INFO: User Schema 
// export const UserSchema = z.object({
//   id: z.string().uuid(),
//   firstName: z.string().min(3, "First name must be at least 3 characters.").trim(),
//   lastName: z.string().min(3, "Last name must be at least 3 characters.").trim(),
//   email: z.string().email("Invalid email format."),
//   password: z.string(),
//   isVerified: z.boolean().default(false),
//   verificationCode: z.string().optional().nullable(), 
//   verificationExpiry: z.date().optional().nullable(),
//   createdAt: z.date().default(new Date()),
//   updatedAt: z.date().default(new Date()),
//   role: RoleEnum.default("MACHINE_HELPER"),
//   isActive: z.boolean().default(true),
//   //relation to Profile
//   profile: ProfileSchema.optional().nullable(),
// });
// export type UserType = z.infer<typeof UserSchema>;

// // INFO: Public data 
// export const UserPublicSchema = UserSchema.omit({
//   password: true,
//   verificationCode: true,
//   verificationExpiry: true,
// });
// export type UserPublicType = z.infer<typeof UserPublicSchema>;

// // INFO: minimal user data
// export const UserMinimalSchema = UserSchema.pick({
//   id: true,
//   email: true,
//   firstName: true, 
//   lastName: true,
//   role: true, 
// });
// export type UserMinimalType = z.infer<typeof UserMinimalSchema>;



// // INFO: signup input
// export const SignupInputSchema = z.object({
//   firstName: z.string().trim().min(3, "First name is required."),
//   lastName: z.string().trim().min(3, "Last name is required."),
//   email: z.string().email("A valid email address is required."),

//   password: z.string().min(8, "Password must be at least 8 characters long."),

//   role: RoleEnum.optional(), 
//   isVerified: z.boolean().optional(),
// });
// export type SignupInputType = z.infer<typeof SignupInputSchema>;

// // INFO: login input
// export const LoginInputSchema = z.object({
//   email: z.string().email("A valid email address is required."),
//   password: z.string().min(8, "Password is required."),
// });
// export type LoginInputType = z.infer<typeof LoginInputSchema>;

// // INFO: verify input
// export const VerifyInputSchema = z.object({
//   email: z.string().email("A valid email address is required."),
//   code: z.string().length(6, "Verification code must be 6 digits."),
// });
// export type VerifyInputType = z.infer<typeof VerifyInputSchema>;



// // INFO: update user input
// const UserUpdatableFields = UserSchema.omit({
//   id: true,
//   email: true,
//   password: true,
//   createdAt: true,
//   updatedAt: true,
//   verificationCode: true,
//   verificationExpiry: true,
//   isActive: true,
// });

// const ProfileUpdatableFields = ProfileSchema.omit({
//   id: true,
//   userId: true,
//   joiningDate: true,
//   baseSalary: true,
// });

// export const UserUpdateInputSchema = z
//   .object({
//     // User fields made optional (partial())
//     firstName: UserUpdatableFields.shape.firstName.optional(),
//     lastName: UserUpdatableFields.shape.lastName.optional(),
//     role: UserUpdatableFields.shape.role.optional(),
//     // Profile fields nested under an optional 'profile' object
//     profile: z
//       .object({
//         bloodGroup: ProfileUpdatableFields.shape.bloodGroup
//           .optional()
//           .nullable(),
//         phone: ProfileUpdatableFields.shape.phone.optional().nullable(),
//         emergencyContact: ProfileUpdatableFields.shape.emergencyContact
//           .optional()
//           .nullable(),
//         presentAddress: ProfileUpdatableFields.shape.presentAddress
//           .optional()
//           .nullable(),
//         permanentAddress: ProfileUpdatableFields.shape.permanentAddress
//           .optional()
//           .nullable(),
//       })
//       .optional(),
//   })
//   .partial(); 

// export type UserUpdateInputType = z.infer<typeof UserUpdateInputSchema>;
