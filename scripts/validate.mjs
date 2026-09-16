import {readFile,access,readdir} from "node:fs/promises";
import {dirname,join,resolve} from "node:path";
const root=process.cwd();
const required=["index.html","assets/styles.css","assets/lifecycle.css","assets/runtime-config.js","assets/course-data.js","assets/knowledge-system.js","assets/question-bank.js","assets/app.js","assets/lifecycle.js","assets/knowledge-graph.json","assets/knowledge-extensions.json","resources/knowledge/viewer.html","resources/knowledge/knowledge.css","resources/knowledge/viewer.js","manifest.webmanifest","service-worker.js","404.html",".nojekyll"];
for(const file of required)await access(join(root,file));
const html=await readFile(join(root,"index.html"),"utf8");
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
const duplicates=ids.filter((id,index)=>ids.indexOf(id)!==index);if(duplicates.length)throw new Error(`入口重复ID: ${[...new Set(duplicates)].join(",")}`);
for(const file of ["./assets/styles.css","./assets/lifecycle.css","./assets/runtime-config.js","./assets/course-data.js","./assets/knowledge-system.js","./assets/question-bank.js","./assets/app.js","./assets/lifecycle.js","./manifest.webmanifest"]){if(!html.includes(file))throw new Error(`入口未引用: ${file}`);}

const graph=JSON.parse(await readFile(join(root,"assets/knowledge-graph.json"),"utf8"));
const extensions=JSON.parse(await readFile(join(root,"assets/knowledge-extensions.json"),"utf8"));
if(!Array.isArray(graph.modules)||graph.modules.length!==57)throw new Error(`核心知识目录应为57项，当前为${graph.modules?.length??0}项`);
if(!Array.isArray(extensions.modules)||extensions.modules.length!==15)throw new Error(`工程延伸应为15项，当前为${extensions.modules?.length??0}项`);
const all=[...graph.modules,...extensions.modules],allIds=all.map(item=>item.id);
if(new Set(allIds).size!==72)throw new Error("72个知识单元存在重复ID");
const chapterCounts=graph.modules.reduce((result,item)=>({...result,[item.chapter]:(result[item.chapter]||0)+1}),{});
const expectedCounts={1:6,2:6,3:8,4:8,5:7,6:9,7:8,8:5};
for(const [chapter,count] of Object.entries(expectedCounts))if(chapterCounts[chapter]!==count)throw new Error(`第${chapter}章核心知识点应为${count}项`);

const pointDir=join(root,"resources/knowledge/points");
const pointFiles=(await readdir(pointDir)).filter(file=>/^kp-.*\.html$/.test(file));
if(pointFiles.length!==57)throw new Error(`部署知识内容应为57项，当前为${pointFiles.length}项`);
for(const item of graph.modules){
  if(!item.id||!item.title||!item.file||!item.description||!item.obeOutcomes?.length)throw new Error(`知识元数据不完整: ${item.id||item.file}`);
  const content=await readFile(join(pointDir,item.file),"utf8");
  const metaMatch=content.match(/^<!--META\s+(.+?)-->/);
  if(!metaMatch)throw new Error(`缺少META: ${item.file}`);
  const meta=JSON.parse(metaMatch[1]);
  const normalized=value=>String(value).replace(/\s+/g,"");
  if(meta.kp_id!==item.id||normalized(meta.title)!==normalized(item.title)||meta.file!==item.file)throw new Error(`图谱与内容元数据不一致: ${item.id}`);
  if(!content.includes(`id="${item.id}"`))throw new Error(`知识页ID不一致: ${item.file}`);
}
for(const item of extensions.modules){for(const key of ["outcome","prerequisites","task","evidence","criteria","remediation"])if(!item[key])throw new Error(`延伸节点${item.id}缺少${key}`);}

const knowledgeSystem=await readFile(join(root,"assets/knowledge-system.js"),"utf8");
for(let chapter=1;chapter<=8;chapter++)if(!knowledgeSystem.includes(`${chapter}:{outcome:`))throw new Error(`第${chapter}章缺少OBE学习画像`);
for(const token of ["verification","boundary","remediation","kp-3-6","kp-4-1","kp-7-8"])if(!knowledgeSystem.includes(token))throw new Error(`知识评价配置缺失: ${token}`);

