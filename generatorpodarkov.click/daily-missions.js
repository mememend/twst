'use strict';
window.GiftMissions=(()=>{
 function render(state,{esc,fmt},compact=false){
  const daily=state.daily_missions;if(!daily)return '';
  const names=Object.fromEntries(state.cases.map(c=>[c.id,c.name]));
  const reward=g=>g.case?'Кейс «'+esc(names[g.case]||g.case)+'»':'+'+fmt(g.stars)+' ✦';
  const ready=daily.bonus.ready&&!daily.bonus.claimed;
  if(compact){
   const next=daily.goals.find(g=>!g.claimed),completed=daily.bonus.claimed;
   return `<section class="daily-missions compact" aria-label="Ежедневные цели"><header><div><span class="eyebrow">ТВОЙ МАРШРУТ НА СЕГОДНЯ</span><h2>Три цели — два кейса</h2></div><span class="mission-counter">${daily.claimed} / ${daily.goals.length}</span></header><div class="mission-home-body"><div><p>${completed?'Все награды получены. Новый маршрут — завтра.':ready?'Маршрут пройден. Забери кейс «'+esc(names[daily.bonus.case]||daily.bonus.case)+'»!':'+350 звёзд, «'+esc(names.neon||'neon')+'» и «'+esc(names[daily.bonus.case]||daily.bonus.case)+'» за три цели.'}</p>${next?`<div class="mission-home-next"><span>Следующая цель</span><strong>${esc(next.name)} · ${next.progress} / ${next.target}</strong></div>`:''}</div><img src="/art/premium-chest.webp" alt="" loading="lazy"></div><div class="mission-home-actions"><a href="#tasks" class="secondary">${completed?'Посмотреть награды':'Открыть ежедневные цели'} ↗</a>${ready?`<button class="primary" data-mission="bonus" data-mission-day="${esc(daily.day)}">Забрать кейс</button>`:''}</div></section>`;
  }
  return `<section class="daily-missions ${compact?'compact':''}" aria-label="Ежедневные цели"><header><div><span class="eyebrow">КАЖДЫЙ ДЕНЬ — НОВЫЕ НАГРАДЫ</span><h2>Твой маршрут на сегодня</h2></div><span class="mission-counter">${daily.claimed} / ${daily.goals.length}<small>награды получены</small></span></header><p class="mission-intro">Выполни три цели и забери дополнительный кейс «${esc(names[daily.bonus.case]||daily.bonus.case)}». Сброс в 00:00 МСК.</p><div class="mission-grid">${daily.goals.map(g=>{const available=g.progress>=g.target&&!g.claimed;return `<article class="mission-goal ${g.claimed?'done':available?'ready':''}"><span class="mission-symbol" aria-hidden="true">${esc(g.claimed?'✓':g.symbol)}</span><h3>${esc(g.name)}</h3><p>${esc(g.description)}</p><div class="mission-progress"><progress value="${g.progress}" max="${g.target}" aria-label="${esc(g.name)}"></progress><span>${g.progress} / ${g.target}</span></div><strong>${reward(g)}</strong>${available||g.claimed?`<button class="${available?'primary':'secondary'}" data-mission="${esc(g.id)}" data-mission-day="${esc(daily.day)}" ${g.claimed?'disabled':''}>${g.claimed?'Получено':'Забрать награду'}</button>`:`<a class="secondary" href="#${esc(g.route)}">${g.route==='cases'?'К кейсам':'Выбрать игру'} ↗</a>`}</article>`}).join('')}</div><div class="mission-bonus ${ready?'ready':''}"><img src="/art/premium-chest.webp" alt="" loading="lazy"><div><span class="eyebrow">НАГРАДА ЗА ВЕСЬ МАРШРУТ</span><h3>Кейс «${esc(names[daily.bonus.case]||daily.bonus.case)}»</h3><p>${daily.bonus.claimed?'Кейс добавлен в твои бонусные открытия.':ready?'Все цели пройдены — награда ждёт тебя.':'Забери награды за три цели выше.'}</p></div><button class="primary" data-mission="bonus" data-mission-day="${esc(daily.day)}" ${!ready?'disabled':''}>${daily.bonus.claimed?'Получено':ready?'Забрать кейс':'Сначала 3 цели'}</button></div></section>`;
 }
 document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-mission]');if(!button||button.disabled||S.busy||S.animating)return;
  button.disabled=true;
  try{const result=await claimReward('mission',{mission:button.dataset.mission,day:button.dataset.missionDay});if(result?.bonus_case)playSound('claim')}
  finally{if(button.isConnected)button.disabled=false}
 });
 return {render};
})();
