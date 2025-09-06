import dotenv from "dotenv";
dotenv.config();
import express, { Express, Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import cookieParser from "cookie-parser";
import apiRoutes from "./src/app/api";

const app: Express = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

mongoose
  .connect(process.env.MONGODB_URI as string)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Language Learning API is running" });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  "/uploads/avatars",
  express.static(path.join(__dirname, "uploads/avatars"))
);

app.use("/api", apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
