import sqlite3
import uuid
import os
import hashlib
from datetime import datetime

DATABASE_FILE = os.path.join(os.path.dirname(__file__), 'database.db')

def get_db():
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at TEXT NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS images (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            prompt TEXT,
            aspect_ratio TEXT,
            image_size TEXT,
            thinking_level TEXT,
            model TEXT,
            source_filename TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS api_keys (
            id TEXT PRIMARY KEY,
            name TEXT,
            value TEXT NOT NULL,
            is_active INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        )
    ''')

    existing_api_key = cursor.execute(
        "SELECT key FROM config WHERE key = 'api_key'"
    ).fetchone()

    if not existing_api_key:
        cursor.execute(
            "INSERT INTO config (key, value, updated_at) VALUES (?, ?, ?)",
            ('api_key', 'AIzaSyAdwFVzpgS1-ip_jwtL4SwzNYi0cXyUGKE', datetime.now().isoformat())
        )
        print(f"Default API KEY set")

    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id)
    ''')

    existing_admin = cursor.execute(
        "SELECT id FROM users WHERE username = 'admin'"
    ).fetchone()

    if not existing_admin:
        admin_id = str(uuid.uuid4())
        password_hash = hashlib.sha256('admin123'.encode()).hexdigest()
        cursor.execute(
            "INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
            (admin_id, 'admin', password_hash, 'admin', datetime.now().isoformat())
        )
        print(f"Default admin created: admin / admin123")

    conn.commit()
    conn.close()

def create_user(username, password, role='user'):
    conn = get_db()
    cursor = conn.cursor()

    existing = cursor.execute(
        "SELECT id FROM users WHERE username = ?", (username,)
    ).fetchone()

    if existing:
        conn.close()
        return None, "用户名已存在"

    user_id = str(uuid.uuid4())
    password_hash = hashlib.sha256(password.encode()).hexdigest()

    cursor.execute(
        "INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, username, password_hash, role, datetime.now().isoformat())
    )

    conn.commit()
    conn.close()

    user_dir = os.path.join(os.path.dirname(__file__), 'data', user_id, 'images')
    os.makedirs(user_dir, exist_ok=True)

    return user_id, None

def verify_user(username, password):
    conn = get_db()
    cursor = conn.cursor()

    user = cursor.execute(
        "SELECT id, username, password_hash, role FROM users WHERE username = ?",
        (username,)
    ).fetchone()

    conn.close()

    if not user:
        return None

    password_hash = hashlib.sha256(password.encode()).hexdigest()

    if user['password_hash'] == password_hash:
        return {'id': user['id'], 'username': user['username'], 'role': user['role']}

    return None

def get_user_by_id(user_id):
    conn = get_db()
    cursor = conn.cursor()

    user = cursor.execute(
        "SELECT id, username, role, created_at FROM users WHERE id = ?",
        (user_id,)
    ).fetchone()

    conn.close()

    if user:
        return dict(user)
    return None

def get_all_users():
    conn = get_db()
    cursor = conn.cursor()

    users = cursor.execute(
        "SELECT id, username, role, created_at FROM users ORDER BY created_at DESC"
    ).fetchall()

    conn.close()
    return [dict(u) for u in users]

