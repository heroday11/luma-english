/* ts-fsrs 5.4.2 (MIT). Per lemma, sense and skill; source occurrence IDs stay intact. */
(function(root){
'use strict';
const F=typeof module==='object'&&module.exports?require('./vendor/index.cjs'):root.FSRS;
const scheduler=F.fsrs({request_retention:.9,enable_fuzz:false,enable_short_term:true,learning_steps:['1m','10m'],relearning_steps:['10m']});
const norm=s=>String(s||'').toLowerCase().trim().replace(/\s+/g,' ');
function pos(word){const p=norm(word.pos).replace(/\./g,'');return /^(vt|vi|v|verb)/.test(p)?'v':/^n(?:$|oun)/.test(p)?'n':/^adj|^a$/.test(p)?'adj':/^adv/.test(p)?'adv':p;}
function skill(kind){return kind==='spell'?'production':kind==='cloze'||kind==='order'?'context':kind==='listening'?'listening':'recognition';}
function key(word,kind,sense){return [norm(word.word),pos(word),norm(sense?.en||word.meanings?.join('；')),skill(kind)].join('|');}
function revive(card,now=new Date()) {
 if(!card)return F.createEmptyCard(now);
 return {...card,due:new Date(card.due),...(card.last_review?{last_review:new Date(card.last_review)}:{})};
}
function review(old,rating,at){const result=scheduler.next(revive(old,new Date(at)),new Date(at),rating);return JSON.parse(JSON.stringify(result));}
function recall(card,at=Date.now()){if(!card?.last_review||!card.stability)return 0;return scheduler.get_retrievability(revive(card),new Date(at),false);}
function grade({correct,hinted,retry,kind}){if(!correct||hinted)return F.Rating.Again;if(retry||['choice','match','listening'].includes(kind))return F.Rating.Hard;return F.Rating.Good;}
function merge(a={},b={}){
 const out={...a,...b};
 for(const k of ['known','saved','wrong'])out[k]=[...new Set([...(a[k]||[]),...(b[k]||[])])];
 out.collectionChanges={...(a.collectionChanges||{}),...(b.collectionChanges||{})};
 for(const [id,change]of Object.entries(a.collectionChanges||{}))if(change.time>(out.collectionChanges[id]?.time||0))out.collectionChanges[id]=change;
 const favorites=new Set(out.saved);for(const [id,change]of Object.entries(out.collectionChanges))if(change.saved)favorites.add(id);else favorites.delete(id);out.saved=[...favorites];
 out.reviewEvents=[...new Map([...(a.reviewEvents||[]),...(b.reviewEvents||[])].map(e=>[e.id,e])).values()].sort((x,y)=>x.time-y.time);
 for(const k of ['memory','due','cards','lessons','daily','activity'])out[k]={...(a[k]||{}),...(b[k]||{})};
 for(const [k,card]of Object.entries(a.cards||{}))if(new Date(card.last_review||0)>new Date(out.cards[k]?.last_review||0))out.cards[k]=card;
 // Rebuild changed branches from their durable events instead of keeping one tab's card.
 const replay={};
 for(const event of out.reviewEvents)for(const record of event.ratings||[]){if(record.early||!record.log)continue;replay[record.key]={...review(replay[record.key],record.rating,event.time).card,lastRating:record.rating};}
 for(const [k,c]of Object.entries(replay))out.cards[k]={...out.cards[k],...c};
 for(const [k,m]of Object.entries(a.memory||{}))if((m.last||0)>(out.memory[k]?.last||0)){out.memory[k]=m;out.due[k]=a.due?.[k];}
 out.quizzes=[...new Map([...(a.quizzes||[]),...(b.quizzes||[])].map(h=>[h.id||h.time||JSON.stringify(h),h])).values()].sort((x,y)=>(y.time||0)-(x.time||0)).slice(0,200);
 for(const [k,v]of Object.entries(a.activity||{})){const w=b.activity?.[k]||{};out.activity[k]={...v,...w,words:[...new Set([...(v.words||[]),...(w.words||[])])],xp:Math.max(v.xp||0,w.xp||0),answered:Math.max(v.answered||0,w.answered||0)};}
 const ax=(a.quizzes||[]).reduce((n,h)=>n+(h.xp||0),0),bx=(b.quizzes||[]).reduce((n,h)=>n+(h.xp||0),0);
 out.xp=Math.max(0,a.xp-ax||0,b.xp-bx||0)+out.quizzes.reduce((n,h)=>n+(h.xp||0),0);out.schemaVersion=3;return out;
}
const api={scheduler,key,skill,pos,review,recall,grade,merge,Rating:F.Rating};
if(typeof module==='object'&&module.exports)module.exports=api;else root.WordMemory=api;
})(typeof globalThis!=='undefined'?globalThis:this);
