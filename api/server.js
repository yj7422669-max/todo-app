
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 4000;

// 웹 브라우저에서 API에 요청할 수 있도록 설정
app.use(cors());
app.use(express.json());

// PostgreSQL 데이터베이스 연결 설정
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// API 서버 상태 확인
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Todo API is running",
  });
});

// PostgreSQL에서 할 일 목록 조회
app.get("/api/todos", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, text, completed FROM todos ORDER BY created_at DESC, id DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("DB 오류:", error.message);
    res.status(500).json({
      error: "데이터베이스 조회 실패",
    });
  }
});


const { randomUUID } = require("crypto");

// 할 일 추가
app.post("/api/todos", async (req, res) => {
  try {
    const text = req.body?.text;

    if (typeof text !== "string" || !text.trim() || text.length > 200) {
      return res.status(400).json({ error: "할 일을 1~200자로 입력하세요." });
    }

    const result = await pool.query(
      "INSERT INTO todos (id, text) VALUES ($1, $2) RETURNING id, text, completed",
      [randomUUID(), text.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("할 일 추가 실패:", error.message);
    res.status(500).json({ error: "할 일 추가 실패" });
  }
});

// 할 일 완료 또는 완료 취소
app.patch("/api/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body ?? {};

    if (typeof completed !== "boolean") {
      return res.status(400).json({ error: "completed는 true 또는 false여야 합니다." });
    }

    const result = await pool.query(
      "UPDATE todos SET completed = $1 WHERE id = $2 RETURNING id, text, completed",
      [completed, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "할 일을 찾을 수 없습니다." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("할 일 수정 실패:", error.message);
    res.status(500).json({ error: "할 일 수정 실패" });
  }
});

// 할 일 삭제
app.delete("/api/todos/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM todos WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "할 일을 찾을 수 없습니다." });
    }

    res.status(204).send();
  } catch (error) {
    console.error("할 일 삭제 실패:", error.message);
    res.status(500).json({ error: "할 일 삭제 실패" });
  }
});

// DB 연결을 확인한 후 서버 실행
async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("PostgreSQL 연결 성공!");

    app.listen(PORT, () => {
      console.log(`API 서버 실행: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("PostgreSQL 연결 실패:", error.message);
    process.exit(1);
  }
}

startServer();