def delete_user(user_id):
    conn = get_db()
    cursor = conn.cursor()

    user = cursor.execute("SELECT role FROM users WHERE id = ?", (user_id,)).fetchone()
    if user and user['role'] == 'admin':
        conn.close()
        return False, "不能删除管理员账户"

    cursor.execute("DELETE FROM images WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))

    conn.commit()
    conn.close()

    user_dir = os.path.join(os.path.dirname(__file__), 'data', user_id)
    if os.path.exists(user_dir):
        import shutil
        shutil.rmtree(user_dir)

    return True, None

def add_image(user_id, filename, prompt, aspect_ratio, image_size, thinking_level, model=None, source_filename=None):
    conn = get_db()
    cursor = conn.cursor()

    image_id = str(uuid.uuid4())

    cursor.execute(
        """INSERT INTO images (id, user_id, filename, prompt, aspect_ratio, image_size, thinking_level, model, source_filename, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (image_id, user_id, filename, prompt, aspect_ratio, image_size, thinking_level, model, source_filename, datetime.now().isoformat())
    )

    conn.commit()
    conn.close()

    return image_id

def get_user_images(user_id):
    conn = get_db()
    cursor = conn.cursor()

    images = cursor.execute(
        """SELECT id, filename, prompt, aspect_ratio, image_size, thinking_level, source_filename, model, created_at
           FROM images WHERE user_id = ? ORDER BY created_at DESC""",
        (user_id,)
    ).fetchall()

    conn.close()
    return [dict(img) for img in images]

def get_image_by_id(image_id, user_id):
    conn = get_db()
    cursor = conn.cursor()

    image = cursor.execute(
        """SELECT id, user_id, filename, prompt, aspect_ratio, image_size, thinking_level, source_filename, created_at
           FROM images WHERE id = ? AND user_id = ?""",
        (image_id, user_id)
    ).fetchone()

    conn.close()

    if image:
        return dict(image)
    return None

def update_image_prompt(image_id, user_id, new_prompt):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE images SET prompt = ? WHERE id = ? AND user_id = ?",
        (new_prompt, image_id, user_id)
    )

    conn.commit()
    affected = cursor.rowcount
    conn.close()

    return affected > 0

def delete_image(image_id, user_id):
    conn = get_db()
    cursor = conn.cursor()

    image = cursor.execute(
        "SELECT filename FROM images WHERE id = ? AND user_id = ?",
        (image_id, user_id)
    ).fetchone()

    if image:
        filepath = os.path.join(os.path.dirname(__file__), 'data', user_id, 'images', image['filename'])
        if os.path.exists(filepath):
            os.remove(filepath)

        cursor.execute("DELETE FROM images WHERE id = ? AND user_id = ?", (image_id, user_id))
        conn.commit()
        conn.close()
        return True

    conn.close()
    return False

def get_config(key):
    conn = get_db()
    cursor = conn.cursor()
    row = cursor.execute("SELECT value FROM config WHERE key = ?", (key,)).fetchone()
    conn.close()
    return row['value'] if row else None

def update_config(key, value):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?, ?, ?)",
        (key, value, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()
    return True

def get_api_keys():
    conn = get_db()
    cursor = conn.cursor()
    keys = cursor.execute(
        "SELECT id, name, value, is_active, created_at FROM api_keys ORDER BY is_active DESC, created_at DESC"
    ).fetchall()
    conn.close()
    return [dict(k) for k in keys]

def add_api_key(name, value):
    conn = get_db()
    cursor = conn.cursor()
    key_id = str(uuid.uuid4())
    cursor.execute(
        "INSERT INTO api_keys (id, name, value, is_active, created_at) VALUES (?, ?, ?, 0, ?)",
        (key_id, name, value, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()
    return key_id

def activate_api_key(key_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE api_keys SET is_active = 0")
    cursor.execute("UPDATE api_keys SET is_active = 1 WHERE id = ?", (key_id,))
    conn.commit()
    conn.close()
    return True

def delete_api_key(key_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM api_keys WHERE id = ?", (key_id,))
    conn.commit()
    conn.close()
    return True

def get_active_api_key():
    conn = get_db()
    cursor = conn.cursor()
    key = cursor.execute(
        "SELECT value FROM api_keys WHERE is_active = 1"
    ).fetchone()
    conn.close()
    return key['value'] if key else None

def init_template_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS prompt_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category VARCHAR(50) NOT NULL,
            sub_category VARCHAR(50),
            name VARCHAR(200) NOT NULL,
            description TEXT,
            prompt_template TEXT NOT NULL,
            example_image VARCHAR(500),
            original_image VARCHAR(500),
            tags JSON,
            is_featured INTEGER DEFAULT 0,
            use_count INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            sort_order INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_template_favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            template_id INTEGER NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, template_id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (template_id) REFERENCES prompt_templates(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS template_usage_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            template_id INTEGER NOT NULL,
            task_id TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (template_id) REFERENCES prompt_templates(id)
        )
    ''')

    cursor.execute('CREATE INDEX IF NOT EXISTS idx_templates_category ON prompt_templates(category)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_templates_featured ON prompt_templates(is_featured)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_favorites_user ON user_template_favorites(user_id)')

    conn.commit()
    conn.close()

def get_templates(category=None, search=None, page=1, limit=20):
    conn = get_db()
    cursor = conn.cursor()

    offset = (page - 1) * limit
    params = []
    conditions = ["is_active = 1"]

    if category and category != '全部':
        conditions.append("category = ?")
        params.append(category)

    if search:
        conditions.append("(name LIKE ? OR description LIKE ? OR prompt_template LIKE ?)")
        search_pattern = f"%{search}%"
        params.extend([search_pattern, search_pattern, search_pattern])

    where_clause = " AND ".join(conditions)

    count_query = f"SELECT COUNT(*) as total FROM prompt_templates WHERE {where_clause}"
    total = cursor.execute(count_query, params).fetchone()[0]

    query = f"""
        SELECT * FROM prompt_templates
        WHERE {where_clause}
        ORDER BY is_featured DESC, use_count DESC, sort_order ASC, id ASC
        LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])
    templates = cursor.execute(query, params).fetchall()

    conn.close()

    return {
        'templates': [dict(t) for t in templates],
        'total': total,
        'page': page,
        'limit': limit,
        'total_pages': (total + limit - 1) // limit
    }

