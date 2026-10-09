/* WordTrail — PDF vocabulary course, deliberate practice and local learning records. */
(() => {
'use strict';
const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const extraIcons = {arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',headphones:'<path d="M4 13v-3a8 8 0 0 1 16 0v3"/><rect x="2" y="12" width="5" height="9" rx="2"/><rect x="17" y="12" width="5" height="9" rx="2"/>',edit:'<path d="m16 3 5 5-12 12-6 1 1-6Z M13 6l5 5"/>',match:'<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="m9 6 6 12M9 18l6-12"/>',message:'<path d="M4 3h16v14H9l-5 4Z M8 7h8M8 11h6"/>',settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>'};
const icon = (name, size = 22) => extraIcons[name] ? `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${extraIcons[name]}</svg>` : window.UI_ICON ? window.UI_ICON(({fire:'flame',refresh:'repeat'})[name]||name, size) : `<span aria-hidden="true">${({book:'▤',play:'▶',sound:'♪',star:'★',check:'✓',close:'×',arrow:'→',fire:'♨',bolt:'ϟ',heart:'♥',refresh:'↻',headphones:'♫',trophy:'🏆',image:'▧',user:'☺',lock:'⌑'})[name] || '✦'}</span>`;
const mascot = () => window.MASCOT || '<span class="mascot-fallback" aria-hidden="true">🦊</span>';
const readJson = (key, fallback) => { try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); } catch { return fallback; } };
const qaMode = new URLSearchParams(location.search).get('qa') === '1';
let account = qaMode ? null : readJson('exam-study-session', null), authMode = 'login', toastTimer;
let serverAccount = false, syncTimer, syncChain = Promise.resolve(), syncStatus = 'checking', sessionIssue = '';
const store = {
 get(key, fallback) { if(qaMode)return readSessionJson(key,fallback); const value = readJson(`exam-study-${account?.id || 'guest'}-${key}`, undefined); return value === undefined ? (!account ? readJson(`exam-study-${key}`, fallback) : fallback) : value; },
 set(key, value) { try { if(qaMode){sessionStorage.setItem(`wordtrail-qa-${key}`,JSON.stringify(value));return;} localStorage.setItem(`exam-study-${account?.id || 'guest'}-${key}`, JSON.stringify(value)); } catch { toast('本机存储已满，请在个人中心导出学习记录。'); } }
};
function readSessionJson(key,fallback){try{return JSON.parse(sessionStorage.getItem(`wordtrail-qa-${key}`))??fallback;}catch{return fallback;}}
const state = { words: [], byId: {}, groups: [], group: null, content: {}, view: 'learn', known: new Set(), saved: new Set(), wrong: new Set(), due: {}, memory: {}, daily: {}, activity: {}, lessons: {}, history: [], xp: 0, goal: 10, sfx: true, rate: 1, details: {}, detailId: null, libraryQuery: '', libraryFilter: 'all', libraryYear: 'all', libraryLimit: 48, contextIndex: 0, subtitleMode: 'both', cards: {}, reviewEvents: [], collectionChanges: {}, plan: {}, session: null, draft: null };
const dateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const gloss = word => word.meanings?.length ? word.meanings.join('；') : '原词表未提供词义';
const shuffled = items => { const list = [...items]; for (let i=list.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [list[i],list[j]]=[list[j],list[i]]; } return list; };
const contentFor = word => state.content[word.word.toLowerCase()] || state.content[word.word] || state.content[word.originalWord?.toLowerCase()] || {};
const dictionaryFor = word => state.dictionary?.[word.word.toLowerCase()] || state.dictionary?.[word.originalWord?.toLowerCase()] || {};
const isLearnable = word => !!word&&!dictionaryFor(word).reviewRequired;
function prepareWords(items, recovered={}) {
 const corrections=new Map((recovered.corrections||[]).filter(c=>c.verified).map(c=>[c.index,c]));
 return items.map((raw,index)=>{
  const word={...raw,id:`${raw.word}-${raw.year}-${raw.text}-${index}`},fix=corrections.get(index);
  if(!fix||fix.originalWord!==raw.word||fix.originalYear!==raw.year||fix.originalText!==raw.text)return word;
  for(const key of ['word','meanings','pos','year','text','page'])if(fix[key]!==undefined)word[key]=fix[key];
  if(raw.word!==word.word)word.originalWord=raw.word;
  if(raw.text!==word.text)word.originalText=raw.text;
  word.sourceCorrection=fix.note;return word;
 });
}
const detailsFor = word => { if (!state.details[word.id]) { const local = contentFor(word), dictionary=dictionaryFor(word); const curated=(local.senses || []).map((s,i) => ({...s,id:s.id||word.word+':'+i,pos:s.pos||word.pos,curated:true})); const aligned=(dictionary.alignedSenses||[]).map(s=>({...s,exampleEn:WordContent.target(word,s,dictionary)?s.exampleEn:'',exampleZh:WordContent.target(word,s,dictionary)?s.exampleZh:'',offline:true,curated:s.source==='WordTrail original',equivalent:s.zhType==='equivalent-lemmas'})); state.details[word.id] = { phonetic: local.phonetic || dictionary.phonetic || '', senses: curated.length?curated:aligned, images:[illustration(word)], loaded:false, imageDone:false, onlineDone:false }; } return state.details[word.id]; };
const overlayOrigins = new Map();
function visibleOverlay() {
 const image=$('#imageModal'),auth=$('#authModal'),lesson=$('#lessonOverlay'),cancel=$('#cancelShade');
 if(image&&!image.hidden)return image;if(auth&&!auth.hidden)return auth;
 if(lesson&&!lesson.hidden)return cancel||lesson;return null;
}
function focusableIn(root) { return [...root.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])')].filter(el=>!el.closest('[hidden], [inert]')&&el.getClientRects().length>0); }
function rememberOverlayOrigin(id) {
 if(overlayOrigins.has(id))return;const el=document.activeElement;
 let selector=el?.id?'#'+CSS.escape(el.id):null;
 if(!selector&&el?.dataset){for(const key of ['lesson','practice','wordId','action'])if(el.dataset[key]){const attr=key==='wordId'?'word-id':key;selector=`[data-${attr}="${CSS.escape(el.dataset[key])}"]`;break;}}
 overlayOrigins.set(id,{element:el,selector});
}
function syncOverlayInteraction() {
 const active=visibleOverlay(),lesson=$('#lessonOverlay'),cancel=$('#cancelShade');
 for(const root of document.querySelectorAll('.sidebar, .app-body')){root.inert=!!active;if(active)root.setAttribute('aria-hidden','true');else root.removeAttribute('aria-hidden');}
 for(const root of document.querySelectorAll('#authModal, #imageModal'))root.inert=!root.hidden&&root!==active;
 if(lesson){lesson.inert=!lesson.hidden&&active!==lesson&&active!==cancel;}
 if($('#lessonShell'))for(const child of $('#lessonShell').children)child.inert=!!cancel&&!lesson.hidden&&child!==cancel;
 if(active&&!active.hasAttribute('tabindex'))active.setAttribute('tabindex','-1');
}
function focusOverlay(root,preferred) {
 if(!root||root.hidden||visibleOverlay()!==root)return;const target=preferred?root.querySelector(preferred):null;
 (target||focusableIn(root)[0]||root).focus({preventScroll:true});
}
function showOverlay(id,preferred) { const node=$('#'+id);if(!node)return;rememberOverlayOrigin(id);node.hidden=false;syncOverlayInteraction();setTimeout(()=>focusOverlay(node,preferred),25); }
function returnOverlayFocus(id) {
 const origin=overlayOrigins.get(id);overlayOrigins.delete(id);setTimeout(()=>{
  const active=visibleOverlay();let target=origin?.element;
  if(!target?.isConnected||target.closest('[hidden], [inert]'))target=origin?.selector?$(origin.selector):null;
  if(target?.isConnected&&!target.closest('[hidden], [inert]')&&(!active||active.contains(target))){target.focus({preventScroll:true});return;}
  if(active)focusOverlay(active);else $('.nav-item.active')?.focus({preventScroll:true});
 },25);
}
function hideOverlay(id) { const node=$('#'+id);if(!node)return;node.hidden=true;syncOverlayInteraction();returnOverlayFocus(id); }
function closeCancelDialog(restore=true) { const dialog=$('#cancelShade');if(!dialog)return;dialog.remove();syncOverlayInteraction();if(restore)returnOverlayFocus('cancelShade');else overlayOrigins.delete('cancelShade'); }
document.addEventListener('focusin',event=>{const active=visibleOverlay();if(active&&!active.contains(event.target))focusOverlay(active);},true);
document.addEventListener('keydown',event=>{
 if(event.key!=='Tab')return;const active=visibleOverlay();if(!active)return;const targets=focusableIn(active),first=targets[0],last=targets[targets.length-1];
 if(!targets.length){event.preventDefault();active.focus();return;}
 if(!active.contains(document.activeElement)){event.preventDefault();(event.shiftKey?last:first).focus();return;}
 if(event.shiftKey&&(document.activeElement===first||document.activeElement===active)){event.preventDefault();last.focus();}
 else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===active)){event.preventDefault();first.focus();}
},true);
function loadProgress() {
 WordTutor.setAccount(account?.id||null);
 state.known = new Set(store.get('known', [])); state.saved = new Set(store.get('saved', [])); state.wrong = new Set(store.get('wrong', []));
 state.due = store.get('due', {}); state.memory = store.get('memory', {}); state.daily = store.get('daily', {}); state.activity = store.get('activity', {}); state.lessons = store.get('lessons', {}); state.history = store.get('quizzes', []);
 state.collectionChanges=store.get('collectionChanges',{});state.cards=store.get('cards',{});state.reviewEvents=store.get('reviewEvents',[]);state.plan=store.get('plan',{});state.subtitleMode=store.get('subtitleMode','both');state.view=store.get('view','learn'); state.xp = store.get('xp', 0); state.goal = store.get('goal', 10); state.sfx = store.get('sfx', true); state.rate = store.get('rate', 1); state.draft = store.get('draft', null);
 const selected = store.get('group', null); if (state.groups.length) state.group = state.groups.find(g => g.id === selected) || state.groups[0];
}
function persist() { for (const key of ['due','memory','daily','activity','lessons','xp','goal','sfx','rate','cards','reviewEvents','collectionChanges','plan','subtitleMode']) store.set(key,state[key]); store.set('known',[...state.known]); store.set('saved',[...state.saved]); store.set('wrong',[...state.wrong]); store.set('quizzes',state.history.slice(0,200)); queueServerSave(); }
const progressKeys = ['known','saved','wrong','due','memory','daily','activity','lessons','quizzes','xp','goal','sfx','rate','draft','group','cards','reviewEvents','collectionChanges','plan','subtitleMode'];
function snapshot() { return { schemaVersion:3,cards:state.cards,reviewEvents:state.reviewEvents,collectionChanges:state.collectionChanges,plan:state.plan,subtitleMode:state.subtitleMode, known:[...state.known],saved:[...state.saved],wrong:[...state.wrong],due:state.due,memory:state.memory,daily:state.daily,activity:state.activity,lessons:state.lessons,quizzes:state.history.slice(0,200),xp:state.xp,goal:state.goal,sfx:state.sfx,rate:state.rate,draft:state.draft,group:state.group?.id||store.get('group',null) }; }
async function api(path, options={}) {
 const scoped=path==='/api/progress'||path==='/api/auth/logout'||path==='/api/auth/recovery-code';const headers={'Content-Type':'application/json',...(scoped&&account?{'X-Study-Account':String(account.id)}:{}),...(options.headers||{})};
 const res=await fetch(path,{credentials:'same-origin',signal:AbortSignal.timeout(15000),...options,headers});const data=await res.json().catch(()=>({}));
 if(!res.ok){if(scoped&&(data.code==='ACCOUNT_MISMATCH'||res.status===401)){sessionIssue=data.code==='ACCOUNT_MISMATCH'?'ACCOUNT_MISMATCH':'SESSION_EXPIRED';serverAccount=false;syncStatus='offline';clearTimeout(syncTimer);toast(sessionIssue==='ACCOUNT_MISMATCH'?'账号已在其他窗口切换。当前记录保留在原账号本机缓存，请重新登录。':'登录已过期，学习记录仍保存在本机，请重新登录。');if(state.view==='profile'&&state.words.length)renderProfile();}const error=new Error(data.error||data.message||'账号服务暂时不可用，请稍后再试。');error.code=data.code;throw error;}return data;
}
function markSyncDirty() { const meta=store.get('syncMeta',{revision:0,dirty:false});const next={revision:(Number(meta.revision)||0)+1,dirty:true,updatedAt:Date.now()};store.set('syncMeta',next);return next; }
function queueServerSave() { if(qaMode||!account)return;markSyncDirty();clearTimeout(syncTimer);syncStatus=serverAccount?'saving':'offline';if(serverAccount)syncTimer=setTimeout(flushServerSave,450); }
async function flushServerSave() {
 clearTimeout(syncTimer);if(qaMode||!account)return true;if(!serverAccount)return !store.get('syncMeta',{}).dirty;
 const id=account.id,meta=store.get('syncMeta',{revision:0,dirty:false});if(!meta.dirty){await syncChain;return !store.get('syncMeta',{}).dirty;}
 const payload=JSON.parse(JSON.stringify(snapshot()));payload._sync={revision:meta.revision,updatedAt:meta.updatedAt};
 syncChain=syncChain.then(async()=>{
  if(account?.id!==id||!serverAccount)return false;
  try {
   let result;
   try {result=await api('/api/progress',{method:'PUT',body:JSON.stringify({data:payload,baseRevision:store.get('serverRevision',0)})});}
   catch(error){if(error.code!=='PROGRESS_CONFLICT')throw error;const remote=await api('/api/progress');store.set('serverRevision',remote.revision||0);const merged=WordMemory.merge(remote.data,payload);result=await api('/api/progress',{method:'PUT',body:JSON.stringify({data:merged,baseRevision:remote.revision||0})});if(account?.id===id){const latest=WordMemory.merge(merged,snapshot());for(const key of progressKeys)if(latest[key]!==undefined)store.set(key,latest[key]);loadProgress();}}
   store.set('serverRevision',result.revision||0);
   const current=store.get('syncMeta',{});if(current.revision===meta.revision)store.set('syncMeta',{...current,dirty:false,savedAt:Date.now()});
   syncStatus=store.get('syncMeta',{}).dirty?'saving':'saved';if(syncStatus==='saving')syncTimer=setTimeout(flushServerSave,600);return true;
  }catch{syncStatus='offline';return false;}
 });
 return await syncChain;
}
async function restoreAccountProgress() {
 loadProgress();let remote;try{remote=await api('/api/progress');}catch{syncStatus='offline';return false;}
 store.set('serverRevision',remote.revision||0);const dirty=store.get('syncMeta',{}).dirty;
 const data=dirty?WordMemory.merge(remote.data,snapshot()):remote.data;
 if(data&&Object.keys(data).length){for(const key of progressKeys)if(data[key]!==undefined)store.set(key,data[key]);loadProgress();}
 if(dirty)return await flushServerSave();syncStatus='saved';return true;
}
async function bootstrapAccount() {
 if(qaMode){account=null;serverAccount=false;syncStatus='guest';loadProgress();return;}
 try {const me=await api('/api/auth/me');account=me.account||null;serverAccount=!!account;if(account){localStorage.setItem('exam-study-session',JSON.stringify(account));await restoreAccountProgress();}else{localStorage.removeItem('exam-study-session');loadProgress();syncStatus='guest';}}
 catch{serverAccount=false;syncStatus='offline';loadProgress();}
}
function streak() { let count=0, d=new Date(); if (!hasActivity(dateKey(d))) d.setDate(d.getDate()-1); while(hasActivity(dateKey(d))) { count++; d.setDate(d.getDate()-1); } return count; }
function hasActivity(key) { return (state.activity[key]?.answered || 0) > 0 || (Number(state.daily[key]) || 0) > 0; }
const dueWords = () => distinctWords(state.words.filter(w=>isLearnable(w)&&state.due[w.id]&&state.due[w.id]<=Date.now())).sort((a,b)=>(state.due[a.id]||Infinity)-(state.due[b.id]||Infinity));
function cardKeys(word){return state.cardIndex?.[word.id]||[];}
function refreshMemoryStatus(){
 state.cardIndex={};const sources={};for(const word of state.words){const base=WordMemory.key(word,'choice').split('|').slice(0,-1).join('|');(sources[base]||=[]).push(word.id);}for(const [key,card]of Object.entries(state.cards)){const ids=card.sourceIds||sources[key.split('|').slice(0,-1).join('|')]||[];for(const id of ids)(state.cardIndex[id]||=[]).push(key);}
 for(const word of state.words){const keys=cardKeys(word);if(keys.length){state.due[word.id]=Math.min(...keys.map(k=>new Date(state.cards[k].due).getTime()));if(keys.some(k=>state.cards[k].lastRating===1))state.wrong.add(word.id);else if(keys.every(k=>state.cards[k].lastRating>1))state.wrong.delete(word.id);const stable=keys.some(k=>k.split('|').pop()!=='recognition'&&state.cards[k].scheduled_days>=7);if(stable&&keys.every(k=>WordMemory.recall(state.cards[k])>=.8))state.known.add(word.id);else state.known.delete(word.id);}else if(state.due[word.id]&&state.due[word.id]<Date.now())state.known.delete(word.id);}
}
function recordAnswer(q,r,correct,s){
 const time=Date.now(),event={id:crypto.randomUUID(),session:s.id,question:q.id,kind:q.kind,wid:q.wid,wids:q.wids||[q.wid],correct,hinted:!!r.hinted,retry:!!q.retry,time,responseMs:time-(r.startedAt||time),answer:q.kind==='spell'?r.input:q.kind==='order'?r.tokens.map(i=>q.tokens[i]).join(' '):r.selected};
 for(const id of event.wids){const word=state.byId[id];if(!word)continue;const sense=q.sense||null,key=WordMemory.key(word,q.kind,sense),old=state.cards[key],rating=WordMemory.grade({correct,hinted:r.hinted,retry:q.retry,kind:q.kind==='cloze'&&!q.free?'choice':q.kind});event.ratings||=[];
  // Successful practice before due does not enlarge the scheduled interval.
  const advance=!old||new Date(old.due).getTime()<=time||rating===WordMemory.Rating.Again;
  if(advance){const result=WordMemory.review(old,rating,time);state.cards[key]={...result.card,lastRating:rating,sourceIds:[...new Set([...(old?.sourceIds||[]),...state.words.filter(w=>WordMemory.key(w,q.kind,sense)===key).map(w=>w.id)])],lemma:word.word,skill:WordMemory.skill(q.kind)};event.ratings.push({key,rating,log:result.log});}else event.ratings.push({key,rating,early:true});
  const memory=state.memory[id]||{attempts:0,lapses:0};memory.attempts++;memory.last=time;if(!correct||r.hinted){memory.lapses++;state.wrong.add(id);}else if(!q.retry)state.wrong.delete(id);state.memory[id]=memory;
 }
 state.reviewEvents.push(event);s.answers.push(event);if(!q.retry){const day=dateKey(),a=state.activity[day]||{xp:0,answered:0,lessons:0,words:[],minutes:0};a.answered++;a.words=[...new Set([...(a.words||[]),...event.wids])];state.activity[day]=a;}refreshMemoryStatus();persist();return event;
}