const lifecycle=await readFile(join(root,"assets/lifecycle.js"),"utf8"),questionBank=await readFile(join(root,"assets/question-bank.js"),"utf8");
for(const module of ["M1","M2","M3","M4","M5","M6"]){const count=[...`${lifecycle}\n${questionBank}`.matchAll(new RegExp(`phase:\"module\",module:\"${module}\"`,"g"))].length;if(count!==8)throw new Error(`${module}模块题应为8题，当前${count}题`);}
for(const token of ["diagnostic","transfer","buildLocalGuidance","renderTeacherLifecycle","masteryComponents","knowledge*.4","evidence*.4","transfer*.2","knowledge-extensions.json","viewer.html?id="])if(!lifecycle.includes(token))throw new Error(`全周期评价功能缺失: ${token}`);
for(const token of ["score>=80","aiLocked","规则反馈（作答阶段无AI）"])if(!lifecycle.includes(token))throw new Error(`评价与AI退场门禁缺失: ${token}`);
const app=await readFile(join(root,"assets/app.js"),"utf8"),courseData=await readFile(join(root,"assets/course-data.js"),"utf8");
  for(const token of ["assistantRule","evidenceFeedback","hasPriorAttempt","policyStage","quinticBlend","drawTrajectoryPlot","sync-time","syncMeshFrame","meshFramePath"])if(!app.includes(token))throw new Error(`AI任务绑定或ABB同步可视化功能缺失: ${token}`);
for(const token of ["aiPolicy","maxLevel: 0","evidenceThreshold: 80","humanReview"])if(!courseData.includes(token))throw new Error(`AI阶段策略缺失: ${token}`);
  for(const id of ["learner-profile-form","assessment-form","assistant-module","ai-stage-note","rubric-score-preview","outcome-attainment","provincial-audit","trajectory-canvas","sync-time","sync-stage","mesh-frame","mesh-mode-note","mastery-components","mastery-level-note"]){if(!ids.includes(id))throw new Error(`关键交互缺失: ${id}`);}
  const frameManifest=JSON.parse(await readFile(join(root,"resources/abb/mesh-frames/manifest.json"),"utf8"));
  if(frameManifest.model!=="ABB IRB 1200-5/0.9"||frameManifest.trajectory?.frame_count!==31)throw new Error("ABB网格帧数据口径不完整");
  for(let frame=0;frame<31;frame++)await access(join(root,"resources/abb/mesh-frames",`irb1200-valid-${String(frame).padStart(2,"0")}.png`));

const deploymentTexts=[];
for(const file of pointFiles)deploymentTexts.push(await readFile(join(pointDir,file),"utf8"));
for(const file of ["ch02.html","ch03.html","ch04.html","ch05.html","ch06.html","ch07.html","机器人学基础_完整版.html"])deploymentTexts.push(await readFile(join(root,"resources/textbook",file),"utf8"));
const combined=deploymentTexts.join("\n");
const forbidden=["全域姿态唯一表示","直接规划关节变量，无奇异问题","拉格朗日法符号推导的 O(n⁴)","目前几乎所有 6 自由度工业机器人","关节内置扭矩传感器，实现碰撞检测","6 自由度机器人最多 8 组解"];
for(const phrase of forbidden)if(combined.includes(phrase))throw new Error(`仍含过度断言: ${phrase}`);
if(/PUMA560|UR5协作机器人/.test(combined))throw new Error("部署教材仍含非ABB教学案例");
const textbookIndex=await readFile(join(root,"resources/textbook/index.html"),"utf8");
for(let chapter=1;chapter<=8;chapter++){
  const chapterFile=`ch0${chapter}.html`;
  if(!textbookIndex.includes(`href="${chapterFile}"`))throw new Error(`数字教材入口缺少第${chapter}章链接`);
  await access(join(root,"resources/textbook",chapterFile));
}
for(const phrase of ["100%代码覆盖","100+视频资源","14个虚拟仿真实验项目","待建设","建设进度总览","双优建设对标"]){
  if(textbookIndex.includes(phrase))throw new Error(`数字教材入口仍含宣传或占位内容: ${phrase}`);
}
for(const token of ["ABB IRB 1200","先理解模型，再相信仿真","AI输出只作为诊断线索"]){
  if(!textbookIndex.includes(token))throw new Error(`数字教材入口缺失学习边界: ${token}`);
}
const abbPoint=await readFile(join(pointDir,"kp-03-6.html"),"utf8");
for(const token of ["ABB IRB 1200-5/0.9","0.3991","0.4480","0.4510","0.0820","社区维护的教学参考链"])if(!abbPoint.includes(token))throw new Error(`ABB参考链知识点缺失: ${token}`);

