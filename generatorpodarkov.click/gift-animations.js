'use strict';
// One original vector animation at a time; keep the photo until a painted frame exists.
(() => {
 let current=null,epoch=0,vendor=null;
 const cache=new Map(),scenes=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function alive(s){return !!s&&current===s&&s.token===epoch&&s.stage.isConnected&&document.querySelector('#modal')?.open}
 function release(s){if(!s)return;clearTimeout(s.deadline);clearTimeout(s.frameDeadline);s.request?.abort();s.viewport?.disconnect();try{s.player?.destroy()}catch{}s.player=null}
 function stop(){epoch++;release(current);current=null}
 function library(){
  if(window.lottie)return Promise.resolve(window.lottie);
  if(!vendor)vendor=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='/vendor/lottie-light.min.js';
   const fail=()=>{clearTimeout(timer);script.remove();vendor=null;reject(new Error('Player unavailable'))};
   const timer=setTimeout(fail,14000);
   script.onload=()=>{clearTimeout(timer);if(window.lottie?.loadAnimation)resolve(window.lottie);else fail()};script.onerror=fail;document.head.append(script);
  });return vendor;
 }
 function photo(s,state='photo'){s.stage.classList.remove('playing');s.stage.dataset.animationState=state}
 async function scene(s,signal){
  if(!s.instance)return null;
  let data=scenes.get(s.instance);
  if(!data){data=await api('gift-scene?instance='+encodeURIComponent(s.instance),undefined,{signal});
   if(!/^\/gift-scenes\/[0-9a-f]{64}\.svg$/.test(data.background))throw new Error('Invalid gift scene');
   scenes.set(s.instance,data);if(scenes.size>8)scenes.delete(scenes.keys().next().value);
  }
  const image=document.createElement('img');image.src=data.background;await image.decode();
  return data;
 }
 function fail(s,text='Повторить анимацию'){
  if(!alive(s))return;
  s.wants=false;s.ready=false;photo(s,'unavailable');s.button.disabled=false;s.button.textContent=text;
  clearTimeout(s.deadline);clearTimeout(s.frameDeadline);s.request?.abort();s.player?.pause();
  // Errors can arrive inside Lottie's render loop; destroy after that callback returns.
  const broken=s.player;s.player=null;queueMicrotask(()=>{try{broken?.destroy()}catch{}});
 }
 function visible(svg){
  if(!svg)return false;
  let box;try{box=svg.getBBox()}catch{return false}
  if(!box||!Number.isFinite(box.width)||!Number.isFinite(box.height)||box.width<2||box.height<2)return false;
  const viewport=svg.getBoundingClientRect();
  for(const path of svg.querySelectorAll('path,rect,ellipse,circle,polygon,polyline')){
   const rect=path.getBoundingClientRect(),width=Math.min(rect.right,viewport.right)-Math.max(rect.left,viewport.left),height=Math.min(rect.bottom,viewport.bottom)-Math.max(rect.top,viewport.top);
   if(width<2||height<2||width*height<16)continue;
   const paint=getComputedStyle(path);
   if((paint.fill==='none'||Number(paint.fillOpacity)<=.02)&&(paint.stroke==='none'||Number(paint.strokeOpacity)<=.02))continue;
   let opacity=1,node=path;
   while(node&&node!==svg.parentElement){
    const style=getComputedStyle(node);if(style.display==='none'||style.visibility==='hidden'){opacity=0;break}
    const alpha=Number(style.opacity);if(Number.isFinite(alpha))opacity*=alpha;if(opacity<=.02)break;node=node.parentElement;
   }
   if(opacity>.02)return true;
  }
  return false;
 }
 function frame(s,force=false){
  if(!alive(s)||!s.ready||!s.wants||document.hidden||!s.inView)return;
  const now=performance.now();if(!force&&now-s.probed<200)return;s.probed=now;
  if(visible(s.motion.querySelector('svg'))){s.stage.classList.add('playing');s.stage.dataset.animationState='motion';s.seen=true;clearTimeout(s.frameDeadline)}else photo(s);
 }
 function playback(s){
  if(!alive(s)||!s.ready||!s.player)return;
  clearTimeout(s.frameDeadline);
  if(s.wants&&!document.hidden&&s.inView){
   if(!s.seen)s.frameDeadline=setTimeout(()=>{if(!s.seen)fail(s)},Math.min(8000,Math.max(2500,s.player.totalFrames/s.player.frameRate*1000+1000)));
   s.player.play();frame(s,true);
  }else s.player.pause();
 }
 async function play(s){
  const attempt=(s.attempt||0)+1;s.attempt=attempt;const valid=()=>alive(s)&&s.attempt===attempt;
  const old=s.player;s.player=null;try{old?.destroy()}catch{}
  clearTimeout(s.deadline);clearTimeout(s.frameDeadline);s.request?.abort();
  const request=new AbortController();s.request=request;s.ready=false;s.wants=true;s.seen=false;s.probed=-Infinity;
  s.button.disabled=true;s.button.textContent='Загружаем…';photo(s,'loading');s.deadline=setTimeout(()=>{if(valid())fail(s)},18000);
  try{
   const [lottie,data,backdrop]=await Promise.all([library(),(async()=>{
    if(cache.has(s.id))return cache.get(s.id);
    const response=await fetch('/gift-animation/'+encodeURIComponent(s.id)+'.json',{signal:request.signal,credentials:'omit'});
    if(!response.ok)throw new Error('Animation unavailable');
    const data=await response.json();cache.set(s.id,data);if(cache.size>6)cache.delete(cache.keys().next().value);return data;
   })(),scene(s,request.signal)]);
   if(!valid()||request.signal.aborted)return;
   if(backdrop){s.backdrop.src=backdrop.background;s.stage.dataset.sceneState='ready'}
   s.motion.replaceChildren();
   const animationData=JSON.parse(JSON.stringify(data));
   // Telegram exporters omit empty shape lists; Lottie expects explicit arrays.
   function shapes(items){for(const item of items||[])if(item.ty==='gr'){if(item.it===undefined)item.it=[];shapes(item.it)}}
   function layers(items){for(const item of items||[])if(item.ty===4){if(item.shapes===undefined)item.shapes=[];shapes(item.shapes)}}
   layers(animationData.layers);for(const asset of animationData.assets||[])layers(asset.layers);
   const registered=new Set(lottie.getRegisteredAnimations?.()||[]);let player;
   try{player=lottie.loadAnimation({container:s.motion,renderer:'svg',loop:true,autoplay:false,animationData,rendererSettings:{progressiveLoad:false,preserveAspectRatio:'xMidYMid meet',hideOnTransparent:true}})}
   catch(error){for(const orphan of lottie.getRegisteredAnimations?.()||[])if(!registered.has(orphan)){try{orphan.destroy()}catch{}}throw error}
   s.player=player;player.setSubframe(false);
   player.addEventListener('error',()=>{if(valid())fail(s)});player.addEventListener('data_failed',()=>{if(valid())fail(s)});player.addEventListener('drawnFrame',()=>{if(valid())frame(s)});
   function ready(){if(!valid()||s.player!==player||s.ready)return;clearTimeout(s.deadline);s.ready=true;s.button.disabled=false;s.button.textContent=s.wants?'Фото подарка':'▶ Анимация';playback(s)}
   player.addEventListener('DOMLoaded',ready);if(player.isLoaded)queueMicrotask(ready);
  }catch(error){if(valid())fail(s,error.name==='AbortError'?'Повторить анимацию':'Анимация пока недоступна')}
 }
 function mount(){
  const modal=document.querySelector('#modal'),image=modal?.open?modal.querySelector('.modal-gift > img[data-animation-id]'):null;
  if(!image){if(current&&!current.stage.isConnected)stop();return}
  stop();const stage=document.createElement('div');stage.className='gift-animation-stage';
  const motion=document.createElement('div');motion.className='gift-motion';motion.setAttribute('aria-hidden','true');
  const button=document.createElement('button');button.className='gift-animation-toggle';button.type='button';button.textContent='▶ Анимация';
  image.replaceWith(stage);stage.append(image,motion,button);
  const backdrop=document.createElement('img');backdrop.className='gift-scene';backdrop.alt='';backdrop.setAttribute('aria-hidden','true');stage.append(backdrop);
  const instance=image.dataset.sceneInstance;
  if(instance&&/^[1-9][0-9]{0,8}$/.test(image.dataset.giftNumber||'')){const badge=document.createElement('span');badge.className='gift-number-badge';badge.textContent='#'+Number(image.dataset.giftNumber).toLocaleString('ru-RU');stage.append(badge)}
  const s={token:epoch,stage,motion,button,backdrop,instance,id:image.dataset.animationId,inView:true,wants:false,ready:false,probed:-Infinity};current=s;photo(s);
  if(typeof IntersectionObserver==='function'){s.viewport=new IntersectionObserver(entries=>{if(!alive(s))return;s.inView=entries.some(e=>e.isIntersecting);playback(s)});s.viewport.observe(stage)}
  button.onclick=()=>{if(!alive(s)||button.disabled)return;if(s.ready&&s.player){s.wants=!s.wants;button.textContent=s.wants?'Фото подарка':'▶ Анимация';if(!s.wants)photo(s);playback(s)}else play(s)};
  if(!reduced.matches)play(s);
 }
 function observe(){
  const content=document.querySelector('#modal-content'),modal=document.querySelector('#modal');if(!content||!modal)return;
  new MutationObserver(mount).observe(content,{childList:true});new MutationObserver(()=>{if(!modal.open)stop();else mount()}).observe(modal,{attributes:true,attributeFilter:['open']});
  modal.addEventListener('close',()=>{if(!modal.open)stop()});modal.addEventListener('cancel',stop);document.addEventListener('visibilitychange',()=>playback(current));
  reduced.addEventListener('change',()=>{if(reduced.matches&&current){current.wants=false;photo(current);current.button.textContent='▶ Анимация';playback(current)}});mount();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe);else observe();
})();
