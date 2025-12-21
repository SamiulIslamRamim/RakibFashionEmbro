// routes/mainRoutes.js
import express from "express";
//info: will add to forgot, verifyreset, resetpass controllers later
import { signupController, loginController, verifyController, updateController, adminUpdateController, forgotPasswordController, verifyResetTokenController, resetPasswordController, changePasswordController } from "#users/controller.ts";
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
users.patch("/change-password", authenticateJWT, changePasswordController); //note: add controller
//todo: need to add these controllers later
users.post("/forgot-password", forgotPasswordController);
users.get("/reset-password/:token", verifyResetTokenController);
users.post("/reset-password", resetPasswordController);

//INFO: settings Router -> profile update
const settings = express.Router();
settings.patch("/update-profile", authenticateJWT, updateController);

//INFO: Admin Update
const admin = express.Router();
admin.patch("/update-profile/:id", adminUpdateController);



export { users, settings, admin };
