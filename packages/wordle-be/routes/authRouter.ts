import { LoginRequest, RegisterRequest } from "@types";
import express from "express";
import { AuthService } from "../services/authService";

const router = express.Router();

// Register new user
router.post("/register", async (req, res) => {
  try {
    const registerData: RegisterRequest = req.body;

    // Basic validation
    if (!registerData.username || !registerData.email || !registerData.password) {
      return res.status(400).json({ error: "Username, email, and password are required" });
    }

    if (registerData.password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    if (registerData.username.length < 3 || registerData.username.length > 20) {
      return res.status(400).json({ error: "Username must be between 3 and 20 characters" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerData.email)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }

    const result = await AuthService.register(registerData);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Registration failed" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const loginData: LoginRequest = req.body;

    // Basic validation
    if (!loginData.username || !loginData.password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const result = await AuthService.login(loginData);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message || "Login failed" });
  }
});

// Verify token (for client-side token validation)
router.get("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = await AuthService.verifyToken(token);
    const user = await AuthService.getUserById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: (user._id as any).toString(),
        username: user.username,
        email: user.email,
      },
      valid: true,
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message || "Token verification failed", valid: false });
  }
});

export default router;
