// routes/mainRoutes.js
import express from "express";
import { 
    signupController, 
    loginController, 
    verifyController 
} from "#users/controller.ts"; 

// You need ONE main router to export
const users = express.Router();

// Define routes on the main router
users.get("/signup", (req, res) => {
  console.log("This is Signup Router Working");
  res.status(200).send("Welcome to the Sign Up page. Please submit your data via POST.");
});
users.post("/signup", signupController);



// Define routes on the main router
users.get("/login", (req, res) => {
  console.log("This is Login Router Working");
  res.status(200).send("Welcome to the LOGIN page. Please submit your data via POST.");
});
users.post("/login", loginController); 
// Export the single router inst
users.post("/verify", verifyController); 
// ance
export default users;




// 1. SIGNUP
users.get("/signup", (req, res) => {
  res.status(200).send("Welcome to the Sign Up page.");
});

// 2. LOGIN
users.get("/login", (req, res) => {
  res.status(200).send("Welcome to the LOGIN page.");
});

// 3. VERIFY