const multiply=(A,B)=>A.map((row,i)=>B[0].map((_,j)=>row.reduce((sum,value,k)=>sum+value*B[k][j],0)));
const transpose=A=>A[0].map((_,j)=>A.map(row=>row[j]));
const maxAbs=A=>Math.max(...A.flat().map(Math.abs));
const identity=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0));
const subtract=(A,B)=>A.map((row,i)=>row.map((value,j)=>value-B[i][j]));
const det3=A=>A[0][0]*(A[1][1]*A[2][2]-A[1][2]*A[2][1])-A[0][1]*(A[1][0]*A[2][2]-A[1][2]*A[2][0])+A[0][2]*(A[1][0]*A[2][1]-A[1][1]*A[2][0]);
const rotZ=a=>[[Math.cos(a),-Math.sin(a),0],[Math.sin(a),Math.cos(a),0],[0,0,1]];
const R=rotZ(0.73);if(maxAbs(subtract(multiply(transpose(R),R),identity(3)))>1e-12||Math.abs(det3(R)-1)>1e-12)throw new Error("SO(3)数值验证失败");
const dh=(theta,d,a,alpha)=>{const c=Math.cos(theta),s=Math.sin(theta),ca=Math.cos(alpha),sa=Math.sin(alpha);return [[c,-s*ca,s*sa,a*c],[s,c*ca,-c*sa,a*s],[0,sa,ca,d],[0,0,0,1]];};
const translation=vector=>[[1,0,0,vector[0]],[0,1,0,vector[1]],[0,0,1,vector[2]],[0,0,0,1]];
const axisRotation=(axis,angle)=>{const [x,y,z]=axis,c=Math.cos(angle),s=Math.sin(angle),v=1-c;return [[c+x*x*v,x*y*v-z*s,x*z*v+y*s,0],[y*x*v+z*s,c+y*y*v,y*z*v-x*s,0],[z*x*v-y*s,z*y*v+x*s,c+z*z*v,0],[0,0,0,1]];};
const origins=[[0,0,.3991],[0,0,0],[0,0,.448],[0,0,.042],[.451,0,0],[.082,0,0]],axes=[[0,0,1],[0,1,0],[0,1,0],[1,0,0],[0,1,0],[1,0,0]];
const referenceFk=q=>q.reduce((T,angle,index)=>multiply(multiply(T,translation(origins[index])),axisRotation(axes[index],angle)),identity(4));
const a=[0,.448,.042,0,0,0],alpha=[-Math.PI/2,0,-Math.PI/2,Math.PI/2,-Math.PI/2,0],d=[.3991,0,0,.451,0,.082],offset=[0,-Math.PI/2,0,0,0,0];
const rawDhFk=q=>q.reduce((T,angle,index)=>multiply(T,dh(angle+offset[index],d[index],a[index],alpha[index])),identity(4));
const zeroDh=rawDhFk([0,0,0,0,0,0]),tool=identity(4);tool[0][0]=zeroDh[0][0];tool[0][1]=zeroDh[1][0];tool[0][2]=zeroDh[2][0];tool[1][0]=zeroDh[0][1];tool[1][1]=zeroDh[1][1];tool[1][2]=zeroDh[2][1];tool[2][0]=zeroDh[0][2];tool[2][1]=zeroDh[1][2];tool[2][2]=zeroDh[2][2];
const dhFk=q=>multiply(rawDhFk(q),tool);
const configurations=[[0,-30,20,0,30,0],[60,40,-70,100,45,180],[30,-35,40,45,20,60],[-45,10,-30,-80,65,-120],[90,-60,50,120,-40,250]].map(row=>row.map(value=>value*Math.PI/180));
for(const q of configurations)if(maxAbs(subtract(referenceFk(q),dhFk(q)))>1e-10)throw new Error("ABB参考链与课程等价D-H链复算失败");
const s=t=>10*t**3-15*t**4+6*t**5,sd=t=>30*t**2-60*t**3+30*t**4,sdd=t=>60*t-180*t**2+120*t**3;
for(const t of [0,1])if(Math.max(Math.abs(s(t)-t),Math.abs(sd(t)),Math.abs(sdd(t)))>1e-12)throw new Error("五次时间标度边界条件失败");
const abb={limits:[[-170,170],[-100,130],[-200,70],[-270,270],[-130,130],[-400,400]],start:[0,-30,20,0,30,0],goal:[60,40,-70,100,45,180],max:[288,240,297,400,405,600],duration:3};
const peaks=abb.goal.map((value,index)=>1.875*Math.abs(value-abb.start[index])/abb.duration);
if(!abb.goal.every((value,index)=>value>=abb.limits[index][0]&&value<=abb.limits[index][1]))throw new Error("ABB验证轨迹关节限位失败");
if(!peaks.every((value,index)=>value<=abb.max[index]))throw new Error("ABB验证轨迹速度约束失败");

