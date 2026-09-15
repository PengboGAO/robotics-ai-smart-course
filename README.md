# 机器人学基础 AI 智慧课程（部署版）

这是一个可直接部署的静态学习应用，面向机器人工程专业核心课《机器人学基础》。课程按“预期学习产出—工程任务—直接证据—评价标准—补证改进”组织，包含六模块学习路径、课程图谱、ABB IRB 1200工程验证、三级提示AI助教、学习证据档案和教师工作台。

## 本地运行

要求 Node.js 18 或更高版本。

```powershell
npm test
npm start
```

浏览器访问 `http://localhost:4173`。

## GitHub Pages部署

1. 在GitHub新建空仓库。
2. 将本目录内容推送到 `main` 分支。
3. 在仓库 `Settings → Pages → Build and deployment` 中选择 `GitHub Actions`。
4. 工作流 `.github/workflows/pages.yml` 会自动发布。

所有资源均使用相对路径，可部署在用户站点或项目子路径。无需安装前端依赖。

## 数据与AI说明

- 默认仅使用浏览器本机存储，不上传个人信息。
- 页面中的教师看板只统计当前浏览器产生的记录，不展示虚构班级数据。
- 内置“AI助教”是经教师审核的三级诊断提示库，可在无网络条件下使用。
- 若接入真实大模型，必须通过学校后端网关调用，不得把API密钥写入前端。在 `assets/runtime-config.js` 中填写网关地址即可切换；网关接收 `course`、`policy`、`type`、`level`、`question`，返回 `{ "answer": "..." }`。
- MATLAB复算结果用于课程模型验证，不代表特定实体机器人的绝对标定结果。
- 未提供RobotStudio站点、工具负载、工件坐标、碰撞集和控制器日志时，碰撞与控制器结论均为“待验证”。

## 目录

- `index.html`：课程应用入口
- `assets/`：课程数据、交互逻辑与样式
- `resources/textbook/`：原有8章数字教材迁移副本
- `resources/abb/`：ABB IRB 1200可复算代码与结果
- `docs/`：建设依据、申报对照、数据与AI边界
- `.github/workflows/pages.yml`：GitHub Pages自动部署
