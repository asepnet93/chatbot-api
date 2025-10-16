import { GoogleGenAI } from "@google/genai";
import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Konfigurasi multer untuk menyimpan file di folder uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());

// Endpoint 1: Generate Text 
app.post("/generate-text", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt tidak boleh kosong.",
      });
    }

    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt,
    });

    res.json({
      success: true,
      response: response.text,
    });
  } catch (error) {
    console.error("Error pada endpoint /generate-text:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
});

// Endpoint 2: Generate from Image 
app.post("/generate-from-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File gambar tidak ditemukan.",
      });
    }

    const { prompt } = req.body;
    const defaultPrompt = "Analisis gambar ini secara detail.";

    // Convert image to base64
    const imageBuffer = fs.readFileSync(req.file.path);
    const imageBase64 = imageBuffer.toString("base64");

    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt || defaultPrompt },
            {
              inlineData: {
                data: imageBase64,
                mimeType: req.file.mimetype,
              },
            },
          ],
        },
      ],
    });

    // Cleanup: hapus file setelah diproses
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      response: response.text,
    });
  } catch (error) {
    console.error("Error pada endpoint /generate-from-image:", error);
    
    // Cleanup jika ada error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat menganalisis gambar.",
    });
  }
});

// Endpoint 5: Chat 
app.post("/chat", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt tidak boleh kosong.",
      });
    }

    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt,
    });

    res.json({
      success: true,
      response: response.text,
    });
  } catch (error) {
    console.error("Error pada endpoint /chat:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
});

// Endpoint 6: Analyze Image 
app.post("/analyze-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File gambar tidak ditemukan.",
      });
    }

    // Convert image to base64
    const imageBuffer = fs.readFileSync(req.file.path);
    const imageBase64 = imageBuffer.toString("base64");

    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: [
        {
          role: 'user',
          parts: [
            { text: "Apa isi gambar ini? Analisis dan jelaskan secara detail." },
            {
              inlineData: {
                data: imageBase64,
                mimeType: req.file.mimetype,
              },
            },
          ],
        },
      ],
    });

    // Cleanup: hapus file setelah diproses
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      response: response.text,
    });
  } catch (error) {
    console.error("Error pada endpoint /analyze-image:", error);
    
    // Cleanup jika ada error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat menganalisis gambar.",
    });
  }
});


app.listen(3000, () => console.log("Server is running di http://localhost:3000"));