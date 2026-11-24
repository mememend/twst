'use strict';
window.GiftReel=(()=>{
 let active=null;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function play({track,target,step,duration,valid,tick}){
  active?.cancel();
  return new Promise(resolve=>{
   const run={animation:null,frame:null,timer:null,done:false,last:-1};
   const distance=()=>typeof target==='function'?target():target;
   function end(finished){
    if(run.done)return;run.done=true;if(run.frame!==null)cancelAnimationFrame(run.frame);clearTimeout(run.timer);
    if(finished&&track.isConnected)track.style.transform=`translateX(-${distance()}px)`;
    try{run.animation?.cancel()}catch{}if(active===run)active=null;resolve(finished);
   }
   run.cancel=()=>end(false);run.finish=()=>end(true);active=run;
   if(!valid()){end(false);return}
   if(reduced.matches||document.hidden){track.style.transform=`translateX(-${distance()}px)`;run.timer=setTimeout(run.finish,reduced.matches?120:0);return}
   function pulse(){
    if(!valid()||!track.isConnected){end(false);return}
    const progress=run.animation?.effect?.getComputedTiming().progress;
    if(progress!==null&&progress!==undefined){const index=Math.floor(progress*distance()/step);if(index!==run.last){run.last=index;tick()}}
    if(!run.done)run.frame=requestAnimationFrame(pulse);
   }
   if(track.animate){
    run.animation=track.animate([{transform:'translateX(0)'},{transform:`translateX(-${distance()}px)`}],{duration,easing:'cubic-bezier(.08,.68,.06,1)',fill:'forwards'});
    run.animation.finished.then(run.finish,()=>{if(!run.done)end(false)});run.frame=requestAnimationFrame(pulse);
   }else{
    track.style.transition=`transform ${duration}ms cubic-bezier(.08,.68,.06,1)`;run.frame=requestAnimationFrame(()=>{if(valid())track.style.transform=`translateX(-${distance()}px)`;else end(false)});run.timer=setTimeout(run.finish,duration+40);
   }
  });
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)active?.finish()});
 document.addEventListener('close',event=>{if(event.target?.id==='modal')active?.cancel()},true);
 window.addEventListener('resize',()=>active?.finish());reduced.addEventListener?.('change',event=>{if(event.matches)active?.finish()});
 return {play};
})();
