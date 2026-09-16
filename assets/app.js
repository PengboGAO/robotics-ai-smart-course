(() => {
  "use strict";
  const data = window.COURSE_DATA;
  const storageKey = "robotics-smart-course-v1";
  const defaultState = { completed: [], evidence: [], aiLogs: [], attempts: [], mastery: {}, diagnostic: null, aiLocked: false, theme: "light" };
  let state = loadState();
  let animationFrame = null;

  function loadState() {
    try { return { ...defaultState, ...JSON.parse(localStorage.getItem(storageKey) || "{}") }; }
    catch { return { ...defaultState }; }
  }
  function saveState() {
    let persisted = {};
    try { persisted = JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch {}
    state = { ...persisted, ...state };
    localStorage.setItem(storageKey, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("smartcourse:statechange"));
    updateDashboard();
  }
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  function escapeHtml(value) { const node = document.createElement("div"); node.textContent = String(value); return node.innerHTML; }
  function toast(message) { const node = $("#toast"); node.textContent = message; node.classList.add("show"); setTimeout(() => node.classList.remove("show"), 2200); }
  function download(name, content, type = "application/json") { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); }

  function route() {
    const valid = ["overview","path","map","lab","assistant","assessment","evidence","teacher"];
    const current = valid.includes(location.hash.slice(1)) ? location.hash.slice(1) : "overview";
    $$(".page").forEach(page => page.classList.toggle("active", page.dataset.page === current));
    $$("[data-route]").forEach(link => link.classList.toggle("active", link.dataset.route === current));
    const active = $(`[data-route="${current}"]`);
    $("#route-title").textContent = active ? active.textContent.trim().replace(/^\d+/, "") : "课程首页";
    $(".sidebar").classList.remove("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (current === "lab") requestAnimationFrame(() => { drawRobot(); syncMeshFrame(0, $("#goal-preset")?.value === "valid"); });
    if (current === "teacher") updateDashboard();
  }

  function renderOutcomes() {
    $("#outcome-grid").innerHTML = data.outcomes.map(item => `<article class="outcome-card" data-id="${item.id}"><h3>${item.title}</h3><p>${item.desc}</p><dl><dt>直接证据</dt><dd>${item.evidence}</dd><dt>达成判据</dt><dd>${item.standard}</dd></dl></article>`).join("");
  }
  function renderDiagnostics() {
    $("#diagnostic-options").innerHTML = data.diagnostics.map(item => `<button type="button" data-diagnostic="${item.id}">${item.label}</button>`).join("");
    if (state.diagnostic) showDiagnostic(state.diagnostic, false);
    $$("[data-diagnostic]").forEach(button => button.addEventListener("click", () => showDiagnostic(button.dataset.diagnostic, true)));
  }
  function showDiagnostic(id, persist) {
    const item = data.diagnostics.find(entry => entry.id === id); if (!item) return;
    state.diagnostic = id; $$("[data-diagnostic]").forEach(button => button.classList.toggle("selected", button.dataset.diagnostic === id));
    $("#diagnostic-result").innerHTML = `<b>${item.module} 路径建议：</b> ${item.result}`;
    if (persist) { saveState(); toast("已生成学习路径建议"); }
  }
  function renderModules() {
    $("#module-list").innerHTML = data.modules.map(module => {
      const done = state.completed.includes(module.id);
      return `<article class="module-card"><div class="module-number">${module.number}</div><div><h3>${module.title}</h3><p>${module.problem}</p></div><div class="module-meta"><span class="chip">${module.hours}</span><span class="chip">${module.level}</span><span class="chip">先修 ${module.prereq}</span></div><div class="module-actions"><button type="button" data-module="${module.id}">查看任务</button><button type="button" data-complete="${module.id}" class="${done ? "done" : ""}">${done ? "已完成" : "记录完成"}</button></div></article>`;
    }).join("");
    $$('[data-module]').forEach(button => button.addEventListener("click", () => openModule(button.dataset.module)));
    $$('[data-complete]').forEach(button => button.addEventListener("click", () => toggleComplete(button.dataset.complete)));
  }
  function openModule(id) {
    const module = data.modules.find(item => item.id === id); if (!module) return;
    $("#dialog-content").innerHTML = `<div class="dialog-body"><span class="eyebrow">${module.id} · ${module.hours} · ${module.level}</span><h2>${module.title}</h2><p><b>工程问题：</b>${module.problem}</p><div class="dialog-grid"><div><b>学习任务</b><span>${module.task}</span></div><div><b>评价量规</b><span>${module.rubric}</span></div><div><b>提交证据</b><span>${module.evidence.join("；")}</span></div><div><b>AI边界</b><span>${module.ai}</span></div></div><div class="dialog-actions"><a class="secondary-btn" href="${module.resource}">打开教材支架</a><button class="primary-btn" type="button" data-dialog-complete="${module.id}">${state.completed.includes(module.id) ? "取消完成" : "记录完成"}</button></div></div>`;
    $("[data-dialog-complete]").addEventListener("click", () => { toggleComplete(id); $("#module-dialog").close(); });
    $("#module-dialog").showModal();
  }
  function toggleComplete(id) { state.completed = state.completed.includes(id) ? state.completed.filter(item => item !== id) : [...state.completed, id]; saveState(); renderModules(); toast(state.completed.includes(id) ? "任务完成已记录" : "已取消完成记录"); }

  function renderMap() {
    const svg = $("#knowledge-map");
    const positions = [[160,130],[430,85],[710,140],[230,330],[540,300],[735,430]];
    const edges = [[0,1],[1,2],[2,3],[2,4],[3,4],[4,5],[3,5]];
    const edgeMarkup = edges.map(([a,b]) => `<line class="map-edge" x1="${positions[a][0]}" y1="${positions[a][1]}" x2="${positions[b][0]}" y2="${positions[b][1]}"/>`).join("");
    const nodeMarkup = data.modules.map((module,index) => `<g class="map-node main" data-map-node="${module.id}" transform="translate(${positions[index][0]} ${positions[index][1]})"><circle r="55"/><text y="-7">${module.id}</text><text y="13">${module.title.slice(0,8)}</text></g>`).join("");
    svg.innerHTML = edgeMarkup + nodeMarkup;
    $$('[data-map-node]').forEach(node => node.addEventListener("click", () => inspectNode(node.dataset.mapNode)));
  }
  function inspectNode(id) {
    const module = data.modules.find(item => item.id === id); if (!module) return;
    $$('[data-map-node]').forEach(node => node.classList.toggle("active", node.dataset.mapNode === id));
    $("#node-inspector").innerHTML = `<span class="eyebrow">${module.id} · 先修 ${module.prereq}</span><h2>${module.title}</h2><p>${module.problem}</p><b>关联知识</b><ul>${module.nodes.map(node => `<li>${node}</li>`).join("")}</ul><b>直接证据</b><ul>${module.evidence.map(item => `<li>${item}</li>`).join("")}</ul>`;
  }

  const identity = () => [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
  function multiply(a,b) { return a.map((row,i) => b[0].map((_,j) => row.reduce((sum,_,k) => sum + a[i][k] * b[k][j],0))); }
  function translation(v) { const m=identity(); m[0][3]=v[0]; m[1][3]=v[1]; m[2][3]=v[2]; return m; }
  function rotation(axis, angle) { const [x,y,z]=axis; const c=Math.cos(angle),s=Math.sin(angle),t=1-c; return [[t*x*x+c,t*x*y-s*z,t*x*z+s*y,0],[t*x*y+s*z,t*y*y+c,t*y*z-s*x,0],[t*x*z-s*y,t*y*z+s*x,t*z*z+c,0],[0,0,0,1]]; }
  function forwardKinematics(degrees) {
    let transform=identity(); const points=[[0,0,0]];
    data.abb.origins.forEach((origin,index)=>{ transform=multiply(transform,translation(origin)); points.push([transform[0][3],transform[1][3],transform[2][3]]); transform=multiply(transform,rotation(data.abb.axes[index],degrees[index]*Math.PI/180)); });
    return { transform, points };
  }
  function currentJoints() { return $$(".joint-slider").map(slider => Number(slider.value)); }
  function renderJointControls() {
    $("#joint-controls").innerHTML = data.abb.start.map((value,index) => `<div class="joint-control"><label><span>A${index+1}</span><output id="joint-output-${index}">${value}°</output></label><input class="joint-slider" data-joint="${index}" type="range" min="${data.abb.jointLimits[index][0]}" max="${data.abb.jointLimits[index][1]}" value="${value}" step="1"><small>${data.abb.jointLimits[index][0]}° ～ ${data.abb.jointLimits[index][1]}°</small></div>`).join("");
    $$(".joint-slider").forEach(slider => slider.addEventListener("input", () => { $(`#joint-output-${slider.dataset.joint}`).textContent = `${slider.value}°`; drawRobot(); syncMeshFrame(0, false); }));
  }
  const meshFrameCount = 31;
  function meshFramePath(index) { return `./resources/abb/mesh-frames/irb1200-valid-${String(index).padStart(2,"0")}.png`; }
  function syncMeshFrame(progress = 0, useMesh = true) {
    const stage=$("#sync-stage"), image=$("#mesh-frame"), note=$("#mesh-mode-note"); if(!stage||!image||!note)return;
    const valid=$("#goal-preset")?.value==="valid";
    if(useMesh&&valid){const index=Math.max(0,Math.min(meshFrameCount-1,Math.round(progress*(meshFrameCount-1))));image.src=meshFramePath(index);stage.classList.remove("reference-mode");note.textContent="ROS-Industrial碰撞网格 · 同源q(t)离线教学帧";}
    else{stage.classList.add("reference-mode");note.textContent="反例或手动调节：参考关节链计算，不冒充RobotStudio结果";}
  }
  function setJoints(values, progress = null, duration = null, useMesh = false) { $$(".joint-slider").forEach((slider,index)=>{slider.value=values[index]; $(`#joint-output-${index}`).textContent=`${Math.round(values[index])}°`;}); drawRobot(); syncMeshFrame(progress??0,useMesh); if(progress!==null)drawTrajectoryPlot(data.abb.goals[$("#goal-preset").value],duration,progress); }
  function project(point,w,h) { const scale=Math.min(w,h)*.6; return [w*.49 + (point[0]-point[1]*.48)*scale, h*.86 - (point[2]+point[1]*.22)*scale]; }
  function quinticBlend(tau) { return 10*tau**3-15*tau**4+6*tau**5; }
  function drawAxes(ctx,w,h) {
    const origin=project([0,0,0],w,h),axes=[{v:[.23,0,0],c:"#ff6b6b",n:"X"},{v:[0,.23,0],c:"#4dabf7",n:"Y"},{v:[0,0,.23],c:"#51cf66",n:"Z"}];
    axes.forEach(axis=>{const end=project(axis.v,w,h);ctx.strokeStyle=axis.c;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(...origin);ctx.lineTo(...end);ctx.stroke();ctx.fillStyle=axis.c;ctx.font="bold 14px sans-serif";ctx.fillText(axis.n,end[0]+5,end[1]-5);});
  }
  function drawRobot() {
    const canvas=$("#robot-canvas"); if (!canvas) return; const ctx=canvas.getContext("2d"); const joints=currentJoints(); if(joints.length!==6)return;
    const result=forwardKinematics(joints); const w=canvas.width,h=canvas.height; ctx.clearRect(0,0,w,h);
    const floor=project([0,0,0],w,h);ctx.fillStyle="rgba(31,73,92,.28)";ctx.beginPath();ctx.ellipse(floor[0],floor[1]+16,150,34,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="rgba(100,190,205,.13)";ctx.lineWidth=1;for(let x=30;x<w;x+=45){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=30;y<h;y+=45){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}drawAxes(ctx,w,h);
    const points=result.points.map(p=>project(p,w,h));ctx.lineCap="round";ctx.lineJoin="round";
    ctx.strokeStyle="rgba(0,0,0,.32)";ctx.lineWidth=30;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0]+5,p[1]+7):ctx.moveTo(p[0]+5,p[1]+7));ctx.stroke();
    ctx.strokeStyle="#f0a23b";ctx.lineWidth=24;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();
    points.forEach((p,i)=>{ctx.fillStyle=i===points.length-1?"#20d5c1":i===0?"#3f4d55":"#ffd166";ctx.strokeStyle="#ffe9ad";ctx.lineWidth=3;ctx.beginPath();ctx.arc(p[0],p[1],i===0?19:11,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#d7eff2";ctx.font="bold 14px sans-serif";ctx.fillText(i===0?"BASE":`A${i}`,p[0]+15,p[1]-10)});
    ctx.fillStyle="rgba(219,242,245,.88)";ctx.font="bold 15px sans-serif";ctx.fillText("ABB IRB 1200-5/0.9 教学参考链",24,32);ctx.font="12px sans-serif";ctx.fillStyle="rgba(172,205,211,.82)";ctx.fillText("非OEM CAD外观；几何、轴向与零位按课程参考链计算",24,53);
    const p=result.transform; $("#fk-x").textContent=`${p[0][3].toFixed(4)} m`;$("#fk-y").textContent=`${p[1][3].toFixed(4)} m`;$("#fk-z").textContent=`${p[2][3].toFixed(4)} m`;
    const wrist=Math.abs(Math.sin(joints[4]*Math.PI/180)); $("#singularity-state").textContent=wrist<.08?"接近腕部奇异":"未触发A5筛查"; $("#singularity-state").style.color=wrist<.08?"var(--danger)":"var(--success)";
  }
  function drawTrajectoryPlot(goal, duration = Math.max(1,Number($("#duration-input")?.value)||3), progress = 0) {
    const canvas=$("#trajectory-canvas");if(!canvas)return;const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height,start=data.abb.start,colors=["#ff6b6b","#ffd43b","#51cf66","#22b8cf","#748ffc","#e599f7"],margin={l:54,r:22,t:54,b:42},plotW=w-margin.l-margin.r,plotH=h-margin.t-margin.b;
    ctx.clearRect(0,0,w,h);ctx.fillStyle="#081f2e";ctx.fillRect(0,0,w,h);ctx.font="bold 14px sans-serif";ctx.fillStyle="#d9f0f3";ctx.fillText("六轴五次轨迹 q(t)｜MATLAB同口径",18,22);
    const min=Math.min(...start,...goal)-15,max=Math.max(...start,...goal)+15;ctx.strokeStyle="rgba(141,190,201,.18)";ctx.lineWidth=1;
    for(let line=0;line<=4;line++){const y=margin.t+plotH*line/4;ctx.beginPath();ctx.moveTo(margin.l,y);ctx.lineTo(w-margin.r,y);ctx.stroke();const value=max-(max-min)*line/4;ctx.fillStyle="#8fb2bc";ctx.font="11px sans-serif";ctx.fillText(`${Math.round(value)}°`,8,y+4);}
    for(let tick=0;tick<=5;tick++){const x=margin.l+plotW*tick/5;ctx.beginPath();ctx.moveTo(x,margin.t);ctx.lineTo(x,h-margin.b);ctx.stroke();ctx.fillStyle="#8fb2bc";ctx.fillText(`${(duration*tick/5).toFixed(1)}s`,x-10,h-16);}
    goal.forEach((target,index)=>{ctx.strokeStyle=colors[index];ctx.lineWidth=2.4;ctx.beginPath();for(let sample=0;sample<=120;sample++){const tau=sample/120,value=start[index]+quinticBlend(tau)*(target-start[index]),x=margin.l+plotW*tau,y=margin.t+(max-value)/(max-min)*plotH;sample?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();ctx.fillStyle=colors[index];ctx.fillRect(margin.l+index*62,31,9,9);ctx.fillStyle="#bdd7dc";ctx.font="10px sans-serif";ctx.fillText(`A${index+1}`,margin.l+12+index*62,40);});
    const cursorX=margin.l+plotW*Math.max(0,Math.min(1,progress));ctx.strokeStyle="#ffffff";ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(cursorX,margin.t);ctx.lineTo(cursorX,h-margin.b);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(cursorX,margin.t,4,0,Math.PI*2);ctx.fill();
    if($("#sync-time"))$("#sync-time").textContent=`${(duration*progress).toFixed(2)} / ${duration.toFixed(2)} s`;
  }
  function checkTrajectory() {
    const goal=data.abb.goals[$("#goal-preset").value]; const duration=Math.max(1,Number($("#duration-input").value)||3); const start=data.abb.start;
    const positionPass=goal.every((q,i)=>q>=data.abb.jointLimits[i][0]&&q<=data.abb.jointLimits[i][1]);
    const peaks=goal.map((q,i)=>1.875*Math.abs(q-start[i])/duration); const speedPass=peaks.every((v,i)=>v<=data.abb.maxSpeed[i]);
    const singularPass=Math.abs(Math.sin(goal[4]*Math.PI/180))>=.08;
    const endpointPass=true;
    const items=[{n:"关节限位",v:positionPass?"通过":"不通过",p:positionPass},{n:"峰值速度",v:speedPass?"通过":"不通过",p:speedPass},{n:"端点v/a",v:endpointPass?"均为0":"不通过",p:endpointPass},{n:"A5奇异筛查",v:singularPass?"未触发":"触发风险",p:singularPass}];
    $("#trajectory-results").innerHTML=items.map(item=>`<div class="check-result ${item.p?"":"fail"}"><span>${item.n}</span><b>${item.v}</b></div>`).join("")+`<div class="check-result" style="grid-column:1/-1"><span>六轴峰值速度 / °·s⁻¹</span><b>${peaks.map(v=>v.toFixed(2)).join(" / ")}</b><small>${data.abb.speedContext}</small></div>`;
    drawTrajectoryPlot(goal,duration,0); syncMeshFrame(0,$("#goal-preset").value==="valid");
    toast(items.every(item=>item.p)?"课程模型预检通过，实体执行仍需安全复核":"发现约束风险，请保留为反证证据");
  }
  function animateTrajectory() {
    if(animationFrame)cancelAnimationFrame(animationFrame); const goal=data.abb.goals[$("#goal-preset").value]; const duration=Math.max(1,Number($("#duration-input").value)||3)*1000; const start=data.abb.start; const begin=performance.now();
    const useMesh=$("#goal-preset").value==="valid";
    function frame(now){const tau=Math.min(1,(now-begin)/duration);const blend=quinticBlend(tau);setJoints(start.map((q,i)=>q+blend*(goal[i]-q)),tau,duration/1000,useMesh);if(tau<1)animationFrame=requestAnimationFrame(frame);else animationFrame=null} animationFrame=requestAnimationFrame(frame);
  }

  const hintBank = {
    model: ["先定位差异发生在哪个层级：坐标系定义、D-H约定、单位、关节零位偏置，还是法兰固定变换。请先报告第一处不一致的中间矩阵。","按此顺序检查：①画出每个z轴；②声明标准D-H或改进D-H；③核对米/毫米和度/弧度；④在零位与至少两组非零构型逐级比较T01…T06；⑤最后检查法兰对齐。","局部支架：只比较位置列时仍可能漏掉姿态错误。请计算 Δp=‖p₁-p₂‖，同时计算 ΔR=‖R₁-R₂‖F，并记录第一个超出自定数值容差的关节变换；不要直接替换整套参数。"],
    code: ["先指出哪一行代码对应哪一个数学量，再检查变量是否在同一单位和同一坐标系。请给出最小可复现输入与实际输出。","建议建立“公式符号—代码变量—维度—单位”四列表，逐项核对矩阵乘法顺序、角度转换和数组索引，再用已知零位测试。","局部支架：为单个变换函数写两个断言：旋转矩阵应满足 RᵀR≈I、det(R)≈1；齐次矩阵最后一行应为[0 0 0 1]。先让这些局部测试通过，再检查整链。"],
    simulation: ["先不要看动画是否顺滑。请报告端点速度/加速度、各轴峰值速度、关节上下限以及A5在何处接近0°。","按“边界条件→位置限位→速度/加速度→奇异性→碰撞→控制器事件日志”顺序检查。前四项可由课程模型预检，后两项必须在完整RobotStudio站点中完成。","局部支架：五次时间标度 s(τ)=10τ³−15τ⁴+6τ⁵，其峰值 ds/dt=1.875/T。用它先独立复算每轴峰值速度，再与对应型号和供电条件下的限值比较。"],
    verification: ["请先说明你想否定哪一个结论。有效反证必须只改变一个关键条件，并保留可复现输入与输出。","可选检查路径：参数符号翻转、A2超限、A5穿越0°、缩短运行时间导致速度超限。每次只改变一项，并比较修正前后证据。","局部支架：用“主张—反例输入—失败指标—修正动作—复算结果”五列记录。若缺少RobotStudio站点或实体数据，只能写‘课程模型通过/待控制器验证’，不能写‘运行安全’。" ]
  };
  function assistantRule(moduleId) { return data.aiPolicy?.moduleRules?.[moduleId] || { maxLevel: 1, stage: "诊断提示", reason: "未配置模块规则" }; }
  function hasPriorAttempt(moduleId) { return state.attempts.some(item => item.module === moduleId) || state.evidence.some(item => item.module === moduleId); }
  function syncAssistantPolicy() {
    if (!$("#assistant-module")) return;
    state = loadState();
    const moduleId = $("#assistant-module").value || "M1";
    const rule = assistantRule(moduleId);
    const locked = state.aiLocked || rule.maxLevel === 0;
    $$("[data-level]").forEach(button => {
      const level = Number(button.dataset.level);
      const thirdLevelWaiting = level === 3 && moduleId === "M3" && !hasPriorAttempt(moduleId);
      button.disabled = locked || level > rule.maxLevel || thirdLevelWaiting;
    });
    $("#question-input").disabled = locked;
    $("#ai-stage-note").textContent = locked ? `${moduleId} · ${rule.stage}：${state.aiLocked ? "无AI迁移测评进行中" : rule.reason}。仅保留既有日志。` : `${moduleId} · ${rule.stage}：最高开放${rule.maxLevel}级提示。${rule.reason}。`;
  }
  function renderAssistantContext() {
    $("#assistant-module").innerHTML = data.modules.map(module => `<option value="${module.id}">${module.id} ${module.title}</option>`).join("");
    syncAssistantPolicy();
  }
  async function requestGatewayHint(type, level, question, module) {
    const endpoint = window.COURSE_RUNTIME?.aiEndpoint?.trim();
    if (!endpoint) return `${module.id} ${module.title}｜${hintBank[type][level - 1]}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course: "机器人学基础",
        policy: "仅定位问题、提供检查路径或局部支架；不得生成完整模型、完整代码、实验数据或安全结论。",
        module: { id: module.id, title: module.title, outcomes: module.nodes, evidence: module.evidence }, type, level, question
      })
    });
    if (!response.ok) throw new Error(`AI网关响应异常：${response.status}`);
    const payload = await response.json();
    if (!payload.answer || typeof payload.answer !== "string") throw new Error("AI网关返回格式无效");
    return payload.answer.trim();
  }
  async function submitQuestion(event) {
    event.preventDefault(); state=loadState(); const submitter=event.submitter; const level=Math.max(1,Math.min(3,Number(submitter.dataset.level)||1)); const type=$("#question-type").value; const question=$("#question-input").value.trim(); const moduleId=$("#assistant-module").value; const module=data.modules.find(item=>item.id===moduleId); const rule=assistantRule(moduleId); if(!question||!module)return;
    if(state.aiLocked||rule.maxLevel===0){toast("当前为无AI独立迁移阶段");return;}
    if(level>rule.maxLevel){toast(`${moduleId}最高开放${rule.maxLevel}级提示`);return;}
    if(level===3&&moduleId==="M3"&&!hasPriorAttempt(moduleId)){toast("先完成一次M3尝试或提交证据，再开放三级支架");return;}
    addMessage("user","学习者",question); $("#question-input").value="";
    let answer;
    try { answer = await requestGatewayHint(type, level, question, module); }
    catch { answer = `${module.id} ${module.title}｜${hintBank[type][level-1]}`; toast("学校AI网关暂不可用，已切换教师审核提示库"); }
    addMessage("assistant",`AI助教 · ${moduleId} · ${level}级提示`,answer);
    state.aiLogs.push({time:new Date().toISOString(),module:moduleId,type,level,question,answer,mode:window.COURSE_RUNTIME?.aiEndpoint?"学校AI网关":"教师审核提示库",policyStage:rule.stage}); saveState();
  }
  function addMessage(role,label,text){const node=document.createElement("div");node.className=`message ${role}`;node.innerHTML=`<span>${escapeHtml(label)}</span><p>${escapeHtml(text)}</p>`;$("#chat-log").append(node);$("#chat-log").scrollTop=$("#chat-log").scrollHeight;}

  function renderEvidenceOptions(){$("#evidence-module").innerHTML=data.modules.map(module=>`<option value="${module.id}">${module.id} ${module.title}</option>`).join("");}
  function rubricSnapshot(){const rubric=Object.fromEntries($$('[data-rubric]').map(item=>[item.dataset.rubric,item.value===""?Number.NaN:Number(item.value)]));const values=Object.values(rubric);return {rubric,score:values.length&&values.every(Number.isFinite)?Math.round(values.reduce((sum,value)=>sum+value,0)/values.length*25):null};}
  function updateRubricPreview(){const snapshot=rubricSnapshot();$("#rubric-score-preview").textContent=snapshot.score===null?"—":`${snapshot.score}分`;}
  function evidenceFeedback(rubric){const labels={model:"模型正确性",consistency:"模型—代码一致",constraints:"约束与安全",explanation:"诊断与技术解释",traceability:"可复算与可追溯",integrity:"AI边界与诚信"};const weak=Object.entries(rubric).filter(([,value])=>value<3).map(([key])=>labels[key]||key);return weak.length?`补证优先级：${weak.join("、")}。先定位第一处缺失，补充原始输入、复算过程和修正前后结果。`:`六维证据均达到3级及以上。下一步由同伴或教师抽检原始文件，并进入无AI变式任务。`;}
  function submitEvidence(event){event.preventDefault();const types=$$('input[name="evidenceType"]:checked').map(item=>item.value);if(!types.length){toast("请至少选择一种证据类型");return}const snapshot=rubricSnapshot();if(snapshot.score===null){toast("请完成六维证据量规");return}const entry={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),time:new Date().toISOString(),module:$("#evidence-module").value,types,location:$("#evidence-location").value.trim(),note:$("#evidence-note").value.trim(),evaluator:$("#evidence-evaluator").value,rubric:snapshot.rubric,rubricScore:snapshot.score,feedback:evidenceFeedback(snapshot.rubric),integrity:$("#integrity-confirm").checked};state.evidence.unshift(entry);saveState();event.target.reset();updateRubricPreview();renderEvidence();syncAssistantPolicy();toast(snapshot.score>=80?"证据已保存，等待人工抽检":"证据已保存，已生成补证优先级");}
  function renderEvidence(){const list=$("#evidence-list");if(!state.evidence.length){list.innerHTML='<div class="empty-state">暂无记录。完成任务后，把“证明什么、证据在哪、如何复算”写入档案。</div>';return}list.innerHTML=state.evidence.map(item=>`<article class="evidence-item"><header><h3>${escapeHtml(item.module)} · ${item.types.map(escapeHtml).join(" / ")}</h3><time>${new Date(item.time).toLocaleString("zh-CN")}</time></header><p><b>位置：</b>${escapeHtml(item.location)}<br><b>口径：</b>${escapeHtml(item.note)}<br><b>形成性反馈：</b>${escapeHtml(item.feedback||evidenceFeedback(item.rubric||{}))}</p><footer><span class="chip">${escapeHtml(item.evaluator||"未标注评价主体")} · ${Number.isFinite(item.rubricScore)?`${item.rubricScore}分`:"旧记录待复评"}</span><button type="button" data-delete-evidence="${item.id}">删除</button></footer></article>`).join("");$$('[data-delete-evidence]').forEach(button=>button.addEventListener("click",()=>{state.evidence=state.evidence.filter(item=>item.id!==button.dataset.deleteEvidence);saveState();renderEvidence();syncAssistantPolicy();}));}

  function updateDashboard(){if(!$("#metric-tasks"))return;state=loadState();$("#metric-tasks").textContent=`${state.completed.length} / ${data.modules.length}`;$("#metric-evidence").textContent=state.evidence.length;$("#metric-ai").textContent=state.aiLogs.length;const gaps=data.modules.filter(module=>!state.completed.includes(module.id)||!state.evidence.some(item=>item.module===module.id&&item.rubricScore>=data.aiPolicy.evidenceThreshold));$("#metric-gaps").textContent=gaps.length;$("#compliance-list").innerHTML=data.compliance.map(item=>`<div class="compliance-row"><b>${item.item}</b><p>${item.implementation}</p><span class="badge ${item.status.includes("待")?"pending":""}">${item.status}</span></div>`).join("");$("#remediation-list").innerHTML=gaps.length?gaps.map(module=>`<div class="remediation-item"><b>${module.id} ${module.title}</b><p>${state.completed.includes(module.id)?"已有任务记录，但缺少80分及以上且可抽检的证据。":"先完成任务，再登记可复算证据。"}</p></div>`).join(""):'<div class="remediation-item"><b>任务与证据已达到过程门槛</b><p>请安排同伴/教师抽检和无AI迁移测试；系统分数不替代正式评价。</p></div>';}
  function portfolio(){state=loadState();return {course:"机器人学基础AI智慧课程",exportedAt:new Date().toISOString(),notice:"本档案由浏览器本机记录生成，不代表正式成绩。",...state};}

  function bindEvents(){window.addEventListener("hashchange",route);window.addEventListener("smartcourse:statechange",syncAssistantPolicy);$$('[data-go]').forEach(button=>button.addEventListener("click",()=>location.hash=button.dataset.go));$("#menu-toggle").addEventListener("click",()=>$(".sidebar").classList.toggle("open"));$("#theme-toggle").addEventListener("click",()=>{state.theme=state.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=state.theme;saveState();});$("#dialog-close").addEventListener("click",()=>$("#module-dialog").close());$("#reset-joints").addEventListener("click",()=>{setJoints(data.abb.start,0,Math.max(1,Number($("#duration-input").value)||3),$("#goal-preset").value==="valid");checkTrajectory();});$("#check-trajectory").addEventListener("click",checkTrajectory);$("#animate-trajectory").addEventListener("click",animateTrajectory);$("#goal-preset").addEventListener("change",checkTrajectory);$("#duration-input").addEventListener("change",checkTrajectory);$("#assistant-module").addEventListener("change",syncAssistantPolicy);$("#assistant-form").addEventListener("submit",submitQuestion);$("#export-ai-log").addEventListener("click",()=>download("AI助教使用记录.json",JSON.stringify(state.aiLogs,null,2)));$("#evidence-form").addEventListener("submit",submitEvidence);$$('[data-rubric]').forEach(item=>item.addEventListener("change",updateRubricPreview));$("#export-evidence").addEventListener("click",()=>download("机器人学基础_学习证据.json",JSON.stringify(state.evidence,null,2)));$("#export-portfolio").addEventListener("click",()=>download("机器人学基础_完整学习档案.json",JSON.stringify(portfolio(),null,2)));}

  function init(){document.documentElement.dataset.theme=state.theme;if(new URLSearchParams(location.search).get("capture")==="lab")document.body.classList.add("capture-lab");renderOutcomes();renderDiagnostics();renderModules();renderMap();renderJointControls();renderAssistantContext();renderEvidenceOptions();renderEvidence();updateDashboard();bindEvents();route();checkTrajectory();const mode=window.COURSE_RUNTIME?.aiEndpoint?`学校AI网关 · ${window.COURSE_RUNTIME.aiModeName||"受控模型"}`:"教师审核提示库 · 离线可用";$("#ai-mode-label").textContent=`当前模式：${mode}`;if("serviceWorker" in navigator&&location.protocol.startsWith("http")){const hadController=Boolean(navigator.serviceWorker.controller);let refreshing=false;if(hadController)navigator.serviceWorker.addEventListener("controllerchange",()=>{if(refreshing)return;refreshing=true;location.reload();});navigator.serviceWorker.register("./service-worker.js",{updateViaCache:"none"}).then(registration=>registration.update()).catch(()=>{});}}
  document.addEventListener("DOMContentLoaded",init);
})();
