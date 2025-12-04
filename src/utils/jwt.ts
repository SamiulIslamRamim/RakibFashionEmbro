import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;

// Access Token — short lived
export const signAccessToken = (userId: string) => {
  return jwt.sign(
    { userId, type: "access" },
    SECRET,
    { expiresIn: "15m" }
  );
};

// Refresh Token — long lived
export const signRefreshToken = (userId: string) => {
  return jwt.sign(
    { userId, type: "refresh" },
    SECRET,
    { expiresIn: "7d" }
  );
};
