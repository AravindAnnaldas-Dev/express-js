import jwt from "jsonwebtoken";

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "You are not authorized to access this." });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}
