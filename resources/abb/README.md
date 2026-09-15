# ABB IRB 1200-5/0.9 复算说明

运行 `ABB_IRB1200_5_90_trajectory_validation.m` 可复算以下证据：

- 10 个 ABB 产品规范腕心边界点；
- 标准 D-H 链与 ROS-Industrial 参考链在 5 组构型下的位姿一致性；
- 目标位姿的正解—数值逆解—再正解一致性；
- 六轴同步五次多项式轨迹；
- 六轴官方工作范围和三相供电条件下最大速度检查；
- 几何雅可比奇异值与 A5 腕部奇异反例筛查；
- 法兰中心正运动学轨迹；
- A2 超限反证与修正。

MATLAB R2024a 实跑命令：

```matlab
results = ABB_IRB1200_5_90_trajectory_validation(pwd)
```

参数来源：

- ABB 产品规范 `3HAC081417-001 Revision M`：https://library.e.abb.com/public/2a49a455c8cb40ccbd757b2dc9f33f4a/3HAC081417%20PS%20IRB%201200%20on%20OmniCore-en.pdf
- ROS-Industrial ABB IRB1200 支持包：https://github.com/ros-industrial/abb/tree/noetic-devel/abb_irb1200_support
- 模型版本：`45f4769d826cf3ac62a65495f2db67b78b0c81df`
- `irb1200_5_90_macro.xacro` SHA-256：`BC46FF9839958BEE372818832C7ABAFB77184AEED3E727815136E0A4538E22B6`

3 mm 是作者针对 ABB 表格中整数显示的角度与坐标设置的复算容差，不是 ABB 的精度或验收指标。几何雅可比最小奇异值仅用于轨迹筛查，也不是 ABB 控制器验收阈值。

ROS-Industrial 模型属于社区参考模型，不是 ABB OEM 标定模型。上述复算用于验证任务包，不代表具体机器人个体的绝对标定。现有材料未提供 RobotStudio 站点、`tooldata`、`loaddata`、`wobjdata`、碰撞集和虚拟控制器事件日志，因此碰撞与 RobotStudio 结果明确保留为待验证；实体执行前必须补齐这些检查。
