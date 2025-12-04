// index.js
import express from "express";
import dotenv from "dotenv";
import {users, settings} from "#users/routes.ts";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
// import bodyParser from "body-parser";

// note: later use these middlewares

dotenv.config();


const app = express();
const PORT = process.env.PORT || 9001;


//note: middlewares (to be used later)
app.use(helmet());
app.use(cors({ origin: "http://localhost:5173", credentials: true })); 
app.use(express.json());
app.use(cookieParser());
// app.use(bodyParser.json());

// Routes

//Home Route
app.get("/", (req, res) => {
 res.send("Hello World!");
  console.log("Response sent");
});

// User Routes/Auth
app.use("/users", users);
app.use("/settings", settings);


//note: Success Message
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
