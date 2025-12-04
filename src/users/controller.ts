import type { Request, Response } from "express";
import { 
    SignupInputSchema, 
    LoginInputSchema, 
    VerifyInputSchema,
    UserUpdateInputSchema,
    UserMinimalSchema
} from "#users/schema.ts"; 
 // Also import the type for better function signature
import { registerUserService, 
    loginUserService, 
    verifyUserService,updateUserService } from "#users/service.ts";
// import { signToken } from "#utils/jwt.ts"; 
import type { SignupInputType, VerifyInputType } from "#users/schema.ts";
import prisma from "#utils/db.ts";

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
       
                   // console.log("Parsed data:", parsed);


          const existingUser = await prisma.user.findUnique({ where: { email:parsed.data?.email } });
            if (existingUser) {
                throw new Error("Email already registered."); 
            }

            //console.log("Parsed data:", parsed);
        const newUser = await registerUserService(parsed?.data as SignupInputType); 

        // 3. Respond (stripping sensitive data)
        // const publicUser = UserPublicSchema.parse(newUser);

        return res.status(201).json({ 
            message: "User registered successfully. Check email for verification code.",
            user: newUser,
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
        const parsed = LoginInputSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid input format." });
        }

        const { email, password } = parsed.data;

        // 2. Call service
        const { user, accessToken, refreshToken } =
            await loginUserService(email, password);

        // 3. Strip sensitive fields
        // const publicUser = UserPublicSchema.parse(user);

        // 4. Respond
        return res.status(200).json({
            message: "Login successful.",
            // user: publicUser,
            accessToken,
            refreshToken
        });

    } catch (error: any) {

        if (error.message?.includes("Invalid credentials")) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        if (error.message?.includes("Account not verified")) {
            return res.status(403).json({ message: error.message });
        }

        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};



//Verify Controller
export const verifyController = async (req: Request, res: Response) => {
    try {
        // 1. Validate Input
        console.log("controller reached");
        const parsed = VerifyInputSchema.safeParse(req.body);
        if (!parsed.success) {
                    console.log("data not parsed");
            return res.status(400).json({ message: "Invalid input format." });
        }
        const { email, code } = parsed.data as VerifyInputType;
                console.log("data parsed");
        // 2. Call Service Layer (Handles code check, expiry check, and database update)
        const user = await verifyUserService(email, code);
        console.log("User verified: from controller");
        // 3. Log user in immediately after verification (Generate and set JWT)
        // const token = signToken(user.id); // Generate the JWT
        // res.cookie('access_token', token, cookieOptions); // Set the cookie
                    console.log("cookie set");
        // 4. Respond
        return res.status(200).json({ 
            message: "Account successfully verified and logged in.",
            user: UserMinimalSchema.parse(user)
        });

    } catch (error) {
        console.log("reached error in verifyController:", error);
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




// Assuming you have a custom Request interface that includes userId from middleware
interface AuthenticatedRequest extends Request {
    userId?: string; 
}

export const updateController = async (req: AuthenticatedRequest, res: Response) => {
    // 1. Get User ID from authentication middleware
    const userId = req.userId; 
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: User ID not found.' });
    }

    try {
        // 2. Validate and Parse the Request Body
        // This validates that the fields exist and are strings (but allows partial/optional fields)
        const updateData = UserUpdateInputSchema.parse(req.body);

        // 3. Check if any fields were actually passed
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No fields provided for update.' });
        }

        // 4. Call the Service to perform the update
        const updatedUser = await updateUserService(userId, updateData);

        // 5. Send successful response with updated user data
        return res.status(200).json({ 
            message: 'Profile updated successfully.', 
            user: updatedUser 
        });

    } catch (error) {
        // Handle Zod validation errors
        if (error instanceof Error && 'issues' in error) {
            return res.status(400).json({ 
                message: 'Validation failed.', 
                errors: (error as any).issues 
            });
        }
        
        console.error('Update Profile Error:', error);
        return res.status(500).json({ message: 'Failed to update profile due to a server error.' });
    }
};