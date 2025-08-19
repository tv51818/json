# 简易接口管理系统（Cloudflare版）

一个完全部署在Cloudflare上的接口管理系统，无需任何传统服务器，3分钟即可完成部署。

## 功能特点
- 用户注册/登录
- 接口添加/删除/管理
- 自动生成聚合JSON地址
- 完全基于Cloudflare生态（Pages + D1）

## 部署步骤（仅3步）

### 1. 创建D1数据库
- 登录Cloudflare控制台 → 进入「Workers & Pages」
- 选择「D1」→ 点击「Create database」
- 数据库名称填写 `video_api_db` → 记录生成的数据库ID

### 2. 部署到Cloudflare Pages
- 将本项目代码上传到GitHub/GitLab仓库
- 控制台 → 「Pages」→ 「Create a project」→ 选择你的仓库
- 构建配置：
  - 框架预设：`None`
  - 构建命令：留空
  - 输出目录：留空
- 点击「Save and Deploy」

### 3. 绑定数据库并初始化
- 部署完成后，进入项目 → 「Settings」→ 「Functions」→ 「D1 database bindings」
- 点击「Add binding」：
  - 变量名：`DB`
  - 数据库：选择第一步创建的 `video_api_db`
- 进入D1数据库控制台 → 「Console」→ 粘贴 `schema.sql` 内容 → 执行

## 使用方法
- 访问部署后的域名（如 `https://your-project.pages.dev`）
- 默认管理员账号：`admin` / `admin123`
- 登录后可添加接口，系统会自动生成聚合JSON地址

## 注意事项
- 本系统为简化版，密码以明文存储（实际生产环境需添加加密）
- Cloudflare免费额度：D1（1GB）、Pages（每天10万次请求）足够个人使用
- 建议部署后立即修改管理员密码
    