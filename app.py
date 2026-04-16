from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import sqlite3
import os
import uuid
from dotenv import load_dotenv
import httpx
from typing import Optional
from datetime import datetime

load_dotenv()

app = FastAPI()

# 数字人API配置
COZE_API_TOKEN = os.getenv("COZE_API_TOKEN")
BOT_ID = os.getenv("BOT_ID")
COZE_CHAT_URL = "https://api.coze.cn/v3/chat"

# 启用CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据库连接
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "volume-detail.db")
USERS_DB_PATH = os.path.join(BASE_DIR, "signup.db")

# 请求/响应模型
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

class UserReg(BaseModel):
    username: str
    password: str
    password_confirm: str

class UserLogin(BaseModel):
    username: str
    password: str

class NoteData(BaseModel):
    id: int
    content: str

class HeartbeatData(BaseModel):
    user_id: int
    issue_id: int

# 初始化数据库
def init_users_db():
    try:
        conn = sqlite3.connect(USERS_DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        conn.close()
        print("用户数据库初始化成功")
    except Exception as e:
        print(f"用户数据库初始化失败: {str(e)}")

def init_history_db():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS read_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                issue_id INTEGER NOT NULL,
                read_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS reading_time (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                issue_id INTEGER NOT NULL,
                total_seconds INTEGER DEFAULT 0,
                last_heartbeat_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, issue_id)
            )
        ''')
        conn.commit()
        conn.close()
        print("阅读历史及时长表初始化成功")
    except Exception as e:
        print(f"阅读历史及时长表初始化失败: {str(e)}")

init_users_db()
init_history_db()

# 笔记内存存储
fake_note = {1: "", 2: "", 3: ""}

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# -------------------- 搜索功能初始化 --------------------
def init_keywords_column():
    """为红色日报表添加 keywords 列（如果不存在），并生成初始关键词"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("PRAGMA table_info(红色日报)")
        columns = [col[1] for col in cursor.fetchall()]
        if 'keywords' not in columns:
            print("正在添加 keywords 列...")
            cursor.execute("ALTER TABLE 红色日报 ADD COLUMN keywords TEXT")
            conn.commit()
            print("keywords 列添加成功，正在生成初始关键词...")
            cursor.execute("SELECT id, title, full_text FROM 红色日报")
            rows = cursor.fetchall()
            common_names = ["毛泽东", "周恩来", "朱德", "刘少奇", "邓小平", "李大钊", "陈独秀"]
            for row in rows:
                row_id, title, content = row
                keywords = title
                if content:
                    for name in common_names:
                        if name in content:
                            keywords += f",{name}"
                cursor.execute("UPDATE 红色日报 SET keywords = ? WHERE id = ?", (keywords, row_id))
            conn.commit()
            print("初始关键词生成完成")
        else:
            print("keywords 列已存在，跳过初始化")
    except Exception as e:
        print(f"初始化 keywords 列失败: {e}")
    finally:
        conn.close()

init_keywords_column()

# -------------------- API 路由 --------------------
@app.get("/api/newspapers/latest")
def get_latest_newspapers():
    conn = get_db_connection()
    try:
        cursor = conn.execute(
            "SELECT id, title, year, month, full_text as content, images as image_url, source, publish_date, period "
            "FROM 红色日报 ORDER BY year DESC, month DESC LIMIT 3"
        )
        newspapers = cursor.fetchall()
        result = []
        for row in newspapers:
            row_dict = dict(row)
            if row_dict.get('publish_date'):
                row_dict['date'] = row_dict['publish_date']
            elif row_dict.get('year') and row_dict.get('month'):
                day = (row_dict['id'] % 28) + 1
                row_dict['date'] = f"{row_dict['year']}-{str(row_dict['month']).zfill(2)}-{str(day).zfill(2)}"
            else:
                row_dict['date'] = None
            result.append(row_dict)
        return result
    finally:
        conn.close()

@app.get("/api/newspapers")
def get_all_newspapers():
    conn = get_db_connection()
    try:
        cursor = conn.execute(
            "SELECT id, title, year, month, full_text as content, images as image_url, source, publish_date, period "
            "FROM 红色日报 ORDER BY year DESC, month DESC"
        )
        newspapers = cursor.fetchall()
        result = []
        for row in newspapers:
            row_dict = dict(row)
            if row_dict.get('publish_date'):
                row_dict['date'] = row_dict['publish_date']
            elif row_dict.get('year') and row_dict.get('month'):
                day = (row_dict['id'] % 28) + 1
                row_dict['date'] = f"{row_dict['year']}-{str(row_dict['month']).zfill(2)}-{str(day).zfill(2)}"
            else:
                row_dict['date'] = None
            result.append(row_dict)
        return result
    finally:
        conn.close()

@app.get("/api/newspapers/{newspaper_id}")
def get_newspaper_detail(newspaper_id: int):
    conn = get_db_connection()
    try:
        cursor = conn.execute(
            "SELECT id, title, year, month, full_text as content, images as image_url, source, publish_date, period "
            "FROM 红色日报 WHERE id = ?",
            (newspaper_id,)
        )
        row = cursor.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="报纸不存在")
        row_dict = dict(row)
        if row_dict.get('publish_date'):
            row_dict['date'] = row_dict['publish_date']
        elif row_dict.get('year') and row_dict.get('month'):
            day = (row_dict['id'] % 28) + 1
            row_dict['date'] = f"{row_dict['year']}-{str(row_dict['month']).zfill(2)}-{str(day).zfill(2)}"
        else:
            row_dict['date'] = None
        return row_dict
    finally:
        conn.close()

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    user_message = request.message.strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="消息不能为空")
    user_id = str(uuid.uuid4())
    headers = {
        "Authorization": f"Bearer {COZE_API_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "bot_id": BOT_ID,
        "user_id": user_id,
        "stream": True,
        "auto_save_history": True,
        "additional_messages": [
            {"role": "user", "content": user_message, "content_type": "text"}
        ],
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            print(f"调用Coze API，Bot ID: {BOT_ID}")
            print(f"API Token: {COZE_API_TOKEN[:10]}...")
            response = await client.post(COZE_CHAT_URL, json=payload, headers=headers)
            print(f"Coze API响应状态码: {response.status_code}")
            response.raise_for_status()
            response_text = await response.aread()
            response_str = response_text.decode('utf-8', errors='ignore')
            print(f"Coze API响应内容长度: {len(response_str)}")
            ai_reply = ""
            if 'event:conversation.message.delta' in response_str:
                print("检测到流式响应格式")
                lines = response_str.split('\n')
                for line in lines:
                    line = line.strip()
                    if line.startswith('data:'):
                        data_str = line[5:].strip()
                        if data_str and data_str != '[DONE]':
                            try:
                                import json
                                data = json.loads(data_str)
                                if isinstance(data, dict):
                                    if data.get('role') == 'assistant' and data.get('type') == 'answer':
                                        content = data.get('content', '')
                                        if content:
                                            ai_reply += content
                            except json.JSONDecodeError:
                                pass
            else:
                print("检测到非流式响应格式")
                try:
                    import json
                    result = json.loads(response_str)
                    if result.get('code') == 0:
                        if 'messages' in result and len(result['messages']) > 0:
                            for message in result['messages']:
                                if message.get('role') == 'assistant' and message.get('type') == 'answer':
                                    ai_reply = message.get('content', '')
                                    break
                        elif 'data' in result:
                            data = result['data']
                            if 'messages' in data and len(data['messages']) > 0:
                                for message in data['messages']:
                                    if message.get('role') == 'assistant' and message.get('type') == 'answer':
                                        ai_reply = message.get('content', '')
                                        break
                            elif 'tool_output_content' in data:
                                ai_reply = data['tool_output_content']
                except json.JSONDecodeError:
                    print("响应不是有效的JSON")
            if ai_reply:
                import re
                ai_reply = re.sub(r'[\x00-\x1F\x7F]', '', ai_reply)
                ai_reply = '\n'.join([line for line in ai_reply.split('\n') if
                                      not line.strip().endswith('？') and not line.strip().endswith('?')])
                ai_reply = ' '.join(ai_reply.split())
                if ai_reply:
                    return ChatResponse(reply=ai_reply)
                else:
                    return ChatResponse(reply="你好！我是红色文化研究员，很高兴为你解答关于红色文化的问题。")
            else:
                return ChatResponse(reply="数字人服务暂时不可用，请稍后重试")
        except httpx.TimeoutException:
            return ChatResponse(reply="请求超时，请稍后重试")
        except Exception as e:
            print(f"数字人API调用错误: {str(e)}")
            return ChatResponse(reply="数字人服务暂时不可用，请稍后重试")

@app.post("/api/user/register")
def register(data: UserReg):
    if data.password != data.password_confirm:
        return {"code": 400, "msg": "两次密码不一致", "data": None}
    conn = sqlite3.connect(USERS_DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM users WHERE username = ?", (data.username,))
        if cursor.fetchone():
            return {"code": 400, "msg": "用户名已存在", "data": None}
        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)",
                       (data.username, data.password))
        conn.commit()
        return {"code": 200, "msg": "注册成功", "data": None}
    except Exception as e:
        return {"code": 500, "msg": f"注册失败: {str(e)}", "data": None}
    finally:
        conn.close()

@app.post("/api/user/login")
def login(data: UserLogin):
    conn = sqlite3.connect(USERS_DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, password FROM users WHERE username = ?", (data.username,))
        row = cursor.fetchone()
        if row and row[1] == data.password:
            token = str(uuid.uuid4())
            return {"code": 200, "msg": "登录成功", "data": {"token": token, "user_id": row[0]}}
        else:
            return {"code": 400, "msg": "账号或密码错误", "data": None}
    except Exception as e:
        return {"code": 500, "msg": f"登录失败: {str(e)}", "data": None}
    finally:
        conn.close()

@app.get("/api/volume/list")
def volume_list(
        period: Optional[str] = Query(None),
        month: Optional[int] = Query(None),
        type: Optional[str] = Query(None)
):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        sql = "SELECT id, year, month, title, period, source, key_figure_place FROM \"红色日报\" WHERE 1=1"
        params = []
        if period:
            sql += " AND period = ?"
            params.append(period)
        if month:
            sql += " AND month = ?"
            params.append(month)
        if type and type != "all":
            sql += " AND type = ?"
            params.append(type)
        sql += " ORDER BY year ASC, month ASC"
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        data = []
        for row in rows:
            data.append({
                "id": row["id"],
                "year": row["year"],
                "month": row["month"],
                "title": row["title"],
                "period": row["period"] or "",
                "source": row["source"] or "",
                "key_figure_place": row["key_figure_place"] or ""
            })
        return {"code": 200, "msg": "success", "data": data}
    except Exception as e:
        return {"code": 500, "msg": str(e), "data": []}
    finally:
        conn.close()

@app.post("/api/note/save")
def save_note(data: NoteData):
    if data.id not in fake_note:
        raise HTTPException(status_code=404, detail="ID不存在")
    fake_note[data.id] = data.content
    return {"code": 200, "msg": "保存成功", "data": None}

@app.get("/api/issue/{issue_id}")
def get_issue(issue_id: int):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM \"红色日报\" WHERE id = ?", (issue_id,))
        row = cursor.fetchone()
        if not row:
            return {"code": 404, "msg": "未找到", "data": None}
        data = {key: row[key] for key in row.keys()}
        return {"code": 200, "msg": "success", "data": data}
    except Exception as e:
        return {"code": 500, "msg": str(e), "data": None}
    finally:
        conn.close()

@app.post("/api/heartbeat")
def heartbeat(data: HeartbeatData):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    now = datetime.now()
    try:
        cursor.execute(
            "SELECT total_seconds, last_heartbeat_at FROM reading_time WHERE user_id = ? AND issue_id = ?",
            (data.user_id, data.issue_id)
        )
        row = cursor.fetchone()
        if row:
            total_sec, last_str = row
            if last_str:
                last_time = datetime.fromisoformat(last_str)
                delta = (now - last_time).total_seconds()
                if 0 < delta < 300:
                    total_sec += int(delta)
            cursor.execute(
                "UPDATE reading_time SET total_seconds = ?, last_heartbeat_at = ? WHERE user_id = ? AND issue_id = ?",
                (total_sec, now.isoformat(), data.user_id, data.issue_id)
            )
        else:
            cursor.execute(
                "INSERT INTO reading_time (user_id, issue_id, total_seconds, last_heartbeat_at) VALUES (?, ?, ?, ?)",
                (data.user_id, data.issue_id, 0, now.isoformat())
            )
        cursor.execute(
            "SELECT id FROM read_history WHERE user_id = ? AND issue_id = ?",
            (data.user_id, data.issue_id)
        )
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO read_history (user_id, issue_id, read_time) VALUES (?, ?, ?)",
                (data.user_id, data.issue_id, now.isoformat())
            )
        conn.commit()
        return {"code": 200, "msg": "心跳成功"}
    except Exception as e:
        return {"code": 500, "msg": str(e)}
    finally:
        conn.close()

@app.get("/api/user/read_issues")
def read_issues(user_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT COUNT(DISTINCT issue_id) FROM read_history WHERE user_id = ?",
            (user_id,)
        )
        count = cursor.fetchone()[0] or 0
        return {"code": 200, "msg": "success", "data": {"read_issues": count}}
    except Exception as e:
        return {"code": 500, "msg": str(e)}
    finally:
        conn.close()

@app.get("/api/reading/duration")
def reading_duration(user_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT SUM(total_seconds) FROM reading_time WHERE user_id = ?",
            (user_id,)
        )
        total_sec = cursor.fetchone()[0] or 0
        total_min = round(total_sec / 60)
        return {"code": 200, "msg": "success", "data": {"total_duration": total_min}}
    except Exception as e:
        return {"code": 500, "msg": str(e)}
    finally:
        conn.close()

@app.get("/api/reading/history")
def reading_history(user_id: int, limit: int = 5):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute('''
            SELECT h.issue_id, h.read_time, r.title, r.year, r.month, r.publish_date
            FROM read_history h
            JOIN "红色日报" r ON h.issue_id = r.id
            WHERE h.user_id = ?
            ORDER BY h.read_time DESC
            LIMIT ?
        ''', (user_id, limit))
        rows = cursor.fetchall()
        data = []
        for row in rows:
            if row["publish_date"]:
                date_str = row["publish_date"]
            else:
                date_str = f"{row['year']}年{row['month']}月"
            data.append({
                "issue_id": row["issue_id"],
                "issue_title": row["title"],
                "issue_date": date_str,
                "read_time": row["read_time"]
            })
        return {"code": 200, "msg": "success", "data": data}
    except Exception as e:
        return {"code": 500, "msg": str(e), "data": []}
    finally:
        conn.close()

@app.post("/api/history/add")
def add_read_history(user_id: int, issue_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO read_history (user_id, issue_id) VALUES (?, ?)",
            (user_id, issue_id)
        )
        conn.commit()
        return {"code": 200, "msg": "记录成功"}
    except Exception as e:
        return {"code": 500, "msg": str(e)}
    finally:
        conn.close()

@app.get("/api/history/list")
def get_read_history(user_id: int):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT h.id, h.issue_id, h.read_time, r.title, r.year, r.month
            FROM read_history h
            JOIN "红色日报" r ON h.issue_id = r.id
            WHERE h.user_id = ?
            ORDER BY h.read_time DESC
        ''', (user_id,))
        rows = cursor.fetchall()
        data = [dict(row) for row in rows]
        return {"code": 200, "msg": "success", "data": data}
    except Exception as e:
        return {"code": 500, "msg": str(e), "data": []}
    finally:
        conn.close()

