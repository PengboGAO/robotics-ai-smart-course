# GitHub Pages发布检查表

## 首次发布

1. 登录GitHub，新建公开仓库，建议仓库名 `robotics-ai-smart-course`。
2. 不要在GitHub页面初始化README、许可证或 `.gitignore`。
3. 在本地课程目录执行：

```powershell
git remote add origin https://github.com/你的账号/robotics-ai-smart-course.git
git push -u origin main
```

4. 打开仓库 `Settings → Pages`，在 `Build and deployment` 中选择 `GitHub Actions`。
5. 等待 `Deploy smart course to GitHub Pages` 工作流完成。
6. 访问 `https://你的账号.github.io/robotics-ai-smart-course/`。

## 上线验收

- 首页、学习路径、课程图谱、ABB验证实验、AI助教、学习证据、教师工作台均可访问。
- 移动端无横向滚动，导航可打开和关闭。
- 数字教材8章与ABB复算文件均可访问或下载。
- 浏览器控制台无错误，所有站内链接返回成功状态。
- 公开版本不包含API密钥、学生个人信息和未经授权的成绩数据。
- 若接入学校AI网关，完成跨域、身份认证、限流、日志脱敏与人工审核测试。

## 正式教学前

- 接入学校统一身份认证和课程平台。
- 将本机学习档案改为后端受控存储，并配置权限、保存期限和删除机制。
- 上传经过脱敏的真实课程运行证据，不使用演示数据替代教学成效。
- 补齐RobotStudio站点、工具负载、工件坐标、碰撞集和控制器日志。
