'use strict';
window.GiftMotion=(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),animations=new Set();let route=null;
 function animate(element,frames,options){
  if(!element||document.hidden||reduced.matches||!element.animate)return;
  const animation=element.animate(frames,options);animations.add(animation);animation.finished.catch(()=>{}).finally(()=>animations.delete(animation));
  if(animations.size>8){const oldest=animations.values().next().value;oldest.cancel();animations.delete(oldest)}
 }
 function enter(element,nextRoute){if(route===nextRoute)return;route=nextRoute;animate(element,[{opacity:.4,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:230,easing:'cubic-bezier(.2,.8,.2,1)'})}
 function dialog(element){animate(element,[{opacity:.15,transform:'translateY(12px) scale(.97)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)'})}
 function cancel(){for(const animation of animations)animation.cancel();animations.clear()}
 reduced.addEventListener?.('change',event=>{if(event.matches)cancel()});document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel()});
 document.addEventListener('pointerdown',event=>{const button=event.target.closest('button,.primary,.secondary');if(!button||button.disabled)return;animate(button,[{transform:'scale(1)'},{transform:'scale(.97)'},{transform:'scale(1)'}],{duration:170,easing:'ease-out'})},{passive:true});
 return {enter,dialog};
})();
