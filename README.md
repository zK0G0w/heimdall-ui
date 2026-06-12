<h1 align="center">Heimdall UI</h1>

<p align="center">
  Heimdall 统一认证中心 · 前端
</p>

<p align="center">
  基于 Vue 3 + Arco Design + TypeScript + Vite 构建的企业级后台管理与 OAuth2 授权前端
</p>

---

## 简介

Heimdall UI 是 [Heimdall 统一认证中心](https://github.com/WainZeng/heimdall) 的前端项目，提供：

- 系统管理后台（用户、角色、部门、菜单、字典、配置等）
- OAuth2 应用管理与 Scope 管理
- OAuth2 授权确认页（支持授权码模式完整流程）
- 多租户管理、任务调度、系统监控等扩展功能

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3（Composition API + `<script setup>`） |
| UI 组件库 | Arco Design Vue |
| 构建工具 | Vite 5 |
| 语言 | TypeScript |
| 包管理 | pnpm |
| 状态管理 | Pinia + 持久化插件 |
| 路由 | Vue Router 4（动态路由） |
| HTTP | Axios（统一封装） |
| 代码规范 | ESLint（@antfu/eslint-config） |
| 图表 | ECharts + vue-echarts |
| 工具库 | VueUse、lodash-es、dayjs |

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 安装与启动

```bash
# 克隆项目
git clone https://github.com/WainZeng/heimdall-ui.git
cd heimdall-ui

# 安装依赖
pnpm bootstrap

# 启动开发服务器（默认 http://localhost:5173）
pnpm dev
```

### 其他命令

```bash
# 类型检查
pnpm typecheck

# 代码检查与修复
pnpm lint
pnpm lint:fix

# 构建生产环境
pnpm build

# 预览构建产物
pnpm preview
```

### 后端依赖

开发时需要后端服务运行在 `localhost:8000`，前端通过 Vite proxy 代理 API 请求。后端项目：[Heimdall](https://github.com/WainZeng/heimdall)

## 项目结构

```
src/
├── apis/              # API 请求封装（按业务模块）
├── assets/            # 静态资源
├── components/        # 全局通用组件
├── config/            # 应用配置
├── constant/          # 常量定义
├── directives/        # 自定义指令
├── hooks/             # 组合式函数
├── layout/            # 布局组件
├── router/            # 路由配置
├── stores/            # Pinia 状态管理
├── styles/            # 全局样式
├── types/             # 全局类型声明
├── utils/             # 工具函数
└── views/             # 页面组件
    ├── dashboard/     # 仪表盘
    ├── system/        # 系统管理
    ├── oauth2/        # OAuth2（应用管理、授权页、回调示例）
    ├── tenant/        # 多租户
    ├── open/          # 能力开放
    ├── schedule/      # 任务调度
    ├── monitor/       # 系统监控
    └── login/         # 登录
```

## 功能模块

### 系统管理

用户管理、角色管理、部门管理、菜单管理、字典管理、系统配置

### OAuth2

- **应用管理** — 注册第三方应用、管理密钥与回调地址
- **Scope 管理** — 定义和管理权限范围
- **授权确认页** — 独立全屏页面，支持亮色/暗色模式，展示应用信息和请求权限
- **回调示例页** — 演示授权码换 Token 完整流程

### 其他

多租户管理、能力开放（对外 API）、任务调度、系统监控


## 开源协议

[Apache License 2.0](./LICENSE)
