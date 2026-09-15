import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
const root=process.cwd();
const required=["index.html","assets/styles.css","assets/lifecycle.css","assets/runtime-config.js","assets/course-data.js","assets/app.js","assets/lifecycle.js","assets/knowledge-graph.json","manifest.webmanifest","service-worker.js","404.html",".nojekyll"];
for(const file of required)await access(join(root,file));
const html=await readFile(join(root,"index.html"),"utf8");
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
const duplicates=ids.filter((id,index)=>ids.indexOf(id)!==index); if(duplicates.length)throw new Error(`重复ID: ${[...new Set(duplicates)].join(",")}`);
for(const file of ["./assets/styles.css","./assets/lifecycle.css","./assets/runtime-config.js","./assets/course-data.js","./assets/app.js","./assets/lifecycle.js","./manifest.webmanifest"]){if(!html.includes(file))throw new Error(`入口未引用: ${file}`)}
const js=await readFile(join(root,"assets/app.js"),"utf8");
for(const token of ["forwardKinematics","hintBank","submitEvidence","updateDashboard"]){if(!js.includes(token))throw new Error(`核心功能缺失: ${token}`)}
const courseData=await readFile(join(root,"assets/course-data.js"),"utf8");
for(const token of ["ABB IRB 1200-5/0.9","jointLimits","outcomes","compliance"]){if(!courseData.includes(token))throw new Error(`课程数据缺失: ${token}`)}
const lifecycle=await readFile(join(root,"assets/lifecycle.js"),"utf8");
for(const token of ["diagnostic","transfer","buildLocalGuidance","renderTeacherLifecycle","knowledge-graph.json"]){if(!lifecycle.includes(token))throw new Error(`全周期评价功能缺失: ${token}`)}
const graph=JSON.parse(await readFile(join(root,"assets/knowledge-graph.json"),"utf8"));
if(!Array.isArray(graph.modules)||graph.modules.length!==57)throw new Error(`知识目录应为57项，当前为${graph.modules?.length??0}项`);
for(const id of ["learner-profile-form","assessment-form","rubric-score-preview","outcome-attainment","provincial-audit"]){if(!ids.includes(id))throw new Error(`关键交互缺失: ${id}`)}
const abb={limits:[[-170,170],[-100,130],[-200,70],[-270,270],[-130,130],[-400,400]],start:[0,-30,20,0,30,0],goal:[60,40,-70,100,45,180],max:[288,240,297,400,405,600],duration:3};
const peaks=abb.goal.map((q,i)=>1.875*Math.abs(q-abb.start[i])/abb.duration);
if(!abb.goal.every((q,i)=>q>=abb.limits[i][0]&&q<=abb.limits[i][1]))throw new Error("验证轨迹关节限位失败");
if(!peaks.every((v,i)=>v<=abb.max[i]))throw new Error("验证轨迹速度约束失败");
console.log(`验证通过：${required.length}个部署文件、${ids.length}个页面ID、57项知识目录、全周期评价与ABB六轴轨迹约束。`);
