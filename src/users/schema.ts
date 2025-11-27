import { z } from "zod";

export const SignupInputSchema = z.object({
    firstName: z.string().trim().min(3, "First name is required."),
    lastName: z.string().trim().min(3, "Last name is required."),
    email: z.string().email("A valid email address is required."),
    // Validate the PLAIN password before hashing
   password: z.string()
  .min(8, "Password must be at least 8 characters long.")
  .max(30, "Password is too long.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[0-9]/, "Password must contain at least one digit.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.")  
});

export type SignupInputType = z.infer<typeof SignupInputSchema>;