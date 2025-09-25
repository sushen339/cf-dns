# Cloudflare DNS Manager

一个基于 Express + React + Tailwind CSS 构建的 Cloudflare DNS 解析记录管理面板。后端负责代理所有 Cloudflare API 请求，前端提供直观的 UI 来查看、创建、更新和删除解析记录。

## 项目结构

```
.
├── server/   # Express 代理服务
└── client/   # React 前端应用（Vite + Tailwind CSS）
```

## 使用前准备

1. 将 `.env.example` 复制为 `.env`，并在其中填入具有 **Zones:Read**、**DNS:Edit** 等权限的 Cloudflare API Token。

```bash
cp .env.example .env
# 编辑 .env 并填入 CLOUDFLARE_API_TOKEN
```

2. Node.js 版本建议 >= 18。

## 安装依赖与启动

### 后端（server）

```bash
cd server
npm install
npm run dev # 或 npm start
```

服务器默认监听在 `http://localhost:4000`，并会自动向 Cloudflare API 附加认证头。

### 前端（client）

```bash
cd client
npm install
npm run dev
```

Vite 默认会在 `http://localhost:5173` 启动开发服务器，同时通过代理将 `/api` 请求转发给后端。

## 环境变量

- `CLOUDFLARE_API_TOKEN`（必填）：用于调用 Cloudflare API 的 Token，仅保存在后端。
- `PORT`（可选）：后端监听端口，默认 `4000`。
- `CLIENT_ORIGIN`（可选）：允许访问 API 的前端地址，多个地址使用逗号分隔。

## 功能特性

- 加载当前账号下所有 Zone 并通过下拉框选择。
- 展示对应域名的 DNS 解析记录。
- 支持创建、修改和删除解析记录，所有操作均通过后端代理完成。
- Tailwind CSS 构建的现代化 UI，包含基础的加载与错误状态反馈。

## 生产部署提示

- 建议使用 `npm run build` 在前端构建静态资源，并配置到静态服务器。
- 在生产环境中，请通过安全方式（例如系统环境变量或秘密管理服务）注入 `CLOUDFLARE_API_TOKEN`。
- 可以将前端构建后的文件部署到 CDN 或静态站点，同时确保前端的 `/api` 请求指向已部署的后端服务。
