(() => {
  "use strict";
  const storageKey="robotics-smart-course-v1";
  const $=selector=>document.querySelector(selector);
  const escapeHtml=value=>{const node=document.createElement("div");node.textContent=String(value??"");return node.innerHTML;};
  const readState=()=>{try{return JSON.parse(localStorage.getItem(storageKey)||"{}");}catch{return {};}};
  const writeProgress=(id,key,checked)=>{const state=readState();const knowledgeProgress={...(state.knowledgeProgress||{})};knowledgeProgress[id]={...(knowledgeProgress[id]||{}),[key]:checked,updatedAt:new Date().toISOString()};localStorage.setItem(storageKey,JSON.stringify({...state,knowledgeProgress}));};
  async function load(){
    const id=new URLSearchParams(location.search).get("id")||"kp-1-1";
    const [graphResponse,extensionResponse]=await Promise.all([fetch("../../assets/knowledge-graph.json"),fetch("../../assets/knowledge-extensions.json")]);
    if(!graphResponse.ok||!extensionResponse.ok)throw new Error("知识数据加载失败");
    const graph=await graphResponse.json(),extensions=await extensionResponse.json();
    const all=[...(graph.modules||[]),...(extensions.modules||[])];
    const index=all.findIndex(item=>item.id===id),item=all[index];
    if(!item)throw new Error(`未找到知识点 ${id}`);
    const profile=item.id.startsWith("ext-")?item:window.getKnowledgeProfile(item);
    document.title=`${item.label} ${item.title} · 机器人学基础`;
    $("#unit-label").textContent=item.label;$("#unit-title").textContent=item.title;$("#unit-description").textContent=item.description;
    $("#unit-meta").innerHTML=[`第${item.chapter}章`,item.bloomLevel,item.learningType,`难度 ${item.difficulty}/5`,...(item.tags||[])].map(value=>`<span>${escapeHtml(value)}</span>`).join("");
    for(const key of ["outcome","task","evidence","criteria","remediation","prerequisites","verification","boundary"]){const node=$(`#unit-${key}`);if(node)node.textContent=profile[key]||"按本知识点任务完成独立验证并保留过程证据。";}
    if(item.id.startsWith("ext-")){
      $("#core-content").innerHTML=`<div class="extension-content"><h2>${escapeHtml(item.title)}工程学习页</h2><p>${escapeHtml(item.description)}</p><section><h3>建议操作顺序</h3><ol><li>声明对象、坐标系、单位、模型假设和软件版本。</li><li>${escapeHtml(item.task)}</li><li>保存${escapeHtml(item.evidence)}。</li><li>依据“${escapeHtml(item.criteria)}”自评，不通过时执行补证。</li></ol></section><section><h3>独立验证要求</h3><p>${escapeHtml(profile.verification||"使用至少一种独立方法交叉验证结果。")}</p></section><p class="truth"><b>证据边界：</b>${escapeHtml(profile.boundary||"工程结论仅在已声明条件下成立。")}</p></div>`;
    }else{
      const response=await fetch(`./points/${item.file}`);if(!response.ok)throw new Error(`内容文件缺失：${item.file}`);$("#core-content").innerHTML=await response.text();
    }
    const href=entry=>`./viewer.html?id=${encodeURIComponent(entry.id)}`;
    if(index>0){$("#prev-unit").href=href(all[index-1]);$("#prev-unit").textContent=`← ${all[index-1].label} ${all[index-1].title}`;}else $("#prev-unit").hidden=true;
    if(index<all.length-1){$("#next-unit").href=href(all[index+1]);$("#next-unit").textContent=`${all[index+1].label} ${all[index+1].title} →`;}else $("#next-unit").hidden=true;
    const current=readState().knowledgeProgress?.[id]||{};document.querySelectorAll("[data-progress]").forEach(input=>{input.checked=!!current[input.dataset.progress];input.addEventListener("change",()=>writeProgress(id,input.dataset.progress,input.checked));});
    const hints={1:`先定位：检查“${profile.prerequisites}”是否缺失，并圈出题目中未知量、参考系和约束。`,2:`检查路径：${profile.verification||"从定义、边界条件和独立复算三个方向检查。"}`,3:`局部支架：只完成首个检查步骤——${profile.remediation}。其余模型、代码、复算与结论由你继续完成。`};
    document.querySelectorAll("[data-hint]").forEach(button=>button.addEventListener("click",()=>{$("#hint-output").textContent=hints[button.dataset.hint];}));
  }
  $("#theme-toggle").addEventListener("click",()=>{const dark=document.documentElement.dataset.theme==="dark";document.documentElement.dataset.theme=dark?"light":"dark";localStorage.setItem("course-theme",dark?"light":"dark");});
  document.documentElement.dataset.theme=localStorage.getItem("course-theme")||"light";
  load().catch(error=>{$("#core-content").innerHTML=`<div class="loading">${escapeHtml(error.message)}</div>`;});
})();
