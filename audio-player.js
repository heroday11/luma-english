/* Free online Edge voices, cached audio, word timing and browser recording. */
(()=>{
'use strict';
let audio=new Audio(),sequence=0,current=null,loop=false,controller,recorder,recordingUrl,recordStream,segmentA=0,segmentB=null,segmentLoop=false;
const voices=[['en-US-AriaNeural','美音 · Aria 女声'],['en-US-GuyNeural','美音 · Guy 男声'],['en-GB-SoniaNeural','英音 · Sonia 女声'],['en-GB-RyanNeural','英音 · Ryan 男声']];
const voiceStorage=new URLSearchParams(location.search).get('qa')==='1'?sessionStorage:localStorage;
let voice=voiceStorage.getItem('wordtrail-voice-v3')||voices[0][0];if(!voices.some(v=>v[0]===voice))voice=voices[0][0];
const dock=document.createElement('section');dock.id='audioDock';dock.className='audio-dock';dock.hidden=true;dock.setAttribute('aria-label','在线朗读播放器');
dock.innerHTML='<div class="audio-dock-copy"><strong id="audioStatus" role="status">在线自然语音</strong><span id="audioText"></span></div><div class="audio-dock-controls"><button id="audioPause" class="button secondary" aria-label="暂停或继续朗读">暂停</button><button id="audioRepeat" class="button ghost" aria-pressed="false">循环</button><details class="audio-segment"><summary>分段</summary><div><button id="audioSetA" class="button ghost">设 A 起点</button><button id="audioSetB" class="button ghost">设 B 终点</button><button id="audioAB" class="button ghost" aria-pressed="false">AB 复读</button></div></details><button id="audioClose" class="icon-btn" aria-label="关闭朗读">×</button></div>';
document.body.appendChild(dock);
const status=t=>{dock.querySelector('#audioStatus').textContent=t;};
function clear(){document.body.classList.remove('is-speaking');document.querySelectorAll('.speaking,.audio-word-active').forEach(n=>n.classList.remove('speaking','audio-word-active'));}
function stop(){sequence++;controller?.abort();audio.pause();clear();dock.hidden=true;current=null;}
async function speak(text,rate=1){
 const overlay=document.querySelector('#lessonOverlay');(overlay&&!overlay.hidden?overlay:document.body).appendChild(dock);
 const id=++sequence;controller?.abort();controller=new AbortController();audio.pause();current=null;segmentLoop=false;clear();dock.hidden=false;dock.querySelector('#audioText').textContent=text;status('正在连接在线自然语音…');dock.querySelector('#audioPause').disabled=true;
 try{
  const response=await fetch('/api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,voice,rate:Number(rate)}),signal:controller.signal});
  const data=await response.json();if(!response.ok)throw new Error(data.error||'在线语音暂时不可用');if(id!==sequence)return;
  let offset=0;data.timings.forEach(t=>{const at=text.toLowerCase().indexOf(t.text.toLowerCase(),offset);t.characterStart=at;t.characterEnd=at+t.text.length;if(at>=0)offset=t.characterEnd;});
  current=data;segmentA=0;segmentB=null;segmentLoop=false;dock.querySelector('#audioAB').setAttribute('aria-pressed','false');audio.src=data.url;audio.loop=loop;dock.querySelector('#audioPause').disabled=false;dock.querySelector('#audioPause').textContent='暂停';
  await audio.play();if(id!==sequence)return;status((data.cached?'缓存播放 · ':'')+voices.find(v=>v[0]===voice)[1]+' · 在线合成');document.body.classList.add('is-speaking');
  document.querySelectorAll('[data-speak]').forEach(n=>{if(n.dataset.speak===text)n.classList.add('speaking');});
 }catch(e){if(id!==sequence||e.name==='AbortError')return;status('在线语音连接失败，点击重试');dock.querySelector('#audioPause').disabled=false;dock.querySelector('#audioPause').textContent='重试';clear();}
}
audio.addEventListener('timeupdate',()=>{
 if(segmentLoop&&segmentB&&audio.currentTime>=segmentB)audio.currentTime=segmentA;
 document.querySelectorAll('.audio-word-active').forEach(n=>n.classList.remove('audio-word-active'));
 if(!current)return;const index=current.timings.findIndex(t=>audio.currentTime>=t.start&&audio.currentTime<t.end);
 if(index>=0)document.querySelectorAll(`[data-audio-text]`).forEach(node=>{if(node.dataset.audioText===current.text)node.querySelectorAll('[data-audio-index]').forEach(n=>n.classList.toggle('audio-word-active',Number(n.dataset.audioStart)<=current.timings[index].characterStart&&Number(n.dataset.audioEnd)>current.timings[index].characterStart));});
});
audio.addEventListener('ended',()=>{if(segmentLoop&&segmentB){audio.currentTime=segmentA;audio.play().catch(()=>status('点击继续播放'));return;}clear();status('朗读结束 · 可重听');dock.querySelector('#audioPause').textContent='重听';});
audio.addEventListener('error',()=>{clear();status('音频加载失败 · 请重试');dock.querySelector('#audioPause').textContent='重试';});
dock.querySelector('#audioPause').onclick=()=>{if(!current){speak(dock.querySelector('#audioText').textContent);return;}if(audio.paused){audio.play().catch(()=>status('播放受阻，请再点一次'));document.body.classList.add('is-speaking');dock.querySelector('#audioPause').textContent='暂停';}else{audio.pause();clear();dock.querySelector('#audioPause').textContent='继续';}};
dock.querySelector('#audioRepeat').onclick=e=>{loop=!loop;audio.loop=loop;e.target.setAttribute('aria-pressed',String(loop));e.target.textContent=loop?'循环中':'循环';};
dock.querySelector('#audioClose').onclick=stop;
dock.querySelector('#audioSetA').onclick=()=>{segmentA=audio.currentTime;status('A 起点 '+segmentA.toFixed(1)+' 秒');};
dock.querySelector('#audioSetB').onclick=()=>{if(audio.currentTime<=segmentA+.1){status('B 终点应晚于 A 起点，请播放后再设');return;}segmentB=audio.currentTime;status('B 终点 '+segmentB.toFixed(1)+' 秒');};
dock.querySelector('#audioAB').onclick=e=>{if(!segmentB){status('先在播放时设置 A、B 两个位置');return;}segmentLoop=!segmentLoop;audio.loop=segmentLoop?false:loop;e.target.setAttribute('aria-pressed',String(segmentLoop));if(segmentLoop){audio.currentTime=segmentA;audio.play().catch(()=>status('点击继续开始分段复读'));}status(segmentLoop?'正在分段复读':'分段复读已关闭');};
document.addEventListener('change',e=>{if(e.target.matches('[data-voice-select]')){voice=e.target.value;voiceStorage.setItem('wordtrail-voice-v3',voice);stop();}});
function voiceSelect(){return '<label class="voice-setting">朗读音色 <select class="select-control" data-voice-select aria-label="选择在线朗读音色">'+voices.map(v=>`<option value="${v[0]}" ${voice===v[0]?'selected':''}>${v[1]}</option>`).join('')+'</select></label>';}
async function record(button){
 if(recorder?.state==='recording'){recorder.stop();button.textContent='录音跟读';return;}
 if(!navigator.mediaDevices?.getUserMedia){status('当前浏览器不支持录音');return;}
 try{
  audio.pause();clear();recordStream=await navigator.mediaDevices.getUserMedia({audio:true});const chunks=[];recorder=new MediaRecorder(recordStream);
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  recorder.onstop=()=>{recordStream.getTracks().forEach(t=>t.stop());if(recordingUrl)URL.revokeObjectURL(recordingUrl);recordingUrl=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType}));const output=document.querySelector('#recordingPlayback');if(output){output.src=recordingUrl;output.hidden=false;}button.textContent='录音跟读';};
  recorder.start();button.textContent='停止录音';setTimeout(()=>{if(recorder?.state==='recording')recorder.stop();},60000);
 }catch{button.textContent='麦克风未获授权，可再次尝试';}
}
function release(){if(recorder?.state==='recording')recorder.stop();recordStream?.getTracks().forEach(t=>t.stop());}
window.addEventListener('beforeunload',release);
window.WordAudio={speak,stop,voiceSelect,record,release};
})();
