import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ Check Authorization Header (Bearer Token)
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2️⃣ No Token → Unauthorized
    if (!token) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    // 3️⃣ Verify Token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        message:
          err.name === "TokenExpiredError"
            ? "Token expired, please login again"
            : "Invalid token, authentication failed",
      });
    }

    // 4️⃣ Find user in DB
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 5️⃣ Attach user to request
    req.user = user;

    // 6️⃣ Continue to next
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(500).json({ message: "Server error in auth middleware" });
  }
};
