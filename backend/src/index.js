import express from "express";
import cors from "cors";
import multer from "multer";
import "dotenv/config";
import { ingestPDF } from "./rag/ingest.js";
import { chat } from "./chains/chain.js";
import pg from "pg";

const server = express();
server.use(cors());
server.use(express.json());

const upload = multer({ dest: "uploads/" });

server.post("/api/upload", upload.single("pdf"), async (req, res) => {
    try {
        const count = await ingestPDF(req.file.path);
        res.json({ success: true, chunks: count });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

server.post("/api/chat", async (req, res) => {
    try {
        const { question } = req.body;
        const result = await chat(question);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 초기화 API 추가
server.delete("/api/documents", async (req, res) => {
  try {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query("TRUNCATE TABLE documents");
    await pool.end();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`서버 실행 중: http://localhost:${PORT}`));