# -------------------- 搜索 API（已添加） --------------------
@app.get("/api/search")
def search_news(q: str = Query(..., min_length=1)):
    """搜索报纸：匹配 title / full_text / keywords"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        like_pattern = f"%{q}%"
        sql = """
            SELECT id, title, year, month, publish_date, 
                   full_text, keywords, source
            FROM 红色日报
            WHERE title LIKE ? 
               OR full_text LIKE ? 
               OR keywords LIKE ?
            ORDER BY year DESC, month DESC
        """
        cursor.execute(sql, (like_pattern, like_pattern, like_pattern))
        rows = cursor.fetchall()
        results = []
        for row in rows:
            if row["publish_date"]:
                date_str = row["publish_date"]
            else:
                date_str = f"{row['year']}年{row['month']}月"
            results.append({
                "id": row["id"],
                "title": row["title"],
                "date": date_str,
                "year": row["year"],
                "month": row["month"],
                "content_preview": (row["full_text"][:150] + "...") if row["full_text"] else "",
                "source": row["source"] or ""
            })
        return {"code": 200, "msg": "success", "data": results}
    except Exception as e:
        return {"code": 500, "msg": str(e), "data": []}
    finally:
        conn.close()

@app.get("/api")
def root():
    return {"message": "红色回响 API 服务", "docs": "/docs"}

# 挂载静态文件（请根据实际前端目录调整）
app.mount("/", StaticFiles(directory="../frontend", html=True), name="static")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