const viewer=await readFile(join(root,"resources/knowledge/viewer.js"),"utf8");for(const token of ["knowledgeProgress","data-hint","points/","knowledge-extensions.json"])if(!viewer.includes(token))throw new Error(`知识学习页功能缺失: ${token}`);
const serviceWorker=await readFile(join(root,"service-worker.js"),"utf8");for(const token of ["robotics-smart-course-v12","NETWORK_FIRST","previousCourseCaches","includeUncontrolled:true","client.navigate(client.url)","cache.put(event.request","knowledge-system.js","question-bank.js","viewer.html","mesh-frames/manifest.json"])if(!serviceWorker.includes(token))throw new Error(`离线缓存缺失: ${token}`);
for(const token of ["updateViaCache:\"none\"","controllerchange","location.reload()"]){if(!app.includes(token))throw new Error(`自动更新机制缺失: ${token}`);}

const collectHtml=async directory=>{
  const files=[];
  for(const entry of await readdir(directory,{withFileTypes:true})){
    if([".git","node_modules"].includes(entry.name))continue;
    const target=join(directory,entry.name);
    if(entry.isDirectory())files.push(...await collectHtml(target));
    else if(entry.isFile()&&entry.name.endsWith(".html"))files.push(target);
  }
  return files;
};
const htmlFiles=await collectHtml(root),missingLinks=[];
for(const file of htmlFiles){
  const content=await readFile(file,"utf8");
  for(const match of content.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)){
    const raw=match[1].trim();
    if(!raw||raw.startsWith("#")||/^(?:https?:|mailto:|tel:|javascript:|data:)/i.test(raw))continue;
    let pathname;
    try{pathname=decodeURIComponent(raw.split(/[?#]/,1)[0]);}catch{pathname=raw.split(/[?#]/,1)[0];}
    if(!pathname)continue;
    const target=pathname.startsWith("/")?resolve(root,pathname.replace(/^\/+/,"")):resolve(dirname(file),pathname);
    try{await access(target);}catch{missingLinks.push(`${file.slice(root.length+1)} -> ${raw}`);}
  }
}
if(missingLinks.length)throw new Error(`发现失效本地链接:\n${missingLinks.slice(0,20).join("\n")}`);
console.log(`验证通过：57个核心知识点、15个工程延伸、48道模块题、ABB双链五构型复算、SO(3)、五次时间标度、AI阶段门禁与轨迹约束均通过。`);
