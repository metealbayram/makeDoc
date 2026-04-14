import fs from "fs";
import path from "path";
import multer from "multer";
import { Router } from "express";
import authorize from "../middlewares/auth.middleware.js";
import { convertWordToPdf } from "../controller/tools.controller.js";

const toolsRouter = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "tools", "source");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (extension === ".doc" || extension === ".docx") {
      cb(null, true);
      return;
    }

    cb(new Error("Only .doc and .docx files are allowed."), false);
  },
});

toolsRouter.post("/word-to-pdf", authorize, upload.single("file"), convertWordToPdf);

export default toolsRouter;
