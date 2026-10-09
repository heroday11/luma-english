const assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('./content-engine'),M=require('./memory-engine');
const raw=JSON.parse(fs.readFileSync('exam_vocab.json','utf8')),content=JSON.parse(fs.readFileSync('learning-content.json','utf8')),dictionary=JSON.parse(fs.readFileSync('local-dictionary.json','utf8')),fixes=JSON.parse(fs.readFileSync('recovered-content.json','utf8'));
const map=new Map(fixes.corrections.map(c=>[c.index,c]));const words=raw.map((w,i)=>({...w,...map.get(i),word:map.get(i)?.word||w.word}));
assert.equal(raw.length,2033);
for(const fix of fixes.corrections){assert.equal(raw[fix.index].word,fix.originalWord);assert.equal(raw[fix.index].year,fix.originalYear);assert.equal(raw[fix.index].text,fix.originalText);}
const failures=[];let count=0;
for(const [lemma,item] of Object.entries(content))for(const sense of item.senses){const span=C.target({word:lemma},sense,dictionary[lemma]);count++;if(!span)failures.push([lemma,sense.exampleEn]);else{const masked=C.mask(sense.exampleEn,span);assert.equal(masked.slice(span.start,span.start+8),'________');}}
assert.equal(C.target({word:'fetch'},{exampleEn:'The painting fetched a high price.'},dictionary.fetch).text,'fetched');
assert.equal(C.target({word:'lead'},{exampleEn:'The water left a mark on the silk dress.'},dictionary.lead),null);
assert.equal(C.target({word:'art'},{exampleEn:'They started today.'}),null);
assert.equal(C.speechText('lead',{pos:'n.',meanings:['铅']},{pos:'v.',zh:'引导',en:'to guide'}),'lead the team');
assert.equal(C.speechText('lead',{pos:'v.',meanings:['引导']},{pos:'n.',zh:'铅',en:'a heavy metal'}),'lead metal');
assert.equal(C.speechText('record',{pos:'n.'},{pos:'v.',zh:'记录'}),'record the results');
assert.equal(C.speechText('live',{pos:'v.'},{pos:'adj.',zh:'现场的'}),'live music');
assert.equal(C.speechText('wind',{pos:'n.'},{pos:'v.',zh:'上发条'}),'wind the clock');
assert.equal(C.speechText('The wind blows.',{pos:'v.'},{pos:'v.',zh:'上发条'}),'The wind blows.');
const start=Date.UTC(2026,9,9),first=M.review(null,3,start).card;
assert.equal(M.grade({correct:true,hinted:true,kind:'spell'}),1);
assert.equal(M.grade({correct:true,hinted:false,retry:false,kind:'choice'}),2);
assert.equal(M.grade({correct:true,kind:'spell'}),3);
assert(M.recall(first,start+100*86400000)<.8);
const a=M.key({word:'lead',pos:'v.',meanings:['引导']},'choice'),b=M.key({word:'lead',pos:'n.',meanings:['铅']},'choice');assert.notEqual(a,b);
const r1=M.review(null,3,start),r2=M.review(r1.card,1,start+86400000);
const merged=M.merge({cards:{test:r1.card},reviewEvents:[{id:'a',time:start,ratings:[{key:'test',rating:3,log:r1.log}]}],quizzes:[{id:'x',time:1,xp:10}],xp:10},{cards:{test:r2.card},reviewEvents:[{id:'b',time:start+86400000,ratings:[{key:'test',rating:1,log:r2.log}]}],quizzes:[{id:'y',time:2,xp:20}],xp:20});
assert.equal(merged.reviewEvents.length,2);assert.equal(merged.cards.test.reps,2);assert.equal(merged.xp,30);
const groups=new Map();for(const w of words){const key=w.year+'-'+w.text;groups.set(key,[...(groups.get(key)||[]),w]);}
const empty=[...groups].filter(([k,ws])=>!ws.some(w=>content[w.word.toLowerCase()]?.senses.some(s=>C.target(w,s,dictionary[w.word.toLowerCase()])&&s.exampleZh))).map(([k])=>k);
console.log(JSON.stringify({assertions:'passed',curatedWords:Object.keys(content).length,examples:count,unmatchedExamples:failures,units:groups.size,unitsWithoutExamples:empty},null,2));
assert.equal(failures.length,0);assert.equal(empty.length,0);
const missing=words.filter(w=>!dictionary[w.word.toLowerCase()]?.reviewRequired&&!content[w.word.toLowerCase()]?.senses.length&&!dictionary[w.word.toLowerCase()]?.alignedSenses?.length);
assert.deepEqual(missing,[]);
