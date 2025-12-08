// routes/mainRoutes.js
import express from "express";
import { signupController, loginController, verifyController, updateController } from "#users/controller.ts"; 
import { authenticateJWT } from "#utils/auth.ts";
const users = express.Router();


// Define routes on the main router
users.get("/", (req, res) => {
  console.log("This is Signup Router Working");
  res.status(200).send("Welcome to the Sign Up page. Please submit your data via POST.");
});
users.post("/signup", signupController);


// Define routes on the main router
// users.get("/login", (req, res) => {
  //   console.log("This is Login Router Working");
  //   res.status(200).send("Welcome to the LOGIN page. Please submit your data via POST.");
  // });
  users.post("/login", loginController); 
  
  users.post("/verify", verifyController); 
  
  
const settings = express.Router();
settings.patch("/update-profile", authenticateJWT, updateController);

export {users, settings};
