import { Multer } from "multer";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      file?: Multer.File;
      userRole?: string;
    }
  }
}