def get_template_by_id(template_id):
    conn = get_db()
    cursor = conn.cursor()
    template = cursor.execute(
        "SELECT * FROM prompt_templates WHERE id = ? AND is_active = 1",
        (template_id,)
    ).fetchone()
    conn.close()
    return dict(template) if template else None

def get_categories():
    conn = get_db()
    cursor = conn.cursor()
    categories = cursor.execute("""
        SELECT category, COUNT(*) as count
        FROM prompt_templates
        WHERE is_active = 1
        GROUP BY category
        ORDER BY count DESC
    """).fetchall()
    conn.close()
    return [dict(c) for c in categories]

def increment_template_use_count(template_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE prompt_templates SET use_count = use_count + 1, updated_at = ? WHERE id = ?",
        (datetime.now().isoformat(), template_id)
    )
    conn.commit()
    conn.close()

def add_template_favorite(user_id, template_id):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO user_template_favorites (user_id, template_id, created_at) VALUES (?, ?, ?)",
            (user_id, template_id, datetime.now().isoformat())
        )
        conn.commit()
        conn.close()
        return True, None
    except sqlite3.IntegrityError:
        conn.close()
        return False, "已收藏"

def remove_template_favorite(user_id, template_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM user_template_favorites WHERE user_id = ? AND template_id = ?",
        (user_id, template_id)
    )
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0

def get_user_favorites(user_id):
    conn = get_db()
    cursor = conn.cursor()
    favorites = cursor.execute("""
        SELECT t.*, 1 as is_favorited
        FROM prompt_templates t
        INNER JOIN user_template_favorites f ON t.id = f.template_id
        WHERE f.user_id = ? AND t.is_active = 1
        ORDER BY f.created_at DESC
    """, (user_id,)).fetchall()
    conn.close()
    return [dict(f) for f in favorites]

def is_template_favorited(user_id, template_id):
    conn = get_db()
    cursor = conn.cursor()
    result = cursor.execute(
        "SELECT id FROM user_template_favorites WHERE user_id = ? AND template_id = ?",
        (user_id, template_id)
    ).fetchone()
    conn.close()
    return result is not None

