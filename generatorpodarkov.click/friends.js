'use strict';
window.GiftFriends=(()=>{
 const active=n=>`${n} ${n%100>=11&&n%100<=14?'активных друзей':n%10===1?'активный друг':n%10>=2&&n%10<=4?'активных друга':'активных друзей'}`;
 const text=r=>r.kind==='case'?`${r.amount} × «${r.name}»`:r.kind==='vip'?`VIP на ${r.days} дней`:r.kind==='style'?`Стиль «${r.name}»`:'Награда';
 const label=step=>step.rewards.map(text).join(' + ');
 function visual(step,state,{image,gift}){
  const reward=step?.rewards?.[0];if(!reward)return '<span class="friend-symbol" aria-hidden="true">✦</span>';
  if(reward.kind==='vip')return '<span class="friend-symbol crown" aria-hidden="true">♛</span>';
  const c=state.cases.find(c=>c.id===reward.case),g=c?.examples?.[0]||gift(c?.collections?.[0]||'toy-bear');
  return `<img class="friend-chest" src="/art/premium-chest.webp" alt="" loading="lazy">${g?image(g,'friend-gift'):''}`;
 }
 function render(state,h){
  const path=state.friend_rewards;if(!path)return '';
  const n=state.user.referrals,next=path.next,{esc,fmt}=h;
  return `<section class="friend-reward-path friend-studio"><span class="eyebrow">ТВОЯ КОМАНДА</span><h2>Больше друзей.<br>Больше находок.</h2><p>+${fmt(path.per_friend)} звёзд за каждого нового друга после его первого кейса. Награды за этапы выдаются автоматически один раз.</p><div class="friend-next"><div class="friend-next-art">${visual(next,state,h)}</div><div><span class="eyebrow">${next?'СЛЕДУЮЩАЯ НАГРАДА':'ВСЕ ЭТАПЫ ПРОЙДЕНЫ'}</span><h3>${next?esc(label(next)):'Команда собрана!'}</h3><p>${next?'До награды: '+active(next.remaining):'Каждый новый активный друг по-прежнему приносит '+fmt(path.per_friend)+' звёзд.'}</p><strong>${fmt(n)} <small>активных друзей</small></strong><button class="secondary friend-path-share" data-share-kind="invite">Сделать приглашение ↗</button></div></div><div class="friend-step-grid">${path.steps.map(step=>`<article class="friend-step ${step.claimed?'done':''} ${next?.target===step.target?'next':''}" data-friend-target="${step.target}"><header><b>${step.target}</b><span>${step.claimed?'✓ Получено':next?.target===step.target?'Ближайший этап':'Цель'}</span></header><div class="friend-step-art">${visual(step,state,h)}</div><h3>${esc(text(step.rewards[0]))}</h3>${step.rewards.some(r=>r.kind==='style')?'<a class="friend-style-link" href="#profile">+ Стиль «Экипаж» ↗</a>':''}<div class="friend-step-progress"><progress value="${step.progress}" max="${step.target}" aria-label="Прогресс этапа за ${step.target} друзей"></progress><span>${step.progress} / ${step.target}</span></div><small>${active(step.target)}</small></article>`).join('')}</div><p class="friend-path-note">Друг считается активным после одного кейса. Уже полученные бонусы сохраняются; повторного начисления за тот же этап нет. VIP за 20 друзей действует 30 дней.</p></section>`;
 }
 function homeCard(state,h){
  const path=state.friend_rewards;if(!path)return '';
  const next=path.next,n=state.user.referrals,{esc,fmt}=h;
  return `<a href="#invite" class="promo-card friends friend-home-card"><div class="promo-art friend-next-art">${visual(next,state,h)}</div><span class="eyebrow">КОМАНДА И НАГРАДЫ</span><h2>Кейсы за друзей</h2><p>${next?esc(label(next)):'Все этапы пройдены. +'+fmt(path.per_friend)+' звёзд за каждого нового друга.'}</p><strong>${next?'До награды: '+active(next.remaining):fmt(n)+' активных друзей'}</strong><div class="progress"><span style="width:${next?Math.min(100,n/next.target*100):100}%"></span></div><span class="friend-home-counter">${next?n+' / '+next.target:'✓ Все этапы'}</span><span class="promo-cta">Пригласить друзей ↗</span></a>`;
 }
 return {render,homeCard};
})();
