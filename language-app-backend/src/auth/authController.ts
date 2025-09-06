import { AuthService } from "./AuthService";
import {
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from "./auth.dto";
import { Request, Response } from "express";

export const register = async (
  req: Request<{}, {}, RegisterRequest>,
  res: Response
) => {
  try {
    await AuthService.registerUser(req.body);
    res
      .status(201)
      .json({ message: "User registered. Please verify your email" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to register user: ${message}` });
  }
};

export const verifyEmail = async (
  req: Request<{ token: string }>,
  res: Response
) => {
  try {
    await AuthService.verifyUser(req.params.token);
    res.json({ message: "User verified successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to verify email: ${message}` });
  }
};

export const login = async (
  req: Request<{}, {}, LoginRequest>,
  res: Response
) => {
  try {
    const { user, accessToken, refreshToken } = await AuthService.loginUser({
      identifier: req.body.identifier,
      password: req.body.password,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ token: accessToken, user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to login user: ${message}` });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { accessToken, newRefreshToken } = await AuthService.refreshToken(
      req.cookies.refreshToken
    );
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ token: accessToken });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Token refresh failed: ${message}` });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    await AuthService.logoutUser(req.userId);
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.json({ message: "Logged out successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Logout failed: ${message}` });
  }
};

export const forgotPassword = async (
  req: Request<{}, {}, ForgotPasswordRequest>,
  res: Response
) => {
  try {
    await AuthService.forgotPassword({
      email: req.body.email,
    });
    res.json({ message: "Password reset link sent to your email" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      error: `Failed to send reset password email: ${message}`,
    });
  }
};

export const resetPassword = async (
  req: Request<{ token: string }, {}, ResetPasswordRequest>,
  res: Response
) => {
  try {
    await AuthService.resetPassword(req.params.token, {
      password: req.body.password,
    });
    res.json({ message: "Password reset successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to reset password: ${message}` });
  }
};
