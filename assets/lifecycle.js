(() => {
  "use strict";
  const storageKey = "robotics-smart-course-v1";
  const course = window.COURSE_DATA;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const outcomeNames = { CO1:"模型与运动学", CO2:"轨迹与约束", CO3:"诊断与解释", CO4:"独立迁移" };
  const modeNames = { diagnostic:"入口诊断", module:"模块测评", transfer:"无AI迁移" };
  const moduleAdvice = {
    M1:"复核机器人型号、负载、工作空间与安全条件，所有参数注明产品规范出处。",
    M2:"先画坐标系，再核对旋转方向、矩阵乘法顺序、单位和逆变换。",
    M3:"用零位和至少两组非零构型逐级比较两条关节链，并同时检查位置与姿态误差。",
    M4:"按端点条件、关节限位、峰值速度、奇异风险顺序复算，不用动画观感代替约束检查。",
    M5:"区分模型、控制器和实体系统边界，补充采样、噪声、工具负载与安全放行条件。",
    M6:"关闭生成式提示，用新构型独立完成模型、代码、仿真、反证和AI使用声明。"
  };
  const questions = [
    {id:"D01",phase:"diagnostic",module:"M2",outcome:"CO1",text:"旋转矩阵R作为有效姿态表示时，必须满足哪项基本性质？",options:["RᵀR=I且det(R)=1","RᵀR=0","det(R)=0","所有元素均为正"],correct:0,explain:"正交性和右手性是检查旋转矩阵有效性的基本条件。"},
    {id:"D02",phase:"diagnostic",module:"M2",outcome:"CO1",text:"标准齐次变换矩阵的最后一行应为：",options:["[1 0 0 0]","[0 0 0 1]","[0 0 1 0]","由平移量决定"],correct:1,explain:"齐次变换的最后一行固定为[0 0 0 1]。"},
    {id:"D03",phase:"diagnostic",module:"M3",outcome:"CO1",text:"建立标准D-H坐标系时，关节i的转轴通常与哪个轴重合？",options:["xᵢ","yᵢ","zᵢ₋₁","任意坐标轴"],correct:2,explain:"标准D-H中关节变量绕或沿zᵢ₋₁定义，必须先统一约定。"},
    {id:"D04",phase:"diagnostic",module:"M3",outcome:"CO3",text:"同一目标位姿可能对应多组关节角，这主要体现逆运动学的什么特性？",options:["唯一性","多解性","线性性","单位无关性"],correct:1,explain:"工业机器人逆运动学通常具有多解，需要结合限位、连续性和任务选择。"},
    {id:"D05",phase:"diagnostic",module:"M4",outcome:"CO2",text:"五次时间标度常用于轨迹规划，核心原因是它可以同时约束：",options:["仅起点位置","端点位置、速度和加速度","仅最大速度","仅路径长度"],correct:1,explain:"五次多项式可同时满足两端的位置、速度和加速度边界条件。"},
    {id:"D06",phase:"diagnostic",module:"M4",outcome:"CO3",text:"六轴球腕机器人中，A5接近0°时首先应关注：",options:["腕部奇异风险","基座质量","网络延迟","颜色设置"],correct:0,explain:"A5接近0°可能导致腕部轴线趋于共线，应结合雅可比量进一步筛查。"},
    {id:"D07",phase:"diagnostic",module:"M4",outcome:"CO2",text:"相同起止关节角采用五次时间标度时，缩短运行时间T通常会使峰值速度：",options:["降低","不变","升高","恒为零"],correct:2,explain:"峰值速度与1/T成正比，缩短时间会提高速度需求。"},
    {id:"D08",phase:"diagnostic",module:"M6",outcome:"CO4",text:"AI给出的机器人安全结论，正确处理方式是：",options:["直接用于实体运行","由代码、软件和人工安全流程复核","只要语言通顺即可采用","删除AI使用记录"],correct:1,explain:"AI不能承担工程安全放行责任，结论必须复算并人工审核。"},

    {id:"M101",phase:"module",module:"M1",outcome:"CO3",text:"比较IRB 1200-5/0.9与7/0.7时，最不应采取的做法是：",options:["分别引用型号参数","结合负载与到达距离选型","混用两个型号的最大指标","记录供电与防护条件"],correct:2,explain:"不同型号参数不可混用，否则选型结论不可追溯。"},
    {id:"M102",phase:"module",module:"M1",outcome:"CO4",text:"课程模型通过速度检查后，实体执行前仍必须：",options:["直接全速运行","检查工具负载、工件坐标、碰撞集和控制器配置","删除仿真记录","只检查动画"],correct:1,explain:"课程模型预检不能代替RobotStudio完整站点和现场安全流程。"},
    {id:"M103",phase:"module",module:"M1",outcome:"CO3",text:"参数表中的容差若由作者为复算设置，应怎样表述？",options:["写成ABB精度指标","说明来源、用途和适用范围","不必说明","改成更小数值"],correct:1,explain:"自定容差必须与厂商指标区分，防止证据越界。"},
    {id:"M201",phase:"module",module:"M2",outcome:"CO1",text:"若T_AB表示B坐标系相对A坐标系的位姿，则把B中点坐标变换到A通常使用：",options:["p_A=T_AB p_B","p_B=T_AB p_A","p_A=T_ABᵀp_B","只加平移"],correct:0,explain:"齐次坐标下，左乘T_AB可把B系表达转换到A系。"},
    {id:"M202",phase:"module",module:"M2",outcome:"CO1",text:"两个旋转矩阵相乘时，乘法顺序不同通常意味着：",options:["结果必然相同","旋转参考系或执行顺序不同","单位自动转换","矩阵失去维度"],correct:1,explain:"三维旋转一般不可交换，顺序对应不同物理过程。"},
    {id:"M203",phase:"module",module:"M2",outcome:"CO3",text:"发现毫米与米混用时，最佳修正方式是：",options:["只改最终结果","在输入层统一单位并增加断言","忽略小数点","调整绘图比例掩盖差异"],correct:1,explain:"单位应在数据入口统一，并用测试阻止错误继续传播。"},
    {id:"M301",phase:"module",module:"M3",outcome:"CO1",text:"验证D-H链与参考关节链一致性，最有说服力的做法是：",options:["只看零位图片","比较多构型下位置和姿态误差","只比较连杆数量","只看代码能否运行"],correct:1,explain:"多构型、位置与姿态联合比较才能降低偶然一致。"},
    {id:"M302",phase:"module",module:"M3",outcome:"CO3",text:"正解—逆解—再正解检查主要证明：",options:["逆解所得关节角能重构目标位姿","机器人没有碰撞","控制器供电正确","实体绝对精度合格"],correct:0,explain:"该检查验证运动学内部一致性，不证明碰撞或实体标定精度。"},
    {id:"M303",phase:"module",module:"M3",outcome:"CO3",text:"两套模型位置一致但姿态不一致，下一步应优先检查：",options:["颜色主题","关节轴方向、角度偏置和法兰固定旋转","网页字体","文件名称"],correct:1,explain:"姿态差通常来自轴向、偏置、乘法顺序或末端固定变换。"},
    {id:"M401",phase:"module",module:"M4",outcome:"CO2",text:"五次时间标度s(τ)=10τ³−15τ⁴+6τ⁵的端点速度和加速度：",options:["均为零","均为一","速度为零、加速度不确定","由关节限位决定"],correct:0,explain:"该时间标度在τ=0和1处的一、二阶导数均为零。"},
    {id:"M402",phase:"module",module:"M4",outcome:"CO2",text:"轨迹速度通过检查，是否可以直接得出“无碰撞”？",options:["可以","不可以，碰撞需要几何模型、环境和碰撞集检查","只要A5不为零就可以","只要时间足够长就可以"],correct:1,explain:"速度约束与碰撞约束相互独立，必须分别提供证据。"},
    {id:"M403",phase:"module",module:"M4",outcome:"CO3",text:"构造奇异反例时，最合理的原则是：",options:["同时修改全部参数","只改变一个关键条件并保留输入输出","删除原轨迹","只描述不复现"],correct:1,explain:"单变量反证更容易定位因果并支持修正结论。"},
    {id:"M501",phase:"module",module:"M5",outcome:"CO2",text:"PID响应出现明显超调，评价时至少应同时报告：",options:["颜色和线宽","超调量、调节时间、稳态误差及采样条件","文件大小","机器人品牌"],correct:1,explain:"控制效果必须由可计算指标和实验条件共同描述。"},
    {id:"M502",phase:"module",module:"M5",outcome:"CO3",text:"仿真与实体响应不一致，首先不应忽略：",options:["摩擦、负载、采样和执行器约束","网页标题","幻灯片页数","课程名称"],correct:0,explain:"模型未包含的非理想因素常是虚实差异的重要来源。"},
    {id:"M503",phase:"module",module:"M5",outcome:"CO4",text:"实体机器人首次运行新轨迹，推荐的策略是：",options:["全速自动运行","低速、单步、隔离工作区并确认急停","关闭限位","跳过教师审核"],correct:1,explain:"工程安全要求先低风险验证，再逐步放开运行条件。"},
    {id:"M601",phase:"module",module:"M6",outcome:"CO4",text:"无AI迁移任务的核心评价目的在于：",options:["减少页面访问量","证明学生能脱离即时提示独立迁移方法","禁止使用任何数字工具","提高代码行数"],correct:1,explain:"AI逐步退出用于区分工具辅助与真实能力达成。"},
    {id:"M602",phase:"module",module:"M6",outcome:"CO4",text:"学生使用AI后，最完整的声明应包含：",options:["只写工具名称","工具、时间、提示级别、采纳内容和人工复核方式","只附截图","不必声明"],correct:1,explain:"完整留痕有助于学术诚信判断和过程评价。"},
    {id:"M603",phase:"module",module:"M6",outcome:"CO3",text:"综合项目结论中存在未完成的RobotStudio碰撞检查，应写为：",options:["已安全通过","待验证，并说明缺少的站点与日志","默认无碰撞","删除相关内容"],correct:1,explain:"实事求是标识证据边界是工程责任的重要部分。"},

    {id:"T01",phase:"transfer",module:"M2",outcome:"CO1",text:"新任务中工具坐标系绕z轴旋转90°并平移，正确做法是：",options:["先声明变换方向与参考系，再建立齐次矩阵复算","直接交换x、y数值","只修改平移列","让AI给最终矩阵且不复核"],correct:0,explain:"迁移任务仍需先声明坐标系和变换方向。"},
    {id:"T02",phase:"transfer",module:"M3",outcome:"CO1",text:"把验证方法迁移到另一台六轴机器人时，首先应替换并核验：",options:["网页配色","关节链几何、轴向、零位偏置和限位","课程名称","评价权重"],correct:1,explain:"模型迁移必须从机构参数和约定开始。"},
    {id:"T03",phase:"transfer",module:"M4",outcome:"CO2",text:"目标角不变，运行时间由3 s缩短到1.5 s，峰值速度理论上约变为：",options:["原来的1/2","原来的2倍","不变","零"],correct:1,explain:"五次时间标度的峰值速度与1/T成正比。"},
    {id:"T04",phase:"transfer",module:"M4",outcome:"CO3",text:"新轨迹穿越A5=0°附近，合理结论是：",options:["必然安全","触发腕部奇异筛查，需要结合雅可比和控制器进一步验证","自动消除碰撞","只需增加颜色提示"],correct:1,explain:"A5条件是筛查信号，不是最终控制器判据。"},
    {id:"T05",phase:"transfer",module:"M5",outcome:"CO3",text:"控制仿真达标但实体超调增大，最合理的解释路径是：",options:["比较模型参数、负载、摩擦、采样与饱和约束","直接宣布仿真错误","只降低绘图比例","删除实体数据"],correct:0,explain:"应从模型假设与实体非理想因素逐项对照。"},
    {id:"T06",phase:"transfer",module:"M6",outcome:"CO4",text:"面对AI建议与复算结果冲突，学生应：",options:["以AI为准","保留冲突记录，以可复算证据为准并说明原因","删除复算","任选一个结论"],correct:1,explain:"证据优先和过程留痕体现学术诚信与结果责任。"}
  ];
  questions.push(...(window.COURSE_QUESTION_BANK || []));

  function readState() {
    let state = {};
    try { state = JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch {}
    return { completed:[], evidence:[], aiLogs:[], attempts:[], mastery:{}, aiLocked:false, profile:{alias:"",goal:"系统掌握"}, ...state };
  }
  function writeState(patch) {
    const next = { ...readState(), ...patch };
    localStorage.setItem(storageKey, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("smartcourse:statechange"));
    return next;
  }
  function escapeHtml(value) { const node=document.createElement("div"); node.textContent=String(value); return node.innerHTML; }
  function average(values) { return values.length ? values.reduce((sum,value)=>sum+value,0)/values.length : 0; }
  function attemptScores(attempts) {
    const result = {};
    Object.keys(outcomeNames).forEach(outcome => {
      const values = attempts.flatMap(attempt => Object.prototype.hasOwnProperty.call(attempt.outcomes || {},outcome) ? [attempt.outcomes[outcome]] : []);
      result[outcome] = Math.round(average(values));
    });
    return result;
  }
  function evidenceCoverage(evidence) {
    const types = new Set(evidence.flatMap(item => item.types || []));
    return Math.round(types.size / 4 * 100);
  }
  function masteryComponents(state) {
    const moduleScores=course.modules.map(module=>[...state.attempts].reverse().find(item=>item.mode==="module"&&item.module===module.id)?.score).filter(Number.isFinite);
    const evidenceScores=state.evidence.map(item=>item.rubricScore).filter(Number.isFinite);
    const transferScores=state.attempts.filter(item=>item.mode==="transfer").map(item=>item.score);
    return {knowledge:Math.round(average(moduleScores)),evidence:Math.round(average(evidenceScores)),transfer:Math.round(average(transferScores)),hasKnowledge:moduleScores.length>0,hasEvidence:evidenceScores.length>0,hasTransfer:transferScores.length>0};
  }
  function masteryLevel(components) {
    if(!components.hasKnowledge&&!components.hasEvidence&&!components.hasTransfer)return "证据不足：先完成入口诊断与首个模块测评";
    const index=Math.round(components.knowledge*.4+components.evidence*.4+components.transfer*.2);
    if(!components.hasTransfer)return `形成性掌握 ${index}：尚缺无AI迁移证据`;
    if(index>=90)return `熟练掌握 ${index}：可进入综合迁移与教师抽检`;
    if(index>=80)return `达到预期 ${index}：补齐薄弱证据后进入综合任务`;
    if(index>=60)return `基础理解 ${index}：按薄弱知识点补学并重新提交证据`;
    return `需要补学 ${index}：先修正概念理解，再进入工程任务`;
  }
  function lifecycleStatus(state) {
    const hasDiagnostic = state.attempts.some(item=>item.mode==="diagnostic");
    const moduleAttempts = state.attempts.filter(item=>item.mode==="module");
    const hasTransfer = state.attempts.some(item=>item.mode==="transfer");
    const needsRemediation = state.attempts.some(item=>item.score<80)||state.evidence.some(item=>Number.isFinite(item.rubricScore)&&item.rubricScore<80);
    return [
      {key:"profile",label:"建档",detail:"匿名目标",done:!!state.profile.alias},
      {key:"diagnostic",label:"诊断",detail:"起点画像",done:hasDiagnostic},
      {key:"learning",label:"学习",detail:"任务推进",done:state.completed.length===course.modules.length,active:state.completed.length>0&&state.completed.length<course.modules.length},
      {key:"practice",label:"练习",detail:"模块测评",done:Object.keys(state.mastery).length===course.modules.length,active:moduleAttempts.length>0},
      {key:"evidence",label:"评价",detail:"四类证据",done:evidenceCoverage(state.evidence)===100,active:state.evidence.length>0},
      {key:"remediation",label:"补证",detail:"针对缺口",done:!needsRemediation&&moduleAttempts.length>0,active:needsRemediation},
      {key:"transfer",label:"迁移",detail:"无AI检验",done:hasTransfer}
    ];
  }
  function progressIndex(state) {
    const components=masteryComponents(state);
    return Math.round(components.knowledge*.4+components.evidence*.4+components.transfer*.2);
  }
  function nextAction(state) {
    if(!state.profile.alias)return ["先建立匿名学习档案","填写学习代号与目标，系统才能生成连续学习记录。"];
    if(!state.attempts.some(item=>item.mode==="diagnostic"))return ["完成8题入口诊断","诊断不计成绩，只用于定位先修知识缺口。"];
    const lowAttempt=[...state.attempts].reverse().find(item=>item.score<80);
    if(lowAttempt){const module=lowAttempt.weakModules?.[0]||"M2";return [`补学 ${module} 后重新测评`,moduleAdvice[module]];}
    const incomplete=course.modules.find(module=>!state.completed.includes(module.id));
    if(incomplete)return [`推进 ${incomplete.id} ${incomplete.title}`,`完成任务后登记直接证据：${incomplete.evidence.join("、")}。`];
    if(evidenceCoverage(state.evidence)<100)return ["补齐四类学习证据","至少覆盖模型、代码、仿真和反证，并说明数据口径。"];
    if(!state.attempts.some(item=>item.mode==="transfer"))return ["进入无AI迁移测评","关闭即时提示，检验能否把方法迁移到新任务。"];
    return ["完成学习反思与教师复核","导出完整档案，由教师抽检证据并确认正式达成度。"];
  }
  function renderLearnerDashboard() {
    const state=readState();
    if($("#learner-alias"))$("#learner-alias").value=state.profile.alias||"";
    if($("#learner-goal"))$("#learner-goal").value=state.profile.goal||"系统掌握";
    const index=progressIndex(state); if($("#learning-index-value"))$("#learning-index-value").textContent=index;
    if($("#learning-index-ring"))$("#learning-index-ring").style.setProperty("--progress",`${index*3.6}deg`);
    const components=masteryComponents(state);if($("#mastery-components"))$("#mastery-components").innerHTML=`<span>知识理解 40% · ${components.hasKnowledge?components.knowledge:"待测"}</span><span>任务证据 40% · ${components.hasEvidence?components.evidence:"待提交"}</span><span>无AI迁移 20% · ${components.hasTransfer?components.transfer:"待测"}</span>`;
    const [title,detail]=nextAction(state); if($("#next-action-title"))$("#next-action-title").textContent=title;if($("#next-action-detail"))$("#next-action-detail").textContent=detail;
    if($("#lifecycle-track"))$("#lifecycle-track").innerHTML=lifecycleStatus(state).map((stage,index)=>`<article class="lifecycle-stage ${stage.done?"done":""} ${stage.active?"active":""}"><span>0${index+1}</span><b>${stage.label}</b><small>${stage.done?"已形成记录":stage.detail}</small></article>`).join("");
  }

  function renderAssessmentControls() {
    if(!$("#assessment-module"))return;
    $("#assessment-module").innerHTML=course.modules.map(module=>`<option value="${module.id}">${module.id} ${module.title}</option>`).join("");
    syncAssessmentMode(); renderAssessmentHistory();
  }
  function syncAssessmentMode(mode=$("#assessment-mode")?.value||"diagnostic") {
    if(!$("#assessment-mode"))return;
    $("#assessment-mode").value=mode;
    $$('[data-assessment-mode]').forEach(button=>button.classList.toggle("active",button.dataset.assessmentMode===mode));
    $("#assessment-module-wrap").hidden=mode!=="module";
    const rules={diagnostic:"不计入正式成绩；提交后显示知识缺口和建议起点。",module:"每模块8个检查点，判断知识理解与接受程度；达到80分后进入直接证据任务，答题分不能单独证明课程目标达成。",transfer:"答题过程中关闭AI提示；提交后统一反馈，用于检验离开AI后能否把方法迁移到新情境。"};
    $("#assessment-rules").textContent=rules[mode];
  }
  function selectedQuestions() {
    const mode=$("#assessment-mode").value;
    if(mode==="module")return questions.filter(item=>item.phase==="module"&&item.module===$("#assessment-module").value);
    return questions.filter(item=>item.phase===mode);
  }
  function startAssessment() {
    const list=selectedQuestions(),mode=$("#assessment-mode").value;
    writeState({aiLocked:mode==="transfer"});
    $("#assessment-empty").hidden=true;$("#assessment-result").hidden=true;$("#assessment-form").hidden=false;
    $("#assessment-form").innerHTML=`<div class="assessment-intro"><span class="eyebrow">${modeNames[mode]}</span><h2>${list.length}道题 · ${mode==="transfer"?"答题阶段不提供AI提示":"提交后生成AI学习处方"}</h2></div>${list.map((question,index)=>`<section class="assessment-question"><h3><span>${String(index+1).padStart(2,"0")}</span>${question.text}</h3><div class="option-list">${question.options.map((option,optionIndex)=>`<label><input type="radio" name="${question.id}" value="${optionIndex}"><span>${option}</span></label>`).join("")}</div></section>`).join("")}<div class="assessment-submit"><small>请完成全部题目后提交。</small><button class="primary-btn" type="submit">提交并生成学习处方</button></div>`;
    $("#assessment-form").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function buildLocalGuidance(weakModules,score) {
    if(score===100)return "本次测评全部正确。下一步不要继续刷同类题，请进入对应工程任务，用模型、代码、仿真和反证证明结论，并在无AI条件下完成一次变式迁移。";
    const advice=weakModules.map(module=>`${module}：${moduleAdvice[module]}`).join(" ");
    return `本次主要缺口集中在${weakModules.join("、")}。${advice} 补学后重新测评，并把修正前后的证据一并保存。`;
  }
  async function enhanceGuidance(attempt,localGuidance) {
    if(attempt.mode==="transfer")return {text:localGuidance,source:"规则反馈（作答阶段无AI）"};
    const endpoint=window.COURSE_RUNTIME?.aiEndpoint?.trim(); if(!endpoint)return {text:localGuidance,source:"本地诊断引擎"};
    try{
      const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({course:"机器人学基础",policy:"依据测评错题生成补学路径，只给检查方法，不代做模型、代码或结论。",type:"assessment",level:2,question:JSON.stringify({mode:attempt.mode,score:attempt.score,weakModules:attempt.weakModules,localGuidance})})});
      const payload=await response.json(); if(!response.ok||typeof payload.answer!=="string")throw new Error(); return {text:payload.answer.trim(),source:"学校AI网关"};
    }catch{return {text:localGuidance,source:"本地诊断引擎（AI网关不可用）"};}
  }
  async function submitAssessment(event) {
    event.preventDefault(); const list=selectedQuestions(); const unanswered=list.filter(question=>!$(`input[name="${question.id}"]:checked`,event.target));
    if(unanswered.length){window.alert(`还有${unanswered.length}题未作答。`);return;}
    const responses=list.map(question=>{const selected=Number($(`input[name="${question.id}"]:checked`,event.target).value);return {id:question.id,module:question.module,outcome:question.outcome,selected,correct:selected===question.correct};});
    const score=Math.round(responses.filter(item=>item.correct).length/responses.length*100);
    const weakModules=[...new Set(responses.filter(item=>!item.correct).map(item=>item.module))];
    const outcomes={}; Object.keys(outcomeNames).forEach(outcome=>{const subset=responses.filter(item=>item.outcome===outcome);if(subset.length)outcomes[outcome]=Math.round(subset.filter(item=>item.correct).length/subset.length*100);});
    const mode=$("#assessment-mode").value; const attempt={id:`A-${Date.now()}`,time:new Date().toISOString(),mode,module:mode==="module"?$("#assessment-module").value:null,score,weakModules,outcomes,responses};
    const state=readState(),attempts=[...state.attempts,attempt],mastery={...state.mastery};if(mode==="module"&&score>=80)mastery[attempt.module]=score;writeState({attempts,mastery,aiLocked:false});
    const guidance=await enhanceGuidance(attempt,buildLocalGuidance(weakModules,score)); attempt.guidance=guidance; writeState({attempts:[...attempts.slice(0,-1),attempt],mastery}); renderAssessmentResult(attempt,list);renderAssessmentHistory();renderLearnerDashboard();renderTeacherLifecycle();
  }
  function renderAssessmentResult(attempt,list) {
    $("#assessment-form").hidden=true;const wrong=attempt.responses.filter(item=>!item.correct).map(response=>{const question=list.find(item=>item.id===response.id);return `<div class="wrong-item"><b>${question.id} · ${question.text}</b><p>检查提示：${question.explain}</p></div>`;}).join("");
    const passed=attempt.score>=80;const guidanceTitle=attempt.mode==="transfer"?"迁移任务统一反馈":"AI学习处方",scoreLabel=attempt.mode==="module"?"知识理解度":attempt.mode==="transfer"?"独立迁移度":"起点诊断分";$("#assessment-result").hidden=false;$("#assessment-result").innerHTML=`<div class="result-hero"><div class="result-score">${attempt.score}<small>${scoreLabel}</small></div><div><h2>${passed?"达到本次检查要求":"需要补学与补证"}</h2><p>${modeNames[attempt.mode]}结果只反映本次答题表现。课程目标达成还需结合工程任务和可抽检的直接证据。</p></div></div><div class="guidance-card"><header><b>${guidanceTitle}</b><small>${attempt.guidance.source}</small></header><p>${escapeHtml(attempt.guidance.text)}</p></div><div class="result-breakdown">${Object.entries(attempt.outcomes).map(([outcome,value])=>`<div><span>${outcomeNames[outcome]}</span><b>${value}</b></div>`).join("")}</div>${wrong?`<h3>错题与补学检查点</h3><div class="wrong-review">${wrong}</div>`:'<div class="empty-state">没有错题。请转入工程任务，用直接证据检验是否真正掌握。</div>'}<div class="assessment-submit"><small>系统已保留本次过程记录。</small><button class="secondary-btn" type="button" data-retry-assessment>重新测评</button></div>`;
    $("[data-retry-assessment]").addEventListener("click",startAssessment);
  }
  function renderAssessmentHistory() {
    if(!$("#assessment-history-list"))return;const attempts=[...readState().attempts].reverse().slice(0,6);$("#assessment-history-list").innerHTML=attempts.length?attempts.map(item=>`<div class="attempt-row"><span>${modeNames[item.mode]}${item.module?` · ${item.module}`:""}</span><b>${item.score}</b></div>`).join(""):'<div class="empty-state">暂无测评记录</div>';
  }

  async function loadKnowledgeCatalog() {
    if(!$("#knowledge-catalog"))return;
    try{const [graphResponse,extensionResponse]=await Promise.all([fetch("./assets/knowledge-graph.json"),fetch("./assets/knowledge-extensions.json")]);const graph=await graphResponse.json(),extensions=await extensionResponse.json();window.SMARTCOURSE_KNOWLEDGE=[...(graph.modules||[]),...(extensions.modules||[])];const chapters=[...new Map(window.SMARTCOURSE_KNOWLEDGE.map(item=>[item.chapter,item.chapterTitle])).entries()];$("#knowledge-chapter").innerHTML='<option value="all">全部章节</option>'+chapters.map(([number,title])=>`<option value="${number}">第${number}章 ${title}</option>`).join("");renderKnowledgeCatalog();}
    catch{$("#knowledge-catalog").innerHTML='<div class="empty-state">知识图谱加载失败，请刷新页面重试。</div>';}
  }
  function renderKnowledgeCatalog() {
    const all=window.SMARTCOURSE_KNOWLEDGE||[],keyword=$("#knowledge-search").value.trim().toLowerCase(),chapter=$("#knowledge-chapter").value;
    const filtered=all.filter(item=>(chapter==="all"||String(item.chapter)===chapter)&&(!keyword||[item.title,item.description,item.chapterTitle,...(item.tags||[]),...(item.obeOutcomes||[])].join(" ").toLowerCase().includes(keyword)));
    const core=all.filter(item=>!item.id.startsWith("ext-")).length,extensions=all.length-core;
    $("#knowledge-stats").innerHTML=`<span>核心知识点 ${core}</span><span>工程延伸 ${extensions}</span><span>当前结果 ${filtered.length}</span><span>章节 ${new Set(all.map(item=>item.chapter)).size}</span>`;
    $("#knowledge-catalog").innerHTML=filtered.length?filtered.map(item=>{const profile=item.id.startsWith("ext-")?item:window.getKnowledgeProfile(item);return `<a class="knowledge-item" href="./resources/knowledge/viewer.html?id=${encodeURIComponent(item.id)}"><header><b>${item.label} ${item.title}</b><em>${item.id.startsWith("ext-")?"工程延伸":`难度 ${item.difficulty}/5`}</em></header><p>${item.description}</p><div class="knowledge-proof"><span>产出</span>${profile.outcome}</div><footer><span>${item.bloomLevel}</span><span>${item.learningType}</span>${(item.tags||[]).slice(0,2).map(tag=>`<span>${tag}</span>`).join("")}</footer></a>`;}).join(""):'<div class="empty-state">没有匹配的知识点</div>';
  }

  function renderTeacherLifecycle() {
    const state=readState(),scores=attemptScores(state.attempts),components=masteryComponents(state);if($("#outcome-attainment"))$("#outcome-attainment").innerHTML=Object.entries(outcomeNames).map(([outcome,name])=>`<div class="attainment-row"><b>${outcome} ${name}</b><div class="attainment-bar"><i style="width:${scores[outcome]}%"></i></div><span>${scores[outcome]||"—"}</span></div>`).join("");if($("#mastery-level-note"))$("#mastery-level-note").textContent=`学习掌握指数口径：知识理解40% + 任务直接证据40% + 无AI迁移20%。${masteryLevel(components)}。当前仅为本机形成性记录，正式达成度由教师核查原始证据后认定。`;
    const stages=lifecycleStatus(state);if($("#cycle-evidence-ledger"))$("#cycle-evidence-ledger").innerHTML=stages.map(stage=>`<div class="ledger-row"><b>${stage.label}</b><p>${stage.done?"已形成可导出的本机记录":`尚缺：${stage.detail}`}</p><span class="badge ${stage.done?"":"pending"}">${stage.done?"已记录":"待完成"}</span></div>`).join("");
    const audits=[
      ["目标—任务—评价一致",true,"4项产出、6项任务、测评与证据已建立映射。"],
      ["AI全周期指导",true,"入口诊断、模块反馈、学习处方、补证与迁移限制。"],
      ["知识任务能力图谱",(window.SMARTCOURSE_KNOWLEDGE||[]).length===72,"57个核心知识点与15个工程延伸单元均可进入学习、提示和证据记录。"],
      ["真实课堂运行数据",false,"必须补充至少两个教学周期的脱敏原始数据。"],
      ["班级级平台接入",false,"公开版仅记录当前学习者；需对接统一认证和学校平台。"],
      ["ABB虚实验证",false,"课程模型可复算；RobotStudio站点、碰撞集和实体日志待补。"],
      ["数据与AI伦理",true,"最小数据、AI留痕、拒绝代做、人工安全复核。"],
      ["共享与持续更新",true,"Git版本管理、Pages自动发布、资源更新文档。"]
    ];
    if($("#provincial-audit"))$("#provincial-audit").innerHTML=`<div class="audit-grid">${audits.map(([title,done,detail])=>`<article class="audit-item"><header><b>${title}</b><span class="audit-state ${done?"":"pending"}">${done?"系统已具备":"需真实材料"}</span></header><p>${detail}</p></article>`).join("")}</div>`;
  }

  function bindLifecycleEvents() {
    $("#learner-profile-form")?.addEventListener("submit",event=>{event.preventDefault();writeState({profile:{alias:$("#learner-alias").value.trim(),goal:$("#learner-goal").value}});renderLearnerDashboard();});
    $$('[data-assessment-mode]').forEach(button=>button.addEventListener("click",()=>syncAssessmentMode(button.dataset.assessmentMode)));
    $("#assessment-mode")?.addEventListener("change",()=>syncAssessmentMode());
    $("#start-assessment")?.addEventListener("click",startAssessment);
    $("#assessment-form")?.addEventListener("submit",submitAssessment);
    $("#knowledge-search")?.addEventListener("input",renderKnowledgeCatalog);
    $("#knowledge-chapter")?.addEventListener("change",renderKnowledgeCatalog);
    window.addEventListener("smartcourse:statechange",()=>{renderLearnerDashboard();renderAssessmentHistory();renderTeacherLifecycle();});
  }
  function init() { renderLearnerDashboard();renderAssessmentControls();loadKnowledgeCatalog().then(renderTeacherLifecycle);renderTeacherLifecycle();bindLifecycleEvents(); }
  document.addEventListener("DOMContentLoaded",init);
})();
