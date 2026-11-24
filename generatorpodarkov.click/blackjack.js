'use strict';
window.BlackjackGame={
 last(S){return S.state.last_rounds?.blackjack||(S.lastRound?.mode==='blackjack'?S.lastRound:null)},
 scoreLabel(score){return score?score.total+(score.soft?' · туз 11':''):'?'},
 cards(cards){return cards.map(card=>HiLoGame.card(card)).join('')},
 status(table,end,selected){
  if(table)return table.step?'Карта добавлена. Ещё одну или хватит?':'Твой ход. Ещё карту или хватит?';
  if(!end)return selected?'Подарок выбран. Начинаем раздачу?':'Выбери подарок для раздачи';
  return end.draw?'Ничья — подарок остаётся у тебя':end.reason==='player_natural'?'Блэкджек! Результат x2,5':end.reason==='player_bust'?'Перебор — '+end.player_score.total+' очков':end.reason==='dealer_natural'?'Блэкджек у дилера':end.won?end.reason==='dealer_bust'?'У дилера перебор. Твоя победа!':'Твоя победа! Результат x2':'Дилер набрал больше очков';
 },
 art(){return '<span class="mode-blackjack-art" aria-hidden="true">'+HiLoGame.card({rank:14,suit:'♠'})+HiLoGame.card({rank:13,suit:'♥'})+'</span>'},
 render(S,h){
  const table=S.state.blackjack,last=this.last(S),end=table?null:last,cards=table||end,source=table?.gift||end?.source_gift;
  return h.heading('Блэкджек','Собери 21. Реши, когда стоит остановиться.')+`<section class="bj-stage ${end?.draw?'bj-draw':end?.won?'bj-won':end?'bj-lost':''}" aria-label="Стол блэкджека"><div class="bj-meta"><span>52 КАРТЫ · ОДНА КОЛОДА</span><b>${table?'ТВОЙ ХОД':end?'РАУНД ЗАВЕРШЁН':'ДО 21 ОЧКА'}</b></div><div class="bj-seat"><div class="bj-seat-label"><b>ДИЛЕР</b><span id="bj-dealer-score">${this.scoreLabel(cards?.dealer_score)}</span></div><div class="bj-cards" id="bj-dealer-cards">${this.cards(cards?.dealer||[null,null])}</div></div><div class="bj-table-line"><span>BLACKJACK</span><small>Победа x2 · Блэкджек x2,5</small></div><div class="bj-seat player-seat"><div class="bj-seat-label"><b>ТВОИ КАРТЫ</b><span id="bj-player-score">${this.scoreLabel(cards?.player_score)}</span></div><div class="bj-cards" id="bj-player-cards">${this.cards(cards?.player||[null,null])}</div></div><p id="bj-status" class="bj-status">${this.status(table,end,S.selected)}</p>${table?`<div class="bj-actions"><button class="primary" data-newgame="blackjack_hit" data-round="${table.id}" data-step="${table.step}" ${S.busy?'disabled':''}>Ещё карту <span>＋</span></button><button class="primary mint" data-newgame="blackjack_stand" data-round="${table.id}" data-step="${table.step}" ${S.busy?'disabled':''}>Хватит <span>✓</span></button></div><div class="bj-stake"><div class="selected-gift">${h.image(source)}<span>${h.esc(source.name)}<small>${h.fmt(source.value)} ✦ · в раздаче</small></span></div><span>Ход ${table.step+1}</span></div>`:`<div class="bj-start"><div class="selected-gift">${h.selectedHtml()}</div><button class="primary gold" data-newgame="blackjack_start" data-previous="${h.esc(end?.round||'')}" ${S.selected?'':'disabled'}>Раздать карты</button></div>`}</section>${end?.draw?'<div class="notice bj-return"><strong>Подарок сохранён</strong><br>Он вернулся в инвентарь с теми же моделью, фоном, символом и номером. За ничью опыт не начисляется.</div>':!table?h.roundResult():''}${end?.draw?`<details><summary>Проверка раунда</summary><p class="small-text">Seed: ${h.esc(end.seed)}<br>SHA-256: ${h.esc(end.commitment)}</p></details>`:''}<div class="notice">Цель — набрать больше дилера, не превысив 21. Туз даёт 1 или 11, картинки — 10. «Ещё карту» добавляет карту; «Хватит» завершает твою руку. При 21 ход завершается автоматически. Дилер добирает до 17 и останавливается на мягких 17.<br>Блэкджек из двух карт даёт x2,5, обычная победа — x2. Равные очки возвращают исходный подарок. Перебор или поражение его забирают. В этой раздаче доступны добор и остановка, без удвоения и разделения рук. Карты и шансы не зависят от VIP или Premium. Подходящий подарок выдаётся автоматически, остаток стоимости обменивается на звёзды по курсу 60%.</div>${table?`<details><summary>Проверка колоды</summary><p class="small-text">SHA-256: ${h.esc(table.commitment)}<br>Колода зафиксирована при раздаче. Seed станет доступен после завершения. Выход из игры сохраняет карты и ход.</p></details>`:h.gameInventory()}`;
 },
 async animate(S,r,reduced){
  if(S.route!=='blackjack')return;
  const table=r.blackjack||r,player=document.getElementById('bj-player-cards'),dealer=document.getElementById('bj-dealer-cards'),status=document.getElementById('bj-status');if(!player||!dealer||!table.player)return;
  document.querySelectorAll('[data-newgame^="blackjack_"]').forEach(button=>button.disabled=true);
  player.innerHTML=this.cards(table.player);document.getElementById('bj-player-score').textContent=this.scoreLabel(table.player_score);
  if(!reduced)player.classList.add('bj-dealing');
  if(!r.seed){dealer.innerHTML=this.cards(table.dealer);if(!reduced)await new Promise(resolve=>setTimeout(resolve,350));return}
  if(status)status.textContent=r.reason==='player_bust'?'Перебор. Открываем карты дилера…':'Дилер открывает карты…';
  for(let count=2;count<=table.dealer.length;count++){
   if(S.route!=='blackjack'||!dealer.isConnected)return;
   dealer.innerHTML=this.cards(table.dealer.slice(0,count));if(!reduced)dealer.classList.add('bj-dealing');
   if(!reduced)await new Promise(resolve=>setTimeout(resolve,280));dealer.classList.remove('bj-dealing');
  }
  if(S.route!=='blackjack'||!dealer.isConnected)return;document.getElementById('bj-dealer-score').textContent=this.scoreLabel(table.dealer_score);if(status)status.textContent=this.status(null,r,false);
  if(!reduced)await new Promise(resolve=>setTimeout(resolve,180));
 }
};
