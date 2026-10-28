import multer from "multer";
import path from "path";
import fs from "fs";
import { Request, Response } from "express";

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = path.join(uploadDir, "images");
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `img-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Ліміт 5 МБ
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Дозволено завантажувати лише зображення!"));
    }
  },
});

// 1. Експортуємо сам мідлвар для роута
export const uploadImageMiddleware = upload.single("image");

// 2. Експортуємо контролер для обробки файлу та відповіді
export const uploadImageController = (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "Файл не завантажено" });
  }
  const fileUrl = `/uploads/images/${req.file.filename}`;
  return res.json({ url: fileUrl });
};
