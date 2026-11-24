'use strict';
window.GiftPayments=(()=>{
 let checking=null,timer=null,failures=0;
 const memory=new Map(),uid=()=>S.state?.user?.id;
 const storageKey=id=>'gift:orders:'+id;
 function pending(id=uid()){
  if(!id)return [];
  let orders=memory.get(id)||[];if(!memory.has(id))try{const raw=localStorage.getItem(storageKey(id));if(raw!==null){const saved=JSON.parse(raw);if(Array.isArray(saved))orders=saved}}catch{}
  return orders.filter(x=>x&&typeof x.id==='string'&&Number.isFinite(x.created)&&Date.now()-x.created>=0&&Date.now()-x.created<86400000).slice(-10);
 }
 function save(orders,id=uid()){
  if(!id)return;memory.set(id,orders);if(memory.size>10)memory.delete(memory.keys().next().value);
  try{localStorage.setItem(storageKey(id),JSON.stringify(orders))}catch{}
 }
 function remember(order,id){save([...pending(id).filter(x=>x.id!==order.id),{id:order.id,created:Date.now()}],id);if(uid()===id)schedule(1200)}
 function schedule(delay=15000){clearTimeout(timer);if(pending().length)timer=setTimeout(check,delay)}
 async function check(){
  const account=uid();if(document.hidden||!account||checking?.account===account)return;
  if(S.busy||S.animating){schedule(1500);return}
  const orders=pending(account);if(!orders.length)return;
  const check={account};checking=check;const paid=[];
  try{
   for(const order of orders){
    if(uid()!==account)return;
    const receipt=await api('receipt?id='+encodeURIComponent(order.id));
    if(uid()!==account)return;
    if(receipt.status==='paid'){
     paid.push({id:order.id,product:receipt.product});
    }else if(receipt.status==='expired'||receipt.status==='failed')save(pending(account).filter(x=>x.id!==order.id),account);
   }
   failures=0;
   if(paid.length&&uid()===account){
    const applied=await refresh();
    if(uid()!==account||applied===false||S.busy||S.animating)return;
    save(pending(account).filter(x=>!paid.some(p=>p.id===x.id)),account);render();
    for(const receipt of paid)toast(receipt.product.balance?'Покупка подтверждена: +'+fmt(receipt.product.balance)+' звёзд':receipt.product.name+' активирован');
   }
  }catch{if(uid()===account)failures++}
  finally{if(checking===check){checking=null;schedule(Math.min(30000,1500*2**Math.min(failures+1,4)))}}
 }
 function cards(){
  const products=S.config.products.filter(p=>p.balance);
  return `<section class="stars-packages"><span class="eyebrow">ПАКЕТЫ НА БАЛАНС</span><h2>Телеграм звёзды</h2><p>Для кейсов и подарков внутри игры. Выбери подходящий пакет.</p><div class="stars-package-grid">${products.map((p,i)=>`<article class="stars-package ${i===1?'popular':''}"><span class="package-tag">${i===1?'БОЛЬШЕ ЗВЁЗД':i===2?'БОЛЬШОЙ ПАКЕТ':'БЫСТРЫЙ СТАРТ'}</span><div class="stars-stack" aria-hidden="true"><i>✦</i><i>✦</i><i>✦</i></div><h3>+${fmt(p.balance)} <small>на баланс</small></h3><button class="primary ${i===1?'gold':''}" data-buy-product="${p.id}">Купить · ${p.price} ★</button><small class="package-price-note">Оплата: ${p.price} Telegram Stars</small></article>`).join('')}</div><p class="package-disclaimer">Пакет пополняет баланс игры. Подарки виртуальные, без вывода.</p></section>`;
 }
 async function buy(pid){
  const product=S.config.products.find(p=>p.id===pid);if(!product)return;
  if(S.state.user.demo||!tg?.initData||typeof tg.openInvoice!=='function'){
   showModal(`<h2 class="modal-title">${esc(product.name)}</h2><p class="modal-note">${product.balance?'На баланс игры добавится '+fmt(product.balance)+' звёзд. ':''}Стоимость — ${product.price} настоящих Telegram Stars.${product.days?' Срок — '+product.days+' дней.':''}${product.style?' Набор включает тему, рамку, титул и эффект. Без игровых бонусов.':''} Оплата доступна в Telegram.</p><div class="modal-actions"><a class="primary gold" target="_blank" rel="noopener" href="https://t.me/${S.config.bot}">Открыть бота</a>${!product.balance&&!product.style&&S.state.user.demo?`<button class="secondary" id="preview-privilege">Проверить ${pid==='vip'?'VIP':'Premium'}</button>`:''}</div>`);
   if($('#preview-privilege'))$('#preview-privilege').onclick=async()=>{if(await act(pid==='vip'?'demo_vip':'demo_premium'))closeModal()};return;
  }
  const active=product.style?S.state.profile?.styles.some(s=>s.id===product.style&&s.available):product.days&&(pid==='vip'?S.state.user.vip:S.state.user.premium);
  showModal(`<span class="eyebrow">${product.balance?'ПОПОЛНЕНИЕ БАЛАНСА':product.style?'СТИЛЬ НА 30 ДНЕЙ':'ПРИВИЛЕГИЯ НА 30 ДНЕЙ'}</span><h2 class="modal-title">${product.balance?'+'+fmt(product.balance)+' звёзд':(active?'Продлить ':'Активировать ')+esc(product.name)}</h2><div class="purchase-price">${product.price} <span>Telegram Stars</span></div><p class="modal-note">${esc(product.description)} ${active?'30 дней добавятся к текущему сроку.':''}</p><label class="purchase-terms"><input type="checkbox" id="purchase-terms"> <span>Принимаю <a href="#rules" id="purchase-rules">условия покупки</a></span></label><p class="modal-note">Поддержка покупки — /paysupport в боте.</p><button class="primary gold full mt" id="confirm-purchase" disabled>Перейти к оплате</button>`);
  const button=$('#confirm-purchase');$('#purchase-terms').onchange=e=>button.disabled=!e.target.checked;$('#purchase-rules').onclick=closeModal;
  const account=uid(),epoch=S.modalEpoch;
  button.onclick=async()=>{
   if(uid()!==account||S.modalEpoch!==epoch||!$('#purchase-terms')?.checked||button.disabled)return;button.disabled=true;button.textContent='Создаём заказ…';
   try{
    const order=await api('invoice',{product:pid,terms:'2026-10-10'});remember(order,account);
    if(uid()!==account||S.modalEpoch!==epoch)return;
    tg.openInvoice(order.link,status=>{
     if(uid()!==account)return;
     if(status==='paid'){if(S.modalEpoch===epoch)closeModal();toast('Telegram подтвердил оплату. Проверяем зачисление…');schedule(100)}
     else if(status==='cancelled'){toast('Оплата отменена');schedule(1500)}
     else if(status==='pending'){toast('Платёж обрабатывается. Зачисление появится после подтверждения');schedule(1500)}
     else{toast('Оплата не завершена. Проверим статус заказа');schedule(1500)}
     if(S.modalEpoch===epoch&&button.isConnected){button.disabled=!$('#purchase-terms')?.checked;button.textContent='Перейти к оплате'}
    });
   }catch(error){if(uid()!==account||S.modalEpoch!==epoch)return;toast(error.message);if(button.isConnected){button.disabled=false;button.textContent='Перейти к оплате'}}
  };
 }
 function balance(){showModal(`<h2 class="modal-title">Телеграм звёзды</h2><p class="modal-note">Получай звёзды за вход, задания, друзей и обмен подарков — или выбери пакет.</p>${cards()}<a class="secondary full mt" href="#tasks" id="balance-tasks">Перейти к заданиям</a>`);$('#balance-tasks').onclick=closeModal}
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});
 window.addEventListener?.('storage',event=>{if(event.key?.startsWith('gift:orders:')){memory.delete(event.key.slice('gift:orders:'.length));if(!document.hidden)check()}});
 document.addEventListener('DOMContentLoaded',()=>{setTimeout(check,2000)});
 return {cards,buy,balance,check};
})();
