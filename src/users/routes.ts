// routes/mainRoutes.js
import express from "express";
import { signupController, loginController, verifyController, updateController, adminUpdateController, forgotPasswordController, verifyResetTokenController, resetPasswordController, changePasswordController, userSelfDeactivateController, adminUpdateStatusController, adminHardDeleteController, requestEmailUpdateController, confirmEmailUpdateController, } from "#users/controller.ts";
import { authenticateJWT } from "#utils/auth.ts";

//INFO: Users Router
const users = express.Router();

users.get("/", (req, res) => {
  console.log("This is Signup Router Working");
  res
    .status(200)
    .send("Welcome to the Sign Up page. Please submit your data via POST.");
});
users.post("/signup", signupController);
users.post("/verify", verifyController);
users.post("/login", loginController);
users.patch("/change-password", authenticateJWT, changePasswordController);
users.patch
//todo: need to add these controllers later
users.post("/forgot-password", forgotPasswordController);
users.get("/reset-password/:token", verifyResetTokenController);
users.post("/reset-password", resetPasswordController);
users.patch("/deactivate", authenticateJWT, userSelfDeactivateController);
users.post("/request-email-change", authenticateJWT, requestEmailUpdateController);
users.get("/confirm-email", confirmEmailUpdateController);

//INFO: settings Router -> profile update
const settings = express.Router();
settings.patch("/update-profile", authenticateJWT, updateController);

//INFO: Admin Update
const admin = express.Router();
admin.patch("/update-profile/:id", adminUpdateController);
admin.patch("/deactivate/:id", authenticateJWT, adminUpdateStatusController); //todo: need to  check this condition "isAdmin ?"
admin.delete("/delete/:id", authenticateJWT, adminHardDeleteController); //todo: need to  check this condition "isAdmin ?"

export { users, settings, admin };
