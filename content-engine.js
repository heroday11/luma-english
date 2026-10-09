/* Target spans are complete surface forms, never substring replacements. */
(function(root){
'use strict';
const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const irregular={lead:['led','leading','leads'],fetch:['fetched','fetches','fetching'],address:['addressed','addresses','addressing'],generate:['generated','generates','generating'],be:['is','are','was','were','been','being'],have:['has','had','having'],make:['made','makes','making'],take:['took','taken','takes','taking'],go:['went','gone','goes','going'],put:['puts','putting'],keep:['kept','keeps','keeping'],rise:['rose','risen','rises','rising'],leave:['left','leaves','leaving'],sell:['sold','sells','selling'],find:['found','finds','finding'],spring:['sprang','sprung','springs','springing'],spill:['spilt','spilled','spills','spilling']};
function forms(lemma,dictionary={}) {
 const list=[lemma,...(dictionary.forms||[]).map(f=>f.word),...(irregular[norm(lemma)]||[])];
 if(/^[a-z]+$/i.test(lemma)) {
  const w=norm(lemma);list.push(w+'s',w+'es');
  if(w.endsWith('e'))list.push(w+'d',w.slice(0,-1)+'ing');else list.push(w+'ed',w+'ing');
  if(/[^aeiou]y$/.test(w))list.push(w.slice(0,-1)+'ies',w.slice(0,-1)+'ied');
 }
 return [...new Set(list.map(norm).filter(Boolean))].sort((a,b)=>b.length-a.length);
}
function target(word,sense,dictionary={}) {
 const sentence=sense.exampleEn||'';
 if(sense.target) {
  const {start,end}=sense.target;
  if(Number.isInteger(start)&&Number.isInteger(end)&&start>=0&&end>start&&end<=sentence.length)return {start,end,text:sentence.slice(start,end)};
 }
 let candidates=forms(word.word,dictionary);
 if(sense.surfaceForms)candidates=[...sense.surfaceForms,...candidates];
 for(const phrase of candidates){
  const re=new RegExp('(?<![A-Za-z])'+escape(phrase)+'(?![A-Za-z])','i'),m=re.exec(sentence);
  if(m)return {start:m.index,end:m.index+m[0].length,text:m[0]};
 }
 return null;
}
const mask=(sentence,span)=>sentence.slice(0,span.start)+'________'+sentence.slice(span.end);
function imageQuery(word,sense){
 const text=norm((sense?.en||'')+' '+(sense?.exampleEn||''));
 const maps={lead:/metal|atomic|element/.test(text)?'lead metal cube':'orchestra conductor',record:/sound|music/.test(text)?'music recording studio':'written document notebook',issue:/magazine|publication/.test(text)?'magazine cover':'public discussion meeting',address:/speech|audience/.test(text)?'speaker audience lecture':/problem|deal|solve/.test(text)?'team solving problem':'street address sign',capital:/city|government/.test(text)?'London city parliament':'business investment finance',charge:/electric|battery/.test(text)?'electric car charging':'payment shop counter',fine:/penalty|money/.test(text)?'traffic parking ticket':'clear sunny weather',fetch:/price|sell|auction/.test(text)?'painting art auction':'person carrying books',spring:/water/.test(text)?'natural water spring':'spring flowering trees',tender:/bid|contract/.test(text)?'business contract meeting':'gentle hand flower',interest:/money|loan/.test(text)?'bank loan document':'person reading book',right:'human rights demonstration'};
 if(norm(word.word)==='gallery'&&/theatre|theater|raised area|seats/.test(text))return 'theatre balcony';
 if(norm(word.word)==='note')return /pitch|music|sound/.test(text)?'sheet music':/writing|reminder|message/.test(text)?'handwritten note':/notice|record/.test(text)?'writing notes':'public speaking audience';
 if(norm(word.word)==='charge'&&/accus|criminal|offence/.test(text))return 'courtroom trial';
 if(norm(word.word)==='capital'&&/letter|alphabet/.test(text))return 'alphabet capital letters';
 if(norm(word.word)==='right'&&/side|direction/.test(text))return 'right arrow road sign';
 return maps[norm(word.word)]||sense?.imageQuery||null;
}
function imageMatches(word,sense,description){
 const text=norm(description),meaning=norm((sense?.en||'')+' '+(sense?.zh||''));
 if(norm(word.word)==='lead')return /metal|铅/.test(meaning)?/\blead\b|plumbum|\bblei\b/.test(text):/conductor|conducting|dirigent|team leader|leadership/.test(text);
 if(norm(word.word)==='gallery'&&/theatre|raised area|seats/.test(meaning))return /theatre|theater|balcony/.test(text);
 return true;
}
function speechText(text,word,sense){
 const lemma=norm(text),selected=sense&&(sense.zh||sense.en);
 const meaning=norm(selected?((sense.zh||'')+' '+(sense.en||'')):(word?.meanings||[]).join(' '));
 const pos=norm(sense?.pos||word?.pos),verb=/^(v\b|vt\b|vi\b|verb\b)/.test(pos);
 const homographs={
  lead:/\bmetal\b|atomic|element|铅/.test(meaning)?'lead metal':'lead the team',
  record:verb?'record the results':'a record',
  live:verb||/生活|居住/.test(meaning)?'live in London':'live music',
  wind:verb||/缠绕|上发条/.test(meaning)?'wind the clock':'the wind blows',
  address:verb?'address the problem':'an address',
  object:verb?'object to the proposal':'an object',
 };
 return homographs[lemma]||text;
}
const api={norm,forms,target,mask,imageQuery,imageMatches,speechText};
if(typeof module==='object'&&module.exports)module.exports=api;else root.WordContent=api;
})(typeof globalThis!=='undefined'?globalThis:this);
