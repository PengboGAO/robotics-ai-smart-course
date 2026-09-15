window.COURSE_DATA = {
  outcomes: [
    { id: "CO1", title: "建立可核验的机器人模型", desc: "统一坐标系、参数约定和单位，完成位姿变换、D-H建模与正逆运动学复算。", evidence: "坐标系图 + 参数表 + 正逆解一致性记录", standard: "误差口径明确，模型可复现" },
    { id: "CO2", title: "设计满足约束的运动轨迹", desc: "比较关节空间与笛卡尔空间规划，检查连续性、限位、速度和奇异风险。", evidence: "轨迹代码 + 曲线 + 约束检查表", standard: "边界条件与约束逐项通过" },
    { id: "CO3", title: "诊断并解释异常结果", desc: "用错误参数、超限构型和奇异轨迹构造反例，定位差异来源并提出修正。", evidence: "错误复现 + 修正前后对照 + 原因说明", standard: "结论由反证支撑，不回避失败" },
    { id: "CO4", title: "独立完成工程迁移", desc: "在限制AI提示的条件下，把方法迁移到新构型、新任务或另一类机器人系统。", evidence: "无AI迁移任务 + AI使用声明 + 复算文件", standard: "过程独立、来源透明、安全合规" }
  ],
  modules: [
    { id: "M1", number: "01", title: "机器人系统与工程责任", hours: "4学时", level: "理解 / 分析", color: "cyan", prereq: "无", problem: "如何从任务、负载、工作空间和安全要求判断机器人方案是否适用？", task: "读取产品规范，为搬运场景建立选型依据与风险清单。", evidence: ["产品参数出处", "选型约束表", "风险与待验证项"], rubric: "参数可追溯；不混用不同型号；风险说明具体。", ai: "允许检索术语与定位参数，不允许代写选型结论。", resource: "./resources/textbook/ch01.html", nodes: ["系统组成", "性能指标", "工程安全"] },
    { id: "M2", number: "02", title: "空间位姿与数学工具", hours: "8学时", level: "应用 / 分析", color: "blue", prereq: "M1", problem: "为什么同一位姿在不同坐标系中会得到不同数值表达？", task: "完成基坐标、工件坐标和工具坐标之间的齐次变换复算。", evidence: ["坐标系定义图", "变换矩阵", "单位与旋转约定检查"], rubric: "矩阵维度、方向、单位一致；逆变换可复算。", ai: "只提示检查顺序；关键矩阵由学生计算。", resource: "./resources/textbook/ch02.html", nodes: ["旋转矩阵", "齐次变换", "四元数"] },
    { id: "M3", number: "03", title: "运动学建模与一致性验证", hours: "12学时", level: "分析 / 评价", color: "violet", prereq: "M2", problem: "程序能运行，怎样证明D-H模型与机器人关节链描述的是同一个机构？", task: "以ABB IRB 1200-5/0.9为对象，完成D-H链、参考关节链、正逆解和工作空间点复算。", evidence: ["D-H参数与坐标系", "两条链位姿差", "正解—逆解—再正解"], rubric: "约定明确；多构型一致；误差阈值有来源与适用范围。", ai: "三级提示；不提供整套D-H表，不生成完整代码。", resource: "./resources/textbook/ch03.html", nodes: ["D-H建模", "正运动学", "逆运动学", "雅可比"] },
    { id: "M4", number: "04", title: "动力学与轨迹规划", hours: "10学时", level: "分析 / 创造", color: "orange", prereq: "M3", problem: "轨迹看起来平滑，是否就满足关节限位、速度和动力学边界？", task: "设计六轴同步五次轨迹，完成端点条件、限位、速度和奇异性预检。", evidence: ["插值公式与代码", "六轴曲线", "约束检查", "奇异反例"], rubric: "公式—代码一致；全部约束有数值；反例能复现。", ai: "可指出哪类约束未检查；不得替学生得出安全结论。", resource: "./resources/textbook/ch06.html", nodes: ["动力学", "五次插值", "速度约束", "奇异筛查"] },
    { id: "M5", number: "05", title: "控制、感知与虚实校核", hours: "10学时", level: "应用 / 评价", color: "green", prereq: "M3,M4", problem: "仿真结果如何与控制器、传感器和实体安全条件相互校核？", task: "完成单关节控制实验，分析采样、误差、噪声和执行约束。", evidence: ["控制指标", "响应曲线", "误差分析", "安全放行清单"], rubric: "指标定义清楚；仿真与实物边界不混淆；异常可解释。", ai: "辅助阅读曲线和定位异常，参数整定与结论由学生完成。", resource: "./resources/textbook/ch07.html", nodes: ["PID控制", "传感器", "虚实差异"] },
    { id: "M6", number: "06", title: "综合项目与独立迁移", hours: "4+16学时", level: "评价 / 创造", color: "red", prereq: "M1-M5", problem: "离开逐步提示后，能否独立完成新任务并为结果负责？", task: "在无AI阶段完成新工位轨迹设计，提交模型、代码、仿真、反证和工程说明。", evidence: ["项目提交包", "版本记录", "无AI迁移任务", "AI使用声明"], rubric: "证据完整；结果可复算；引用真实；安全边界明确。", ai: "前期提示，终评阶段关闭AI，只保留过程日志。", resource: "./resources/textbook/ch08.html", nodes: ["工程项目", "版本管理", "独立迁移"] }
  ],
  diagnostics: [
    { id: "d1", label: "坐标变换经常混淆", result: "建议从 M2 开始，先完成坐标系方向与逆变换检查。", module: "M2" },
    { id: "d2", label: "会写代码但模型对不上", result: "建议从 M3 开始，用多构型比较D-H链与参考关节链。", module: "M3" },
    { id: "d3", label: "轨迹能跑但不会验约束", result: "建议从 M4 开始，先检查端点、限位、峰值速度和奇异风险。", module: "M4" },
    { id: "d4", label: "基础较稳，想做综合项目", result: "建议先完成 M3、M4的证据核验，再进入M6无AI迁移任务。", module: "M6" }
  ],
  compliance: [
    { item: "学生中心与产出导向", implementation: "4项学习产出对应任务、直接证据、量规和补证建议。", status: "已实现" },
    { item: "知识、任务、能力图谱", implementation: "六模块先修关系与任务证据联动展示。", status: "已实现" },
    { item: "常态化智慧教学场景", implementation: "入口诊断、三级提示、ABB虚拟预检、证据档案。", status: "已实现" },
    { item: "多类型数字资源", implementation: "迁移8章数字教材、交互动画与可复算工程代码。", status: "已实现" },
    { item: "数据驱动评价与改进", implementation: "本机档案可导出；真实班级数据须接入校级平台。", status: "待平台接入" },
    { item: "安全、伦理与学术诚信", implementation: "最小数据、AI使用留痕、待验证标识、人工安全复核。", status: "已实现" },
    { item: "持续更新与共享", implementation: "静态部署、版本管理、Pages自动发布；内容更新机制见文档。", status: "已实现" }
  ],
  abb: {
    model: "ABB IRB 1200-5/0.9",
    jointLimits: [[-170,170],[-100,130],[-200,70],[-270,270],[-130,130],[-400,400]],
    maxSpeed: [288,240,297,400,405,600],
    start: [0,-30,20,0,30,0],
    goals: { valid:[60,40,-70,100,45,180], singular:[60,40,-70,100,0,180], overlimit:[60,140,-70,100,45,180] },
    origins: [[0,0,0.3991],[0,0,0],[0,0,0.448],[0,0,0.042],[0.451,0,0],[0.082,0,0]],
    axes: [[0,0,1],[0,1,0],[0,1,0],[1,0,0],[0,1,0],[1,0,0]],
    source: "ABB产品规范3HAC081417-001 Revision M；ROS-Industrial abb_irb1200_support参考链"
  }
};
