import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

const uploadDirectory = path.resolve("uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const safeName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9_-]/g, "_");

    cb(null, `${Date.now()}-${safeName}${extension}`);
  },
});

const allowedExtensions = [
  ".pdf", ".doc", ".docx", ".txt",
  ".png", ".jpg", ".jpeg",
  ".xls", ".xlsx", ".ppt", ".pptx",
];

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      return cb(new Error("File type not allowed."));
    }

    cb(null, true);
  },
});

router.post("/", protect, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please select a file." });
  }

  res.status(201).json({
    message: "File uploaded successfully.",
    attachment: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname,
  });
});

export default router;
