// routes/mainRoutes.js
import express from "express";

// You need ONE main router to export
const users = express.Router();

// Define routes on the main router
users.get("/signup", (req, res) => {
  console.log("User Router Working");
  res.status(200).send("Welcome to the Sign Up page. Please submit your data via POST.");
});

// Export the single router instance
export default users;