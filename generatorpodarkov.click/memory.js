'use strict';
window.MemoryGame=(()=>{
 let anchor=null;
 const command=button=>button.dataset.memoryAction==='memory_start'?{day:button.dataset.day,previous:button.dataset.previous||null}:{round:button.dataset.round,step:Number(button.dataset.step),...(button.hasAttribute('data-tile')?{tile:Number(button.dataset.tile)}:{})};
 function art(){return '<span class="mode-memory-art" aria-hidden="true"><i>✦</i><i>✦</i><i>?</i><i>?</i></span>'}
 function paint(S,h){
  const m=S.state.memory;if(!m)return h.heading('Пары','Расклад загружается. Обнови страницу.');
  const t=m.active,last=t?null:m.last,board=t||last,matched=new Set(board?.matched||[]),visible=board?.cards||Array(12).fill(null),reward=m.prize_claimed?'Награда сегодня получена':`+${h.fmt(m.reward_stars)} ✦ и кейс «Первый подарок»`;
  anchor=t?{id:t.id,server:m.now,local:Date.now()}:null;
  const startHtml=`<div class="memory-start"><button class="primary full" data-memory-action="memory_start" data-day="${h.esc(m.day)}" data-previous="${h.esc(last?.round||'')}" ${!m.attempts_remaining?'disabled':''}>${m.attempts_remaining?last?'Новый расклад':'Начать игру':'Новые попытки завтра'}</button></div>`;
  const status=t?t.expired?'Время вышло. Заверши раунд.':t.shown.length===2?'Не совпало. Запомни их и открой следующую карточку.':t.shown.length===1?'Найди такую же карточку.':'Выбирай карточку. Совпадения остаются открытыми.':last?last.message:'Найди 6 пар за 3 минуты. До 8 ошибок.';
  return h.heading('Пары','Запоминай подарки. Собирай совпадения.')+`<section class="memory-stage ${last?.won?'won':''}" aria-label="Поле игры Пары"><div class="memory-top"><span class="eyebrow">12 КАРТОЧЕК · 6 ПАР</span><span class="memory-attempts">${m.attempts_remaining} / ${m.attempts_limit} попыток</span></div><div class="memory-score"><div><small>ПАРЫ</small><strong>${board?.pairs||0} <span>/ 6</span></strong></div><div><small>ОШИБКИ</small><strong>${board?.mistakes||0} <span>/ 8</span></strong></div><div><small>${t?'ОСТАЛОСЬ':'ВРЕМЯ РАУНДА'}</small><strong id="memory-timer">${t?timeLabel(Math.max(0,t.deadline-m.now)):'3:00'}</strong></div></div>${!t&&!last?startHtml:''}<div class="memory-board">${visible.map((token,index)=>{const open=Boolean(token),g=token?h.gift(token):null,disabled=!t||t.expired||matched.has(index)||t.shown.includes(index)||S.busy;return `<button class="memory-card ${open?'revealed':''} ${matched.has(index)?'matched':''}" data-memory-action="memory_flip" data-round="${h.esc(t?.id||'')}" data-step="${t?.step||0}" data-tile="${index}" ${disabled?'disabled':''} aria-label="${open?'Карточка '+(index+1)+': '+h.esc(g?.name||'Подарок')+(matched.has(index)?', пара найдена':''):'Закрытая карточка '+(index+1)}"><span class="memory-card-inner"><span class="memory-back" aria-hidden="true"><b>G</b><i>✦</i><small>${String(index+1).padStart(2,'0')}</small></span><span class="memory-front" aria-hidden="true">${g?h.image(g):''}${matched.has(index)?'<span class="memory-check">✓</span>':''}</span></span></button>`}).join('')}</div><p class="memory-status" role="status">${h.esc(status)}</p>${t?`<button class="secondary full" data-memory-action="memory_end" data-round="${h.esc(t.id)}" data-step="${t.step}">${t.expired?'Завершить раунд':'Закрыть расклад'}</button>`:last?startHtml:''}<div class="memory-reward"><span aria-hidden="true">✦</span><div><b>${h.esc(reward)}</b><small>За первое прохождение за день</small></div>${m.prize_claimed?'<a href="#cases">К кейсам ↗</a>':''}</div></section><div class="notice">Участие без списания баланса и подарков. Три попытки в день, награда за первое прохождение — один раз в день. Неправильная пара остаётся открытой до следующего хода. Восьмая ошибка или истечение трёх минут завершают раунд. Закрытие расклада использует попытку; за него не начисляются опыт и участие в ежедневных целях. Завершённые раунды учитываются в целях на игры и разные режимы. VIP и Premium не меняют расклад. Новый день — в 00:00 МСК.</div>`;
 }
 function timeLabel(seconds){const n=Math.max(0,Math.ceil(seconds));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')}
 function tick(){
  if(document.hidden||S.route!=='memory'||!anchor)return;
  const active=S.state?.memory?.active,el=document.getElementById('memory-timer');if(!active||active.id!==anchor.id||!el)return;
  const remaining=Math.max(0,active.deadline-anchor.server-(Date.now()-anchor.local)/1000);el.textContent=timeLabel(remaining);
  if(!remaining){document.querySelectorAll('[data-memory-action="memory_flip"]').forEach(b=>b.disabled=true);const status=document.querySelector('.memory-status');if(status)status.textContent='Время вышло. Заверши раунд.'}
 }
 document.addEventListener('click',async event=>{
  const b=event.target.closest('[data-memory-action]');if(!b||b.disabled||S.busy||S.animating)return;
  const action=b.dataset.memoryAction,data=command(b);b.disabled=true;
  try{
   const result=await act(action,data,{render:false});
   if(!result){await refresh();render();return}
   render();
   if(action==='memory_start')playSound('open');else if(result.won)playSound('win');else if(result.matched_pair)playSound('claim');else if(action==='memory_flip')playSound('tick');
   const current=S.state?.memory?.active;
   if(action==='memory_flip'&&current?.id===data.round&&current.step===data.step+1&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    const inner=document.querySelector('[data-memory-action="memory_flip"][data-tile="'+data.tile+'"] .memory-card-inner');
    try{inner?.animate?.([{transform:'rotateY(0deg)'},{transform:'rotateY(180deg)'}],{duration:260,easing:'ease-out'})}catch{}
   }
  }finally{if(b.isConnected&&!b.classList.contains('matched'))b.disabled=false}
 });
 setInterval(tick,1000);
 return {render:paint,art,command,timeLabel,tick};
})();