def log_template_usage(user_id, template_id, task_id=None):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO template_usage_logs (user_id, template_id, task_id, created_at) VALUES (?, ?, ?, ?)",
        (user_id, template_id, task_id, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

def get_template_favorites_status(user_id, template_ids):
    conn = get_db()
    cursor = conn.cursor()
    placeholders = ','.join(['?'] * len(template_ids))
    result = cursor.execute(
        f"SELECT template_id FROM user_template_favorites WHERE user_id = ? AND template_id IN ({placeholders})",
        [user_id] + template_ids
    ).fetchall()
    conn.close()
    return [r['template_id'] for r in result]

def create_template(category, sub_category, name, description, prompt_template, example_image=None, original_image=None, tags=None, is_featured=False):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO prompt_templates (category, sub_category, name, description, prompt_template, example_image, original_image, tags, is_featured, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (category, sub_category, name, description, prompt_template, example_image, original_image, tags, 1 if is_featured else 0, datetime.now().isoformat(), datetime.now().isoformat()))
    template_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return template_id

def update_template(template_id, category=None, sub_category=None, name=None, description=None, prompt_template=None, example_image=None, original_image=None, tags=None, is_featured=None):
    conn = get_db()
    cursor = conn.cursor()

    updates = []
    params = []

    if category is not None:
        updates.append("category = ?")
        params.append(category)
    if sub_category is not None:
        updates.append("sub_category = ?")
        params.append(sub_category)
    if name is not None:
        updates.append("name = ?")
        params.append(name)
    if description is not None:
        updates.append("description = ?")
        params.append(description)
    if prompt_template is not None:
        updates.append("prompt_template = ?")
        params.append(prompt_template)
    if example_image is not None:
        updates.append("example_image = ?")
        params.append(example_image)
    if original_image is not None:
        updates.append("original_image = ?")
        params.append(original_image)
    if tags is not None:
        updates.append("tags = ?")
        params.append(tags)
    if is_featured is not None:
        updates.append("is_featured = ?")
        params.append(1 if is_featured else 0)

    if updates:
        updates.append("updated_at = ?")
        params.append(datetime.now().isoformat())
        params.append(template_id)

        cursor.execute(
            f"UPDATE prompt_templates SET {', '.join(updates)} WHERE id = ?",
            params
        )
        conn.commit()

    conn.close()
    return True

def delete_template(template_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE prompt_templates SET is_active = 0, updated_at = ? WHERE id = ?",
        (datetime.now().isoformat(), template_id)
    )
    conn.commit()
    conn.close()

def get_all_templates_admin():
    conn = get_db()
    cursor = conn.cursor()
    templates = cursor.execute("""
        SELECT * FROM prompt_templates
        ORDER BY category, sort_order, id
    """).fetchall()
    conn.close()
    return [dict(t) for t in templates]

def init_video_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS videos (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            prompt TEXT,
            duration INTEGER DEFAULT 5,
            model TEXT,
            status TEXT DEFAULT 'pending',
            task_id TEXT,
            thumbnail_url TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id)
    ''')

    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_videos_task_id ON videos(task_id)
    ''')

    conn.commit()
    conn.close()

def add_video(user_id, filename, prompt, duration, model, task_id=None):
    conn = get_db()
    cursor = conn.cursor()

    video_id = str(uuid.uuid4())

    cursor.execute(
        """INSERT INTO videos (id, user_id, filename, prompt, duration, model, status, task_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (video_id, user_id, filename, prompt, duration, model, 'pending', task_id, datetime.now().isoformat())
    )

    conn.commit()
    conn.close()

    return video_id

def update_video_status(video_id, status, thumbnail_url=None):
    conn = get_db()
    cursor = conn.cursor()

    if thumbnail_url:
        cursor.execute(
            "UPDATE videos SET status = ?, thumbnail_url = ? WHERE id = ?",
            (status, thumbnail_url, video_id)
        )
    else:
        cursor.execute(
            "UPDATE videos SET status = ? WHERE id = ?",
            (status, video_id)
        )

    conn.commit()
    conn.close()

def get_video_by_task_id(task_id):
    conn = get_db()
    cursor = conn.cursor()

    video = cursor.execute(
        """SELECT * FROM videos WHERE task_id = ?""",
        (task_id,)
    ).fetchone()

    conn.close()

    return dict(video) if video else None

def get_user_videos(user_id):
    conn = get_db()
    cursor = conn.cursor()

    videos = cursor.execute(
        """SELECT id, filename, prompt, duration, model, status, task_id, thumbnail_url, created_at
           FROM videos WHERE user_id = ? ORDER BY created_at DESC""",
        (user_id,)
    ).fetchall()

    conn.close()
    return [dict(v) for v in videos]

def delete_video(video_id, user_id):
    conn = get_db()
    cursor = conn.cursor()

    video = cursor.execute(
        "SELECT filename FROM videos WHERE id = ? AND user_id = ?",
        (video_id, user_id)
    ).fetchone()

    if video:
        filepath = os.path.join(os.path.dirname(__file__), 'data', user_id, 'videos', video['filename'])
        if os.path.exists(filepath):
            os.remove(filepath)

        cursor.execute("DELETE FROM videos WHERE id = ? AND user_id = ?", (video_id, user_id))
        conn.commit()
        conn.close()
        return True

    conn.close()
    return False

if __name__ == '__main__':
    init_db()
    print("Database initialized.")