'use strict';
window.GiftAudio=(()=>{
 const kinds=new Set(['click','tick','open','win','epic','legendary','claim','error']),buffers=new Map(),pending=new Map(),last=new Map(),voices=new Set(),queue=[];
 let context=null,master=null,epoch=0,enabled=true,loading=0;
 try{enabled=localStorage.getItem('gift:sound')!=='off'}catch{}
 function sync(){const button=document.querySelector('#sound-toggle');if(!button)return;button.textContent=enabled?'♫':'♪';button.setAttribute('aria-pressed',String(enabled));button.setAttribute('aria-label',enabled?'Выключить звук':'Включить звук')}
 function stop(){epoch++;for(const source of voices){try{source.stop()}catch{}try{source.disconnect()}catch{}}voices.clear()}
 function pump(){
  while(loading<2&&queue.length){
   const job=queue.shift(),controller=new AbortController();let timer;loading++;
   const data=fetch('/sounds/'+job.kind+'.wav',{cache:'force-cache',signal:controller.signal}).then(r=>{if(!r.ok)throw new Error('Sound unavailable');return r.arrayBuffer()}).then(body=>context.decodeAudioData(body));
   const timeout=new Promise(resolve=>{timer=setTimeout(()=>{controller.abort();resolve(null)},4500)});
   Promise.race([data,timeout]).then(buffer=>{if(buffer)buffers.set(job.kind,buffer);job.resolve(buffer)}).catch(()=>job.resolve(null)).finally(()=>{clearTimeout(timer);pending.delete(job.kind);loading--;pump()});
  }
 }
 function load(kind){
  if(buffers.has(kind))return Promise.resolve(buffers.get(kind));if(pending.has(kind))return pending.get(kind);
  if(!context)return Promise.resolve(null);
  let resolve;const promise=new Promise(done=>resolve=done);pending.set(kind,promise);queue.push({kind,resolve});pump();return promise;
 }
 async function unlock(){
  if(!enabled||document.hidden)return;
  try{if(!context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;context=new Audio();master=context.createGain();master.gain.value=.28;master.connect(context.destination)}if(context.state==='suspended')await context.resume();if(context.state==='running'){load('click');load('open')}}catch{}
 }
 function start(kind,buffer){
  if(!enabled||document.hidden||context?.state!=='running'||!buffer)return;
  if(voices.size>=8){if(kind==='tick'||kind==='click')return;const oldest=voices.values().next().value;try{oldest.stop()}catch{}oldest.disconnect();voices.delete(oldest)}
  const source=context.createBufferSource();source.buffer=buffer;source.connect(master);voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();source.onended=null};source.start();
 }
 function play(kind){
  if(!kinds.has(kind)||!enabled||document.hidden||context?.state!=='running')return;
  const now=performance.now(),gap=kind==='tick'?45:kind==='click'?65:kind==='legendary'?900:200;
  if(now-(last.get(kind)??-Infinity)<gap)return;last.set(kind,now);
  const token=epoch;if(buffers.has(kind)){start(kind,buffers.get(kind));return}
  load(kind).then(buffer=>{if(token===epoch&&performance.now()-now<600)start(kind,buffer)});
 }
 document.addEventListener('pointerdown',unlock,{passive:true});document.addEventListener('keydown',unlock,{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
 document.addEventListener('click',event=>{
  const button=event.target.closest('button,a');if(!button||button.disabled)return;
  if(button.id==='sound-toggle'){enabled=!enabled;try{localStorage.setItem('gift:sound',enabled?'on':'off')}catch{}if(!enabled)stop();else unlock().then(()=>play('click'));sync()}
  else play('click');
 });sync();return {play,get enabled(){return enabled}};
})();
