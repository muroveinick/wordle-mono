import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import { RegisterRequest, LoginRequest, AuthResponse } from "@types";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const BCRYPT_SALT_ROUNDS = 12;

export class AuthService {
  static async register(registerData: RegisterRequest): Promise<AuthResponse> {
    const { username, email, password } = registerData;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new Error("Username already exists");
      }
      if (existingUser.email === email) {
        throw new Error("Email already exists");
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign({ userId: (user._id as any).toString(), username: user.username }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    return {
      token,
      user: {
        id: (user._id as any).toString(),
        username: user.username,
        email: user.email,
      },
    };
  }

  static async login(loginData: LoginRequest): Promise<AuthResponse> {
    const { username, password } = loginData;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error("Invalid username or password");
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, (user as any).password);
    if (!isPasswordValid) {
      throw new Error("Invalid username or password");
    }

    // Generate JWT token
    const token = jwt.sign({ userId: (user._id as any).toString(), username: user.username }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    return {
      token,
      user: {
        id: (user._id as any).toString(),
        username: user.username,
        email: user.email,
      },
    };
  }

  static async verifyToken(token: string): Promise<{ userId: string; username: string }> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
      return decoded;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  static async getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }
}
