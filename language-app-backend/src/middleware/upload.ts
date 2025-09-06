import multer, { StorageEngine, Multer, FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";

const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/avatars/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${req.userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedTypes = ["image/jpeg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG and PNG images are allowed"));
  }
};

const upload: Multer = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default upload;
