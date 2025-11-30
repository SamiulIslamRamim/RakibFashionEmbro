// index.js
import express from "express";
import dotenv from "dotenv";
import users from "#users/routes.js";

//note: later use these middlewares
// import helmet from "helmet";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import authRoutes from "./routes/auth.js"; // todo: have to add Note the .js!

dotenv.config();


const app = express();
const PORT = process.env.PORT || 9001;


//note: middlewares (to be used later)
// app.use(helmet());
// app.use(cors({ origin: "http://localhost:5173", credentials: true })); 
app.use(express.json());
// app.use(cookieParser());

// Routes
app.get("/", (req, res) => {
  // res.send("Hello World!");
  console.log("Response sent");
});

app.use("/users", users);


//Home


//note: Success Message
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
