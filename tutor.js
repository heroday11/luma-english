(function(){
'use strict';
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const modes = {reading:'阅读理解',vocabulary:'词汇运用',writing:'写作修改',conversation:'情景对话',diagnosis:'学习诊断','transfer-review':'复习与迁移'};
let accountId=null, login, status={}, sessions=[], active=null, busy=false, pending=null, generation=0;
function setAccount(id){if(accountId===id)return;accountId=id;active=null;pending=null;sessions=[];busy=false;generation++;const box=document.getElementById('tutorContent');if(box)box.replaceChildren();}
async function api(path, data, timeout=140000){
 const response=await fetch('/api/tutor/'+path,{method:data?'POST':'GET',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Study-Account':accountId||''},...(data?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(timeout)});
 const result=await response.json();if(!response.ok)throw new Error(result.error||'连接失败，请重试');return result;
}
function error(message){const node=document.getElementById('tutorError');if(node)node.textContent=message;}
function sessionMarkup(){return `<div class="tutor-history">${sessions.map(s=>`<button class="button secondary" data-tutor-session="${esc(s.id)}">${esc(modes[s.mode])} · ${esc(s.goal)}<br><small>${new Date(s.created*1000).toLocaleDateString()}</small></button>`).join('')||'<p class="muted">开始后，练习与回复会保存在当前账号。</p>'}</div>`;}
function chatMarkup(){
 if(!active)return '';
 return `<section class="card tutor-card tutor-chat" id="tutorChat"><div class="section-head"><h3>${esc(modes[active.mode])} · ${esc(active.goal)}</h3><span class="tag">${active.minutes} 分钟</span></div><div id="tutorMessages" aria-live="polite">${active.turns.map(t=>`<div class="tutor-message ${esc(t.role)} ${esc(t.status)}"><strong>${t.role==='user'?'我的尝试':'词境老师'}${t.status==='failed'?' · 尚未获得回复':''}</strong>${esc(t.text)}</div>`).join('')||'<p class="muted">告诉老师你想练什么，或直接提交一段自己的尝试。老师会先了解你的思路。</p>'}</div><form id="tutorMessageForm"><label for="tutorInput">你的问题或独立尝试</label><textarea id="tutorInput" maxlength="4000" placeholder="例如：请给我一段短文，先让我独立回答，再指出我的问题。" ${busy?'disabled':''}>${esc(pending?.text||'')}</textarea><div class="tutor-actions"><button class="button primary" type="submit" ${busy||!status.ready?'disabled':''}>${busy?'老师正在思考…':pending?'重试这次提问':'发送给老师'}</button></div><p class="tutor-privacy">发送后，本次文字、近期对话和必要学习表现会交给 DeepSeek 官方 API；不发送邮箱、密码或其他账号资料。回复是教学建议，不能作为官方等级或发音评分。</p></form></section>`;
}
function challengeMarkup(data){
 const t=data.task;
 if(data.done)return `<h3>独立复测已完成</h3><p>${data.result.correct?'本次回答正确。':'本次仍需巩固。'}${esc(data.result.explanation)}</p><p class="muted">${esc(data.note)}</p>`;
 if(!data.available)return `<h3>隔日复测已安排</h3><p>下一次使用新的阅读材料，检查你是否能独立判断证据。</p><p>开放时间：${new Date(data.dueAt*1000).toLocaleString()}</p><p class="muted">${esc(data.note)}</p>`;
 return `<h3>${esc(t.title)}</h3><p class="muted">先独立作答；每道题只记录首次提交。需要帮助时可以先退出小测，再去找老师练习。</p><p class="tutor-passsage" lang="en">${esc(t.passage)}</p><p lang="en"><strong>${esc(t.question)}</strong></p><form id="tutorChallengeForm">${t.options.map((o,i)=>`<label class="tutor-option"><input type="radio" name="challengeAnswer" value="${i}" required><span lang="en">${esc(o)}</span></label>`).join('')}<button class="button secondary" type="submit">提交独立答案</button><input type="hidden" name="challengeId" value="${esc(t.id)}"></form>`;
}
async function render(options){
 login=options.login;
 const nextId=options.account?.id||null;
 setAccount(nextId);
 const ticket=++generation, container=document.getElementById('tutorContent');
 container.innerHTML='<div class="loading-state">正在准备 AI 老师…</div>';
 try{status=await api('status',null,10000);if(ticket!==generation)return;
  if(accountId){const list=await api('sessions',null,10000);if(ticket!==generation)return;sessions=list.sessions;}
  container.innerHTML=`<section class="tutor-intro"><span class="eyebrow">LEARN · TRY · TRANSFER</span><h2>从“看懂答案”，走向自己会用。</h2><p>用一次独立尝试开始。老师根据你的思路提供提示，再用新的情境检验。</p><div class="tutor-status"><span>${status.installed?'DSH 已安装':'DSH 未安装'}</span><span>${status.configured?'DeepSeek 已配置':'等待配置模型密钥'}</span><span>6 项教学技能</span></div>${!status.ready?'<p><strong>首次使用：</strong>在项目文件夹双击“配置AI老师.cmd”，填写你的 DeepSeek 官方 API Key，然后点击下方刷新。密钥仅在本机加密保存。</p><button class="button secondary" id="tutorRefresh">刷新连接状态</button>':''}</section><p id="tutorError" class="tutor-error" role="alert"></p>${!accountId?'<section class="card tutor-card"><h3>为你保存连续的学习证据</h3><p>登录后开始教学对话和独立小测，每个账号分别保存。</p><button id="tutorLogin" class="button primary">登录 / 创建账号</button></section>':`<div class="tutor-grid"><section class="card tutor-card"><h3>今天想练什么</h3><form id="tutorStart"><label for="tutorMode">学习方式</label><select id="tutorMode">${Object.entries(modes).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select><label for="tutorGoal">具体目标</label><input id="tutorGoal" maxlength="300" required value="提升考研英语二阅读理解"><label for="tutorMinutes">可用时间（分钟）</label><input id="tutorMinutes" type="number" min="5" max="60" value="20" required><div class="tutor-actions"><button class="button primary" ${busy?'disabled':''}>开始新的学习</button></div></form></section><section class="card tutor-card"><h3>继续之前的学习</h3><div id="tutorHistory">${sessionMarkup()}</div></section></div><div id="tutorActive">${chatMarkup()}</div><section class="card tutor-card" id="tutorChallenge"><p>正在准备独立小测…</p></section>`}`;
  container.querySelector('#tutorLogin')?.addEventListener('click',()=>login());
  container.querySelector('#tutorRefresh')?.addEventListener('click',()=>render(options));
  container.querySelector('#tutorStart')?.addEventListener('submit',async event=>{event.preventDefault();if(busy)return;const form=event.currentTarget,button=form.querySelector('button');button.disabled=true;try{const created=await api('sessions',{mode:form.querySelector('#tutorMode').value,goal:form.querySelector('#tutorGoal').value,minutes:Number(form.querySelector('#tutorMinutes').value)});if(ticket!==generation)return;active=created;pending=null;sessions.unshift(active);document.getElementById('tutorHistory').innerHTML=sessionMarkup();drawChat();}catch(e){error(e.message)}finally{button.disabled=false}});
  container.onclick=async event=>{const button=event.target.closest('[data-tutor-session]');if(!button||busy)return;try{const loaded=await api('session?id='+encodeURIComponent(button.dataset.tutorSession));if(ticket!==generation)return;active=loaded;const failed=active.turns.findLast(t=>t.role==='user'&&t.status==='failed');pending=failed?{requestId:failed.id.slice(active.id.length+1),text:failed.text}:null;drawChat();}catch(e){error(e.message)}};
  bindChat();
  if(accountId){const challenge=await api('challenge');if(ticket!==generation)return;drawChallenge(challenge);}
 }catch(e){if(ticket===generation)container.innerHTML=`<div class="card tutor-card"><h3>AI 老师暂时无法连接</h3><p>${esc(e.message)}</p><p>如果刚升级，请重新启动词境服务。</p></div>`;}
}
function drawChat(){document.getElementById('tutorActive').innerHTML=chatMarkup();bindChat();document.getElementById('tutorChat')?.scrollIntoView({behavior:'smooth',block:'start'});}
function bindChat(){document.getElementById('tutorMessageForm')?.addEventListener('submit',async event=>{
 event.preventDefault();if(busy||!active)return;const text=document.getElementById('tutorInput').value.trim();if(!text)return;
 if(!pending||pending.text!==text)pending={requestId:crypto.randomUUID(),text};
 const owner=accountId,sid=active.id;busy=true;error('');drawChat();
 try{const updated=await api('message',{sessionId:sid,...pending});if(owner!==accountId||sid!==active?.id)return;active=updated;pending=null;}
 catch(e){if(owner===accountId&&sid===active?.id)error(e.message)}finally{if(owner===accountId&&sid===active?.id){busy=false;if(document.getElementById('tutorActive'))drawChat();}}
});}
function drawChallenge(data){const box=document.getElementById('tutorChallenge');box.innerHTML=challengeMarkup(data);box.querySelector('form')?.addEventListener('submit',async event=>{event.preventDefault();const ticket=generation,form=event.currentTarget,button=form.querySelector('button'),fields=new FormData(form);button.disabled=true;try{const result=await api('challenge',{id:fields.get('challengeId'),answer:Number(fields.get('challengeAnswer'))});if(ticket!==generation)return;drawChallenge(result.next);const feedback=document.createElement('p');feedback.className='tutor-feedback';feedback.textContent=(result.correct?'回答正确。':'还需要巩固。')+result.explanation;box.prepend(feedback);}catch(e){error(e.message);button.disabled=false;}});}
window.WordTutor={render,setAccount};
})();
