import type { Request, Response } from "express";
import { SignupInputSchema, LoginInputSchema, VerifyInputSchema, UserUpdateInputSchema, ForgotPasswordInputSchema, ResetPasswordInputSchema, ChangePasswordSchema, UpdateStatusSchema, RequestEmailChangeSchema,  } from "#users/schema.ts"; 
import { registerUserService, loginUserService, verifyUserService, updateUserService, adminUpdateUserService, forgotPasswordService, checkResetTokenService, resetPasswordService, changePasswordService, userSelfDeactivateService, adminUpdateStatusService, adminHardDeleteService, requestEmailUpdateService, confirmEmailUpdateService, } from "#users/service.ts";
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


// FIX: admin update Controller -> need to update for every field
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



//TODO: forgot/reset & password & emailUpdate controller


//forgetPassword controller
export const forgotPasswordController = async (req: Request, res: Response) => {
    try {
        const parsed = ForgotPasswordInputSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ errors: parsed.error.issues });

        await forgotPasswordService(parsed.data.email);
        return res.status(200).json({ message: "A reset link has been sent to the user." });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error." });
    }
};

//verifyResetToken controller
export const verifyResetTokenController = async (req: Request, res: Response) => {
    const { passresettoken } = req.params;
    try {
        const isValid = await checkResetTokenService(passresettoken);
        if (!isValid) return res.status(400).json({ valid: false, message: "passresetToken is invalid or expired." });
        
        return res.status(200).json({ valid: true, message: "passresetToken is valid." });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error." });
    }
};

//resetPassword controller
export const resetPasswordController = async (req: Request, res: Response) => {
    try {
        const parsed = ResetPasswordInputSchema.safeParse(req.body);
        
        if (!parsed.success) return res.status(400).json({ errors: parsed.error.issues });

        await resetPasswordService(parsed.data.passresettoken, parsed.data.password);
        return res.status(200).json({ message: "Password has been successfully updated." });
    } catch (error: any) {
        return res.status(400).json({ message: error.message || "Reset failed." });
    }
};

//changePassword controller
export const changePasswordController = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const parsed = ChangePasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ errors: parsed.error.issues });
        }

        // 2. Get User ID from your Auth Middleware (e.g., JWT)
        const userId = req.userId;
        console.log("userId in controller:", userId); 

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }

        await changePasswordService(
            userId, 
            parsed.data.currentPassword, 
            parsed.data.newPassword
        );

        return res.status(200).json({ message: "Password changed successfully." });

    } catch (error: any) {
        const status = error.message === "Incorrect current password" ? 400 : 500;
        return res.status(status).json({ message: error.message || "Internal server error." });
    }
};

//userSelfDeactivate controller
export const userSelfDeactivateController = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId; // Provided by your authenticateJWT
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        await userSelfDeactivateService(userId);
        
        return res.status(200).json({ message: "Your account has been deactivated." });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error." });
    }
};

//email update controllers
export const requestEmailUpdateController = async (req: AuthenticatedRequest, res: Response) => {
  const parsed = RequestEmailChangeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.issues });
  try {
    await requestEmailUpdateService(req.userId!, parsed.data.newEmail);
    return res.status(200).json({ message: "Verification links sent." });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const confirmEmailUpdateController = async (req: Request, res: Response) => {
  const emailUpdatetoken = req.query.emailUpdatetoken as string;
  if (!emailUpdatetoken) return res.status(400).json({ error: "emailUpdatetoken is required" });

  try {
    await confirmEmailUpdateService(emailUpdatetoken);
    return res.status(200).json({ message: "Email updated successfully!" });
  } catch (error: any) {
    return res.status(400).json({ error: "Invalid or expired link." });
  }
};

















//note: admin again need to move this
export const adminUpdateStatusController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // The ID of the user being managed
        const parsed = UpdateStatusSchema.safeParse(req.body);
        
        if (!parsed.success) return res.status(400).json({ errors: parsed.error.issues });

        const updatedUser = await adminUpdateStatusService(id, parsed.data.isActive);
        
        return res.status(200).json({ 
            message: `User status updated to ${parsed.data.isActive}`,
            user: { id: updatedUser.id, status: updatedUser.isActive }
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update user status." });
    }
};

export const adminHardDeleteController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await adminHardDeleteService(id);
        return res.status(200).json({ message: "User permanently deleted from system." });
    } catch (error) {
        return res.status(400).json({ message: "Cannot delete user. They may have active records/assignments." });
    }
};