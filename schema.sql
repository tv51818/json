-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,  -- 用户名（唯一）
    password TEXT NOT NULL,         -- 密码（明文存储，实际项目建议加密）
    token TEXT,                     -- 登录令牌
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 创建时间
);

-- 创建接口表
CREATE TABLE IF NOT EXISTS apis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,       -- 关联用户ID
    name TEXT NOT NULL,             -- 接口名称
    url TEXT NOT NULL,              -- 接口URL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE  -- 级联删除
);

-- 创建默认管理员账号（用户名：admin，密码：admin123）
INSERT OR IGNORE INTO users (username, password) 
VALUES ('admin', 'admin123');
    