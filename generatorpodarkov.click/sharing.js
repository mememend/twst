'use strict';
window.GiftSharing=(()=>{
 let current=null,creating=false;
 const sdk=()=>window.Telegram?.WebApp;
 const supported=(version,method)=>!!sdk()?.initData&&typeof sdk()?.[method]==='function'&&sdk().isVersionAtLeast(version);
 const alive=c=>current===c&&S.modalEpoch===c.epoch&&S.state.user.id===c.uid&&document.querySelector('#modal')?.open;
 function trusted(card){return ['image','download','thumbnail'].every(k=>{try{const u=new URL(card[k],location.href);return u.origin===location.origin&&u.pathname.startsWith('/share-media/')&&['http:','https:'].includes(u.protocol)}catch{return false}})&&typeof card.id==='string'&&typeof card.caption==='string'&&/^https:\/\/t\.me\/[A-Za-z0-9_]+(?:\?start=ref_[0-9]+)?$/.test(card.invite_link)}
 function panel(card,demo=false){
  const chat=supported('8.0','shareMessage'),story=supported('7.8','shareToStory')&&card.image.startsWith('https://');
  return `<section class="share-card-panel"><span class="eyebrow">ПОДАРКИ, КОТОРЫМИ ХОЧЕТСЯ ДЕЛИТЬСЯ</span><h2>Твоя карточка</h2><p>${demo?'QR-код и ссылка ведут в игру.':'QR-код и ссылка ведут на твоё приглашение.'} Получателя выбираешь ты.</p><div class="share-card-preview"><img id="share-card-image" src="${esc(card.image)}" alt="Карточка ${card.kind==='gift'?'подарка':card.kind==='album'?'альбома':'приглашения'}"></div><div class="share-card-actions"><button class="primary full" data-card-chat disabled>${chat?'Отправить карточку в Telegram':'Поделиться ссылкой на игру'} ↗</button>${story?'<button class="secondary" data-card-story disabled>В историю Telegram</button>':''}<button class="secondary" data-card-save disabled>Сохранить картинку</button><button class="secondary" data-card-copy>Копировать ссылку</button></div><p class="share-card-help">Картинку можно использовать в истории или видео. Награда за друга придёт после его первого открытого кейса.</p><div class="share-card-error" id="share-card-error" role="status"></div><button class="secondary full" data-card-retry hidden>Попробовать ещё раз</button></section>`;
 }
 async function open(input){
  if(creating||S.busy||S.animating||S.state.access?.required)return;
  creating=true;const c={input,uid:S.state.user.id,epoch:showModal('<section class="share-card-loading"><span class="eyebrow">ТВОЯ ИСТОРИЯ</span><h2>Готовим карточку</h2><span class="spinner"></span><p>Собираем находку и ссылку для друзей…</p></section>')};current=c;
  try{
   const card=await api('share-card',input);if(!alive(c))return;
   if(!trusted(card))throw new Error('Не удалось получить картинку');
   c.card=card;c.epoch=showModal(panel(card,S.state.user.demo));c.ready=false;
   const image=$('#share-card-image');
   const loaded=()=>{if(!alive(c))return;c.ready=true;document.querySelectorAll('[data-card-chat],[data-card-story],[data-card-save]').forEach(b=>b.disabled=false)};
   const failed=()=>{if(!alive(c))return;$('#share-card-error').textContent='Картинка не загрузилась. Проверь соединение и попробуй снова.';document.querySelector('[data-card-retry]').hidden=false};
   image.onload=loaded;image.onerror=failed;if(image.complete){if(image.naturalWidth)loaded();else failed()}
  }catch(e){if(alive(c)){c.epoch=showModal(`<section class="share-card-loading"><h2>Не удалось собрать карточку</h2><p>${esc(e.message)}</p><button class="primary full" data-card-retry>Попробовать ещё раз</button></section>`)}}
  finally{creating=false}
 }
 async function chat(c){
  if(!alive(c)||!c.ready||c.preparing)return;
  if(!supported('8.0','shareMessage')){
   const text=c.card.caption.replace('\n'+c.card.invite_link,''),link='https://t.me/share/url?url='+encodeURIComponent(c.card.invite_link)+'&text='+encodeURIComponent(text);
   if(sdk()?.initData)sdk().openTelegramLink(link);else window.open(link,'_blank','noopener');return;
  }
  c.preparing=true;const button=$('[data-card-chat]');button.disabled=true;button.textContent='Готовим отправку…';
  try{
   const message=await api('share-message',{card:c.card.id});if(!alive(c))return;
   sdk().shareMessage(message.id,sent=>{if(alive(c))toast(sent?'Карточка отправлена':'Отправка отменена')});
  }catch(e){if(alive(c))toast(e.message)}
  finally{c.preparing=false;if(alive(c)){button.disabled=false;button.textContent='Отправить карточку в Telegram ↗'}}
 }
 function story(c){
  if(!alive(c)||!c.ready||!supported('7.8','shareToStory'))return;
  try{sdk().shareToStory(c.card.image,{text:c.card.caption.slice(0,200)})}catch{toast('Не удалось открыть историю. Сохрани картинку и добавь её вручную')}
 }
 function save(c){
  if(!alive(c)||!c.ready)return;
  if(supported('8.0','downloadFile')){
   try{sdk().downloadFile({url:c.card.download,file_name:'gift-generator-card.jpg'},accepted=>{if(alive(c))toast(accepted?'Запрос на сохранение принят':'Сохранение отменено')});return}catch{}
  }
  if(sdk()?.initData){sdk().openLink(c.card.download);return}
  const a=document.createElement('a');a.href=c.card.download;a.download='gift-generator-card.jpg';document.body.append(a);a.click();a.remove();
 }
 document.addEventListener('click',async event=>{
  const button=event.target.closest('button');if(!button||button.disabled)return;
  if(button.dataset.shareKind){await open({kind:button.dataset.shareKind,...(button.dataset.shareInstance?{instance:button.dataset.shareInstance}:{}),...(button.dataset.shareAlbum?{album:button.dataset.shareAlbum}:{})});return}
  const c=current;if(!c||!alive(c))return;
  if(button.hasAttribute('data-card-retry')){await open(c.input);return}
  if(button.hasAttribute('data-card-chat'))await chat(c);
  if(button.hasAttribute('data-card-story'))story(c);
  if(button.hasAttribute('data-card-save'))save(c);
  if(button.hasAttribute('data-card-copy')){try{await navigator.clipboard.writeText(c.card.invite_link);if(alive(c))toast('Ссылка скопирована')}catch{toast('Открой раздел «Друзья» и скопируй свою ссылку')}}
 });
 return {open,panel,trusted,supported};
})();
