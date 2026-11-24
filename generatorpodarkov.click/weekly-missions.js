'use strict';
window.GiftWeekly=(()=>{
 function render(state,{esc,fmt},compact=false){
  const w=state.weekly_missions;if(!w)return '';const names=Object.fromEntries(state.cases.map(c=>[c.id,c.name]));
  const reward=g=>g.case?`${g.amount||1} × «${esc(names[g.case]||g.case)}»`:`+${fmt(g.stars)} ✦`;
  const ready=w.bonus.ready&&!w.bonus.claimed;
  if(compact)return `<a class="weekly-banner" href="#tasks"><span class="weekly-emblem" aria-hidden="true">♛</span><div><span class="eyebrow">НОВАЯ НЕДЕЛЯ · НОВЫЕ НАГРАДЫ</span><h3>${ready?'Набор недели ждёт тебя':w.bonus.claimed?'Неделя пройдена':'Четыре цели — большой набор'}</h3><p>${w.claimed} / 4 награды · «Коллекционер» и 1 500 ✦ за весь маршрут</p></div><span>↗</span></a>`;
  return `<section class="weekly-panel" aria-label="Недельные задания"><header><div><span class="eyebrow">ТВОЯ НЕДЕЛЯ ПОДАРКОВ</span><h2>Больше целей. Больше находок.</h2><p>Неделя начинается в понедельник, в 00:00 МСК.</p></div><strong>${w.claimed} / 4</strong></header><div class="weekly-grid">${w.goals.map(g=>{const available=!g.claimed&&g.progress>=g.target;return `<article class="weekly-goal ${g.claimed?'done':available?'ready':''}"><span class="weekly-symbol" aria-hidden="true">${esc(g.claimed?'✓':g.symbol)}</span><h3>${esc(g.name)}</h3><p>${esc(g.description)}</p><progress value="${g.progress}" max="${g.target}" aria-label="${esc(g.name)}"></progress><span class="weekly-progress-label">${g.progress} / ${g.target}</span><strong>${reward(g)}</strong>${g.claimed||available?`<button class="${available?'primary gold':'secondary'}" data-weekly="${esc(g.id)}" data-week="${esc(w.week)}" ${g.claimed?'disabled':''}>${g.claimed?'Получено':'Забрать награду'}</button>`:`<a class="secondary" href="#${esc(g.route)}" ${g.id==='days'?'data-weekly-daily':''}>${g.route==='invite'?'Пригласить друзей':g.route==='cases'?'Открыть кейсы':g.route==='games'?'Выбрать игру':'Ежедневная награда'} ↗</a>`}</article>`}).join('')}</div><div class="weekly-bonus"><img src="/art/premium-chest.webp" alt="Набор недели" loading="lazy"><div><span class="eyebrow">ЗА ЧЕТЫРЕ ПОЛУЧЕННЫЕ НАГРАДЫ</span><h3>«${esc(names[w.bonus.case]||w.bonus.case)}» + ${fmt(w.bonus.stars)} ✦</h3><p>${w.bonus.claimed?'Набор уже добавлен в твои награды.':'Забери награды каждой цели, чтобы открыть большой набор.'}</p></div><button class="primary gold" data-weekly="bonus" data-week="${esc(w.week)}" ${!ready?'disabled':''}>${w.bonus.claimed?'Получено':ready?'Забрать набор':'Сначала 4 цели'}</button></div></section>`;
 }
 document.addEventListener('click',async event=>{
  const daily=event.target.closest('[data-weekly-daily]');if(daily&&S.route==='tasks'){event.preventDefault();document.querySelector('.login-streak')?.scrollIntoView({block:'start',behavior:'instant'});return}
  const b=event.target.closest('[data-weekly]');if(!b||b.disabled||S.busy||S.animating)return;b.disabled=true;
  try{if(await claimReward('weekly',{mission:b.dataset.weekly,week:b.dataset.week}))playSound('claim')}finally{if(b.isConnected)b.disabled=false}
 });
 return {render};
})();
