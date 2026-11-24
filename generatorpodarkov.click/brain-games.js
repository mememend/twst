'use strict';
window.BrainGames=(()=>{
 const names={puzzle:'Пятнашки',codebreaker:'Кодовый замок'};
 function art(kind){return kind==='puzzle'?'<span class="brain-mode-art tiles" aria-hidden="true"><i>1</i><i>2</i><i>3</i><i>✦</i></span>':'<span class="brain-mode-art lock" aria-hidden="true"><i>●</i><i>●</i><i>●</i><i>●</i><b>⌁</b></span>'}
 function paint(S,h){
  const kind=S.route,m=S.state.brain?.[kind];if(!m)return h.heading(names[kind],'Вызов загружается. Обнови игру.');
  const r=m.active,last=r?null:m.last,board=r||last;
  const attrs=`data-brain-action="${kind}_start" data-day="${h.esc(m.day)}" data-previous="${h.esc(m.previous||'')}"`;
  const reward=`+${h.fmt(m.reward.stars)} ✦ и кейс «${h.esc(S.state.cases.find(c=>c.id===m.reward.case)?.name||m.reward.case)}»`;
  let field;
  if(kind==='puzzle'){
   const tiles=board?.board||Array.from({length:16},(_,n)=>n===15?0:n+1),blank=tiles.indexOf(0);
   field=`<div class="puzzle-board" aria-label="Поле Пятнашек">${tiles.map((value,index)=>{const legal=Math.abs(index%4-blank%4)+Math.abs(Math.floor(index/4)-Math.floor(blank/4))===1;return value?`<button class="puzzle-tile ${value===index+1?'placed':''}" data-brain-action="puzzle_move" data-day="${h.esc(m.day)}" data-round="${h.esc(r?.id||'')}" data-step="${r?.step||0}" data-tile="${index}" ${!r||!legal||S.busy?'disabled':''} aria-label="Передвинуть плитку ${value}">${value}</button>`:'<span class="puzzle-empty" aria-label="Пустая клетка">✦</span>'}).join('')}</div>`;
  }else{
   field=`<div class="code-display" aria-label="Четыре цифры замка">${(last?.secret||'????').split('').map(c=>`<span>${h.esc(c)}</span>`).join('')}</div><div class="code-guesses">${(board?.guesses||[]).map(g=>`<div class="code-guess"><strong>${h.esc(g.guess)}</strong><span><b>${g.exact}</b> на месте</span><span><b>${g.misplaced}</b> не на месте</span></div>`).join('')||'<p class="muted">После попытки здесь появятся подсказки.</p>'}</div>${r?`<form id="code-guess-form" data-day="${h.esc(m.day)}" data-round="${h.esc(r.id)}" data-step="${r.step}"><label for="code-guess">Четыре разные цифры</label><div class="code-input-row"><input class="search" id="code-guess" type="text" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="off" placeholder="0123" required aria-label="Четыре разные цифры"><button class="primary" type="submit" ${S.busy?'disabled':''}>Проверить</button></div></form>`:''}`;
  }
  return h.heading(names[kind],kind==='puzzle'?'Собери числа по порядку. Каждый ход — твой выбор.':'Разгадай четыре цифры за шесть попыток.')+`<section class="brain-stage ${kind} ${last?.won?'won':''}"><div class="brain-stage-head"><span class="eyebrow">ВЫЗОВ ДНЯ · БЕЗ СТАВКИ</span><strong>${r?kind==='puzzle'?(r.moves+' / 200 ходов'):(r.remaining+' попыток осталось'):last?.won?'Задача решена':'Новый вызов каждый день'}</strong></div>${field}<p class="brain-status" role="status">${h.esc(last?.message||(!r?'Нажми «Начать вызов», чтобы открыть сегодняшний расклад.':kind==='puzzle'?'Нажми на число рядом с пустой клеткой.':'Цифры не повторяются. Первая цифра может быть нулём.'))}</p>${!r?`<button class="primary full" ${attrs} ${!m.attempts_remaining?'disabled':''}>${m.attempts_remaining?'Начать вызов':'Следующий вызов завтра'}</button>`:`<button class="secondary full" data-brain-action="${kind}_end" data-day="${h.esc(m.day)}" data-round="${h.esc(r.id)}" data-step="${r.step}">Завершить попытку</button>`}<div class="brain-reward"><span>✦</span><div><strong>${reward}</strong><small>За решение сегодняшнего вызова</small></div></div></section><div class="notice">${kind==='puzzle'?'Все расклады можно решить. Нужно расположить числа 1–15 по порядку, пустую клетку оставить внизу справа. Лимит — 200 ходов.':'Четыре разные цифры от 0 до 9. «На месте» — правильная цифра в правильной позиции; «не на месте» — правильная цифра в другой позиции. Лимит — 6 попыток.'} Один вызов в день. Баланс и подарки не списываются. При выходе прогресс сохраняется; завершение попытки закрывает её до следующего дня. Новый день начинается в 00:00 МСК. VIP и Premium не меняют задачу.</div>`;
 }
 async function send(button,action,data){
  if(S.busy||S.animating||button.disabled)return;const account=S.state.user.id,route=S.route;button.disabled=true;
  try{
   const result=await act(action,data,{render:false});
   if(result&&S.state.user.id===account)render();
   if(result?.won&&S.state.user.id===account){playSound('win');haptic('success')}
   if(!result&&['round_changed','day_changed'].includes(S.lastErrorCode)&&S.state.user.id===account&&S.route===route)await refresh();
  }finally{if(button.isConnected)button.disabled=false}
 }
 document.addEventListener('click',event=>{
  const b=event.target.closest('[data-brain-action]');if(!b)return;
  const action=b.dataset.brainAction,data=action.endsWith('_start')?{day:b.dataset.day,previous:b.dataset.previous||null}:{day:b.dataset.day,round:b.dataset.round,step:Number(b.dataset.step),...(b.hasAttribute('data-tile')?{tile:Number(b.dataset.tile)}:{})};
  send(b,action,data);
 });
 document.addEventListener('submit',event=>{
  if(event.target.id!=='code-guess-form')return;event.preventDefault();const form=event.target,button=form.querySelector('button');
  send(button,'codebreaker_guess',{day:form.dataset.day,round:form.dataset.round,step:Number(form.dataset.step),guess:form.querySelector('input').value.trim()});
 });
 return {art,render:paint};
})();
