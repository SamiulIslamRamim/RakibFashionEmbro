import type { Request, Response } from "express";
import { SignupInputSchema, LoginInputSchema, VerifyInputSchema, UserUpdateInputSchema, ForgotPasswordInputSchema, ResetPasswordInputSchema } from "#users/schema.ts"; 
import { registerUserService, loginUserService, verifyUserService, updateUserService, adminUpdateUserService, } from "#users/service.ts";
import type { SignupInputType, VerifyInputType, ForgotPasswordInputType, ResetPasswordInputType } from "#users/schema.ts";
import prisma from "#utils/db.ts";
import type { AuthenticatedRequest } from "#utils/auth.ts";




//Signup Controller
export const signupController = async (req: Request, res: Response) => {
    try {   
        // 1. Validate Input using Zod
        const parsed = SignupInputSchema.safeParse(req.body);
       
                    console.log("Parsed data:", parsed);

          const existingUser = await prisma.user.findUnique({ where: { email:parsed.data?.email } });
            if (existingUser) {
                throw new Error("Email already registered."); 
            }

            //console.log("Parsed data:", parsed);
        const newUser = await registerUserService(parsed?.data as SignupInputType); 

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
        // 4. Respond
        return res.status(200).json({ 
            message: "Account successfully verified and logged in.",
            //user: UserMinimalSchema.parse(user),
            
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


// update Controller
export const updateController = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    console.log("userId in controller:", userId);
    if (!userId) {
        return res.status(401).send({ message: 'Unauthorized or invalid.' });
    }
    try {
        const updateData = UserUpdateInputSchema.parse(req.body); 

        if (Object.keys(updateData).length === 0) {
            return res.status(400).send({ message: 'No fields provided for update.' });
        }

        const user = await updateUserService(userId, updateData);
        
        res.status(200).send(user);

    } catch (error: any) {
        if (error.issues) {
            return res.status(400).send({ 
                error: 'Validation failed.', 
                details: error.issues 
            });
        } 
        if (error.message && error.message.includes("not found")) {
            return res.status(404).send({ error: "User not found." });
        }
        console.error("Error updating user:", error);
        res.status(500).send({ error: 'Internal server error.' });
    }
};


// Todo: admin update Controller -> need to update for every field
export const adminUpdateController = async (req: Request, res: Response) => {
    const userId = req.params.id;
    console.log("userId in controller:", userId);
    if (!userId) {
        return res.status(401).send({ message: 'Unauthorized or invalid.' });
    }
    try {
        const updateData = UserUpdateInputSchema.parse(req.body); 

        if (Object.keys(updateData).length === 0) {
            return res.status(400).send({ message: 'No fields provided for update.' });
        }

        const user = await adminUpdateUserService(userId, updateData);
        
        res.status(200).send(user);

    } catch (error: any) {
        if (error.issues) {
            return res.status(400).send({ 
                error: 'Validation failed.', 
                details: error.issues 
            });
        } 
        if (error.message && error.message.includes("not found")) {
            return res.status(404).send({ error: "User not found." });
        }
        console.error("Error updating user:", error);
        res.status(500).send({ error: 'Internal server error.' });
    }
};



