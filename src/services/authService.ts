import jwt from "jsonwebtoken";

// read secret inside functions so tests can modify env variable
const getSecret = () => process.env.JWT_SECRET || "secret";

export const generateToken = (user: { id: number; role: string }) => {
  const payload = { id: user.id, role: user.role };
  return jwt.sign(payload, getSecret(), { expiresIn: "1h" });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, getSecret());
};
