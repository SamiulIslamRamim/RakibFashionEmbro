import type { Request, Response } from "express";
import { 
    SignupInputSchema, 
    LoginInputSchema, 
    VerifyInputSchema,
    UserPublicSchema
} from "#users/schema.ts"; 
 // Also import the type for better function signature
import { registerUserService, 
    loginUserService, 
    verifyUserService } from "#users/service.ts";
import { signToken } from "#utils/jwt.ts"; 
import type { SignupInputType, VerifyInputType } from "#users/schema.ts";

// Cookie Configuration (12 hours to match JWT expiry in jwt.ts)
const MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

const cookieOptions = {
    httpOnly: true, // Crucial: Prevents client-side JS access (XSS defense)
    secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
    sameSite: 'strict' as const, // CSRF defense
    maxAge: MAX_AGE_MS,
};


//Signup Controller
export const signupController = async (req: Request, res: Response) => {
    try {   
        // 1. Validate Input using Zod
        const parsed = SignupInputSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ 
                message: "Validation failed.", 
                errors: parsed.error.issues 
            });
        }
        
        // 2. Call Service Layer
        const newUser = await registerUserService(parsed.data as SignupInputType); 

        // 3. Respond (stripping sensitive data)
        const publicUser = UserPublicSchema.parse(newUser);

        return res.status(201).json({ 
            message: "User registered successfully. Check email for verification code.",
            user: publicUser
        });

    } catch (error) {
        // 4. Handle Specific Errors
        if (error instanceof Error && error.message.includes("Email already registered")) {
            // Conflict: 409
            return res.status(409).json({ message: error.message });
        }
        
        console.error("Signup error:", error);
        return res.status(500).json({ message: "An unexpected error occurred during registration." });
    }
};


// Login Controller
export const loginController = async (req: Request, res: Response) => {
    try {
        // 1. Validate Input
        const parsed = LoginInputSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid input format." });
        }
        const { email, password } = parsed.data;

        // 2. Call Service Layer (Handles user find, password check, and token generation)
        const { user, token } = await loginUserService(email, password);
        
        // 3. Set Secure HTTP-Only Cookie
        res.cookie('access_token', token, cookieOptions);

        // 4. Respond (stripping sensitive data)
        const publicUser = UserPublicSchema.parse(user);

        return res.status(200).json({ 
            message: "Login successful.",
            user: publicUser,
        });

    } catch (error) {
        // 4. Handle Specific Errors
        if (error instanceof Error) {
            if (error.message.includes("Invalid credentials")) {
                 return res.status(401).json({ message: "Invalid email or password." });
            }
            if (error.message.includes("Account not verified")) {
                 return res.status(403).json({ message: error.message });
            }
        }
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};



//Verify Controller
export const verifyController = async (req: Request, res: Response) => {
    try {
        // 1. Validate Input
        const parsed = VerifyInputSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid input format." });
        }
        const { email, code } = parsed.data as VerifyInputType;

        // 2. Call Service Layer (Handles code check, expiry check, and database update)
        const user = await verifyUserService(email, code);

        // 3. Log user in immediately after verification (Generate and set JWT)
        const token = signToken(user.id); // Generate the JWT
        res.cookie('access_token', token, cookieOptions); // Set the cookie

        // 4. Respond
        return res.status(200).json({ 
            message: "Account successfully verified and logged in.",
            user: UserPublicSchema.parse(user)
        });

    } catch (error) {
        // 4. Handle Specific Errors
        if (error instanceof Error) {
            // These errors come from the service layer
            if (error.message.includes("Invalid email or code")) {
                return res.status(400).json({ message: "Invalid email or verification code." });
            }
            if (error.message.includes("expired")) {
                return res.status(400).json({ message: "Verification code has expired." });
            }
        }
        console.error("Verification error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};