'use strict';
window.TowerGame={
 art(){return '<span class="mode-tower-art" aria-hidden="true"><i></i><i></i><i></i><b>✦</b></span>'},
 mult(level){return level?95*(3**level)/(100*(2**level)):1},
 label(value){return 'x'+value.toLocaleString('ru-RU',{minimumFractionDigits:3,maximumFractionDigits:3})},
 render(S,h){
  const t=S.state.tower,r=S.lastRound?.mode==='tower'?S.lastRound:S.state.last_rounds?.tower;
  const end=t?null:r,opened=t?.opened||end?.opened||[],level=t?.floor||opened.length;
  const status=t?(level?'Этаж '+level+' пройден. Продолжай или забирай.':'Выбери плитку на первом этаже'):end?(end.lost?'Опасная плитка. Попробуем ещё?':end.completed?'Вершина твоя!':end.gift?'Подарок уже в коллекции':'Получено '+h.fmt(end.stars)+' звёзд'):'Выбери подарок и начни подъём';
  return h.heading('Башня','Один шаг — выше множитель. Насколько высоко поднимешься?')+`<section class="tower-stage ${end?.lost?'tower-lost':''}" aria-label="Башня из восьми этажей"><div class="tower-sky"><span class="tower-glow"></span>${this.art()}<span class="eyebrow">ВОСЕМЬ ЭТАЖЕЙ ДО ВЕРШИНЫ</span><strong>${this.label(t?.multiplier??end?.multiplier??1)}</strong><p>${status}</p></div><div class="tower-controls" id="tower-controls"><div class="selected-gift">${t?h.image(t.gift)+'<span>'+h.esc(t.gift.name)+'<small>'+h.fmt(t.gift.value)+' ✦ · в башне</small></span>':h.selectedHtml()}</div>${t?`<button class="primary mint" data-newgame="tower_cashout" data-round="${t.id}" data-floor="${level}" ${!level?'disabled':''}>${level?'Забрать '+this.label(t.multiplier):'Пройди 1-й этаж'}</button>`:`<button class="primary gold" data-newgame="tower_start" ${S.selected?'':'disabled'}>Начать подъём</button>`}</div><div class="tower-board" id="tower-board">${Array.from({length:8},(_,row)=>7-row).map(floor=>{
   const current=!!t&&floor===t.floor,chosen=opened[floor],danger=end?.dangers?.[floor];
   return `<div class="tower-floor ${current?'current':''} ${floor<level?'visited':''}" data-floor-row="${floor}"><span class="tower-floor-number">${floor+1}<small>этаж</small></span><div class="tower-tiles">${Array.from({length:3},(_,tile)=>{const selected=chosen===tile,hit=end?.lost&&floor===level-1&&selected,safe=selected&&!hit;return `<button class="tower-tile ${safe?'safe':''} ${danger===tile?'danger':''} ${hit?'hit':''}" data-tower-tile="${tile}" data-round="${t?.id||''}" data-floor="${floor}" ${!current||S.busy?'disabled':''} aria-label="Этаж ${floor+1}, плитка ${tile+1}${safe?', пройдено':danger===tile?', опасность':''}">${danger===tile?'✕':safe?'◆':current?'✦':'·'}</button>`}).join('')}</div><b class="tower-floor-mult">${this.label(this.mult(floor+1))}</b></div>`
  }).join('')}</div><div class="tower-bottom"><span>◆ 2 безопасные</span><span>✕ 1 опасная</span><strong>Шанс шага 66,67%</strong></div></section>${!t?h.roundResult():''}<div class="notice">На каждом этаже выбери одну плитку из трёх. После безопасной плитки можно забрать результат или идти выше. Опасная плитка завершает раунд с потерей подарка. На восьмом этаже результат выдаётся автоматически. Выход из игры сохраняет поле. VIP и Premium не меняют шанс.<br>Результат: 0,95 × (3 ÷ 2)<sup>число пройденных этажей</sup>. Подходящий подарок выдаётся автоматически, остаток стоимости обменивается на звёзды по курсу 60%.</div>${t?`<details class="tower-proof"><summary>Проверка поля</summary><p class="small-text">SHA-256: ${h.esc(t.commitment)}<br>После завершения доступен seed для проверки всех этажей.</p></details>`:h.gameInventory()}`;
 },
 focusFloor(){document.querySelector('.tower-floor.current')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'})},
 async animate(S,r,reduced){
  const step=r.step;if(!step||S.route!=='tower')return;
  const button=document.querySelector(`[data-floor-row="${step.floor}"] [data-tower-tile="${step.tile}"]`);
  if(!button)return;document.querySelectorAll('[data-tower-tile],[data-newgame="tower_cashout"]').forEach(b=>b.disabled=true);
  button.classList.add(step.safe?'safe':'hit','tower-reveal');button.textContent=step.safe?'◆':'✕';
  if(!reduced)await new Promise(resolve=>setTimeout(resolve,450));
 }
};