const learnedCount = () => new Set(state.words.filter(w=>state.due[w.id]).map(w=>w.word.toLowerCase())).size;
function toast(message) { const node=$('#toast'); if(!node)return; node.textContent=message; node.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>node.classList.remove('show'),2600); }
let audioContext;
function tone(type='tap') {
 if(!state.sfx)return;
 try { const C=window.AudioContext||window.webkitAudioContext; if(!C)return; audioContext ||= new C(); if(audioContext.state==='suspended') audioContext.resume(); const now=audioContext.currentTime, notes={tap:[520],correct:[659,831,988],wrong:[262,220],start:[440,659],finish:[523,659,784,1047],match:[784,988]}[type]||[520]; notes.forEach((hz,i)=>{ const o=audioContext.createOscillator(), g=audioContext.createGain(), t=now+i*.075; o.type=type==='wrong'?'triangle':'sine';o.frequency.value=hz;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(type==='tap'?.025:.055,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+.18);o.connect(g);g.connect(audioContext.destination);o.start(t);o.stop(t+.2); }); } catch {}
}
function speak(text,rate=state.rate){
 const s=state.session,q=s?.phase==='questions'?s.questions[s.qindex]:null,context=!s&&state.view==='context'?groupContext()[state.contextIndex]:null;
 const word=q?state.byId[q.wid]:s?.phase==='learn'?state.byId[s.learnIds[s.learnIndex]]:state.view==='library'?state.byId[state.detailId]:context?.word;
 const sense=q?.sense||(!s&&state.view==='library'&&word?detailsFor(word).senses[state.detailSenseIndex||0]:context?.sense);
 WordAudio.speak(WordContent.speechText(text,word,sense),rate);
}

