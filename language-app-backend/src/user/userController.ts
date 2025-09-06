import { Request, Response } from "express";
import { UserService } from "./UserService";
import { UpdateInterfaceLanguageRequest, UpdateUserRequest } from "./user.dto";

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await UserService.uploadAvatar(req.userId, req.file.filename);
    res.json({
      message: "Avatar uploaded successfully",
      avatar: user.avatar,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to upload avatar: ${message}` });
  }
};

export const deleteAvatar = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    await UserService.deleteAvatar(req.userId);
    res.json({ message: "Avatar deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to upload avatar: ${message}` });
  }
};

export const updateInterfaceLanguage = async (
  req: Request<{}, {}, UpdateInterfaceLanguageRequest>,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const language = await UserService.updateInterfaceLanguage(
      req.userId,
      req.body
    );
    res.json(language);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      error: `Failed to update interface language: ${message}`,
    });
  }
};

export const updateUser = async (
  req: Request<{}, {}, UpdateUserRequest>,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await UserService.updateUser(req.userId, req.body);
    res.json({
      message: "User updated",
      user,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to update user: ${message}` });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    await UserService.deleteUser(req.userId);
    res.json({ message: "User deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to delete user: ${message}` });
  }
};
