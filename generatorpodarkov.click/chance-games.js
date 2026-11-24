'use strict';
window.ChanceGames={
 last(S,mode){return S.lastRound?.mode===mode?S.lastRound:S.state.last_rounds?.[mode]},
 choice(S,mode){return S[mode+'Choice']||this.last(S,mode)?.choice||(mode==='coin'?'heads':'low')},
 die(value){
  const positions={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]}[value]||[];
  return `<span class="chance-die" role="img" aria-label="Кубик: ${value}">${Array.from({length:9},(_,i)=>`<i class="${positions.includes(i)?'pip':''}"></i>`).join('')}</span>`;
 },
 coin(S,h){
  const choice=this.choice(S,'coin'),r=this.last(S,'coin'),side=r?.side||'heads',label=side==='heads'?'Орёл':'Решка';
  return h.heading('Монетка','Один подарок. Две стороны. Твой выбор.')+`<section class="chance-stage coin-stage ${r?.won?'chance-won':''}"><span class="chance-orbit"></span><span class="chance-spark one">✦</span><span class="chance-spark two">✧</span><div class="coin-object" id="chance-coin" style="transform:rotateY(${side==='tails'?180:0}deg) rotateZ(8deg)"><div class="coin-face coin-heads"><span>✦</span><b>ОРЁЛ</b></div><div class="coin-face coin-tails"><span>◕</span><b>РЕШКА</b></div></div><p class="chance-caption" id="chance-caption">${r?'Последний раунд: '+label+' · '+(r.won?'Победа!':'Не угадал'):'Какой стороной упадёт монетка?'}</p></section><div class="chance-choices coin-choices" aria-label="Сторона монетки">${[['heads','✦','Орёл'],['tails','◕','Решка']].map(([id,icon,name])=>`<button class="chance-choice ${choice===id?'chosen':''}" data-coin-choice="${id}" aria-pressed="${choice===id}"><span>${icon}</span><b>${name}</b><small>50% · x1,90</small></button>`).join('')}</div><div class="game-controls"><div class="selected-gift">${h.selectedHtml()}</div><button class="primary gold" data-newgame="coin" ${S.selected?'':'disabled'}>Подбросить монетку</button></div>${h.roundResult()}<div class="notice">У каждой стороны шанс 50%. При победе стоимость результата — x1,90 от твоего подарка. При проигрыше подарок теряется. Подходящий подарок выдаётся автоматически, остаток стоимости обменивается на звёзды по курсу 60%. VIP и Premium не меняют шанс.</div>${h.gameInventory()}`;
 },
 dice(S,h){
  const choice=this.choice(S,'dice'),r=this.last(S,'dice'),values=r?.dice||[5,3];
  return h.heading('Кости','Выбери сумму двух кубиков и сделай бросок.')+`<section class="chance-stage dice-stage ${r?.won?'chance-won':''}"><span class="chance-orbit"></span><div class="dice-pair" id="chance-dice">${values.map(v=>this.die(v)).join('')}</div><div class="dice-total"><small>${r?'Последняя сумма':'Два кубика'}</small><strong id="chance-dice-total">${r?r.sum:'?'}</strong></div><p class="chance-caption" id="chance-caption">${r?(r.won?'Попадание!':'Не угадал сумму'):'От двух до двенадцати'}</p></section><div class="chance-choices dice-choices" aria-label="Сумма кубиков">${[['low','Меньше 7','2–6','41,67% · x2,28'],['seven','Ровно 7','7','16,67% · x5,70'],['high','Больше 7','8–12','41,67% · x2,28']].map(([id,name,range,odds])=>`<button class="chance-choice ${choice===id?'chosen':''}" data-dice-choice="${id}" aria-pressed="${choice===id}"><span>${range}</span><b>${name}</b><small>${odds}</small></button>`).join('')}</div><div class="dice-sums" aria-label="Возможные суммы">${Array.from({length:11},(_,i)=>i+2).map(n=>`<span class="${choice==='low'&&n<7||choice==='seven'&&n===7||choice==='high'&&n>7?'in-range':''} ${r?.sum===n?'last-sum':''}">${n}</span>`).join('')}</div><div class="game-controls"><div class="selected-gift">${h.selectedHtml()}</div><button class="primary" data-newgame="dice" ${S.selected?'':'disabled'}>Бросить кости</button></div>${h.roundResult()}<div class="notice">Два независимых кубика, 36 равновероятных сочетаний. У суммы 7 шанс 6 из 36; у каждой из двух остальных групп — 15 из 36. При попадании подарок заменяется результатом указанного множителя, остаток стоимости обменивается по курсу 60%. При промахе подарок теряется. Привилегии не меняют бросок.</div>${h.gameInventory()}`;
 },
 async animate(S,mode,r,reduced){
  const caption=document.getElementById('chance-caption');if(caption)caption.textContent=mode==='coin'?'Монетка в воздухе…':'Кубики летят…';
  document.querySelectorAll('[data-coin-choice],[data-dice-choice]').forEach(button=>button.disabled=true);
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  if(mode==='coin'){
   const coin=document.getElementById('chance-coin');if(!coin)return;
   coin.classList.add('flipping');coin.style.transform=`rotateY(${1800+(r.side==='tails'?180:0)}deg) rotateZ(8deg)`;
   if(!reduced)await pause(1400);
  }else{
   const pair=document.getElementById('chance-dice');if(!pair)return;
   const total=document.getElementById('chance-dice-total');if(total)total.textContent='…';pair.classList.add('rolling');
   if(!reduced)for(let step=0;step<9;step++){
    if(S.route!==mode||!pair.isConnected)return;
    pair.innerHTML=r.dice.map((v,i)=>this.die((v+step*3+i)%6+1)).join('');await pause(85);
   }
   if(S.route!==mode||!pair.isConnected)return;pair.classList.remove('rolling');pair.innerHTML=r.dice.map(v=>this.die(v)).join('');if(total)total.textContent=r.sum;
   if(!reduced)await pause(180);
  }
 }
};
