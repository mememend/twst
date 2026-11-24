'use strict';
window.GiftProfile=(()=>{
 const parts={theme:'Темы',frame:'Рамки',title:'Титулы',effect:'Эффекты'},ids=new Set(['classic','ice','crew','aurora','neon','royal']);
 const backgrounds={classic:'#0d0c15',ice:'#0c1520',crew:'#171524',aurora:'#0c1b20',neon:'#1b1024',royal:'#1c1620'};
 const safe=id=>ids.has(id)?id:'classic';
 function apply(state){
  const selected=state?.profile?.selected||{},theme=safe(selected.theme),changed=document.body.dataset.profileTheme!==theme;
  document.body.dataset.profileTheme=theme;
  const avatar=document.querySelector('#avatar');if(avatar){avatar.dataset.profileFrame=safe(selected.frame);avatar.dataset.profileEffect=safe(selected.effect)}
  if(state?.profile?.title){const label=document.querySelector('#profile-label');if(label)label.textContent=(state.user.vip?'♛ VIP · ':state.user.premium?'✦ Premium · ':'')+state.profile.title}
  if(changed){
   document.querySelector('meta[name="theme-color"]')?.setAttribute('content',backgrounds[theme]);
   try{const sdk=window.Telegram?.WebApp;if(sdk?.isVersionAtLeast?.('6.1')){sdk.setHeaderColor(backgrounds[theme]);sdk.setBackgroundColor(backgrounds[theme])}}catch{}
  }
 }
 function render(state,products,tab='theme'){
  const part=Object.prototype.hasOwnProperty.call(parts,tab)?tab:'theme',profile=state.profile,selected=profile.selected;
  return heading('Твой стиль','Сочетай темы, рамки, титулы и эффекты. Оформление не даёт игровых бонусов.')+`<section class="profile-studio"><span class="eyebrow">ТВОЯ КОЛЛЕКЦИЯ · ТВОЙ ХАРАКТЕР</span><div class="profile-studio-preview" data-style="${safe(selected.theme)}"><span class="style-preview-avatar" data-profile-frame="${safe(selected.frame)}" data-profile-effect="${safe(selected.effect)}">${esc(state.user.name.charAt(0).toUpperCase())}</span><div><h2>${esc(state.user.name)}</h2><p>${state.user.vip?'♛ VIP · ':''}${esc(profile.title)}</p></div><span class="style-preview-star" aria-hidden="true">✦</span></div><p class="style-studio-note">Изменения сохраняются в твоём аккаунте. «Лёд» откроется за 20 кейсов, «Экипаж» — за 5 активных друзей.</p></section><div class="profile-style-tabs" role="tablist" aria-label="Часть оформления">${Object.entries(parts).map(([key,name])=>`<button role="tab" aria-selected="${part===key}" data-style-tab="${key}">${name}</button>`).join('')}</div><section class="profile-style-grid" aria-label="${parts[part]}">${profile.styles.map(style=>{
   const product=products.find(p=>p.id===style.product),chosen=selected[part]===style.id,expiry=style.expires?new Date(style.expires*1000).toLocaleDateString('ru-RU',{timeZone:'Europe/Moscow'}):'';
   return `<article class="profile-style-card ${chosen?'chosen':''}" data-style="${safe(style.id)}"><div class="style-card-art"><span class="style-art-orbit"></span><span class="style-preview-avatar" data-profile-frame="${part==='frame'||part==='effect'?safe(style.id):'classic'}" data-profile-effect="${part==='effect'?safe(style.id):'classic'}">${esc(part==='title'?state.user.name.charAt(0).toUpperCase():style.symbol)}</span><span class="style-art-spark" aria-hidden="true">✦</span></div><span class="eyebrow">${part==='effect'&&style.id==='classic'?'БЕЗ ЭФФЕКТА':style.product?'НАБОР НА 30 ДНЕЙ':style.field?'НАГРАДА ЗА АКТИВНОСТЬ':'БАЗОВЫЙ СТИЛЬ'}</span><h3>${esc(part==='title'?style.title:style.name)}</h3><p>${esc(part==='effect'&&style.id==='classic'?'Спокойный профиль без дополнительного эффекта':style.description)}</p>${style.field?`<div class="style-goal"><span>${style.progress} / ${style.target}</span><progress value="${style.progress}" max="${style.target}" aria-label="${esc(style.description)}"></progress></div>`:''}${style.available?`<button class="${chosen?'secondary':'primary'} full" data-profile-part="${part}" data-profile-style="${safe(style.id)}" ${chosen?'disabled':''}>${chosen?'Выбрано':'Выбрать'}</button><button class="style-set-all" data-profile-all="${safe(style.id)}">Применить весь стиль</button>`:product?`<button class="primary full" data-buy-product="${esc(product.id)}">Открыть набор · ${product.price} ★</button>`:'<button class="secondary full" disabled>Пока не открыт</button>'}${style.product?`<small class="style-expiry">${style.available?'Доступен до '+expiry:'Тема, рамка, титул и эффект · 30 дней'}${product&&style.available?` · <button data-buy-product="${esc(product.id)}">Продлить · ${product.price} ★</button>`:''}</small>`:''}</article>`;
  }).join('')}</section><p class="style-studio-note">Оплата наборов — настоящими Telegram Stars. Повторная покупка добавляет 30 дней к выбранному набору. После окончания срока профиль вернётся к базовому оформлению для недоступных частей; выбор сохранится на случай продления. Эффект появляется при наведении или фокусе; при уменьшении движения отключается.</p><a class="secondary" href="#privileges">VIP и донаты ↗</a>`;
 }
 document.addEventListener('click',async event=>{
  const button=event.target.closest('button');if(!button||button.disabled||S.busy||S.animating)return;
  if(button.hasAttribute('data-style-tab')){S.profileTab=button.dataset.styleTab;window.dispatchEvent(new Event('gift-profile-render'));return}
  let selection;
  if(button.hasAttribute('data-profile-part')){const part=button.dataset.profilePart;if(!Object.prototype.hasOwnProperty.call(parts,part))return;selection={...S.state.profile.selected,[part]:button.dataset.profileStyle}}
  if(button.hasAttribute('data-profile-all'))selection=Object.fromEntries(Object.keys(parts).map(p=>[p,button.dataset.profileAll]));
  if(selection)await act('profile_style',selection);
 });
 return {apply,render,safe};
})();
