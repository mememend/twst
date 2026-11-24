'use strict';
window.RpsGame={
 signs:{rock:'Камень',paper:'Бумага',scissors:'Ножницы'},
 last(S){return S.state.last_rounds?.rps||(S.lastRound?.mode==='rps'?S.lastRound:null)},
 choice(S){const choice=S.rpsChoice||this.last(S)?.choice;return Object.prototype.hasOwnProperty.call(this.signs,choice)?choice:'rock'},
 icon(sign){
  const shapes={rock:'M27 53V32Q27 21 36 21Q43 21 44 29V25Q44 16 53 16Q61 16 61 26V30Q62 20 70 20Q78 20 78 30V36Q79 28 86 29Q94 29 94 39V69Q94 85 80 94H49Q34 88 29 78L17 62Q12 55 17 51Q21 47 27 53Z',paper:'M31 55V19Q31 10 38 10Q46 10 46 20V44V10Q46 2 54 2Q62 2 62 11V44V17Q62 8 70 8Q78 8 78 18V49V31Q78 23 86 23Q94 23 94 32V69Q94 85 80 97H47Q35 93 28 80L12 59Q7 51 13 46Q19 42 25 49Z',scissors:'M34 58L24 17Q21 8 29 5Q37 2 40 13L52 44L62 12Q65 2 73 5Q81 8 78 18L68 55Q70 45 79 48Q86 50 86 60Q89 52 95 58L97 72Q96 88 81 98H50Q39 95 34 86L18 72Q10 65 15 59Q20 53 27 58L34 64Z'};
  const valid=Object.prototype.hasOwnProperty.call(this.signs,sign)?sign:'rock';
  return `<svg viewBox="0 0 110 110" class="rps-hand" role="img" aria-label="${this.signs[valid]}"><path class="rps-hand-shadow" d="${shapes[valid]}"/><path class="rps-hand-shape" d="${shapes[valid]}"/><path class="rps-hand-detail" d="M48 91H76M45 77Q57 80 66 72M35 60Q42 65 45 75"/></svg>`;
 },
 art(){return '<span class="mode-rps-art" aria-hidden="true">'+this.icon('rock')+this.icon('scissors')+'</span>'},
 render(S,h){
  const r=this.last(S),choice=this.choice(S),status=r?r.draw?'Ничья — подарок остаётся у тебя':r.won?'Победа! Результат x1,85':'Сервер победил. Попробуем ещё раз?':S.selected?'Подарок выбран. Покажи свой знак!':'Выбери подарок и свой знак';
  return h.heading('Камень · ножницы · бумага','Твой выбор против случайного знака сервера.')+`<section class="rps-stage ${r?.draw?'rps-draw':r?.won?'rps-won':r?'rps-lost':''}" aria-label="Поле игры"><div class="rps-badge">${r?'ПОСЛЕДНИЙ РАУНД':'ТРИ ЗНАКА · ОДИН РАУНД'}</div><div class="rps-arena"><div><small>ТВОЙ ЗНАК</small><div id="rps-player">${this.icon(r?.choice||choice)}</div><strong id="rps-player-name">${this.signs[r?.choice||choice]}</strong></div><span class="rps-vs">VS</span><div><small>СЕРВЕР</small><div id="rps-server">${r?this.icon(r.server_sign):'<span class="rps-hidden" aria-label="Знак сервера скрыт">?</span>'}</div><strong id="rps-server-name">${r?this.signs[r.server_sign]:'Откроется после хода'}</strong></div></div><p id="rps-status" class="rps-status">${status}</p></section><div class="rps-choices" aria-label="Выбери знак">${['rock','scissors','paper'].map(sign=>`<button data-rps-choice="${sign}" class="${choice===sign?'chosen':''}" aria-pressed="${choice===sign}">${this.icon(sign)}<b>${this.signs[sign]}</b></button>`).join('')}</div><div class="rps-odds"><span><b>33,33%</b>Победа · x1,85</span><span><b>33,33%</b>Ничья · возврат</span><span><b>33,33%</b>Поражение · x0</span></div><div class="game-controls"><div class="selected-gift">${h.selectedHtml()}</div><button class="primary" data-newgame="rps" data-previous="${h.esc(r?.round||'')}" ${S.selected?'':'disabled'}>Показать ${choice==='rock'?'камень':choice==='paper'?'бумагу':'ножницы'}</button></div>${r?.draw?'<div class="notice rps-return"><strong>Подарок сохранён</strong><br>Он остаётся в инвентаре с тем же номером, фоном и моделью. Выбери его снова для следующего раунда. За ничью опыт не начисляется.</div>':h.roundResult()}${r?.draw?`<details><summary>Проверка раунда</summary><p class="small-text">Seed: ${h.esc(r.seed)}<br>SHA-256: ${h.esc(r.commitment)}</p></details>`:''}<div class="notice">Камень бьёт ножницы, ножницы режут бумагу, бумага накрывает камень. Каждый знак сервера равновероятен. При ничьей исходный подарок сохраняется; при поражении теряется. При победе стоимость результата — x1,85. Подходящий подарок выдаётся автоматически, остаток обменивается на звёзды по курсу 60%. VIP и Premium не меняют шансы.</div>${h.gameInventory()}`;
 },
 async animate(S,r,reduced){
  if(S.route!=='rps')return;
  const player=document.getElementById('rps-player'),server=document.getElementById('rps-server'),stage=document.querySelector('.rps-stage');if(!player||!server||!stage)return;
  document.querySelectorAll('[data-rps-choice]').forEach(button=>button.disabled=true);
  const status=document.getElementById('rps-status');status.textContent='Камень… ножницы… бумага!';player.innerHTML=this.icon('rock');server.innerHTML=this.icon('rock');
  if(!reduced){stage.classList.add('rps-countdown');await new Promise(resolve=>setTimeout(resolve,900))}
  if(S.route!=='rps'||!stage.isConnected)return;
  stage.classList.remove('rps-countdown');player.innerHTML=this.icon(r.choice);server.innerHTML=this.icon(r.server_sign);document.getElementById('rps-player-name').textContent=this.signs[r.choice];document.getElementById('rps-server-name').textContent=this.signs[r.server_sign];
  status.textContent=r.draw?'Ничья — подарок остаётся у тебя':r.won?'Победа!':'На этот раз сервер победил';stage.classList.add(r.draw?'rps-draw':r.won?'rps-won':'rps-lost');
  if(!reduced)await new Promise(resolve=>setTimeout(resolve,250));
 }
};