function groupTitle(group) { if(group.year==='2010' && group.text==='Text 1') return '艺术与拍卖'; const joined=group.words.map(gloss).join(''); const topics=[[/法律|法院|审判|律师|司法|陪审/,'法律与社会'],[/就业|职业|工作|雇佣|员工/,'工作与生活'],[/科学|技术|互联网|网络|计算机/,'科技与未来'],[/学校|教育|学生|学习|教师/,'教育与成长'],[/自然|环境|气候|生态|污染/,'自然与环境'],[/市场|经济|企业|公司|商业/,'经济与商业']]; return topics.find(([r])=>r.test(joined))?.[1] || '真题阅读词汇'; }
function updateHeader() {
 const titles={tutor:['AI 老师','先独立尝试，再获得帮助，最后换个情境检验'],learn:['学习路径','每天一小步，让真题词汇变熟悉'],library:['我的词库','词义、例句与图片，让每个词都有上下文'],practice:['练习中心','多种玩法，把“眼熟”练成“记得”'],context:['语境听读','一句一句听，读懂单词的真实用法'],profile:['个人中心','看见每一次积累']};
 if($('#headerTitle'))$('#headerTitle').textContent=titles[state.view][0]; if($('#headerSubtitle'))$('#headerSubtitle').textContent=titles[state.view][1];
 if($('#topStreak'))$('#topStreak').textContent=streak(); if($('#topXp'))$('#topXp').textContent=state.xp.toLocaleString();
 if($('#accountButton')) { $('#accountButton').innerHTML=icon('user',20)+`<span>${esc(account?.name || '登录 / 注册')}</span>`; $('#accountButton').setAttribute('aria-label',account?'打开个人中心':'登录或创建学习账号'); }
 if($('#toggleSfx')) { $('#toggleSfx').innerHTML=icon('sound',20); $('#toggleSfx').classList.toggle('muted',!state.sfx); $('#toggleSfx').setAttribute('aria-pressed',String(state.sfx)); $('#toggleSfx').setAttribute('aria-label',state.sfx?'关闭互动音效':'开启互动音效'); }
}
function rail() {
 const today=state.activity[dateKey()]||{}, count=today.words?.length||Number(state.daily[dateKey()])||0, percent=Math.min(100,Math.round(count/state.goal*100)), due=dueWords().length;
 $('#rightRail').innerHTML=`<section class="rail-card daily-goal"><div class="section-head"><h3>今日目标</h3><button class="icon-btn" data-view="profile" aria-label="调整每日目标">${icon('settings',18)}</button></div><div class="goal-ring" style="--progress:${percent}%"><div><strong>${Math.min(count,state.goal)}<span> / ${state.goal}</span></strong><small>词汇目标</small></div></div><p class="muted">${percent>=100?'今天的目标已完成，做得不错！':'学习或复习一组，给今天一点进步。'}</p><div class="quest-row"><span>${icon('bolt',20)} 今日经验</span><strong>${today.xp||0} XP</strong></div></section><section class="rail-card"><div class="section-head"><h3>保持学习节奏</h3>${icon('fire',22)}</div><div class="streak-number"><strong>${streak()}</strong><span>天连续学习</span></div><div class="week-dots">${Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return `<span class="${hasActivity(dateKey(d))?'active':''}" aria-label="${dateKey(d)} ${hasActivity(dateKey(d))?'已学习':'未学习'}">${['日','一','二','三','四','五','六'][d.getDay()]}</span>`;}).join('')}</div></section><section class="rail-card review-rail"><div class="section-head"><h3>记忆补给站</h3>${icon('refresh',22)}</div><p><strong>${due}</strong> 个词到了复习时间</p><p class="muted">先回忆，再核对。间隔复习会随着记忆变牢而延长。</p><button class="button secondary full" data-action="review">${due?'开始今日复习':'查看练习中心'} ${icon('arrow',18)}</button></section><section class="rail-card rail-tip"><div class="mascot mini">${mascot()}</div><p>每次只学 5 个新词。<br>把学过的词放回句子里。</p><small>词表来自你的考研英语二 PDF</small></section>`;
}
function switchView(view) {
 if(!['learn','library','practice','context','profile','tutor'].includes(view))return;
 state.view=view;store.set('view',view);WordAudio.stop();WordAudio.release(); document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
 for(const key of ['learn','library','practice','context','profile','tutor']) { const panel=$(`#${key}View`); if(panel)panel.hidden=key!==view; }
 renderView(); updateHeader(); rail(); window.scrollTo({top:0,behavior:'smooth'});
}
function renderView() { ({learn:renderPath,library:renderLibrary,practice:renderPractice,context:renderContext,profile:renderProfile,tutor:()=>WordTutor.render({account,login:()=>openAuth('login')})})[state.view](); }
function selectGroup(id) { WordAudio.stop();WordAudio.release();const g=state.groups.find(g=>g.id===id); if(!g)return; state.group=g;state.contextIndex=0;store.set('group',id);queueServerSave();renderView();rail(); }
function groupSelect() { return `<div class="course-switch"><label for="courseSelect">${icon('book',20)} 考研英语二 · 真题课程</label><select id="courseSelect" class="select-control" aria-label="切换真题年份和阅读篇目">${state.groups.map(g=>`<option value="${esc(g.id)}" ${g.id===state.group.id?'selected':''}>${g.year} 年 · ${esc(g.text)} · ${groupTitle(g)}</option>`).join('')}</select></div>`; }
function renderPath() {
 const group=state.group;if(!group)return;const completed=group.lessons.filter(l=>state.lessons[l.id]).length,currentIndex=group.lessons.findIndex(l=>!state.lessons[l.id]);
 let path='';group.lessons.forEach((lesson,index)=>{const done=!!state.lessons[lesson.id],current=!done&&index===currentIndex,status=done?'done':current?'current':'locked';
 path+=`<div class="path-row position-${index%4}"><div class="path-tooltip ${current?'visible':''}">${done?'再练一次':current?'从这里开始':'第 '+(index+1)+' 关'}</div><button class="path-node ${status}" data-action="lesson" data-lesson="${esc(lesson.id)}" aria-label="${done?'已完成':current?'当前关卡':'待解锁'} 第${index+1}关，${lesson.words.map(w=>w.word).join('、')}">${icon(done?'check':current?'star':'lock',31)}</button><div class="node-label"><strong>${index===0?'开启词汇之旅':'词汇关卡 '+(index+1)}</strong><span>${lesson.words.length} 个新词 · ${done?'已完成':current?'约 4 分钟':'完成上一关解锁'}</span></div></div>`;
 if(index===1&&groupContext(group).length)path+=`<div class="path-row checkpoint"><button class="path-node context-node" data-view="context" aria-label="进入语境听读">${icon('headphones',28)}</button><div class="node-label"><strong>语境小站</strong><span>听读双语例句</span></div></div>`;
 if(index===3)path+=`<div class="path-row checkpoint"><button class="path-node review-node" data-action="review" aria-label="复习已经学过的词">${icon('refresh',27)}</button><div class="node-label"><strong>记忆补给站</strong><span>巩固学过的词</span></div></div>`;
 });
 $('#pathContent').innerHTML=`${groupSelect()}${planMarkup()}${courseOverview()}${state.draft?`<section class="resume-card card"><div>${icon('play',24)}<div><strong>继续未完成的学习</strong><p class="muted">${esc(state.draft.title)} · 进度已保存在本机</p></div></div><button class="button secondary" data-action="resume">继续</button></section>`:''}<section class="unit-banner"><div><span class="eyebrow">${group.year} · ${esc(group.text)} / 阅读词汇</span><h2>${groupTitle(group)}</h2><p>${group.words.filter(isLearnable).length} 个词 · ${group.lessons.length} 个小关卡${group.words.some(w=>!isLearnable(w))?` · ${group.words.filter(w=>!isLearnable(w)).length} 条原文待校对`:''}</p><div class="unit-summary"><span>${completed} / ${group.lessons.length} 关已完成</span><div class="progress-track"><i style="width:${completed/group.lessons.length*100}%"></i></div></div></div><div class="mascot">${mascot()}</div></section><div class="path-map">${path}<div class="path-finish">${icon('trophy',36)}<strong>单元完成</strong><span>复习这些词，再进入下一篇真题。</span>${completed===group.lessons.length?`<button class="button primary" data-action="next-group">进入下一单元</button>`:''}</div></div><p class="path-source muted">按 PDF 原始年份与篇目组织 · 共 ${state.groups.length} 个单元 · ${state.words.length.toLocaleString()} 个词条</p>`;
}
function illustration(word) {
 const local=contentFor(word), text=word.word+' '+gloss(word), palette=['#e4f4ee','#eee8fc','#fff0d8','#e1f1ff'][[...word.word].reduce((s,c)=>s+c.charCodeAt(0),0)%4];
 const symbol=/领导|指挥|主持/.test(text)?'👥':/铅|金属/.test(text)?'⚙️':/音符/.test(text)?'🎵':/留言/.test(text)?'✉️':/画|艺术|拍卖|gallery|art|paint|auction/.test(text)?'🎨':/经济|钱|价格|市场|money|price|market/.test(text)?'🏷️':/法院|法律|law|court|trial/.test(text)?'⚖️':/学校|书|学习|read|book|learn/.test(text)?'📚':/环境|树|自然|climate|nature|tree/.test(text)?'🌱':/工作|职业|work|job/.test(text)?'💼':/食|吃|food|eat/.test(text)?'🍽️':/家|建筑|home|house/.test(text)?'🏡':'💡';
 const wordSize=Math.min(40,Math.max(12,Math.floor(540/(word.word.length*.58)))),meaning=word.meanings?.[0]||'词义联想',meaningLines=[...meaning].reduce((rows,c,i)=>{const line=Math.floor(i/28);if(line<2)(rows[line]||=[]).push(c);return rows;},[]).map(r=>r.join(''));
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420"><rect width="640" height="420" rx="26" fill="${palette}"/><circle cx="520" cy="80" r="110" fill="#fff" opacity=".55"/><circle cx="80" cy="370" r="150" fill="#fff" opacity=".4"/><text x="320" y="198" text-anchor="middle" font-family="Arial,sans-serif" font-size="116">${symbol}</text><text x="320" y="283" text-anchor="middle" font-family="Arial,sans-serif" font-size="${wordSize}" font-weight="700" fill="#263e4a">${esc(word.word)}</text>${meaningLines.map((line,i)=>`<text x="320" y="${324+i*28}" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#526472">${esc(line)}${i===1&&meaning.length>56?'…':''}</text>`).join('')}</svg>`;
 const url='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg); return {thumb:url,full:url,source:`https://commons.wikimedia.org/wiki/Special:MediaSearch?type=image&search=${encodeURIComponent(local.imageQuery||word.word)}`,artist:'词境词义联想图',license:'本地插画',local:true};
}
function imagesMarkup(word, detail, limit=3) {
 const fallback=illustration(word);return `<div class="image-grid">${detail.images.slice(0,limit).map(img=>`<figure class="photo-item"><button class="photo-view" data-full-image="${esc(img.thumb||img.full)}" data-image-source="${esc(img.source)}" data-fallback="${esc(fallback.thumb)}" data-fallback-source="${esc(fallback.source)}" aria-label="放大 ${esc(word.word)} 图片"><img src="${esc(img.thumb)}" alt="${esc(word.word)} 词义联想" loading="lazy" data-fallback-image="${esc(fallback.thumb)}"></button><figcaption>${img.local?'词义联想插画':esc(img.artist)+' · '+esc(img.license)}<a href="${esc(img.source)}" target="_blank" rel="noreferrer">${img.local?'搜索真实配图':'图片来源'} ↗</a></figcaption></figure>`).join('')}</div>`;
}
function sensesMarkup(word, detail, limit=8, offset=0) {
 if(!detail.senses.length) return `<div class="sense-pair"><div><span class="sense-label">中文 · PDF 原文</span><p>${esc(gloss(word))}</p></div><div><span class="sense-label">English definition</span><p class="muted">${detail.onlineDone?'暂未查到可配对的英文释义。可点击词典来源继续查询。':'正在查找英文释义与对应中文解释…'}</p></div></div>`;
 return detail.senses.slice(offset,offset+limit).map((s,i)=>`<article class="sense-pair"><div class="sense-label">${String(i+offset+1).padStart(2,'0')} <span>${esc(s.pos||word.pos||'')}</span> ${s.curated?'<span class="tag">双语释义</span>':s.offline?`<span class="tag">离线词典${s.equivalent?' · 中文近义词':''}</span>`:'<span class="tag">在线词典</span>'}</div><div class="definition-en">${esc(s.en)}</div><div class="definition-zh">${s.equivalent?'<span class="sense-label">中文近义词（非完整释义译文）</span> ':''}${s.zh?esc(s.zh):'<span class="muted">对应中文译文暂未取得，保留原文供核对。</span>'}</div>${s.exampleEn?`<div class="example-pair"><button class="icon-btn" data-speak="${esc(s.exampleEn)}" aria-label="朗读例句">${icon('sound',18)}</button><div><p>${esc(s.exampleEn)}</p><p class="muted">${s.exampleZh?esc(s.exampleZh):detail.onlineDone?'例句译文暂未取得':'正在补充对应中文译文…'}</p></div></div>`:''}</article>`).join('');
}
function dictionaryMarkup(word) {
 const d=dictionaryFor(word);if(!(d.chineseMeanings?.length||d.englishDefinitions?.length||d.forms?.length))return '';
 return `<details class="dictionary-extra"><summary>更多词义与词形 <span>开源离线词典</span></summary><div class="dictionary-content">${d.chineseMeanings?.length?`<h4>中文词义</h4>${d.chineseMeanings.map(s=>`<p><b>${esc(s.pos)}</b> ${esc(s.text)}</p>`).join('')}`:''}${d.englishDefinitions?.length?`<h4>英文词典释义</h4><p class="source-note">以下是该词的独立英文释义；上方对照区按同一词义组织。</p>${d.englishDefinitions.map(s=>`<p class="dictionary-definition"><b>${esc(s.pos)}</b> ${esc(s.text)}</p>`).join('')}`:''}${d.forms?.length?`<h4>常见词形</h4><div class="word-forms">${d.forms.map(f=>`<span>${esc(f.label)} <strong>${esc(f.word)}</strong></span>`).join('')}</div>`:''}${d.note?`<p class="source-note">${esc(d.note)}</p>`:''}</div></details>`;
}
async function translate(text) {
 if(!text)return''; const cache=store.get('translations',{});if(cache[text])return cache[text];
 try { const response=await fetch('/api/translate?'+new URLSearchParams({text:text.slice(0,480)}),{signal:AbortSignal.timeout(13000)}); if(!response.ok)return'';const json=await response.json();const value=decode(json.responseData?.translatedText||'').trim();if(json.responseStatus===200&&value&&!/please select|MYMEMORY WARNING|QUOTA EXCEEDED/i.test(value)){cache[text]=value;store.set('translations',cache);return value;} }catch{} return'';
}
function decode(html) { const div=document.createElement('div');div.innerHTML=html||'';return div.textContent||''; }
async function lookup(word, force=false) {
 const d=detailsFor(word);if(d.loading||!force&&(d.loaded||d.retryAt>Date.now()))return;d.loading=true;d.onlineDone=false;let successful=true;
 const redraw=()=>{ if(state.detailId===word.id&&state.view==='library') renderDetail();if(state.view==='context'&&groupContext()[state.contextIndex]?.word.id===word.id)renderContext();const s=state.session;if(s?.phase==='learn'&&s.revealed&&s.learnIds[s.learnIndex]===word.id) updateFlashcardDetail(word); };
 const jobs=[(async()=>{if(d.senses.some(s=>s.curated))return;for(const sense of d.senses.slice(0,3)){if(sense.exampleEn&&!sense.exampleZh){sense.exampleZh=await translate(sense.exampleEn);redraw();}}})(),(async()=>{if(d.senses.filter(s=>s.curated||s.offline).length>=2&&!force){d.onlineDone=true;return;}try{const res=await fetch('/api/dictionary/'+encodeURIComponent(word.word),{signal:AbortSignal.timeout(15000)});if(!res.ok)throw new Error();const entries=await res.json(),entry=entries[0];d.phonetic ||= entry?.phonetic||entry?.phonetics?.find(p=>p.text)?.text||'';d.audio=entry?.phonetics?.find(p=>p.audio)?.audio||'';
 const senses=(entry?.meanings||[]).flatMap(m=>(m.definitions||[]).map(x=>({pos:m.partOfSpeech,en:decode(x.definition),zh:'',exampleEn:decode(x.example||''),exampleZh:'',curated:false}))).filter(s=>s.en).map(s=>({...s,...(!WordContent.target(word,s,dictionaryFor(word))?{exampleEn:'',exampleZh:''}:{})})).slice(0,5);
 if(!d.senses.length)d.senses=senses;else senses.forEach(s=>{if(!d.senses.some(old=>old.en===s.en)&&d.senses.length<7)d.senses.push(s);});redraw();
 let next=0;await Promise.all(Array.from({length:3},async()=>{while(next<d.senses.length){const s=d.senses[next++];if(!s.zh)s.zh=await translate(s.en);if(s.exampleEn&&!s.exampleZh)s.exampleZh=await translate(s.exampleEn);redraw();}}));
 }catch{successful=false;}d.onlineDone=true;redraw();})(),(async()=>{try{const query=WordContent.imageQuery(word,d.senses[0])||contentFor(word).imageQuery||word.word;const params=new URLSearchParams({action:'query',generator:'search',gsrsearch:`filetype:bitmap ${query}`,gsrnamespace:'6',gsrlimit:'3',prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'720',format:'json',origin:'*'});const res=await fetch('/api/images?'+new URLSearchParams({word:query}),{signal:AbortSignal.timeout(15000)});const json=await res.json();const photos=Object.values(json.query?.pages||{}).flatMap(p=>{const i=p.imageinfo?.[0],m=i?.extmetadata||{};return i?.thumburl||i?.url?[{thumb:i.thumburl||i.url,full:i.url||i.thumburl,source:'https://commons.wikimedia.org/wiki/'+encodeURIComponent(p.title),artist:decode(m.Artist?.value||'作者见来源页').slice(0,80),license:decode(m.LicenseShortName?.value||'许可见来源页')}]:[];});if(photos.length)d.images=photos;}catch{}d.imageDone=true;redraw();})()];await Promise.all(jobs);d.loading=false;d.loaded=successful;d.retryAt=successful?0:Date.now()+60000;
}
function filteredWords() { const q=state.libraryQuery.toLowerCase();return state.words.filter(w=>(state.libraryYear==='all'||w.year===state.libraryYear)&&(!q||`${w.word} ${gloss(w)}`.toLowerCase().includes(q))&&(state.libraryFilter==='all'||state.libraryFilter==='saved'&&state.saved.has(w.id)||state.libraryFilter==='learned'&&!!state.due[w.id]||state.libraryFilter==='wrong'&&state.wrong.has(w.id))); }
function renderLibrary() {
 const years=[...new Set(state.words.map(w=>w.year))];$('#libraryContent').innerHTML=`<div class="page-heading"><span class="eyebrow">VOCABULARY EXPLORER</span><h2>让每个词，都有画面。</h2><p class="muted">保留真题词义，逐条查看中英解释与双语例句。</p></div><div class="library-toolbar"><label class="search-field">${icon('search',20)}<input id="librarySearch" placeholder="搜索英文或中文词义" value="${esc(state.libraryQuery)}" aria-label="搜索词汇"></label><select id="libraryYear" class="select-control" aria-label="筛选真题年份"><option value="all">全部年份</option>${years.map(y=>`<option ${state.libraryYear===y?'selected':''} value="${y}">${y} 年</option>`).join('')}</select></div><div class="tab-bar">${[['all','全部词汇'],['learned','学过的词'],['saved','我的收藏'],['wrong','错题词汇']].map(([key,title])=>`<button class="${state.libraryFilter===key?'active':''}" data-filter="${key}">${title}</button>`).join('')}<span id="wordResultCount" class="muted"></span></div><div id="libraryResults"></div><div id="wordDetailPanel"></div>`;renderLibraryResults();if(state.detailId)renderDetail();
}
function renderLibraryResults() {
 const items=filteredWords();$('#wordResultCount').textContent=`${items.length} 词`;const shown=items.slice(0,state.libraryLimit);
 $('#libraryResults').innerHTML=`<div class="word-grid">${shown.map(w=>`<button class="word-tile ${state.detailId===w.id?'selected':''}" data-word-id="${esc(w.id)}"><div><strong>${esc(w.word)}</strong><span class="word-status">${state.known.has(w.id)?icon('check',17):state.saved.has(w.id)?icon('star',17):''}</span></div><p>${esc(gloss(w))}</p><small>${w.year} · ${esc(w.text)} <span>${esc(w.pos||'')}</span>${w.courseFrequency>1?` · ${w.courseFrequency} 篇收录`:''}</small></button>`).join('')||'<div class="empty">没有找到匹配的词。试试另一个关键词。</div>'}</div>${shown.length<items.length?`<button class="button secondary full load-more" data-action="more-words">加载更多 · 还有 ${items.length-shown.length} 词</button>`:''}`;
}
function openWord(id) { const w=state.byId[id];if(!w)return;state.detailId=id;state.detailSenseIndex=0;if(state.view!=='library')switchView('library');else renderLibraryResults();renderDetail();$('#wordDetailPanel').scrollIntoView({behavior:'smooth',block:'start'});lookup(w);tone(); }
function renderDetail() {
 const word=state.byId[state.detailId];if(!word||!$('#wordDetailPanel'))return;const d=detailsFor(word),selectedSense=d.senses[state.detailSenseIndex||0],imageWord=selectedSense?{...word,meanings:[selectedSense.zh]}:word,imageDetail={...d,images:selectedSense?.images?.length?selectedSense.images:[illustration(imageWord)]};if(selectedSense)loadSenseImages(word,selectedSense);const panel=$('#wordDetailPanel'),oldScroll=panel.scrollTop;
 panel.innerHTML=`<article class="word-detail card"><div class="section-head"><span class="tag">${word.year} 年 · ${esc(word.text)} · PDF 第 ${word.page} 页</span><button class="icon-btn" data-action="close-detail" aria-label="关闭词条详情">${icon('close',22)}</button></div><div class="word-hero"><div><h2>${esc(word.word)}</h2><p class="phonetic">${esc(selectedSense?.phonetic||d.phonetic||word.pos||'')}</p></div><div class="detail-actions"><button class="icon-btn" data-speak="${esc(word.word)}" aria-label="朗读 ${esc(word.word)}">${icon('sound',23)}</button><button class="icon-btn ${state.saved.has(word.id)?'active':''}" data-save="${esc(word.id)}" aria-label="${state.saved.has(word.id)?'取消':'加入'}收藏">${icon('star',23)}</button></div></div><div class="meaning-pills"><span class="sense-label">PDF 词义</span>${word.meanings.map(m=>`<span>${esc(m)}</span>`).join('')}</div>${dictionaryFor(word).reviewRequired?`<p class="word-review-note">${esc(dictionaryFor(word).note||'这个原文词组不完整，暂不安排学习题目。')}</p>`:''}<section class="detail-section"><div class="section-head"><h3>图片联想</h3><span class="muted">按词义选图 · 点击放大</span></div>${d.senses.length>1?`<label class="sense-image-select">配图词义 <select id="detailSense" class="select-control" aria-label="选择配图对应的词义">${d.senses.map((sense,i)=>`<option value="${i}" ${(state.detailSenseIndex||0)===i?'selected':''}>${i+1}. ${esc(sense.zh||sense.en)}</option>`).join('')}</select></label>`:''}${imagesMarkup(imageWord,imageDetail)}</section><section class="detail-section"><div class="section-head"><h3>中英释义对照</h3><span class="tag">逐义对应</span></div>${sensesMarkup(word,d)}${dictionaryMarkup(word)}</section><div class="source-note"><a href="https://github.com/skywind3000/ECDICT" target="_blank" rel="noreferrer">ECDICT</a> · <a href="https://github.com/omwn/omw-data" target="_blank" rel="noreferrer">WordNet / 中文等义词</a> · <a href="./DICTIONARY-NOTICE.txt" target="_blank" rel="noreferrer">数据来源与许可</a> · <a href="https://dictionaryapi.dev/" target="_blank" rel="noreferrer">在线词典来源 ↗</a> · 在线译文为机器辅助翻译，真题词义以 PDF 为准。</div><div class="detail-actions bottom"><button class="button secondary" data-action="word-practice" data-word="${esc(word.id)}" ${isLearnable(word)?'':'disabled'}>${isLearnable(word)?'练练这个词':'原文词组待校对'} ${icon('arrow',18)}</button><button class="button ghost" data-action="reload-detail">重新查询在线释义</button></div></article>`;
 panel.scrollTop=oldScroll;
}
function renderPractice() {
 const due=dueWords().length,wrong=[...state.wrong].filter(id=>state.byId[id]).length;
 const modes=[['mixed','star','混合闯关','词义、听力、拼写轮番练习','推荐','teal'],['choice','book','词义选择','选出最准确的中文释义','认词','purple'],['listening','headphones','听音辨词','只听发音，选出对应单词','听力','blue'],['spell','edit','看义拼词','主动拼出单词，记忆更牢','拼写','orange'],['match','match','词义配对','连接英文单词与中文词义','趣味','pink'],['cloze','message','语境填空','把单词放回中英对照句子','应用','teal']];
 $('#practiceContent').innerHTML=`<div class="page-heading"><span class="eyebrow">PRACTICE MAKES PROGRESS</span><h2>把记忆，练成你的能力。</h2><p class="muted">练习优先使用当前单元与学过的词，每次一小组。</p></div><div class="grid-2 review-actions"><section class="card practice-review"><div class="practice-icon teal">${icon('refresh',28)}</div><h3>今日复习</h3><p><strong>${due}</strong> 个词待复习</p><p class="muted">FSRS 按答题表现安排，目标记忆保留率 90%。</p><button class="button primary full" data-action="review">${due?'开始复习':'巩固当前单元'}</button></section><section class="card practice-review"><div class="practice-icon orange">${icon('heart',28)}</div><h3>错题修复</h3><p><strong>${wrong}</strong> 个需要再练的词</p><p class="muted">答错后重新练，完成一轮正确复习再移出。</p><button class="button secondary full" data-action="wrong-review" ${wrong?'':'disabled'}>${wrong?'修复错题':'暂时没有错题'}</button></section></div><div class="section-head"><h3>选一种喜欢的玩法</h3><span class="muted">先选答案，再检查</span></div><div class="practice-grid">${modes.map(([mode,i,title,description,tag,color])=>`<button class="practice-card card" data-practice="${mode}"><span class="practice-icon ${color}">${icon(i,28)}</span><span class="tag">${tag}</span><h3>${title}</h3><p class="muted">${description}</p><span class="practice-start">开始练习 ${icon('arrow',18)}</span></button>`).join('')}</div>${state.draft?'<button class="button secondary full" data-action="resume">继续未完成的练习</button>':''}`;
}
function groupContext(group=state.group) { return group.words.filter(isLearnable).flatMap(word=>detailsFor(word).senses.filter(s=>s.exampleEn&&s.exampleZh&&WordContent.target(word,s,dictionaryFor(word))).map(s=>({word,sense:s}))); }
function renderContext() {
 const contexts=groupContext(),box=$('#contextContent');
 if(!contexts.length) { box.innerHTML=`${groupSelect()}<div class="empty card"><div class="mascot">${mascot()}</div><h2>先让单词有上下文</h2><p>当前单元的离线双语例句还在补充。打开词库中的单词，可查询在线例句与对应翻译。</p><button class="button primary" data-action="load-context" ${state.contextLoading?'disabled':''}>${state.contextLoading?'正在查询当前单元例句…':'查询当前单元双语例句'}</button><button class="button secondary" data-view="library">打开词库</button></div>`;return; }
 state.contextIndex=Math.min(state.contextIndex,contexts.length-1);const {word,sense}=contexts[state.contextIndex];
 const contextDetail=detailsFor(word),contextFallback=illustration({...word,meanings:[sense.zh]}),contextImage=sense.images?.[0]||contextFallback;loadSenseImages(word,sense);
 const english=sense.exampleEn,span=WordContent.target(word,sense,dictionaryFor(word));
 let cursor=0,index=0;const decorated=english.replace(/[^\s]+/g,(token,at)=>{const target=span&&at<span.end&&at+token.length>span.start;return `<span data-audio-index="${index++}" data-audio-start="${at}" data-audio-end="${at+token.length}" class="${target?'context-target':''}">${esc(token)}</span>`;});
 box.innerHTML=`${groupSelect()}<div class="page-heading"><span class="eyebrow">LISTEN · UNDERSTAND · RECALL</span><h2>在句子里，真正认识一个词。</h2><p class="muted">先听一句，理解一句，再试着遮住单词回忆。</p></div><article class="sentence-card card"><div class="section-head"><span class="tag">${state.contextIndex+1} / ${contexts.length} 双语例句</span><button class="icon-btn" data-save="${esc(word.id)}" aria-label="收藏词汇">${icon('star',21)}</button></div><div class="context-stage"><div class="context-stage-top"><span class="tag">双语情境 · 听读练习</span>${icon('sound',23)}</div><div class="context-stage-art"><button class="photo-view" data-full-image="${esc(contextImage.thumb||contextImage.full)}" data-image-source="${esc(contextImage.source)}" data-fallback="${esc(contextFallback.thumb)}" data-fallback-source="${esc(contextFallback.source)}" aria-label="查看完整语境配图"><img src="${esc(contextImage.thumb||contextImage.full)}" data-fallback-image="${esc(contextFallback.thumb)}" alt="${esc(word.word)} 语境联想配图"></button></div><div class="context-word"><button class="tag" data-word-id="${esc(word.id)}">${esc(word.word)} ${icon('arrow',16)}</button><span>${esc(sense.zh)}</span></div><div class="context-sentence" id="contextEnglish" data-audio-text="${esc(english)}" ${state.subtitleMode==='blind'?'hidden':''}>${decorated}</div><div class="context-translation" id="contextChinese" ${state.subtitleMode!=='both'?'hidden':''}>${esc(sense.exampleZh)}</div></div><p class="context-media-credit source-note">${contextImage.local?'词义联想插画':esc(contextImage.artist)+' · '+esc(contextImage.license)} · <a href="${esc(contextImage.source)}" target="_blank" rel="noreferrer">图片来源 ↗</a> · 例句为教学补充，并非 PDF 真题原句。</p><div class="context-playback"><button class="button primary" data-speak="${esc(english)}">${icon('play',21)} 朗读句子</button><label>语速 <select id="speechRate" class="select-control">${[[.7,'0.7×'],[.85,'0.85×'],[1,'1.0×'],[1.15,'1.15×']].map(([v,l])=>`<option value="${v}" ${Number(state.rate)===v?'selected':''}>${l}</option>`).join('')}</select></label>${WordAudio.voiceSelect()}<label>字幕 <select id="subtitleMode" class="select-control" aria-label="选择听读字幕">${[['both','中英对照'],['english','仅英文'],['blind','盲听挑战']].map(([v,l])=>`<option value="${v}" ${state.subtitleMode===v?'selected':''}>${l}</option>`).join('')}</select></label></div><div class="context-tip"><strong>听、说、再回忆</strong><p class="muted">切换盲听先理解，再显示中英对照。录下自己的声音，与示范对比；录音仅保留在本页，不上传。当前未提供自动口语评分。</p><button class="button secondary" data-action="record-voice">录音跟读</button><audio id="recordingPlayback" controls hidden aria-label="播放自己的跟读录音"></audio></div><div class="detail-actions bottom"><button class="button secondary" data-action="context-prev" ${state.contextIndex?'':'disabled'}>上一句</button><button class="button secondary" data-action="context-test" data-word="${esc(word.id)}">用这句来填空</button><button class="button primary" data-action="context-next">${state.contextIndex===contexts.length-1?'回到第一句':'下一句'} ${icon('arrow',18)}</button></div></article><div class="card context-guide"><h3>三个小步骤</h3><div class="grid-3"><div><span class="step-number">1</span><strong>先听</strong><p>用声音建立印象</p></div><div><span class="step-number">2</span><strong>对照</strong><p>逐句理解中英含义</p></div><div><span class="step-number">3</span><strong>回忆</strong><p>遮住单词主动提取</p></div></div></div>`;
 if(!contextDetail.loaded)lookup(word);
}
async function loadSenseImages(word,sense){
 if(sense.imageLoading||sense.images||sense.imageRetry>Date.now())return;sense.imageLoading=true;
 const query=WordContent.imageQuery(word,sense)||sense.imageQuery||contentFor(word).imageQuery||word.word;
 try{const res=await fetch('/api/images?'+new URLSearchParams({word:query}),{signal:AbortSignal.timeout(12000)});if(!res.ok)throw new Error();const data=await res.json();const photos=Object.values(data.query?.pages||{}).flatMap(p=>{const i=p.imageinfo?.[0],m=i?.extmetadata||{};return i?.url&&WordContent.imageMatches(word,sense,p.title+' '+decode(m.ImageDescription?.value||''))?[{thumb:i.thumburl||i.url,full:i.url,source:'https://commons.wikimedia.org/wiki/'+encodeURIComponent(p.title),artist:decode(m.Artist?.value||'作者见来源'),license:decode(m.LicenseShortName?.value||'许可见来源')}]:[];});sense.images=photos;if(state.view==='context'&&groupContext()[state.contextIndex]?.sense===sense)renderContext();if(state.view==='library'&&state.detailId===word.id)renderDetail();}catch{sense.imageRetry=Date.now()+60000;}finally{sense.imageLoading=false;}
}
function planMarkup(){
 const due=dueWords().length,remaining=distinctWords(state.words.filter(w=>isLearnable(w)&&!state.due[w.id])).length,deadline=state.plan.examDate,days=deadline?Math.max(1,Math.ceil((new Date(deadline+'T23:59:59')-Date.now())/86400000)):null,recommended=days?Math.ceil(remaining/days):state.plan.newGoal||5;
 return `<section class="card study-plan"><div class="section-head"><div><span class="eyebrow">YOUR DAILY ROUTE</span><h3>今天，先复习再学新词</h3></div><span class="tag">${due} 词到期</span></div><div class="plan-actions"><button class="button primary" data-action="review">${due?'复习 '+Math.min(10,due)+' 个到期词':'巩固最近学过的词'}</button><button class="button secondary" data-action="daily-new">学习 ${state.plan.newGoal||5} 个新词</button><button class="button ghost" data-action="pretest">词汇摸底</button></div><p class="muted">${deadline?`距目标日期约 ${days} 天 · 剩余 ${remaining} 个不同词 · 建议每天 ${recommended} 个新词。`:'短练习开始，认词、听力、拼写与语境分别巩固。可在个人中心设置考试日期和新词量。'}</p></section>`;
}
function courseOverview(){return `<details class="course-overview card"><summary>浏览全部 ${state.groups.length} 个真题单元 <span>年份 · 词汇 · 进度</span></summary><label class="search-field">${icon('search',20)}<input id="courseSearch" placeholder="搜索年份、篇目或词汇" aria-label="搜索课程单元"></label><div class="course-grid">${state.groups.map(g=>{const done=g.lessons.filter(l=>state.lessons[l.id]).length;return `<button class="course-card" data-course="${esc(g.id)}" data-course-search="${esc(g.year+' '+g.text+' '+groupTitle(g)+' '+g.words.map(w=>w.word).join(' '))}"><span class="tag">${g.year} · ${esc(g.text)}</span><strong>${groupTitle(g)}</strong><small>${g.words.length} 词 · ${done}/${g.lessons.length} 关</small><div class="progress-track"><i style="width:${done/g.lessons.length*100}%"></i></div></button>`;}).join('')}</div></details>`;}
function memoryMarkup(){
 const entries=Object.entries(state.cards),due=dueWords().length,soon=distinctWords(state.words.filter(w=>state.due[w.id]>Date.now()&&state.due[w.id]<=Date.now()+86400000)).length,avg=entries.length?Math.round(entries.reduce((n,[k,c])=>n+WordMemory.recall(c),0)/entries.length*100):0;
 const skills=[['recognition','认词'],['listening','听力'],['production','拼写'],['context','语境']];
 return `<section class="card memory-dashboard"><div class="section-head"><div><span class="eyebrow">MEMORY, NOT JUST POINTS</span><h3>你的记忆状态</h3></div><span class="tag">FSRS · 目标 90%</span></div><div class="memory-stats"><div><strong>${due}</strong><span>现在到期</span></div><div><strong>${soon}</strong><span>未来 24 小时到期</span></div><div><strong>${entries.length?avg+'%':'—'}</strong><span>模型估算可回忆率</span></div></div><div class="skill-grid">${skills.map(([k,l])=>{const cards=entries.filter(([key])=>key.endsWith('|'+k));const r=cards.length?Math.round(cards.reduce((n,[,c])=>n+WordMemory.recall(c),0)/cards.length*100):0;return `<div><span>${l}</span><strong>${cards.length} 项</strong><div class="progress-track"><i style="width:${r}%"></i></div></div>`;}).join('')}</div><div class="memory-next"><h4>接下来的复习安排</h4>${entries.sort((a,b)=>new Date(a[1].due)-new Date(b[1].due)).slice(0,6).map(([k,c])=>`<div class="history-row"><div><strong>${esc(c.lemma||k.split('|')[0])}</strong><span>${esc(({recognition:'认词',listening:'听力',production:'拼写',context:'语境'})[k.split('|').pop()]||'复习')}</span></div><strong>${new Date(c.due)<=new Date()?'现在到期':new Date(c.due).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</strong></div>`).join('')||'<p class="muted">完成首次回忆后，系统会安排下一次复习。</p>'}</div><p class="source-note">模型估算用于安排复习，并非考试成绩或真实测量。历史记录不足时使用开源默认参数；中文释义相同的重复来源合并，同形异义和不同技能分别记录。</p><details><summary>最近逐题记录 · ${state.reviewEvents.length} 次</summary>${state.reviewEvents.slice(-12).reverse().map(e=>`<div class="history-row"><div><strong>${esc(state.byId[e.wid]?.word||'词汇')}</strong><span>${esc(e.kind)} · ${e.hinted?'使用提示':e.retry?'错题重练':'首次回忆'} · ${Math.round(e.responseMs/1000)} 秒</span></div><span class="tag">${e.correct?'答对':'待巩固'}</span></div>`).join('')||'<p class="muted">检查第一道题后就会开始记录，提前退出也会保存。</p>'}</details></section>`;
}
async function importProgress(file){
 if(!file)return;if(file.size>8_000_000){toast('备份文件过大，请选择本站导出的 JSON');return;}
 try{const data=JSON.parse(await file.text());if(data.app!=='词境 WordTrail'||![2,3].includes(data.version)||typeof data.xp!=='number')throw new Error('不是可识别的词境备份');const imported={...data,quizzes:data.quizzes||data.history||[]};
  for(const key of ['known','saved','wrong']){if(!Array.isArray(imported[key]))throw new Error('备份结构异常');imported[key]=imported[key].filter(id=>state.byId[id]);}
  for(const key of ['due','memory','lessons','daily','activity','cards'])if(imported[key]!==undefined&&(!imported[key]||typeof imported[key]!=='object'||Array.isArray(imported[key])))throw new Error('备份结构异常');
  for(const [id,value]of Object.entries(imported.due||{}))if(!Number.isFinite(value)||value<0)throw new Error('复习时间数据异常');
  for(const card of Object.values(imported.cards||{})){if(!card||!Number.isFinite(new Date(card.due).getTime())||card.last_review&&!Number.isFinite(new Date(card.last_review).getTime())||!Number.isFinite(card.stability)||card.stability<0||card.stability>100000||!Number.isFinite(card.difficulty)||card.difficulty<0||card.difficulty>10||![0,1,2,3].includes(card.state)||!Number.isInteger(card.reps)||card.reps<0)throw new Error('记忆卡片数据异常');}
  if(imported.reviewEvents!==undefined&&!Array.isArray(imported.reviewEvents))throw new Error('逐题记录格式异常');
  for(const e of imported.reviewEvents||[]){if(!e||typeof e.id!=='string'||!Number.isFinite(e.time)||e.time<0||e.ratings!==undefined&&!Array.isArray(e.ratings))throw new Error('逐题记录格式异常');for(const r of e.ratings||[])if(typeof r.key!=='string'||![1,2,3,4].includes(r.rating))throw new Error('复习评级格式异常');}
  if(!Number.isFinite(imported.xp)||imported.xp<0||imported.xp>1000000000)throw new Error('经验值数据异常');
  const merged=WordMemory.merge(snapshot(),imported);for(const key of progressKeys)if(merged[key]!==undefined)store.set(key,merged[key]);loadProgress();refreshMemoryStatus();persist();renderView();rail();toast('备份已合并导入，现有记录已保留。');
 }catch(error){toast('导入失败：'+error.message);}finally{$('#importFile').value='';}
}
async function recoveryCode(){try{const data=await api('/api/auth/recovery-code',{method:'POST',body:'{}'});const node=$('#recoveryCode');node.hidden=false;node.textContent='请保存恢复码（重新生成后旧码失效）：'+data.recoveryCode;}catch(error){toast(error.message);}}
async function loadContextGroup() {
 if(state.contextLoading)return;const group=state.group;state.contextLoading=true;renderContext();
 const pool=group.words.filter(isLearnable).slice(0,6);let next=0;await Promise.all(Array.from({length:2},async()=>{while(next<pool.length){const word=pool[next++];await lookup(word);if(state.view==='context'&&state.group===group)renderContext();}}));
 state.contextLoading=false;if(state.view==='context'&&state.group===group){renderContext();if(!groupContext(group).length)toast('当前单元暂未查到双语例句，可以先进行词汇练习。');}
}
function renderProfile() {
 const days=Array.from({length:14},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(13-i));const k=dateKey(d),a=state.activity[k]||{};return {key:k,label:`${d.getMonth()+1}/${d.getDate()}`,value:a.words?.length||Number(state.daily[k])||0};});
 const recorded=state.reviewEvents.filter(e=>!e.retry),legacy=state.history.filter(h=>!h.id);const total=recorded.length+legacy.reduce((n,h)=>n+(h.total||0),0),right=recorded.filter(e=>e.correct).length+legacy.reduce((n,h)=>n+(h.correct||0),0),completed=Object.keys(state.lessons).filter(id=>findLesson(id)).length,max=Math.max(1,...days.map(d=>d.value));
 const badges=[['first','star','初次启程','完成第一次学习',state.history.length>0],['five','book','词汇探索者','学过 25 个词',learnedCount()>=25],['streak','fire','持续行动','连续学习 3 天',streak()>=3],['review','refresh','记忆守护者','完成一次复习',state.history.some(h=>h.type==='review'||h.type==='wrong')],['perfect','trophy','全对时刻','一轮练习全部答对',state.history.some(h=>h.correct===h.total&&h.total>0)],['hundred','bolt','百词里程碑','学过 100 个词',learnedCount()>=100]];
 $('#profileContent').innerHTML=`<section class="profile-hero card"><div class="profile-avatar">${mascot()}</div><div><span class="eyebrow">YOUR LEARNING JOURNEY</span><h2>${esc(account?.name||'词汇探索者')}</h2><p class="muted">${account?esc(account.email):'访客学习档案'} · ${sessionIssue==='ACCOUNT_MISMATCH'?'其他窗口已切换账号 · 当前记录保留在本机':sessionIssue==='SESSION_EXPIRED'?'登录已过期 · 当前记录保留在本机':serverAccount?(syncStatus==='offline'?'暂存本机，等待同步':syncStatus==='saving'?'正在同步学习记录':'账号同步保存'):'本机保存'}</p><span class="tag">${streak()} 天连续学习</span></div><div class="profile-buttons">${account?'<button class="button secondary" data-action="switch-account">切换账号</button><button class="button ghost" data-action="logout">退出登录</button>':'<button class="button primary" data-action="auth">登录 / 创建账号</button>'}</div></section><div class="metric-grid">${[[learnedCount(),'学过的词','book'],[distinctWords(state.words.filter(w=>state.known.has(w.id))).length,'当前记忆稳定','check'],[state.xp,'累计 XP','bolt'],[total?Math.round(right/total*100)+'%':'—','首答正确率','trophy']].map(([v,l,i])=>`<div class="card stat">${icon(i,22)}<strong>${v}</strong><span>${l}</span></div>`).join('')}</div>${memoryMarkup()}<section class="card"><div class="section-head"><h3>最近 14 天</h3><span class="muted">${completed} 个关卡完成 · ${state.history.length} 次练习</span></div><div class="activity-chart">${days.map(d=>`<div class="activity-day"><strong>${d.value||''}</strong><i style="height:${Math.max(5,d.value/max*90)}px" title="${d.key}: ${d.value}词"></i><span>${d.label}</span></div>`).join('')}</div></section><section class="card"><div class="section-head"><h3>学习徽章</h3><span class="muted">真实积累，慢慢点亮</span></div><div class="achievement-grid">${badges.map(([id,i,name,description,earned])=>`<div class="achievement ${earned?'earned':''}"><div>${icon(i,28)}</div><strong>${name}</strong><span>${description}</span><small>${earned?'已获得':'尚未获得'}</small></div>`).join('')}</div></section><section class="card"><div class="section-head"><h3>学习计划与偏好</h3>${icon('settings',22)}</div><label class="setting-row"><span><strong>目标考试日期</strong><small>按剩余词汇量估算每日新词建议</small></span><input id="examDate" type="date" class="select-control" value="${esc(state.plan.examDate||'')}"></label><label class="setting-row"><span><strong>每日新词</strong><small>到期复习优先；新词量单独设置</small></span><select id="newGoal" class="select-control">${[5,10,15,20].map(n=>`<option value="${n}" ${(state.plan.newGoal||5)===n?'selected':''}>${n} 个新词</option>`).join('')}</select></label><div class="setting-row"><span><strong>在线自然语音</strong><small>免费 Edge 在线服务 · 无密钥 · 服务可能临时限流</small></span>${WordAudio.voiceSelect()}</div><label class="setting-row"><span><strong>每日词汇目标</strong><small>学习和复习都计入目标</small></span><select id="goalSelect" class="select-control">${[5,10,20,30,50].map(n=>`<option value="${n}" ${state.goal===n?'selected':''}>${n} 词 / 天</option>`).join('')}</select></label><label class="setting-row"><span><strong>互动音效</strong><small>答题、配对与完成时的声音反馈</small></span><input type="checkbox" id="profileSound" ${state.sfx?'checked':''}></label><div class="setting-row"><span><strong>备份学习记录</strong><small>${serverAccount?'学习记录按账号保存在本站服务器，并保留浏览器缓存。':'访客记录保存在当前浏览器，创建账号后可以同步保存。'}</small></span><div class="backup-actions"><button class="button secondary" data-action="export">导出记录</button><button class="button secondary" data-action="import">导入备份</button>${account?'<button class="button ghost" data-action="recovery-code">生成账号恢复码</button><button class="button ghost" data-action="guest-import">导入本机游客进度</button>':''}</div></div><p id="recoveryCode" class="recovery-code" hidden></p><p class="source-note">账号与学习记录保存在当前电脑的站点服务中；跨设备云同步需要另行部署。录音不上传，朗读文字发送到在线语音服务。</p></section><section class="card"><div class="section-head"><h3>最近完成</h3><span class="muted">只记录完整练习</span></div>${state.history.slice(0,8).map(h=>`<div class="history-row"><div><strong>${esc(h.title||({choice:'词义选择',spell:'拼写练习',recall:'词义回忆',truefalse:'真假判断',mixed:'混合闯关',lesson:'课程关卡',review:'间隔复习',wrong:'错题修复',cloze:'语境填空',match:'词义配对',listening:'听音辨词'})[h.type]||'词汇练习')}</strong><span class="muted">${esc(h.date)} ${h.xp?'· +'+h.xp+' XP':''}</span></div><strong>${h.correct} / ${h.total}</strong></div>`).join('')||'<div class="empty">完成第一组学习后，这里会记录你的进步。</div>'}</section>`;
}
function findLesson(id) { return state.groups.flatMap(g=>g.lessons).find(l=>l.id===id); }
function lessonGroup(lesson) { return state.groups.find(g=>g.lessons.some(l=>l.id===lesson.id)); }
function distinctWords(words) { const seen=new Set(); return words.filter(w=>{const key=WordMemory.key(w,'choice');if(seen.has(key))return false;seen.add(key);return true;}); }
function alternatives(word,labelFn,limit=3) {
 const usedLabels=new Set([labelFn(word)]),usedWords=new Set([word.word.toLowerCase()]),chinese=labelFn(word)===gloss(word),pos=String(word.pos||'').replace(/[^a-z]/gi,'').toLowerCase();
 const sessionWords=state.questionPool||(state.session?.wordIds||[]).map(id=>state.byId[id]).filter(Boolean),group=state.group?.words||[];
 const candidates=[...shuffled(sessionWords),...shuffled(group.filter(w=>String(w.pos||'').replace(/[^a-z]/gi,'').toLowerCase()===pos)),...shuffled(group),...shuffled(state.words)];
 const result=[];for(const w of candidates){if(!isLearnable(w))continue;const label=labelFn(w),key=w.word.toLowerCase();if(usedWords.has(key)||usedLabels.has(label)||chinese&&/[a-zA-Z]{3,}/.test(gloss(w)))continue;usedWords.add(key);usedLabels.add(label);result.push(w);if(result.length===limit)break;}return result;
}
function choiceQuestion(word,kind='choice') {
 const label=kind==='listening'?w=>w.word:w=>gloss(w),options=shuffled([word,...alternatives(word,label)]).map(w=>({id:w.id,label:label(w)}));return {kind,wid:word.id,options};
}
function sentenceFor(word) { return detailsFor(word).senses.find(s=>s.exampleEn&&s.exampleZh&&WordContent.target(word,s,dictionaryFor(word))); }
function clozeQuestion(word,selectedSense) {const sense=selectedSense||sentenceFor(word);if(!sense)return null;const span=WordContent.target(word,sense,dictionaryFor(word));if(!span)return null;return {kind:'cloze',wid:word.id,sense,sentence:sense.exampleEn,translation:sense.exampleZh,span,options:shuffled([{id:word.id,label:span.text},...alternatives(word,w=>w.word).map(w=>({id:w.id,label:w.word}))])};}
function orderQuestion(word) { const s=sentenceFor(word);if(!s)return null;const tokens=s.exampleEn.split(/\s+/);if(tokens.length<4||tokens.length>13)return null;return {kind:'order',wid:word.id,sentence:s.exampleEn,translation:s.exampleZh,tokens,bank:shuffled(tokens.map((text,index)=>({text,index})))}; }
function matchQuestion(words) { const used=new Set(),pool=words.filter(w=>{if(used.has(gloss(w)))return false;used.add(gloss(w));return true;}).slice(0,5); if(pool.length<2)return choiceQuestion(pool[0]||words[0]);return {kind:'match',wid:pool[0].id,wids:pool.map(w=>w.id),left:shuffled(pool).map(w=>({id:w.id,label:w.word})),right:shuffled(pool).map(w=>({id:w.id,label:gloss(w)}))}; }
function makeQuestions(words,mode) {
 let questions=[];const previousPool=state.questionPool;state.questionPool=words;
 if(mode==='match') { for(let i=0;i<words.length;i+=5){const chunk=words.slice(i,i+5),match=matchQuestion(chunk);questions.push(match);const included=new Set(match.wids||[match.wid]);for(const word of chunk)if(!included.has(word.id))questions.push(choiceQuestion(word));} }
 else if(mode==='review'||mode==='wrong'){questions=words.map(w=>{const key=cardKeys(w).sort((a,b)=>new Date(state.cards[a].due)-new Date(state.cards[b].due))[0],skill=key?.split('|').pop();if(skill==='production')return {kind:'spell',wid:w.id};if(skill==='listening')return choiceQuestion(w,'listening');if(skill==='context'){const c=clozeQuestion(w);return c?{...c,free:true}:{kind:'spell',wid:w.id};}return choiceQuestion(w);});}
 else if(mode==='cloze') questions=words.map(clozeQuestion).filter(Boolean);
 else if(mode==='choice'||mode==='listening') questions=words.map(w=>choiceQuestion(w,mode));
 else if(mode==='spell') questions=words.map(w=>({kind:'spell',wid:w.id}));
 else { questions=words.map(w=>choiceQuestion(w));words.forEach((w,i)=>questions.push(i%2?{kind:'spell',wid:w.id}:choiceQuestion(w,'listening')));questions.push(words.length>1?matchQuestion(words):{kind:'spell',wid:words[0].id});const contextual=words.filter(w=>sentenceFor(w));contextual.slice(0,3).forEach((w,i)=>questions.push({...clozeQuestion(w),free:i===2}));const cw=contextual[Math.floor(Math.random()*contextual.length)];if(cw){const order=orderQuestion(cw);if(order)questions.push(order);} }
 const result=questions.map((q,i)=>({...q,id:`${Date.now()}-${i}`,retry:false}));state.questionPool=previousPool;return result;
}
function startLesson(id) {
 const lesson=findLesson(id);if(!lesson)return;const g=lessonGroup(lesson),index=g.lessons.findIndex(l=>l.id===id),previous=g.lessons[index-1];
 if(previous&&!state.lessons[previous.id]&&!state.lessons[id]) { toast('先完成上一关，再解锁这一组新词。也可以在词库里自由查阅。');tone();return; }
 selectGroup(g.id);newSession(lesson.words,'lesson',`${g.year} · ${g.text} · 第 ${index+1} 关`,lesson.id);
}
function practicePool() { const eligible=state.group.words.filter(isLearnable),learned=eligible.filter(w=>state.due[w.id]),pool=learned.length>=5?learned:eligible.slice(0,10);return distinctWords(shuffled(pool)).slice(0,8); }
function startPractice(mode, customWords, title) {
 let words=(customWords||practicePool()).filter(isLearnable);if(mode==='cloze')words=words.filter(w=>sentenceFor(w));
 if(!words.length){toast(mode==='cloze'?'这一组暂时没有双语语境，先去语境听读认识几个词。':'没有可练习的词。');if(mode==='cloze')switchView('context');return;}
 const labels={mixed:'混合闯关',choice:'词义选择',listening:'听音辨词',spell:'看义拼词',match:'词义配对',cloze:'语境填空',review:'今日间隔复习',wrong:'错题修复'};
 newSession(words,mode,title||labels[mode]||'词汇练习');
}
function newSession(words,mode,title,lessonId=null,customQuestions=null) {
 const questions=customQuestions||makeQuestions(words,mode);if(!questions.length){toast('这组词暂无可用题目，请先查看词义。');return;}
 if(state.draft) { WordAudio.stop();WordAudio.release();state.pendingSession={words:words.map(w=>w.id),mode,title,lessonId,questions};showOverlay('lessonOverlay');document.body.classList.add('lesson-open');$('#lessonShell').innerHTML=`<div class="cancel-dialog card"><div class="mascot">${mascot()}</div><h2>还有一组学习没完成</h2><p class="muted">${esc(state.draft.title)} 的进度已保存。可以继续它，或开始这一组。</p><button class="button primary full" data-action="resume">继续原来的学习</button><button class="button secondary full" data-action="replace-draft">开始新的一组</button><button class="button ghost full" data-action="close-empty-overlay">返回</button></div>`;return; }
 launchSession(words,mode,title,lessonId,questions);
}
function launchSession(words,mode,title,lessonId,questions=makeQuestions(words,mode)) {
 WordAudio.stop();WordAudio.release();
 state.session={id:crypto.randomUUID(),mode,title,lessonId,wordIds:words.map(w=>w.id),learnIds:mode==='lesson'?words.map(w=>w.id):[],learnIndex:0,phase:'intro',revealed:false,questions,qindex:0,response:{},feedback:null,answers:[],firstCount:0,firstCorrect:0,wordMistakes:{},combo:0,startedAt:Date.now(),completeSaved:false};
 showOverlay('lessonOverlay');document.body.classList.add('lesson-open');saveDraft();renderSession();$('#lessonOverlay').scrollTop=0;tone('start');
}
function saveDraft() { const s=state.session;if(s&&s.phase!=='complete'){state.draft=JSON.parse(JSON.stringify(s));store.set('draft',state.draft);queueServerSave();} }
function resumeSession() { if(!state.draft)return;WordAudio.stop();WordAudio.release();if(!state.draft.wordIds?.every(id=>isLearnable(state.byId[id]))){toast('这组含有待核对的原文词组，请开始新的练习。原进度仍保留。');return;}state.session=JSON.parse(JSON.stringify(state.draft));for(const q of state.session.questions){const w=state.byId[q.wid];if(q.kind==='cloze'&&w&&!q.span){const sense=detailsFor(w).senses.find(x=>x.exampleEn===q.sentence)||{exampleEn:q.sentence,exampleZh:q.translation,zh:gloss(w)};q.span=WordContent.target(w,sense,dictionaryFor(w));q.sense=sense;if(q.span&&q.options)q.options.forEach(o=>{if(o.id===q.wid)o.label=q.span.text;});}}const current=state.session.questions[state.session.qindex];if(current?.sense&&state.session.feedback){state.session.feedback.note=state.byId[current.wid].word+' · '+current.sense.zh;}state.pendingSession=null;showOverlay('lessonOverlay');document.body.classList.add('lesson-open');renderSession();$('#lessonOverlay').scrollTop=0;tone('start'); }
function requestExit() {
 const s=state.session;if(!s||s.phase==='complete'){closeSession();return;}saveDraft();
 const dialog=document.createElement('div');dialog.className='lesson-cancel-shade';dialog.id='cancelShade';dialog.innerHTML=`<div class="cancel-dialog card" role="alertdialog" aria-modal="true" aria-labelledby="cancelTitle"><div class="mascot mini">${mascot()}</div><h2 id="cancelTitle">休息一下？</h2><p class="muted">已回答的题目会立即写入复习记录；本组进度也会保留，完成整组后领取经验。</p><button class="button primary full" data-action="keep-learning">继续学习</button><button class="button secondary full" data-action="exit-session">退出并保留进度</button></div>`;$('#lessonShell').appendChild(dialog);showOverlay('cancelShade','button');
}
function closeSession() { if(state.session?.phase!=='complete')saveDraft();state.session=null;state.pendingSession=null;closeCancelDialog(false);hideOverlay('lessonOverlay');document.body.classList.remove('lesson-open');WordAudio.stop();WordAudio.release();renderView();updateHeader();rail(); }
function progressFraction(s) { if(s.phase==='complete')return 1;if(s.phase==='intro')return 0;if(s.phase==='learn')return .25*(s.learnIndex/s.learnIds.length);const base=s.learnIds.length?.25:0;return base+(1-base)*Math.min(1,s.qindex/Math.max(1,s.questions.length)); }
function sessionTop(s) { const p=Math.round(progressFraction(s)*100);return `<div class="lesson-top"><button class="icon-btn lesson-close" data-action="cancel-session" aria-label="退出学习">${icon('close',25)}</button><div class="lesson-progress progress-track" role="progressbar" aria-label="学习进度" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><i style="width:${p}%"></i></div><span class="lesson-combo">${icon('bolt',22)} ${s.combo?`${s.combo} 连对`:'专注学习'}</span></div>`; }
function renderSession() {
 const s=state.session;if(!s)return;const shell=$('#lessonShell');
 if(s.phase==='complete'){renderCompletion();return;}
 if(s.phase==='intro') { const words=s.wordIds.map(id=>state.byId[id]).filter(Boolean);shell.innerHTML=`${sessionTop(s)}<div class="lesson-main lesson-intro"><div class="mascot">${mascot()}</div><span class="eyebrow">${s.mode==='lesson'?'A LITTLE EVERY DAY':'READY TO PRACTICE'}</span><h1>${esc(s.mode==='lesson'?'一起认识这 '+words.length+' 个词':'准备好，开始一组练习')}</h1><p class="muted">${esc(s.title)}</p><div class="intro-words">${words.map(w=>`<span class="tag">${esc(w.word)}</span>`).join('')}</div><div class="lesson-intro-plan"><div>${icon('book',22)}<span>${s.mode==='lesson'?'双语释义与图片':'从记忆里主动回忆'}</span></div><div>${icon('headphones',22)}<span>多种小练习</span></div><div>${icon('refresh',22)}<span>错题再练 + 间隔复习</span></div></div><p class="muted">不怕答错。每个错题都有再次练习的机会。</p></div><div class="lesson-footer"><span class="muted">${words.length} 个词 · 约 ${Math.max(2,Math.round(s.questions.length*.25))} 分钟</span><button class="button primary" data-action="begin-session">开始学习 ${icon('arrow',19)}</button></div>`;return; }
 if(s.phase==='learn'){renderLearningCard();return;}renderQuestion();
}
function flashcardInner(word,s) {
 const d=detailsFor(word);return `<div class="word-hero"><div><span class="eyebrow">NEW WORD ${s.learnIndex+1} / ${s.learnIds.length}</span><h1>${esc(word.word)}</h1><p class="phonetic">${esc(d.phonetic||word.pos||'')}</p></div><div class="detail-actions"><button class="icon-btn" data-speak="${esc(word.word)}" aria-label="朗读单词">${icon('sound',26)}</button><button class="icon-btn ${state.saved.has(word.id)?'active':''}" data-save="${esc(word.id)}" aria-label="收藏单词">${icon('star',23)}</button></div></div>${s.revealed?`<div class="flashcard-image">${imagesMarkup(word,d,1)}</div><div class="meaning-pills">${word.meanings.map(m=>`<span>${esc(m)}</span>`).join('')}</div><div class="flashcard-senses">${sensesMarkup(word,d,2)}${d.senses.length>2?`<details class="additional-senses"><summary>查看另外 ${d.senses.length-2} 个词义</summary>${sensesMarkup(word,d,8,2)}</details>`:''}${dictionaryMarkup(word)}</div>`:`<div class="flashcard-cover"><div class="mascot">${mascot()}</div><h3>你见过这个词吗？</h3><p class="muted">先试着回忆，再打开它的词义与例句。</p><button class="button secondary" data-action="reveal-word">打开词卡 ${icon('book',20)}</button><button class="button ghost" data-action="skip-explanation">我认识这个词，直接测试</button></div>`}`;
}
function renderLearningCard() {
 const s=state.session,word=state.byId[s.learnIds[s.learnIndex]];if(!word){s.phase='questions';s.response={};renderSession();return;}
 $('#lessonShell').innerHTML=`${sessionTop(s)}<div class="lesson-main"><div class="vocabulary-flashcard card" id="flashcardDetails">${flashcardInner(word,s)}</div></div><div class="lesson-footer"><p class="muted">${s.revealed?'读一遍词义，再听一遍发音。':'先回忆，后揭晓。'}</p><button class="button primary" data-action="next-word" ${s.revealed?'':'disabled'}>${s.learnIndex===s.learnIds.length-1?'开始小练习':'认识下一个词'} ${icon('arrow',19)}</button></div>`;
 if(s.revealed)lookup(word);
}
function updateFlashcardDetail(word) { const s=state.session;if(!s||s.phase!=='learn'||!s.revealed)return;const node=$('#flashcardDetails');if(!node)return;const scroll=node.scrollTop;node.innerHTML=flashcardInner(word,s);node.scrollTop=scroll; }
function initializeResponse(q) { if(state.session.response?.questionId===q.id)return;state.session.response={questionId:q.id,startedAt:Date.now(),hinted:false,selected:null,input:'',left:null,right:null,matched:[],hadError:false,tokens:[]}; }
function questionBody(q,s) {
 const word=state.byId[q.wid],r=s.response;if(!word)return '<p>找不到这个词。</p>';
 if(q.kind==='choice')return `<h1 class="exercise-title">选择正确的词义</h1><div class="exercise-prompt word-prompt"><strong>${esc(word.word)}</strong><button class="icon-btn" data-speak="${esc(word.word)}" aria-label="朗读单词">${icon('sound',24)}</button></div><div class="choice-grid">${q.options.map((o,i)=>optionMarkup(q,o,i,r,s)).join('')}</div>`;
 if(q.kind==='listening')return `<h1 class="exercise-title">你听到了哪个单词？</h1><p class="muted">点击播放，再选择对应的英文。</p><div class="listen-controls"><button class="listen-button" data-speak="${esc(word.word)}" aria-label="播放单词发音">${icon('sound',49)}</button><button class="button secondary" data-speak="${esc(word.word)}" data-rate="0.7">${icon('sound',20)} 慢速</button></div><div class="choice-grid">${q.options.map((o,i)=>optionMarkup(q,o,i,r,s)).join('')}</div>`;
 if(q.kind==='spell')return `<h1 class="exercise-title">根据词义，拼出英文</h1><div class="exercise-prompt gloss-prompt">${esc(gloss(word))}</div><p class="muted">${word.word.length} 个字符${word.word.includes(' ')?' · 包含空格':''}</p><input class="answer-input ${s.feedback?(s.feedback.correct?'correct':'wrong'):''}" id="lessonAnswer" aria-label="输入英文单词" placeholder="输入英文单词…" value="${esc(r.input||'')}" autocomplete="off" autocapitalize="none" spellcheck="false" ${s.feedback?'disabled':''}><button class="button ghost" data-action="spell-hint" ${s.feedback?'disabled':''}>需要一点提示？</button><div class="spell-hint" id="spellHint"></div>`;
 if(q.kind==='cloze'){const span=q.span||WordContent.target(word,{exampleEn:q.sentence},dictionaryFor(word)),masked=span?WordContent.mask(q.sentence,span):q.sentence;return `<h1 class="exercise-title">把单词放回句子</h1><div class="cloze-sentence">${esc(masked)}</div><p class="cloze-translation">${esc(q.translation)}</p>${q.free?`<input class="answer-input" id="lessonAnswer" aria-label="填入例句中的正确词形" placeholder="填入正确词形…" value="${esc(r.input||'')}" autocomplete="off" spellcheck="false" ${s.feedback?'disabled':''}>`:`<div class="choice-grid">${q.options.map((o,i)=>optionMarkup(q,o,i,r,s)).join('')}</div>`}`;}
 if(q.kind==='match')return `<h1 class="exercise-title">配对所有词义</h1><p class="muted">先点击英文，再点击对应中文。也可以先选中文。</p><div class="match-grid"><div>${q.left.map(o=>matchMarkup(o,'left',r,s)).join('')}</div><div>${q.right.map(o=>matchMarkup(o,'right',r,s)).join('')}</div></div>`;
 if(q.kind==='order')return `<h1 class="exercise-title">整理成一个完整句子</h1><p class="cloze-translation">${esc(q.translation)}</p><div class="token-answer">${r.tokens.length?r.tokens.map((index,i)=>`<button class="token" data-unpick-token="${i}" ${s.feedback?'disabled':''}>${esc(q.tokens[index])}</button>`).join(''):'<span class="muted">点击下方单词，组成英文句子</span>'}</div><div class="token-bank">${q.bank.map(t=>`<button class="token ${r.tokens.includes(t.index)?'used':''}" data-pick-token="${t.index}" ${r.tokens.includes(t.index)||s.feedback?'disabled':''}>${esc(t.text)}</button>`).join('')}</div>`;
 return '';
}
function optionMarkup(q,o,i,r,s) { const selected=r.selected===o.id;const evaluated=s.feedback;const isRight=o.id===q.wid;return `<button class="answer-option ${selected?'selected':''} ${evaluated&&isRight?'correct':''} ${evaluated&&selected&&!isRight?'wrong':''}" data-answer-choice="${esc(o.id)}" ${evaluated?'disabled':''}><span class="option-number">${i+1}</span><span>${esc(o.label)}</span>${selected?icon(evaluated&&!isRight?'close':'check',20):''}</button>`; }
function matchMarkup(o,side,r,s) { const matched=r.matched.includes(o.id),selected=r[side]===o.id;return `<button class="match-card ${matched?'matched':''} ${selected?'selected':''}" data-match-side="${side}" data-match-id="${esc(o.id)}" ${matched||s.feedback?'disabled':''}>${esc(o.label)}${matched?icon('check',18):''}</button>`; }
function canCheck(q,s) { const r=s.response;if(q.kind==='spell'||q.kind==='cloze'&&q.free)return !!r.input?.trim();if(q.kind==='match')return r.matched.length===q.wids.length;if(q.kind==='order')return r.tokens.length===q.tokens.length;return !!r.selected; }
function renderQuestion() {
 const s=state.session;if(!s)return;if(s.qindex>=s.questions.length){finishSession();return;}const q=s.questions[s.qindex];initializeResponse(q);
 const correct=s.feedback?.correct,feedback=s.feedback,word=state.byId[q.wid];
 let footer;if(feedback){footer=`<div class="feedback-strip ${correct?'correct':'wrong'}"><div class="feedback-icon">${icon(correct?'check':'close',26)}</div><div><strong>${correct?(s.response.hinted?'借助提示答对了':q.kind==='match'&&s.response.hadError?'都配对成功了！':'答对了，继续保持！'):'再记一次，稍后会重新练习'}</strong><p>${correct?esc(feedback.note||`${word.word} · ${gloss(word)}`):`正确答案：<b>${esc(feedback.answer)}</b>`}</p>${!correct&&q.sense?`<p>${esc(q.sense.en)}<br>${esc(q.sense.zh)}</p><p>${esc(q.sentence)}</p>`:''}${!correct&&q.kind==='spell'?`<button class="button ghost" data-speak="${esc(word.word)}">${icon('sound',18)} 听一遍正确发音</button>`:''}</div><button class="button ${correct?'primary':'danger'}" data-action="continue-question">继续 ${icon('arrow',18)}</button></div>`;}else footer=`<span class="muted">${q.retry?'错题回炉 · 再试一次':'先选择，再检查答案'}</span><button class="button primary" id="checkLesson" data-action="check-question" ${canCheck(q,s)?'':'disabled'}>检查答案</button>`;
 $('#lessonShell').innerHTML=`${sessionTop(s)}<div class="lesson-main question-enter"><div class="exercise-meta"><span class="tag">${q.retry?'再练一次':({choice:'词义选择',listening:'听音辨词',spell:'主动拼写',match:'词义配对',cloze:'语境填空',order:'句子重组'})[q.kind]}</span><span class="muted">${Math.min(s.qindex+1,s.questions.length)} / ${s.questions.length}</span></div>${questionBody(q,s)}</div><div class="lesson-footer ${feedback?'has-feedback':''}">${footer}</div>`;
 if((q.kind==='spell'||q.kind==='cloze'&&q.free)&&!feedback)setTimeout(()=>$('#lessonAnswer')?.focus(),40);
}
function selectMatch(side,id) {
 const s=state.session;if(!s||s.feedback)return;const q=s.questions[s.qindex],r=s.response;if(q.kind!=='match'||r.matched.includes(id))return;r[side]=id;tone();
 if(r.left&&r.right){const left=r.left,right=r.right;if(left===right){r.matched.push(left);r.left=null;r.right=null;tone('match');saveDraft();renderQuestion();}else{r.hadError=true;s.wordMistakes[left]=(s.wordMistakes[left]||0)+1;tone('wrong');document.querySelectorAll(`[data-match-id="${CSS.escape(left)}"],[data-match-id="${CSS.escape(right)}"]`).forEach(node=>node.classList.add('wrong'));r.left=null;r.right=null;saveDraft();setTimeout(()=>{if(state.session===s&&!s.feedback)renderQuestion();},450);}}else{saveDraft();renderQuestion();}
}
function normalize(text) { return String(text||'').normalize('NFKC').toLowerCase().trim().replace(/\s+/g,' '); }
function checkQuestion() {
 const s=state.session;if(!s||s.feedback)return;const q=s.questions[s.qindex];if(!canCheck(q,s))return;const word=state.byId[q.wid],r=s.response;
 const correct=q.kind==='cloze'&&q.free?WordContent.norm(r.input).replace(/[.!?]$/,'')===WordContent.norm(q.span.text).replace(/[.!?]$/,''):q.kind==='spell'?WordContent.norm(r.input).replace(/[.!?]$/,'')===WordContent.norm(word.word).replace(/\b(?:sb|sth)\.\b/g,'').replace(/[.!?]$/,''):q.kind==='match'?r.matched.length===q.wids.length:q.kind==='order'?normalize(r.tokens.map(i=>q.tokens[i]).join(' '))===normalize(q.sentence):r.selected===q.wid;
 const firstCorrect=correct&&!r.hinted&&!(q.kind==='match'&&r.hadError);if(!q.retry){s.firstCount++;if(firstCorrect)s.firstCorrect++;}
 recordAnswer(q,r,firstCorrect,s);
 if(!correct){s.wordMistakes[q.wid]=(s.wordMistakes[q.wid]||0)+1;s.combo=0;s.questions.push({...q,...(q.kind==='choice'?{kind:'spell'}:{}),...(q.kind==='cloze'?{free:true}:{}),id:crypto.randomUUID(),retry:true,...(q.options?{options:shuffled(q.options)}:{}),...(q.bank?{bank:shuffled(q.bank)}:{})});}else s.combo++;
 s.feedback={correct,answer:q.kind==='order'?q.sentence:q.kind==='choice'?gloss(word):q.kind==='cloze'?q.span?.text||word.word:word.word,note:q.sense?`${word.word} · ${q.sense.zh}`:q.kind==='order'?'句子重组正确，之后再独立回忆。':q.kind==='match'?'所有英文和中文词义都匹配了。':r.hinted?'借助提示答对：已安排较近的复习。':''};saveDraft();tone(correct?'correct':'wrong');renderQuestion();
}
function finishSession() {
 const s=state.session;if(!s||s.completeSaved)return;s.completeSaved=true;s.phase='complete';
 const unique=[...new Set(s.wordIds)];refreshMemoryStatus();
 const repeat=s.lessonId&&state.lessons[s.lessonId],base=s.mode==='lesson'?20:10,earned=(repeat?10:base)+s.firstCorrect*3+(s.firstCorrect===s.firstCount?10:0);s.earned=earned;state.xp+=earned;
 const key=dateKey(),a=state.activity[key]||{xp:0,answered:0,lessons:0,words:[],minutes:0};a.xp+=earned;a.lessons+=s.mode==='lesson'?1:0;a.words=[...new Set([...a.words,...unique])];a.minutes+=Math.max(1,Math.min(20,Math.round((Date.now()-s.startedAt)/60000)));state.activity[key]=a;state.daily[key]=(Number(state.daily[key])||0)+unique.length;
 if(s.lessonId)state.lessons[s.lessonId]={completedAt:Date.now(),accuracy:s.firstCount?Math.round(s.firstCorrect/s.firstCount*100):100,xp:earned};
 state.history.unshift({id:s.id,date:key,time:Date.now(),type:s.mode,title:s.title,correct:s.firstCorrect,total:s.firstCount,xp:earned,words:unique.length});state.draft=null;store.set('draft',null);persist();updateHeader();tone('finish');renderCompletion();
}
function renderCompletion() {
 const s=state.session,accuracy=s.firstCount?Math.round(s.firstCorrect/s.firstCount*100):100,mistakes=Object.keys(s.wordMistakes).length;$('#lessonShell').innerHTML=`<div class="completion"><div class="completion-confetti" aria-hidden="true">${Array.from({length:16},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div><div class="mascot celebration">${mascot()}</div><span class="eyebrow">LESSON COMPLETE</span><h1>${accuracy===100?'漂亮！这一组全对了':'每一步，都在让记忆变牢'}</h1><p class="muted">${esc(s.title)} · 学习记录已保存</p><div class="completion-stats"><div class="card"><span>本次获得</span><strong class="xp-burst">+${s.earned} XP</strong></div><div class="card"><span>首答正确率</span><strong>${accuracy}%</strong></div><div class="card"><span>完成词汇</span><strong>${s.wordIds.length} 词</strong></div></div><div class="completion-summary card">${icon('refresh',24)}<div><strong>${mistakes?`${mistakes} 个词已放入稍后复习`:'下一次复习已经安排好'}</strong><p class="muted">${mistakes?'错题与提示题已安排短期复习，以个人中心显示的到期时间为准。':'复习间隔由记忆稳定度和难度决定，认词、听音、拼写和语境分开记录。'}</p></div></div><div class="completion-actions"><button class="button primary full" data-action="finish-close">回到学习路径 ${icon('arrow',20)}</button><button class="button secondary full" data-action="completion-context">再听一句语境</button></div></div>`;
}
function setAuthMode(mode) {
 mode=mode==='register'?'signup':mode;authMode=mode;$('#recoveryField').hidden=mode!=='recover';$('#authRecovery').required=mode==='recover';document.querySelectorAll('[data-auth-mode]').forEach(b=>b.classList.toggle('active',(b.dataset.authMode==='register'?'signup':b.dataset.authMode)===mode));$('#authTitle').textContent=mode==='recover'?'用恢复码找回账号':mode==='signup'?'开启你的学习旅程':'欢迎回来';$('#nameField').hidden=mode!=='signup';$('#authName').required=mode==='signup';$('#authPassword').autocomplete=mode==='signup'?'new-password':'current-password';$('#authSubmit').textContent=mode==='recover'?'设置新密码并登录':mode==='signup'?'创建账号，保存学习进度':'登录';$('#authError').textContent='';
}
function openAuth(mode='login'){setAuthMode(mode);showOverlay('authModal','#authEmail');}
function closeAuth(){hideOverlay('authModal');$('#authForm').reset();$('#authError').textContent='';}
async function submitAuth(event) {
 event.preventDefault();const email=$('#authEmail').value.trim().toLowerCase(),password=$('#authPassword').value;$('#authError').textContent='';$('#authSubmit').disabled=true;
 try {
  if(authMode==='signup'&&password.length<6)throw new Error('请设置至少 6 位的密码。');
  await flushServerSave();const guestData=!account&&authMode==='signup'?JSON.parse(JSON.stringify(snapshot())):null;
  const result=await api('/api/auth/'+(authMode==='recover'?'recover':authMode==='signup'?'register':'login'),{method:'POST',body:JSON.stringify({email,password,recoveryCode:$('#authRecovery').value,name:$('#authName').value.trim()||email.split('@')[0]})});
  if(!result.account?.id)throw new Error('账号服务没有返回有效账号，请稍后重试。');
  account=result.account;serverAccount=true;sessionIssue='';localStorage.setItem('exam-study-session',JSON.stringify(account));
  if(guestData){for(const key of progressKeys)if(guestData[key]!==undefined)store.set(key,guestData[key]);loadProgress();markSyncDirty();await flushServerSave();}
  else{await restoreAccountProgress();}
  closeAuth();switchView('profile');toast(sessionIssue?'登录状态已在其他窗口变化。原账号进度已保留，请重新登录。':syncStatus==='offline'?'已登录。学习记录暂存在本机，连接恢复后会补同步。':guestData?'欢迎！访客学习记录已转入你的账号。':`欢迎回来，${account.name}。`);tone('correct');
 }catch(error){$('#authError').textContent=error.message||'登录暂时未完成，请再试一次。';}
 finally{$('#authSubmit').disabled=false;}
}
async function logoutAccount(){const uploaded=await flushServerSave();try{await api('/api/auth/logout',{method:'POST',body:'{}'});}catch{if(!sessionIssue)toast('退出暂未完成，请检查连接后再试。');return;}const pending=store.get('syncMeta',{}).dirty;account=null;serverAccount=false;sessionIssue='';syncStatus='guest';localStorage.removeItem('exam-study-session');loadProgress();switchView('profile');toast(uploaded&&!pending?'已退出，账号与访客学习档案都已保留。':'已退出。未同步的学习记录保留在本机，下次登录会补同步。');}
function exportProgress(){const payload={...snapshot(),version:3,app:'词境 WordTrail',exportedAt:new Date().toISOString(),account:account?{name:account.name,email:account.email}:null,course:state.group.id,known:[...state.known],saved:[...state.saved],wrong:[...state.wrong],due:state.due,memory:state.memory,lessons:state.lessons,daily:state.daily,activity:state.activity,history:state.history,xp:state.xp,goal:state.goal};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`WordTrail-学习记录-${dateKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('学习记录已导出。');}
function toggleSave(id){const word=state.byId[id];if(!word)return;if(state.saved.has(id)){state.saved.delete(id);toast('已取消收藏');}else{state.saved.add(id);toast(`${word.word} 已加入收藏`);}state.collectionChanges[id]={saved:state.saved.has(id),time:Date.now()};persist();tone();if(state.session?.phase==='learn')updateFlashcardDetail(word);else if(state.view==='library'){renderLibraryResults();renderDetail();}else if(state.view==='context')renderContext();}
function action(name,target){const s=state.session;switch(name){
 case'lesson':startLesson(target.dataset.lesson);break;
 case'review':{const due=dueWords();startPractice('review',due.length?distinctWords(due).slice(0,10):practicePool(),due.length?'今日间隔复习':'当前单元巩固');break;}
 case'wrong-review':startPractice('wrong',distinctWords(state.words.filter(w=>state.wrong.has(w.id))).slice(0,10));break;
 case'resume':resumeSession();break;
 case'replace-draft':{const p=state.pendingSession;if(!p)return;state.draft=null;store.set('draft',null);state.pendingSession=null;launchSession(p.words.map(id=>state.byId[id]).filter(Boolean),p.mode,p.title,p.lessonId,p.questions);break;}
 case'close-empty-overlay':state.pendingSession=null;hideOverlay('lessonOverlay');document.body.classList.remove('lesson-open');break;
 case'next-group':{const index=state.groups.findIndex(g=>g.id===state.group.id);selectGroup(state.groups[(index+1)%state.groups.length].id);break;}
 case'begin-session':if(!s)return;s.phase=s.learnIds.length?'learn':'questions';s.response={};saveDraft();renderSession();$('#lessonOverlay').scrollTop=0;tone();break;
 case'reveal-word':if(!s)return;s.revealed=true;saveDraft();renderSession();tone();break;
 case'skip-explanation':if(!s)return;s.revealed=true;action('next-word',target);break;
 case'next-word':WordAudio.stop();if(!s||!s.revealed)return;s.learnIndex++;s.revealed=false;if(s.learnIndex>=s.learnIds.length)s.phase='questions';s.response={};saveDraft();renderSession();$('#lessonOverlay').scrollTop=0;tone();break;
 case'check-question':checkQuestion();break;
 case'continue-question':WordAudio.stop();if(!s||!s.feedback)return;s.qindex++;s.feedback=null;s.response={};saveDraft();renderSession();$('#lessonOverlay').scrollTop=0;break;
 case'cancel-session':if(!$('#cancelShade'))requestExit();break;
 case'keep-learning':closeCancelDialog();tone();break;
 case'exit-session':closeSession();toast('进度已保留，可以随时继续。');break;
 case'finish-close':closeSession();switchView('learn');break;
 case'completion-context':closeSession();switchView('context');break;
 case'spell-hint':{if(!s||s.feedback)return;const word=state.byId[s.questions[s.qindex].wid];s.response.hinted=true;$('#spellHint').textContent=`首字母：${word.word[0]} · ${word.word.length} 个字符`;s.wordMistakes[word.id]=(s.wordMistakes[word.id]||0)+1;saveDraft();break;}
 case'more-words':state.libraryLimit+=48;renderLibraryResults();break;
 case'close-detail':state.detailId=null;$('#wordDetailPanel').innerHTML='';renderLibraryResults();break;
 case'reload-detail':if(state.byId[state.detailId])lookup(state.byId[state.detailId],true);toast('正在重新查找词典与图片');break;
 case'word-practice':if(state.byId[target.dataset.word])startPractice('mixed',[state.byId[target.dataset.word]],`巩固 ${state.byId[target.dataset.word].word}`);break;
 case'load-context':loadContextGroup();break;
 case'context-prev':WordAudio.stop();WordAudio.release();state.contextIndex=Math.max(0,state.contextIndex-1);renderContext();tone();break;
 case'context-next':WordAudio.stop();WordAudio.release();state.contextIndex=(state.contextIndex+1)%Math.max(1,groupContext().length);renderContext();tone();break;
 case'context-test':{const selected=groupContext()[state.contextIndex];if(!selected)return;const q=clozeQuestion(selected.word,selected.sense);if(q)newSession([selected.word],'cloze','当前例句 · '+selected.word.word,null,[{...q,id:crypto.randomUUID(),retry:false}]);break;}
 case'toggle-translation':{const chinese=$('#contextChinese');chinese.hidden=!chinese.hidden;target.textContent=chinese.hidden?'显示中文':'隐藏中文';tone();break;}
 case'auth':case'switch-account':openAuth();break;
 case'logout':logoutAccount();break;
 case'export':exportProgress();break;
 case'import':$('#importFile').click();break;
 case'recovery-code':recoveryCode();break;
 case'guest-import':{const guest={};for(const key of progressKeys)guest[key]=readJson('exam-study-guest-'+key,readJson('exam-study-'+key,undefined));const merged=WordMemory.merge(snapshot(),guest);for(const key of progressKeys)if(merged[key]!==undefined)store.set(key,merged[key]);loadProgress();refreshMemoryStatus();persist();renderProfile();toast('游客学习记录已合并到当前账号。');break;}
 case'record-voice':WordAudio.record(target);break;
 case'daily-new':{const words=distinctWords(state.group.words.filter(w=>isLearnable(w)&&!state.due[w.id])).sort((a,b)=>b.courseFrequency-a.courseFrequency).slice(0,state.plan.newGoal||5);if(!words.length){toast('这个单元已学完新词，可切换单元或复习。');return;}newSession(words,'lesson','今日新词');break;}
 case'pretest':startPractice('mixed',distinctWords(shuffled(state.words.filter(isLearnable))).slice(0,6),'词汇摸底 · 找到需要巩固的词');break;

 }}
document.addEventListener('click',event=>{
 if(event.target.closest('[data-modal-close]')){closeAuth();return;}if(event.target.closest('[data-image-close]')){hideOverlay('imageModal');return;}
 const target=event.target.closest('button');if(!target||target.disabled)return;
 if(target.dataset.fullImage){$('#fullImage').src=target.dataset.fullImage;$('#fullImageSource').href=target.dataset.imageSource;showOverlay('imageModal','.modal-close');tone();return;}
 if(target.dataset.authMode){setAuthMode(target.dataset.authMode);return;}
 if(target.dataset.speak){speak(target.dataset.speak,target.dataset.rate||state.rate);return;}
 if(target.dataset.save){toggleSave(target.dataset.save);return;}
 if(target.dataset.course){selectGroup(target.dataset.course);$('.course-overview').open=false;return;}if(target.dataset.view){switchView(target.dataset.view);tone();return;}
 if(target.dataset.wordId){openWord(target.dataset.wordId);return;}
 if(target.dataset.practice){startPractice(target.dataset.practice);return;}
 if(target.dataset.filter){state.libraryFilter=target.dataset.filter;state.libraryLimit=48;renderLibrary();tone();return;}
 if(target.dataset.answerChoice){const s=state.session;if(!s||s.feedback)return;s.response.selected=target.dataset.answerChoice;saveDraft();renderQuestion();tone();return;}
 if(target.dataset.matchSide){selectMatch(target.dataset.matchSide,target.dataset.matchId);return;}
 if(target.dataset.pickToken!==undefined){const s=state.session;if(!s||s.feedback)return;s.response.tokens.push(Number(target.dataset.pickToken));saveDraft();renderQuestion();tone();return;}
 if(target.dataset.unpickToken!==undefined){const s=state.session;if(!s||s.feedback)return;s.response.tokens.splice(Number(target.dataset.unpickToken),1);saveDraft();renderQuestion();tone();return;}
 if(target.id==='accountButton'){if(account)switchView('profile');else openAuth();return;}
 if(target.id==='toggleSfx'){state.sfx=!state.sfx;store.set('sfx',state.sfx);queueServerSave();updateHeader();if(state.sfx)tone();return;}
 if(target.dataset.action)action(target.dataset.action,target);
});
document.addEventListener('input',event=>{const t=event.target;if(t.id==='courseSearch'){document.querySelectorAll('[data-course-search]').forEach(n=>n.hidden=!n.dataset.courseSearch.toLowerCase().includes(t.value.toLowerCase()));}if(t.id==='librarySearch'){state.libraryQuery=t.value;state.libraryLimit=48;renderLibraryResults();}if(t.id==='lessonAnswer'&&state.session&&!state.session.feedback){state.session.response.input=t.value;const q=state.session.questions[state.session.qindex];$('#checkLesson').disabled=!canCheck(q,state.session);saveDraft();}});
document.addEventListener('change',event=>{const t=event.target;if(t.id==='detailSense'){state.detailSenseIndex=Number(t.value);renderDetail();}if(t.id==='importFile'){importProgress(t.files[0]);return;}if(t.id==='subtitleMode'){state.subtitleMode=t.value;store.set('subtitleMode',t.value);renderContext();}if(t.id==='examDate'||t.id==='newGoal'){state.plan={...state.plan,[t.id==='examDate'?'examDate':'newGoal']:t.id==='examDate'?t.value:Number(t.value)};persist();toast('学习计划已更新');}if(t.id==='courseSelect')selectGroup(t.value);if(t.id==='libraryYear'){state.libraryYear=t.value;state.libraryLimit=48;renderLibraryResults();}if(t.id==='goalSelect'){state.goal=Number(t.value);store.set('goal',state.goal);queueServerSave();rail();toast('每日目标已更新。');}if(t.id==='profileSound'){state.sfx=t.checked;store.set('sfx',state.sfx);queueServerSave();updateHeader();if(state.sfx)tone();}if(t.id==='speechRate'){state.rate=Number(t.value);store.set('rate',state.rate);queueServerSave();}});
document.addEventListener('error',event=>{const img=event.target;if(!(img instanceof HTMLImageElement)||!img.dataset.fallbackImage||img.dataset.fallbackApplied)return;img.dataset.fallbackApplied='true';img.src=img.dataset.fallbackImage;const button=img.closest('.photo-view');if(button){button.dataset.fullImage=button.dataset.fallback;button.dataset.imageSource=button.dataset.fallbackSource;const caption=button.closest('.photo-item')?.querySelector('figcaption');if(caption)caption.innerHTML=`词义联想插画<a href="${esc(button.dataset.fallbackSource)}" target="_blank" rel="noreferrer">搜索真实配图 ↗</a>`;}},true);
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'){if(!$('#imageModal').hidden){hideOverlay('imageModal');return;}if(!$('#authModal').hidden){closeAuth();return;}if($('#cancelShade')){closeCancelDialog();return;}if(state.session){requestExit();return;}if(!$('#lessonOverlay').hidden){hideOverlay('lessonOverlay');document.body.classList.remove('lesson-open');}}
 const s=state.session;if(!s||s.phase!=='questions'||!$('#authModal').hidden||!$('#imageModal').hidden||$('#cancelShade'))return;
 const typing=/INPUT|TEXTAREA|SELECT/.test(event.target.tagName);if(event.key==='Enter'&&(event.target.id==='lessonAnswer'||event.target===document.body)){event.preventDefault();if(s.feedback)action('continue-question',{});else checkQuestion();}
 if(!typing&&!s.feedback&&/^[1-4]$/.test(event.key)){const q=s.questions[s.qindex];if(q.options?.[Number(event.key)-1]){s.response.selected=q.options[Number(event.key)-1].id;saveDraft();renderQuestion();tone();}}
});
window.addEventListener('beforeunload',saveDraft);
window.addEventListener('storage',event=>{if(qaMode||!account||event.key!=='exam-study-session')return;let other;try{other=JSON.parse(event.newValue);}catch{}if(other?.id===account.id)return;sessionIssue=other?'ACCOUNT_MISMATCH':'SESSION_EXPIRED';serverAccount=false;syncStatus='offline';clearTimeout(syncTimer);toast('其他窗口已切换登录状态。当前学习记录保留在本机，请重新登录后同步。');if(state.view==='profile')renderProfile();});
window.addEventListener('online',async()=>{if(account&&!sessionIssue){await bootstrapAccount();refreshMemoryStatus();renderView();rail();}});setInterval(()=>{if(account&&!sessionIssue&&syncStatus==='offline')bootstrapAccount().then(()=>{refreshMemoryStatus();if(state.view==='profile')renderProfile();});},30000);
$('#authForm').addEventListener('submit',submitAuth);
loadProgress();updateHeader();
bootstrapAccount().then(()=>{if(state.words.length){refreshMemoryStatus();renderView();updateHeader();rail();}});
Promise.all([fetch('./exam_vocab.json').then(r=>{if(!r.ok)throw new Error('词库读取失败');return r.json();}),fetch('./learning-content.json').then(r=>r.ok?r.json():{}).catch(()=>({})),fetch('./local-dictionary.json').then(r=>r.ok?r.json():{}).catch(()=>({})),fetch('./recovered-content.json').then(r=>r.ok?r.json():{}).catch(()=>({}))]).then(([items,content,dictionary,recovered])=>{
 state.content=content.words||content;state.dictionary=dictionary;state.words=prepareWords(items,recovered);state.byId=Object.fromEntries(state.words.map(w=>[w.id,w]));const occurrences={};state.words.forEach(w=>(occurrences[w.word.toLowerCase()]||=new Set()).add(w.year+'-'+w.text));state.words.forEach(w=>w.courseFrequency=occurrences[w.word.toLowerCase()].size);const grouped=new Map();state.words.forEach(w=>{const id=`${w.year}-${w.text}`;if(!grouped.has(id))grouped.set(id,{id,year:w.year,text:w.text,words:[],lessons:[]});grouped.get(id).words.push(w);});state.groups=[...grouped.values()];state.groups.forEach(g=>{for(let i=0;i<g.words.length;i+=5){const eligible=g.words.slice(i,i+5).filter(isLearnable);if(eligible.length)g.lessons.push({id:`${g.id}-lesson-${Math.floor(i/5)}`,words:eligible});};});
 loadProgress();if(state.draft&&!state.draft.wordIds?.every(id=>state.byId[id])){state.draft=null;store.set('draft',null);}refreshMemoryStatus();switchView(['learn','library','practice','context','profile'].includes(state.view)?state.view:'learn');
}).catch(error=>{$('#pathContent').innerHTML=`<div class="empty card"><h2>词库暂时无法读取</h2><p>${esc(error.message)}</p><button class="button primary" onclick="location.reload()">重新载入</button></div>`;});
})();
