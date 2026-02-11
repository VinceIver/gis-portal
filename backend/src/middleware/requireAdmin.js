import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const requireAdmin = (req, res, next) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = payload.adminId;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default requireAdmin;