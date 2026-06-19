"""
道德困境实验室 - 后端服务
FastAPI + JSON文件存储，数据文件在项目根目录，记事本就能打开看
"""
import os
import uuid
import json
import threading
from pathlib import Path
from datetime import datetime, timedelta
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 数据文件就放在项目根目录，一眼就能看到
DATA_FILE = Path(__file__).parent / "答题记录.json"
LOCK = threading.Lock()


# ── JSON 文件读写 ──────────────────────────────────────────
def read_data():
    """读取数据文件，没有则返回空结构"""
    if not DATA_FILE.exists():
        return {"submissions": []}
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def write_data(data):
    """写入数据文件"""
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ── 自动清理过期数据 ────────────────────────────────────────
def cleanup_old_records(days=7):
    """删除超过指定天数的旧记录"""
    data = read_data()
    before = len(data["submissions"])
    cutoff = datetime.now() - timedelta(days=days)

    kept = []
    deleted = 0
    for sub in data["submissions"]:
        try:
            created = datetime.strptime(sub["created_at"], "%Y-%m-%d %H:%M:%S")
            if created >= cutoff:
                kept.append(sub)
            else:
                deleted += 1
        except (ValueError, KeyError):
            kept.append(sub)  # 无法解析日期的保留

    data["submissions"] = kept
    write_data(data)

    after = len(kept)
    return {"before": before, "after": after, "deleted": deleted}


# ── 应用启动 ───────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 首次启动创建空文件
    if not DATA_FILE.exists():
        write_data({"submissions": []})
    else:
        # 启动时自动清理 7 天前的记录
        result = cleanup_old_records(days=7)
        if result["deleted"] > 0:
            print(f"[自动清理] 已删除 {result['deleted']} 条过期记录，剩余 {result['after']} 条")
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
    choice: str
    choice_text: str
    scores: dict


class SubmitRequest(BaseModel):
    session_id: str
    name: str = "匿名"
    answers: list[AnswerItem]
    total_scores: dict
    archetype: str


# ── API ─────────────────────────────────────────────────────
@app.post("/api/submit")
def submit_results(req: SubmitRequest):
    """提交一轮答题结果"""
    sid = req.session_id or str(uuid.uuid4())

    record = {
        "session_id": sid,
        "name": req.name or "匿名",
        "archetype": req.archetype,
        "total_scores": req.total_scores,
        "answers": [a.model_dump() for a in req.answers],
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }

    with LOCK:
        data = read_data()
        data["submissions"].append(record)
        write_data(data)

    return {"ok": True, "session_id": sid}


@app.get("/api/stats")
def get_stats():
    """获取全局统计数据"""
    data = read_data()
    submissions = data["submissions"]

    total_sessions = len(set(s["session_id"] for s in submissions))

    # 每个困境的选择分布
    dilemma_stats = {}
    for sub in submissions:
        for ans in sub["answers"]:
            did = ans["dilemma_id"]
            if did not in dilemma_stats:
                dilemma_stats[did] = {
                    "title": ans["dilemma_title"],
                    "A": 0, "B": 0,
                    "A_text": "", "B_text": "",
                }
            dilemma_stats[did][ans["choice"]] += 1
            key = f"{ans['choice']}_text"
            if not dilemma_stats[did][key]:
                dilemma_stats[did][key] = ans["choice_text"]

    # 人格类型分布
    archetype_dist = {}
    seen = set()
    for sub in submissions:
        if sub["session_id"] not in seen:
            seen.add(sub["session_id"])
            name = sub["archetype"]
            archetype_dist[name] = archetype_dist.get(name, 0) + 1

    # 各维度平均分
    avg_scores = {"utilitarian": 0.0, "personal": 0.0, "universal": 0.0, "liberty": 0.0}
    score_count = 0
    seen2 = set()
    for sub in submissions:
        if sub["session_id"] not in seen2:
            seen2.add(sub["session_id"])
            for key in avg_scores:
                avg_scores[key] += sub["total_scores"].get(key, 0)
            score_count += 1
    if score_count > 0:
        for key in avg_scores:
            avg_scores[key] = round(avg_scores[key] / score_count, 1)

    # 组装
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


@app.post("/api/clear")
def clear_data():
    """清空所有答题记录"""
    write_data({"submissions": []})
    return {"ok": True, "message": "所有记录已清空"}


@app.post("/api/cleanup")
def manual_cleanup(days: int = 7):
    """手动清理过期记录（默认7天）"""
    result = cleanup_old_records(days=days)
    return {"ok": True, **result}


@app.get("/api/cleanup/info")
def cleanup_info():
    """查看自动清理规则"""
    return {
        "rule": "每次启动后端时自动删除超过7天的记录",
        "retention_days": 7,
        "last_checked": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }


@app.get("/api/raw")
def raw_data():
    """查看原始数据（JSON格式，浏览器打开直接看）"""
    return read_data()


# ── 启动入口 ───────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
