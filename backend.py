"""
道德困境实验室 - 后端服务
FastAPI + SQLite，收集匿名答题数据，提供统计对比
"""
import sqlite3
import uuid
import json
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

DB_PATH = Path(__file__).parent / "data.db"


# ── 数据库初始化 ───────────────────────────────────────────
def init_db():
    with sqlite3.connect(str(DB_PATH)) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                dilemma_id INTEGER NOT NULL,
                dilemma_title TEXT NOT NULL,
                choice TEXT NOT NULL,
                choice_text TEXT NOT NULL,
                scores_json TEXT NOT NULL,
                total_scores_json TEXT NOT NULL DEFAULT '{}',
                archetype TEXT NOT NULL DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_dilemma ON submissions(dilemma_id, choice)
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_session ON submissions(session_id)
        """)
        conn.commit()


# ── 应用启动 ───────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="道德困境实验室 API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── 数据模型 ───────────────────────────────────────────────
class AnswerItem(BaseModel):
    dilemma_id: int
    dilemma_title: str
    choice: str  # "A" or "B"
    choice_text: str
    scores: dict  # {utilitarian, personal, universal, liberty}

class SubmitRequest(BaseModel):
    session_id: str
    answers: list[AnswerItem]
    total_scores: dict
    archetype: str


# ── API 路由 ───────────────────────────────────────────────
@app.post("/api/submit")
def submit_results(req: SubmitRequest):
    """提交一轮完整答题结果"""
    sid = req.session_id or str(uuid.uuid4())
    total_json = json.dumps(req.total_scores, ensure_ascii=False)

    with sqlite3.connect(str(DB_PATH)) as conn:
        for ans in req.answers:
            conn.execute(
                """INSERT INTO submissions
                   (session_id, dilemma_id, dilemma_title, choice, choice_text,
                    scores_json, total_scores_json, archetype)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    sid,
                    ans.dilemma_id,
                    ans.dilemma_title,
                    ans.choice,
                    ans.choice_text,
                    json.dumps(ans.scores, ensure_ascii=False),
                    total_json,
                    req.archetype,
                ),
            )
        conn.commit()

    return {"ok": True, "session_id": sid}


@app.get("/api/stats")
def get_stats():
    """获取全局统计数据"""
    with sqlite3.connect(str(DB_PATH)) as conn:
        conn.row_factory = sqlite3.Row

        # ── 总提交数 ──
        total_sessions = conn.execute(
            "SELECT COUNT(DISTINCT session_id) FROM submissions"
        ).fetchone()[0]

        # ── 每个困境的选择分布 ──
        dilemma_stats = {}
        rows = conn.execute("""
            SELECT dilemma_id, dilemma_title, choice, COUNT(*) as cnt
            FROM submissions
            GROUP BY dilemma_id, dilemma_title, choice
            ORDER BY dilemma_id, choice
        """).fetchall()
        for row in rows:
            did = row["dilemma_id"]
            if did not in dilemma_stats:
                dilemma_stats[did] = {
                    "title": row["dilemma_title"],
                    "A": 0, "B": 0,
                    "A_text": "", "B_text": "",
                }
            dilemma_stats[did][row["choice"]] = row["cnt"]

        # 获取每个选项的文本
        text_rows = conn.execute("""
            SELECT dilemma_id, choice, choice_text
            FROM submissions
            GROUP BY dilemma_id, choice
            ORDER BY dilemma_id, choice
        """).fetchall()
        for row in text_rows:
            did = row["dilemma_id"]
            if did in dilemma_stats:
                key = f"{row['choice']}_text"
                dilemma_stats[did][key] = row["choice_text"]

        # ── 人格类型分布 ──
        archetype_dist = {}
        rows = conn.execute("""
            SELECT archetype, COUNT(DISTINCT session_id) as cnt
            FROM submissions
            WHERE archetype != ''
            GROUP BY archetype
            ORDER BY cnt DESC
        """).fetchall()
        for row in rows:
            archetype_dist[row["archetype"]] = row["cnt"]

        # ── 各维度平均分 ──
        avg_scores = {"utilitarian": 0.0, "personal": 0.0, "universal": 0.0, "liberty": 0.0}
        score_count = 0
        rows = conn.execute(
            "SELECT DISTINCT session_id, total_scores_json FROM submissions"
        ).fetchall()
        for row in rows:
            try:
                scores = json.loads(row["total_scores_json"])
                for key in avg_scores:
                    avg_scores[key] += scores.get(key, 0)
                score_count += 1
            except (json.JSONDecodeError, TypeError):
                pass
        if score_count > 0:
            for key in avg_scores:
                avg_scores[key] = round(avg_scores[key] / score_count, 1)

    # ── 组装返回 ──
    dilemma_list = []
    for did in sorted(dilemma_stats.keys()):
        d = dilemma_stats[did]
        total = d["A"] + d["B"]
        dilemma_list.append({
            "id": did,
            "title": d["title"],
            "choice_a": {"text": d["A_text"], "count": d["A"],
                         "pct": round(d["A"] / total * 100) if total > 0 else 0},
            "choice_b": {"text": d["B_text"], "count": d["B"],
                         "pct": round(d["B"] / total * 100) if total > 0 else 0},
        })

    return {
        "total_sessions": total_sessions,
        "dilemma_stats": dilemma_list,
        "archetype_distribution": archetype_dist,
        "average_scores": avg_scores,
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}


# ── 静态文件（前端） ─────────────────────────────────────
frontend_dir = Path(__file__).parent
app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="static")


# ── 启动入口 ───────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
