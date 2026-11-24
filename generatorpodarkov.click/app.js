'use strict';
const $=s=>document.querySelector(s),tg=window.Telegram?.WebApp;
tg?.ready();tg?.expand();try{if(tg?.isVersionAtLeast?.('6.1')){tg.setHeaderColor('#0d0c15');tg.setBackgroundColor('#0d0c15')}}catch{}
function haptic(kind){if(tg?.isVersionAtLeast?.('6.1'))tg.HapticFeedback?.notificationOccurred(kind)}
const S={state:null,catalog:[],collections:[],collection:null,config:null,route:'home',filter:'all',query:'',page:0,selected:null,battles:[],busy:false,modalEpoch:0};

function playSound(kind){window.GiftAudio?.play(kind)}
document.addEventListener('error',e=>{const img=e.target;if(img.tagName==='IMG'&&img.dataset.fallback&&img.getAttribute('src')!==img.dataset.fallback){img.src=img.dataset.fallback;delete img.dataset.fallback}},true);

const labels={common:'Обычный',rare:'Редкий',epic:'Эпический',legendary:'Легендарный'};
const icons={home:'<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',cases:'<rect x="4" y="7" width="16" height="14" rx="2"/><path d="M3 7h18M12 7v14M12 7c-6 0-7-5-3-5 3 0 3 5 3 5Zm0 0c6 0 7-5 3-5-3 0-3 5-3 5Z"/>',games:'<path d="M7 7h10c3 0 5 11 3 13-2 2-5-3-5-3H9s-3 5-5 3C2 18 4 7 7 7Z"/><path d="M6 12h5M8.5 9.5v5M16 11h.1M18 14h.1"/>',inventory:'<path d="M4 8h16v12H4ZM8 8V4h8v4M4 13h16M10 13v3h4v-3"/>',tasks:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M8 10l2 2 5-5M9 16h6"/>',pass:'<path d="m3 6 4 4 5-7 5 7 4-4-2 13H5ZM5 21h14"/>',invite:'<circle cx="9" cy="8" r="4"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M18 6v8M14 10h8"/>',ranking:'<path d="M8 3h8v7a4 4 0 0 1-8 0ZM8 5H4v3a4 4 0 0 0 4 4M16 5h4v3a4 4 0 0 1-4 4M12 14v6M7 21h10"/>'};
const nav=[['home','Главная'],['cases','Кейсы'],['games','Игры'],['inventory','Подарки'],['tasks','Задания'],['pass','Батл-пасс'],['invite','Друзья'],['ranking','Рейтинг'],['privileges','VIP и донаты'],['albums','Альбомы'],['profile','Твой стиль']];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=x=>Number(x).toLocaleString('ru-RU');
const image=(g,cls='')=>`<img class="${cls}" data-animation-id="${esc(g.id)}" ${g.instance&&g.market?`data-scene-instance="${esc(g.instance)}" data-gift-number="${esc(g.market.number)}"`:""} src="${esc(g.image)}" alt="${esc(g.name)}" loading="lazy" data-fallback="${esc(g.model_image||gift(g.id)?.image||'/art/premium-chest.webp')}">`;
let giftCatalog=null,giftIndex=new Map();
const gift=id=>{if(giftCatalog!==S.catalog){giftIndex=new Map();for(const g of S.catalog)if(!giftIndex.has(g.id))giftIndex.set(g.id,g);giftCatalog=S.catalog}return (id===id?giftIndex.get(id):undefined)||S.catalog[0]};
icons.privileges=icons.pass;icons.albums=icons.inventory;icons.profile=icons.inventory;
const svg=id=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[id]}</svg>`;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('visible'),4000)}
function apiRetryWait(ms,signal){return new Promise((resolve,reject)=>{let timer;const abort=()=>{clearTimeout(timer);reject(new DOMException('Операция отменена','AbortError'))};if(signal?.aborted){abort();return}timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve()},ms);signal?.addEventListener('abort',abort,{once:true})})}
async function api(path,body,options={}){
 const headers={};if(tg?.initData)headers.Authorization='tma '+tg.initData;if(body){headers['Content-Type']='application/json';headers['X-Gift-Client']='1'}
 const controller=body?null:new AbortController(),signal=controller?.signal||options.signal,forward=()=>controller?.abort();
 if(options.signal?.aborted)forward();else options.signal?.addEventListener('abort',forward,{once:true});
 const timer=controller?setTimeout(()=>controller.abort(),25000):null;
 try{
  for(let attempt=0;attempt<3;attempt++){
   let response;
   try{response=await fetch('/api/'+path,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined,credentials:'same-origin',signal})}
   catch(error){if(!body&&!signal?.aborted&&attempt<2&&error instanceof TypeError){await apiRetryWait(800+Math.random()*700,signal);continue}throw error}
   let data;try{data=await response.json()}catch(error){if(response.ok)throw error;data={error:[429,503].includes(response.status)?'Сервер занят. Повтори действие через несколько секунд.':'Не удалось выполнить запрос'}}
   if(!body&&[429,503].includes(response.status)&&attempt<2){const retry=Number(response.headers?.get('Retry-After'));await apiRetryWait((Number.isFinite(retry)&&retry>0?Math.min(5,retry)*1000:1500)+Math.random()*700,signal);continue}
   if(!response.ok){const error=new Error(data.error||'Не удалось выполнить запрос');error.code=data.code||([429,503].includes(response.status)?'server_busy':undefined);throw error}
   return data;
  }
 }catch(error){if(controller?.signal.aborted&&!options.signal?.aborted){const timeout=new Error('Сервер отвечает долго. Проверь соединение и повтори.');timeout.code='request_timeout';throw timeout}throw error}
 finally{if(timer)clearTimeout(timer);options.signal?.removeEventListener('abort',forward)}
}

function requestId(){
 const secure=window.crypto;if(typeof secure?.randomUUID==='function')return secure.randomUUID();
 if(typeof secure?.getRandomValues!=='function')throw new Error('Не удалось подготовить действие. Закрой игру и открой её снова в Telegram.');
 const bytes=secure.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
}
async function act(action,data={},options={}){if(S.busy)return null;S.busy=true;S.actionVersion=(S.actionVersion||0)+1;S.lastError=null;S.lastErrorCode=null;try{const key=options.requestKey||requestId();let res;for(let attempt=0;attempt<3;attempt++){try{res=await api('action',{action,data,key});break}catch(e){if(attempt===2||!(e instanceof TypeError||e.code==='server_busy'))throw e;if(e.code==='server_busy')await apiRetryWait(1800+attempt*400)}}S.state=res.state;header();if(['daily','task','channel','vip_daily','album_claim'].includes(action)||(action==='pass'&&!res.result.gift&&!res.result.case))playSound('claim');if(!options.silent)toast(res.result.message);if(options.render!==false)render();haptic('success');return res.result}catch(e){S.lastError=e.message;S.lastErrorCode=e.code;toast(e.message);playSound('error');haptic('error');return null}finally{S.busy=false}}
function header(){document.body.classList.toggle('membership-required',!!S.state.access?.required);if(S.state.access?.required){window.GiftProfile?.apply(S.state);return}const sound=$('#sound-toggle');if(sound){sound.textContent=GiftAudio.enabled?'♫':'♪';sound.setAttribute('aria-pressed',String(GiftAudio.enabled));sound.setAttribute('aria-label',GiftAudio.enabled?'Выключить звук':'Включить звук')}const u=S.state.user;$('#stars').textContent=fmt(u.stars);$('#player-name').textContent=u.name;$('#avatar').textContent=u.name.charAt(0).toUpperCase();$('#avatar').classList.toggle('vip-avatar',!!u.vip);$('.topbar').classList.toggle('vip-header',!!u.vip);$('#player-name').parentElement.classList.toggle('vip-name',!!u.vip);$('#profile-label').textContent=u.vip?'♛ VIP до '+new Date(u.vip_until*1000).toLocaleDateString('ru-RU') : u.premium?'✦ Улучшенный батл-пасс активен':'Твоя коллекция начинается здесь';$('#demo-banner').hidden=!u.demo;$('#bot-link').href='https://t.me/'+S.config.bot;$('#side-nav').innerHTML=nav.map(([id,name])=>`<a class="nav-item ${active(id)?'active':''}" href="#${id}">${svg(id)}${name}${id==='inventory'?`<span class="badge-count">${S.state.inventory.length}</span>`:''}</a>`).join('');$('#bottom-nav').innerHTML=nav.slice(0,6).map(([id,name])=>`<a class="nav-item ${active(id)||id==='inventory'&&albumRoute()?'active':''}" href="#${id}">${svg(id)}${name}</a>`).join('');window.GiftProfile?.apply(S.state)}
function active(id){return id===S.route||id==='games'&&['rocket','pvp','mines','plinko','upgrade','wheel','coin','dice','tower','hilo','rps','blackjack','memory','puzzle','codebreaker'].includes(S.route)||id==='inventory'&&S.route==='shop'||id==='albums'&&albumRoute()}
function heading(title,description,extra=''){return `<div class="page-heading"><div><h1>${title}</h1><p>${description}</p></div>${extra}</div>`}
function section(title,link='',href=''){return `<div class="section-title"><h2>${title}</h2>${link?`<a href="#${href}">${link} ↗</a>`:''}</div>`}
function modeCards(){return `<div class="mode-grid">${[
 ['rocket','Ракетка','ЛОВИ МОМЕНТ','Забери результат до падения','🚀'],
 ['pvp','PvP','ИГРА С ДРУЗЬЯМИ','Два игрока. Один победитель.','⚔️'],
 ['mines','Мины','ВЫБИРАЙ КЛЕТКИ','Находи кристаллы и забирай результат','💎'],
 ['plinko','Плинко','ПУСТЬ ПАДАЕТ','Путь шарика определяет множитель','🔮'],
 ['upgrade','Апгрейд','НОВАЯ ВЫСОТА','Попробуй получить подарок дороже','✨'],
 ['wheel','Колесо','КРУТИ И ЛОВИ','От x0 до x10 за один поворот','🎡'],
 ['coin','Монетка','ОРЁЛ ИЛИ РЕШКА','Выбери сторону · результат x1,90','🪙'],
 ['dice','Кости','ДВА КУБИКА','Меньше, ровно или больше семи','🎲'],
 ['tower','Башня','ПОДНИМАЙСЯ ВЫШЕ','Восемь этажей · забирай после любого шага','🏰'],
 ['hilo','Выше или ниже','СЛЕДУЮЩАЯ КАРТА','Угадывай карты · собирай множитель','♠'],
 ['rps','Камень · ножницы · бумага','ТРИ ЗНАКА','Выбери знак · ничья сохраняет подарок','✊'],
 ['blackjack','Блэкджек','ТВОИ 21 ОЧКО','Добирай карты · остановись вовремя','♠'],
 ['memory','Пары','ПРОВЕРЬ ПАМЯТЬ','Шесть совпадений · кейс за прохождение','◈'],
 ['puzzle','Пятнашки','ВЫЗОВ ДНЯ','Собери числа · звёзды и кейс за решение','▦'],
 ['codebreaker','Кодовый замок','РАЗГАДАЙ СЕКРЕТ','Четыре цифры · шесть попыток','⌁']
 ].map(([id,name,tag,desc,art])=>`<a href="#${id}" class="mode-card ${id}"><span class="tag">${tag}</span><h3>${name}</h3><p>${desc}</p>${modeArt(id)}<span class="arrow">↗</span></a>`).join('')}</div>`}

function modeArt(id){return ['puzzle','codebreaker'].includes(id)?BrainGames.art(id):id==='memory'?MemoryGame.art():id==='blackjack'?BlackjackGame.art():id==='rps'?RpsGame.art():id==='hilo'?HiLoGame.art():id==='tower'?TowerGame.art():id==='coin'?'<span class="mode-coin-art" aria-hidden="true">✦</span>':id==='dice'?'<span class="mode-dice-art" aria-hidden="true">'+ChanceGames.die(5)+ChanceGames.die(3)+'</span>':id==='rocket'?'<img class="mode-render" src="/art/rocket-72be36178470.webp" data-fallback="/art/rocket.png" alt="" loading="lazy">':id==='plinko'?'<span class="mode-plinko-art" aria-hidden="true"></span>':id==='wheel'?'<span class="mode-wheel-art" aria-hidden="true"></span>':id==='pvp'?image(gift('diamond-ring'),'gift-art')+image(gift('toy-bear'),'gift-art second'):image(gift(id==='mines'?'astral-shard':'magic-potion'),'mode-render')}
function caseArtwork(c){const g=c.examples?.[Math.floor(c.examples.length/2)];return c.theme?`<div class="case-theme-art ${esc(c.theme)}"><span class="case-theme-orbit" aria-hidden="true"></span>${(c.examples||[]).filter((x,i,a)=>a.findIndex(y=>(c.collections?.length===1?y.id:y.collection_id||y.id)===(c.collections?.length===1?x.id:x.collection_id||x.id))===i).slice(0,3).map(x=>image({...x,image:x.model_image||x.image})).join('')}${!c.examples?.length?'<span class="case-theme-placeholder" aria-hidden="true">✧</span>':''}</div>`:`<div class="case-art"><img src="/art/premium-chest.webp" alt="Кейс ${esc(c.name)}" loading="lazy">${g?image(g,'case-featured-gift'):''}</div>`}
function caseCard(c){const art=caseArtwork(c);return `<button class="case-card ${c.color} ${c.theme?'themed-case':''} ${c.available===false?'unavailable':''}" data-case="${c.id}"><span class="tag">${c.theme?'ТЕМАТИЧЕСКИЙ':c.id==='daily'?'КАЖДЫЙ ДЕНЬ':c.odds[3]>=25?'ВЫСОКИЙ ШАНС ЛЕГЕНДЫ':'КЕЙС С ПОДАРКАМИ'}</span>${art}<h3>${esc(c.name)}</h3><p>${esc(c.description)}</p><span class="case-value-range">${c.floor?fmt(c.floor)+(c.floor===c.ceiling?'':'–'+fmt(c.ceiling))+' ✦ в находках':'Состав обновляется'}</span><span class="case-model-count">${c.model_count?'Моделей в составе: '+fmt(c.model_count):'Загружаем рыночные цены'}</span><div class="case-price">${c.credits?'У тебя · '+c.credits+' шт.':c.price?'Открыть · '+fmt(c.price)+' ✦':c.remaining?'Доступно · '+c.remaining+' шт.':'Завтра снова'}<span>↗</span></div></button>`}

function home(){const featured=['plush-pepe','heart-locket','durov-s-cap','toy-bear','precious-peach','magic-potion','astral-shard','sakura-flower','jelly-bunny','diamond-ring'].map(id=>gift(id));return `${contentLaunch()}${section('Четыре новых кейса')}<div class="case-grid">${S.state.cases.filter(c=>['resistance','polar','heroes','champion'].includes(c.id)).map(caseCard).join('')}</div><div class="live-strip"><div class="live-label">✦ ПОДАРКИ<small>${S.catalog.filter(g=>!g.legacy).length} в каталоге</small></div>${featured.map(g=>`<a href="#shop" class="live-gift ${g.rarity}" title="${esc(g.name)}">${image(g)}</a>`).join('')}</div><section class="hero collection-hero"><div class="hero-copy"><span class="eyebrow">ТВОЯ КОЛЛЕКЦИЯ ПОДАРКОВ</span><h1>Открой кейс.<br><span>Найди свой подарок.</span></h1><p>Собирай модели, играй с друзьями и открывай новые награды.</p><div class="hero-actions"><a class="primary" href="#cases">Выбрать кейс ↗</a><a class="secondary" href="#albums">Альбомы</a><a class="secondary" href="#invite">Пригласить друзей ↗</a></div></div><div class="hero-art"><div class="hero-orbit"></div><img src="/art/premium-chest.webp" alt="Подарочный кейс" fetchpriority="high"></div></section><a href="#pass" class="pass-banner"><span class="crown">♛</span><div><h3>Батл-пасс · Уровень ${S.state.user.level}/${S.state.battle_pass.levels}</h3><p>Награды за опыт · Улучшение за ${S.config.premium_price} Telegram Stars</p></div><span class="arrow">↗</span></a>${vipBanner()}${bonusCases()}${GiftMissions.render(S.state,{esc,fmt},true)}${GiftWeekly.render(S.state,{esc,fmt},true)}${homePromotions()}${albumBanner()}${section('Выбирай свою игру','Все режимы','games')}${modeCards()}<div class="home-bottom"><div class="daily-card"><div class="daily-icon">✦</div><div><h3>Ежедневная награда</h3><p>${S.state.daily_claimed?'Возвращайся завтра':'Забери '+(S.state.user.premium?(S.state.daily_rewards?.premium||400):(S.state.daily_rewards?.base||200))+' звёзд'}</p></div><button class="primary mint" data-action="daily" ${S.state.daily_claimed?'disabled':''}>${S.state.daily_claimed?'Получено':'Забрать'}</button></div></div>${section('Кейсы с характером','Посмотреть все','cases')}<div class="case-grid">${S.state.cases.map(caseCard).join('')}</div>`}
function contentLaunch(){return `<section class="content-launch"><div><span class="eyebrow">БОЛЬШЕ ИГР · БОЛЬШЕ НАГРАД</span><h2>Проверь себя. Открой новое.</h2><p>Два новых вызова дня, четыре тематических кейса и недельный маршрут с большим набором.</p><div class="content-launch-actions"><a class="primary" href="#puzzle">Пятнашки ↗</a><a class="secondary" href="#codebreaker">Кодовый замок</a><a class="secondary" href="#tasks">Награды недели</a></div></div><span class="content-launch-symbol" aria-hidden="true">✦</span></section>`}
function puzzle(){return BrainGames.render(S,{heading,esc,fmt})}
function codebreaker(){return BrainGames.render(S,{heading,esc,fmt})}
function casePreview(g){return `<div class="case-preview ${g.rarity}">${image(g)}<h3>${esc(g.name)}</h3><span>${esc(g.collection_name||labels[g.rarity])}</span><strong>${fmt(g.value)} ✦</strong></div>`}
function caseHighlights(c){return c?.examples||[]}
function cases(){const tabs=[['all','Все'],['theme','По теме'],['bonus','Мои кейсы']],chosen=tabs.some(t=>t[0]===S.caseFilter)?S.caseFilter:'all',match=c=>chosen==='all'||(chosen==='theme'?Boolean(c.theme):Boolean(c.credits||c.id==='daily'&&c.remaining)),rows=S.state.cases.filter(match);return `${heading('Кейсы','Выбирай тему, стоимость находок и шансы.')}<div class="case-category-tabs" role="group" aria-label="Категории кейсов">${tabs.map(([id,name])=>`<button class="secondary ${chosen===id?'active':''}" data-case-filter="${id}" aria-pressed="${chosen===id}">${name}<span>${S.state.cases.filter(c=>id==='all'||(id==='theme'?c.theme:c.credits||c.id==='daily'&&c.remaining)).length}</span></button>`).join('')}</div><div class="case-explainer"><span>🎁 Подарок</span><b>+</b><span>◈ Фон и символ</span><b>+</b><span># Номер</span><p>Всё выпадает автоматически. Тематические кейсы содержат только указанные коллекции в своём диапазоне цен. В карточке — текущие подарки и шансы.</p></div><div class="case-grid">${rows.map(caseCard).join('')}</div>${!rows.length?'<div class="notice">Сейчас бонусных кейсов нет. Следующие можно получить за задания и активных друзей.</div>':''}`}
function card(g,kind='catalog'){return `<button class="gift-card ${g.rarity} ${g.status&&g.status!=='owned'?'locked':''} ${S.selected===g.instance?'selected':''}" data-gift="${esc(g.instance||g.id)}" data-kind="${kind}">${image(g)}<h3>${esc(g.name)}</h3>${g.collection_name?`<div class="collection-name">${esc(g.collection_name)}</div>`:''}<div class="rarity">${labels[g.rarity]}${g.status==='pvp'?' · В PvP':g.status==='rocket'?' · В полёте':g.status==='tower'?' · В башне':g.status==='blackjack'?' · За столом':g.status==='hilo'?' · В колоде':g.status==='mines'?' · В минах':''}</div><div class="gift-value">${kind==='catalog'&&g.model?'Посмотреть варианты ↗':fmt(g.value)+' ✦'}</div></button>`}
function filtered(items){return items.filter(g=>(S.filter==='all'||g.rarity===S.filter)&&(g.name+' '+(g.collection_name||'')).toLocaleLowerCase().includes(S.query.toLocaleLowerCase()))}
function filters(){return `<div class="filters"><input class="search" id="search" type="search" placeholder="Найти подарок…" value="${esc(S.query)}" aria-label="Найти подарок">${[['all','Все'],...Object.entries(labels)].map(([id,name])=>`<button class="filter-button ${S.filter===id?'active':''}" data-filter="${id}">${name}</button>`).join('')}</div>`}
function collectionDirectory(){return heading('Каталог подарков',`${S.collections.length} коллекции · ${fmt(S.catalog.filter(g=>g.model).length)} моделей`, '<a href="#inventory" class="secondary">Мои подарки</a>')+`<div class="filters"><input class="search" id="search" type="search" placeholder="Найти коллекцию или модель…" aria-label="Найти подарок"><button class="secondary" data-collection="all">Все модели</button></div><div class="gift-grid">${S.collections.map(c=>`<button class="gift-card collection-card ${c.rarity}" data-collection="${esc(c.id)}">${image(c)}<h3>${esc(c.name)}</h3><div class="collection-count">${c.model_count} моделей ↗</div></button>`).join('')}</div>`}
function shop(){if(!S.collection&&!S.query)return collectionDirectory();const rows=filtered(S.catalog.filter(g=>!g.legacy&&(S.collection==='all'||!S.collection||g.collection_id===S.collection))),pages=Math.ceil(rows.length/24),items=rows.slice(S.page*24,(S.page+1)*24);return `${heading('Каталог подарков',`${S.collections.length} коллекции · ${fmt(S.catalog.filter(g=>g.model).length)} моделей`, '<a href="#inventory" class="secondary">Мои подарки</a>')}<div class="notice">Покупай подарки за баланс <strong>«Телеграм звёзды»</strong>. Выбирай коллекцию и находи свою любимую модель.</div><button class="secondary" data-collection="" style="margin-bottom:15px">← Коллекции</button>${filters()}<div class="gift-grid" id="catalog-grid">${items.map(g=>card(g)).join('')}</div>${!rows.length?'<div class="empty">Ничего не найдено. Попробуй другое название.</div>':''}<div class="pagination"><button class="secondary" data-page="${S.page-1}" ${S.page===0?'disabled':''}>←</button><span>${pages?S.page+1:0} / ${pages}</span><button class="secondary" data-page="${S.page+1}" ${S.page+1>=pages?'disabled':''}>→</button></div>`}
function inventory(){const rows=filtered(S.state.inventory);return `${heading('Мои подарки',`${S.state.inventory.length} в коллекции · Каждый подарок — твоя находка`, '<a class="secondary" href="#shop">Магазин ↗</a>')}${albumBanner()}${filters()}${rows.length?`<div class="gift-grid">${rows.map(g=>card(g,'inventory')).join('')}</div>`:S.state.inventory.length?'<div class="empty"><h3>Ничего не найдено</h3><p>В коллекции есть подарки, но они не подходят под выбранные фильтры.</p><button class="primary" data-reset-filters="inventory">Сбросить фильтры</button></div>':`<div class="empty">${image(gift('toy-bear'))}<h3>Здесь появятся твои подарки</h3><p>Открой ежедневный кейс или загляни в магазин.</p><a href="#cases" class="primary">Выбрать кейс</a></div>`}`}
function games(){return `${heading('Игры','Используй свои подарки и пробуй новые стратегии.')}<div class="notice">В режимах с подарком его можно потерять. В «Парах» подарки и баланс не списываются. Улучшенный батл-пасс <strong>не меняет исход игр</strong>.</div>${modeCards()}${section('Готовы к игре','Мой инвентарь','inventory')}<div class="gift-grid">${S.state.inventory.filter(g=>g.status==='owned').slice(0,10).map(g=>card(g,'inventory')).join('')}</div>`}
function tasks(){return `${heading('Задания','Звёзды, бонусные кейсы и новые цели каждый день.')}<a class="secondary mt" href="#invite">Пригласить друзей · моя ссылка ↗</a>${GiftWeekly.render(S.state,{esc,fmt})}${GiftMissions.render(S.state,{esc,fmt})}${loginStreak()}${section('Твои цели')}<div class="task-list">${S.state.tasks.map(t=>`<div class="task-card"><h3>${t.name}</h3><small>${t.progress} из ${t.target}</small><div class="progress"><span style="width:${t.progress/t.target*100}%"></span></div><div class="task-bottom"><span>+${fmt(t.reward)} ✦</span><button class="secondary" data-task="${t.id}" ${t.claimed||t.progress<t.target?'disabled':''}>${t.claimed?'Получено':'Забрать'}</button></div></div>`).join('')}</div><div class="task-card mt"><h3>Подпишись на канал</h3><p class="muted small-text">@generatorpodarkovtg · +400 ✦</p><div class="task-bottom"><a class="secondary" href="https://t.me/generatorpodarkovtg" target="_blank" rel="noopener">Подписаться ↗</a><button class="primary" data-action="channel" ${S.state.channel_claimed?'disabled':''}>${S.state.channel_claimed?'Получено':'Проверить'}</button></div></div>${vipReferralCard()}${section('Приглашай и получай','Друзья','invite')}<p class="muted small-text">За друга, который откроет один кейс, ты получишь 300 звёзд. Приглашения учитываются только для Telegram-аккаунтов.</p>`}
function inviteLink(){return 'https://t.me/'+S.config.bot+'?start=ref_'+S.state.user.id.replace('tg_','')}
function invite(){return `${heading('Друзья и награды','Собирай команду и открывай новые кейсы.')}${S.state.user.demo?`<div class="notice mt">Личная ссылка доступна внутри Telegram. Открой бота и зайди в игру со своего аккаунта.</div><a class="primary" target="_blank" rel="noopener" href="https://t.me/${S.config.bot}">Открыть бота ↗</a>`:`<div class="invite-box"><input class="search" readonly value="${esc(inviteLink())}" aria-label="Ссылка приглашения"><button class="primary" id="copy-invite">Копировать</button></div><button class="secondary mt" id="share-invite">Поделиться с друзьями ↗</button>`}${friendRewards()}${inviteCard()}`}
function pass(){return GiftPass.render(S,{image,gift,esc,fmt})}
function albumRoute(){return S.route==='albums'||S.route.startsWith('album/')}
function albumBanner(){return GiftAlbums.banner(S.state.album_summary,{fmt})}
function albumCacheValid(entry){
 if(!entry||entry.uid!==S.state.user.id||entry.version!==(S.actionVersion||0)||Date.now()-entry.created>=30000)return false;
 const actual=S.state.album_summary,saved=entry.data?.summary;
 return !saved||!actual||['models','ready','completed'].every(k=>saved[k]===actual[k]);
}
function albums(){
 const key=S.route,candidate=S.albumCache?.get(key),entry=candidate?.uid===S.state.user.id?candidate:null,valid=albumCacheValid(entry);
 if(!entry?.data&&!entry?.error)return `<section class="album-load"><span class="eyebrow">АЛЬБОМЫ ПОДАРКОВ</span><h1>Собираем твои находки</h1><span class="spinner"></span><p>Загружаем модели и награды коллекций…</p></section>`;
 if(entry.error)return `<section class="album-load"><h1>Альбомы пока недоступны</h1><p>${esc(entry.error)}</p><button class="primary" data-album-retry>Попробовать снова</button></section>`;
 const view={query:S.albumQuery||'',filter:S.albumFilter||'all',modelFilter:S.albumModelFilter||'all',page:S.albumPage||0,loading:!valid},helpers={esc,fmt,gift,image};
 return `${!valid?'<div class="album-loading-strip" role="status">Обновляем находки и награды…</div>':''}`+(S.route==='albums'?GiftAlbums.directory(entry.data,view,helpers):GiftAlbums.detail(entry.data,view,helpers));
}
async function loadAlbums(){
 const route=S.route,uid=S.state.user.id,version=S.actionVersion||0;S.albumCache??=new Map();S.albumLoads??=new Map();
 const old=S.albumCache.get(route),pending=S.albumLoads.get(route);
 if(albumCacheValid(old)||pending&&pending.version===version)return;
 const marker={version};S.albumLoads.set(route,marker);
 try{
  const data=await api('albums'+(route==='albums'?'':'?id='+encodeURIComponent(route.slice(6))));
  if(uid!==S.state.user.id||version!==(S.actionVersion||0))return;
  if(!Array.isArray(data.albums)||!data.summary)throw new Error('Не удалось загрузить альбом');
  if(route!=='albums'&&(data.albums.length!==1||!Array.isArray(data.model_ids)||!Array.isArray(data.seen)))throw new Error('Не удалось загрузить модели альбома');
  S.state.album_summary=data.summary;
  S.albumCache.set(route,{uid,version,created:Date.now(),data});
 }catch(e){if(uid===S.state.user.id&&version===(S.actionVersion||0))S.albumCache.set(route,{uid,version,created:Date.now(),error:e.message})}
 finally{
  if(S.albumLoads.get(route)===marker)S.albumLoads.delete(route);
  while(S.albumCache.size>8)S.albumCache.delete(S.albumCache.keys().next().value);
  if(S.route===route&&uid===S.state.user.id&&!S.state.access?.required)render();
 }
}

function rocket(){const r=S.state.rocket;return `${heading('Ракетка','Забери результат до падения. Выбранный подарок участвует в ставке.')}<div class="rocket-scene ${r?'flying':''}" id="rocket-scene"><span class="scene-rocket">🚀</span><div class="rocket-mult" id="rocket-mult">${r?'x'+r.multiplier.toFixed(2):'x1.00'}</div><div class="rocket-label" id="rocket-label">${r?'Полёт продолжается':'Выбери подарок и начинай полёт'}</div></div><div class="game-controls"><div class="selected-gift" id="selected-gift">${r?image(r.gift)+'<span>'+esc(r.gift.name)+'</span>':selectedHtml()}</div><button class="primary ${r?'mint':''}" id="rocket-button" ${r?`data-round="${esc(r.id)}"`:""}>${r?'Забрать':'Запустить ракету'}</button></div><div class="notice">Множитель растёт с серверным временем. При падении подарок теряется. При выходе получаешь подарок подходящей стоимости, а остаток стоимости обменивается на звёзды по курсу 60%. Ракета может упасть сразу на x1.00. Максимум — x30.<br>${r?`Проверка раунда: <span class="small-text">${esc(r.commitment)}</span>`:'Выход из приложения не отменяет ставку.'}</div>${section('Выбери подарок')}<div class="gift-grid">${S.state.inventory.filter(g=>g.status==='owned').map(g=>card(g,'select')).join('')}</div>${!S.state.inventory.some(g=>g.status==='owned')?'<div class="empty">Нет свободных подарков. <a href="#cases">Открой кейс ↗</a></div>':''}`}
function selectedHtml(){const g=S.state.inventory.find(g=>g.instance===S.selected);return g?image(g)+'<span>'+esc(g.name)+'<br>'+fmt(g.value)+' ✦</span>':'Выбери подарок ниже'}
function focusGameControls(){const controls=$('#app .selected-gift')?.closest('.game-controls,.tower-controls,.hilo-controls,.bj-start');if(!controls)return;const box=controls.getBoundingClientRect(),top=Math.max(0,$('.topbar')?.getBoundingClientRect().bottom||0),bottom=$('.bottom-nav')?.getBoundingClientRect().top||innerHeight;if(box.top<top||box.bottom>bottom)controls.scrollIntoView({block:'center',behavior:'instant'})}
function pvp(){return `${heading('PvP · Дуэли','Победитель забирает оба подарка.')}<div class="notice">Шанс победы пропорционален стоимости подарков. Например, два одинаковых по стоимости подарка дают по <strong>50%</strong>. Привилегия не меняет шансы. После создания дуэли подарок блокируется; до прихода соперника дуэль можно отменить.</div><div class="game-controls"><div class="selected-gift" id="selected-gift">${selectedHtml()}</div><button class="primary gold" id="create-battle">Создать дуэль</button></div>${section('Дуэли')}<div class="battle-list" id="battles">${battleHtml()}</div>${section('Твои свободные подарки')}<div class="gift-grid">${S.state.inventory.filter(g=>g.status==='owned').map(g=>card(g,'select')).join('')}</div>`}
function battleHtml(){return S.battles.length?S.battles.map(b=>`<div class="battle-card"><header>${image(b.gift)}<div><h3>${esc(b.owner_name)}</h3><p>${esc(b.gift.name)} · ${fmt(b.gift.value)} ✦</p><p>${b.status==='waiting'?'Ожидает соперника':b.status==='finished'?'Победитель: '+esc(b.winner===b.owner?b.owner_name:b.opponent_name):'Отменена'}</p></div></header>${b.status==='waiting'?b.owner===S.state.user.id?`<button class="secondary" data-cancel-battle="${b.id}">Отменить и вернуть подарок</button>`:`<button class="primary" data-join-battle="${b.id}">Посмотреть дуэль</button>`:''}${b.status==='finished'?`<p class="small-text">Seed: ${esc(b.seed)}</p>`:''}</div>`).join(''):'<div class="empty">Пока нет дуэлей. Создай первую и пригласи друга.<br>Здесь участвуют настоящие игроки, автоматических соперников нет.</div>'}
function ranking(){return `${heading('Рейтинг коллекционеров','Больше находок — выше место в рейтинге.')}<div class="notice">${S.state.user.demo?'Это рейтинг демонстрационных профилей. Telegram-игроки учитываются отдельно.':'Рейтинг основан на количестве полученных подарков.'}</div>${S.state.leaderboard.map((u,i)=>`<div class="leader-row ${u.self?'self':''}"><b>${String(i+1).padStart(2,'0')}</b><strong>${esc(u.name)}${u.self?' · ты':''}</strong><span>${fmt(u.gifts)} подарков</span></div>`).join('')}`}
function history(){return `${heading('История','Твои находки, игры и награды.')}<div class="history-list">${S.state.history.map(h=>`<div class="history-row">${h.gift?image(h.gift):'<span class="star">✦</span>'}<div><strong>${esc(h.label)}</strong><span>${h.gift?esc(h.gift.name):'Генератор подарков'}</span></div><time>${new Date(h.created*1000).toLocaleString('ru-RU',{timeZone:'Europe/Moscow',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</time></div>`).join('')}</div>`}
function membershipGate(){const a=S.state.access;return `<section class="task-card access-gate"><span class="eyebrow">ДОБРО ПОЖАЛОВАТЬ</span><h1>Открой доступ к игре</h1><p class="muted">${a.bots?.length?'Перейди в наши боты и нажми «Начать» в каждом. Затем вернись сюда и проверь доступ.':'Подпишись на канал и проверь доступ.'}</p>${(a.bots||[]).map(b=>`<a class="primary mt" href="${esc(b.url)}" target="_blank" rel="noopener">${esc(b.name)} ↗</a>`).join('')}${a.channel_required!==false?`<a class="secondary mt" href="${esc(a.channel)}" target="_blank" rel="noopener">Подписаться на канал ↗</a>`:''}<button class="primary mt" data-action="access_check">Проверить доступ</button></section>`}
function render(){if(!S.state)return;header();syncRecording();if(S.state.access?.required){$('#app').innerHTML=membershipGate();return}const routes={home,cases,inventory,shop,games,tasks,pass,invite,rocket,pvp,mines,plinko,upgrade,wheel,coin,dice,tower,hilo,rps,blackjack,memory,puzzle,codebreaker,ranking,history,rules,privileges,tiktok,albums,profile};$('#app').innerHTML=(S.route.startsWith('album/')?albums:routes[S.route]||home)();if(S.route==='rocket')updateRocket();if(S.route==='pvp')loadBattles();if(S.route==='upgrade')loadUpgradeTargets();if(albumRoute())loadAlbums();window.GiftMotion?.enter($('#app'),S.route)}
function navigate(){const dialog=S.upgradeOfferContext;if(dialog?.epoch===S.modalEpoch&&dialog.uid===S.state?.user.id)closeModal();S.route=location.hash.slice(1)||'home';S.collection=null;S.query='';S.filter='all';S.page=0;S.selected=null;clearUpgradeChoice();S.albumPage=0;render();window.scrollTo(0,0)}
function showModal(html){S.modalEpoch++;$('#modal-content').innerHTML=html;if(!$('#modal').open)$('#modal').showModal();window.GiftMotion?.dialog($('#modal-content'));return S.modalEpoch}
function closeModal(){S.modalEpoch++;$('#modal').close()}
function showGift(g,kind){if(kind==='catalog'&&g.model){showMarketGift(g);return}const owned=kind==='inventory';showModal(`<div class="modal-gift">${image(g)}<span class="rarity">${labels[g.rarity]}</span><h2>${esc(g.name)}</h2>${g.collection_name?`<p class="modal-note">${esc(g.collection_name)} · Редкость модели в Telegram: ${g.original_rarity_percent??'крафтовая'}${g.original_rarity_percent?'%':''}</p>`:''}${g.market?marketTraits(g.market):''}<p class="modal-note">Стоимость: ${fmt(g.value)} ✦</p><div class="modal-actions">${owned?g.status==='owned'?`<button class="primary" id="gift-play">Играть</button><button class="secondary" id="gift-sell">Обменять на ${fmt(Math.floor(g.value*.6))} ✦</button>`:'<span class="tag">Подарок уже участвует в игре</span>':`<button class="primary" id="gift-buy" ${S.state.user.stars<g.value?'disabled':''}>Купить за ${fmt(g.value)} ✦</button>`}</div></div>`);if(owned&&g.instance)$('#modal-content .modal-gift').insertAdjacentHTML('beforeend',`<button class="secondary full gift-share-button" data-share-kind="gift" data-share-instance="${esc(g.instance)}">Показать подарок друзьям ↗</button>`);if($('#gift-buy'))$('#gift-buy').onclick=async()=>{const r=await act('buy',{gift:g.id});if(r)winModal(r.gift,'Подарок в твоей коллекции!')};if($('#gift-sell'))$('#gift-sell').onclick=()=>{showModal(`<h2 class="modal-title">Обменять подарок?</h2><p class="modal-note">${esc(g.name)} исчезнет из инвентаря. Ты получишь ${fmt(Math.floor(g.value*.6))} звёзд.</p><button class="primary full mt" id="confirm-sell">Обменять</button>`);$('#confirm-sell').onclick=async()=>{if(await act('sell',{instance:g.instance}))closeModal()}};if($('#gift-play'))$('#gift-play').onclick=()=>{closeModal();location.hash='games'}}
function oddsHtml(c){return `<div class="odds">${c.odds.map((n,i)=>`<div class="odd"><strong>${Number(n).toLocaleString('ru-RU',{maximumFractionDigits:2})}%</strong><span>${labels[Object.keys(labels)[i]]}</span></div>`).join('')}</div>`}
function caseModal(id){const c=S.state.cases.find(x=>x.id===id);if(!c)return;showModal(`<div class="case-modal-hero ${c.color} ${c.theme?'themed-hero':''}">${c.theme?caseArtwork(c):'<img src="/art/premium-chest.webp" alt="">'}<span class="eyebrow">ПОДАРОК ВЫПАДЕТ САМ</span><h2 class="modal-title">${esc(c.name)}</h2></div><div class="case-open-bar"><button class="primary full" id="open-case" ${c.available===false||c.id==='daily'&&!c.remaining||c.price>S.state.user.stars&&!c.credits?'disabled':''}>${c.available===false?'Состав обновляется':c.credits?'Открыть бонусный кейс':c.price?'Открыть за '+fmt(c.price)+' ✦':'Открыть кейс'}</button><p>${c.id==='daily'?'Открытий сегодня: '+c.remaining:c.credits?'Бонусных кейсов: '+c.credits:'Один подарок за открытие'}${S.state.user.premium?' · Premium':''}</p></div><div class="case-price-band"><span class="eyebrow">СТОИМОСТЬ ВОЗМОЖНЫХ НАХОДОК</span><strong>${c.floor?fmt(c.floor)+(c.floor===c.ceiling?'':'–'+fmt(c.ceiling))+' ✦':'Рыночные цены обновляются'}</strong><small>Диапазон подбора: ${fmt(c.min_value)}–${fmt(c.max_value)} ✦ · Моделей: ${fmt(c.model_count||0)}</small></div>${c.theme?`<div class="case-collection-list"><span class="eyebrow">ТОЛЬКО ЭТИ КОЛЛЕКЦИИ</span><p>${c.collections.map(id=>esc(S.collections.find(x=>x.id===id)?.name||id)).join(' · ')}</p></div>`:''}<p class="modal-note">Модель, фон, символ и номер коллекционного подарка выпадают вместе. У обычных подарков этих параметров нет.</p>${oddsHtml(c)}<h3 class="case-content-heading">Подарки в этом кейсе</h3><div class="case-preview-grid">${caseHighlights(c).map(casePreview).join('')}</div>${c.available===false?'<p class="modal-note">Ждём свежие рыночные предложения в этом диапазоне. Звёзды не списываются.</p>':'<p class="modal-note">Примеры из текущего состава. Подарок выбирается автоматически.</p>'}<button class="secondary full" id="case-all-contents">Все модели и цены ↗</button><details class="case-details"><summary>Как выбирается подарок</summary><p>Сначала выбирается редкость по показанным шансам, затем модель внутри неё с одинаковой вероятностью. Фон, символ и номер выбираются вместе из оценённых предложений этой модели в диапазоне кейса. Цена открытия обновляется вместе с рыночным составом. Перед открытием проверяем цену, шансы и бонусные кейсы; если они изменились, показываем новые данные без списания звёзд.</p></details>`);$('#open-case').onclick=()=>openCase(c);$('#case-all-contents').onclick=()=>CasePrices.contents(c)}
async function openCase(c,attempt=0){
 const openingEpoch=S.modalEpoch,btn=$('#open-case');if(!btn||S.busy)return;btn.disabled=true;btn.textContent='Готовим открытие…';S.caseRequests??={};try{S.caseRequests[c.id]??=requestId()}catch(e){btn.disabled=false;btn.textContent='Попробовать снова';toast(e.message);return}
 const result=await act('case',{case:c.id,version:c.version,bonus:Boolean(c.credits)},{render:false,silent:true,requestKey:S.caseRequests[c.id]});
 if(openingEpoch!==S.modalEpoch){if(result){delete S.caseRequests[c.id];render();toast(result.message)}return}
 if(!result){
  if(S.lastErrorCode==='case_changed'){
   delete S.caseRequests[c.id];await refresh();if(openingEpoch!==S.modalEpoch||S.state.access?.required)return;
   const fresh=S.state.cases.find(x=>x.id===c.id);caseModal(c.id);
   if(attempt<1&&CasePrices.sameTerms(c,fresh)){
    toast('Обновили предложения. Цена, диапазон и шансы прежние — продолжаем открытие.');return openCase(fresh,attempt+1);
   }
   $('.case-open-bar').insertAdjacentHTML('afterbegin','<p class="notice" role="status">Данные кейса обновились. Звёзды не списаны. Проверь цену и шансы, затем подтверди открытие ещё раз.</p>');return;
  }
  if(S.lastError?.includes('Привилегия изменилась'))delete S.caseRequests[c.id];if(btn.isConnected){btn.disabled=false;btn.textContent='Попробовать снова'}return;
 }
 delete S.caseRequests[c.id];
 const epoch=showModal(`<span class="eyebrow">${esc(c.name)}</span><h2 class="modal-title">Ловим твою находку…</h2><div class="reel"><div class="reel-pointer"></div><div class="reel-track" id="reel-track"></div></div><p class="modal-note reveal-status">Подарок и его параметры уже выбраны.<br>Сейчас узнаем, что внутри ✦</p>`);
 const pool=[...(c.examples||[]),result.gift],list=Array.from({length:38},()=>pool[Math.floor(Math.random()*pool.length)]);list[30]=result.gift;
 $('#reel-track').innerHTML=list.map(g=>`<div class="reel-item ${g.rarity}">${image(g)}<span>${esc(g.name)}</span></div>`).join('');
 const reel=$('.reel'),track=$('#reel-track'),step=track.children[1].offsetLeft-track.children[0].offsetLeft;
 const target=()=>30*step+track.children[30].offsetWidth/2-reel.clientWidth/2;
 playSound('open');
 const finished=await GiftReel.play({track,target,step,duration:3600,valid:()=>S.modalEpoch===epoch,tick:()=>playSound('tick')});
 if(finished&&S.modalEpoch===epoch)winModal(result.gift,'Твоя новая находка!');render();
}
function winModal(g,title,bonusStars=0){playSound(g.rarity==='legendary'?'legendary':g.rarity==='epic'?'epic':'win');showModal(`<div class="modal-gift revealed reward-showcase" data-rarity="${esc(g.rarity)}"><div class="reward-aura" aria-hidden="true"></div><div class="reward-burst" aria-hidden="true">${Array.from({length:20},(_,i)=>`<i style="--i:${i};--c:${['#ffd685','#c8a6ff','#85e9bd'][i%3]}"></i>`).join('')}</div><span class="eyebrow">${esc(title)}</span>${image(g)}<span class="rarity">${labels[g.rarity]}</span><h2>${esc(g.name)}</h2>${g.collection_name?`<p class="modal-note">${esc(g.collection_name)}</p>`:''}${g.market?marketTraits(g.market):''}<p class="modal-note">${fmt(g.value)} звёзд · Уже в инвентаре</p>${bonusStars?`<p class="notice">+${fmt(bonusStars)} звёзд на баланс</p>`:''}${g.instance?`<button class="secondary full gift-share-button" data-share-kind="gift" data-share-instance="${esc(g.instance)}">Показать находку друзьям ↗</button>`:''}<button class="primary full mt" id="win-done">Отлично!</button></div>`);$('#win-done').onclick=closeModal;haptic('success')}
function updateRocket(){const r=S.state?.rocket;if(!r||S.route!=='rocket')return;const now=Date.now()/1000+(updateRocket.offset||0),elapsed=now-r.started;const mult=Math.exp(.18*Math.max(0,elapsed));$('#rocket-mult').textContent=elapsed<0?Math.ceil(-elapsed)+'…':'x'+mult.toFixed(2);$('#rocket-label').textContent=elapsed<0?'Приготовься!':'Успей забрать подарок';$('#rocket-button').disabled=elapsed<0||S.busy;$('#rocket-scene').classList.toggle('flying',elapsed>=0)}
async function loadBattles(){
 if(!S.state||S.busy||S.animating)return;
 const uid=S.state.user.id,version=S.actionVersion||0;
 if(loadBattles.running?.uid===uid&&loadBattles.running.version===version)return loadBattles.running.promise;
 const pending={uid,version};loadBattles.running=pending;
 pending.promise=(async()=>{try{
  const response=await api('battles');
  if(S.busy||S.animating||S.state?.user.id!==uid||(S.actionVersion||0)!==version)return;
  S.battles=response.battles;
  if(S.route==='pvp'&&$('#battles'))$('#battles').innerHTML=battleHtml();
 }catch(e){if(!S.busy&&!S.animating&&S.state?.user.id===uid&&(S.actionVersion||0)===version&&S.route==='pvp')toast(e.message)}})();
 try{await pending.promise}finally{if(loadBattles.running===pending)loadBattles.running=null}
}
function roundViewKey(state,route){const brain=state?.brain?.[route],r=brain?brain.active:route==='memory'?state?.memory?.active:state?.[route],end=brain?brain.last:route==='memory'?state?.memory?.last:state?.last_rounds?.[route];return JSON.stringify([r?.id,r?.step,r?.floor,r?.opened,r?.expired,end?.round||end?.id||end?.seed,brain?[brain.day,brain.attempts_remaining]:null,route==='memory'?[state?.memory?.day,state?.memory?.attempts_remaining,state?.memory?.prize_claimed]:null])}
function rewardViewKey(state,route){
 if(!['home','cases','tasks','pass','invite','privileges'].includes(route))return null;
 const u=state.user,benefits=[u.premium,u.premium_until,u.vip,u.vip_until,u.referrals,state.daily_rewards];
 const cases=()=>state.cases?.map(c=>[c.id,c.version,c.price,c.credits,c.remaining,c.available,c.floor,c.ceiling,c.odds,c.min_value,c.max_value,c.examples?.map(g=>[g.id,g.image,g.value])]);
 if(route==='cases')return JSON.stringify([benefits,cases()]);
 if(route==='pass')return JSON.stringify([benefits,state.season,u.level,u.xp,state.battle_pass]);
 if(route==='invite')return JSON.stringify([benefits,state.friend_rewards,state.vip_referral_claimed]);
 if(route==='privileges')return JSON.stringify([benefits,state.vip_daily_claimed,state.vip_referral_claimed]);
 if(route==='tasks')return JSON.stringify([benefits,state.tasks,state.daily_claimed,state.daily_streak,state.daily_missions,state.weekly_missions,state.channel_claimed,state.vip_referral_claimed]);
 return JSON.stringify([benefits,u.level,state.battle_pass?.levels,state.daily_claimed,state.daily_missions,state.weekly_missions,state.friend_rewards,state.album_summary,cases()]);
}
function clearUpgradeChoice(){
 S.upgradeGift=null;S.upgradeTarget=null;S.upgradeRows=null;S.upgradePending=null;S.upgradePage=0;
 S.upgradeEpoch=(S.upgradeEpoch||0)+1;
}
function reconcileUpgradeSource(before,next){
 if(!S.selected)return false;
 const old=before.inventory.find(g=>g.instance===S.selected),current=next.inventory.find(g=>g.instance===S.selected);
 if(current?.status==='owned'&&old?.status==='owned'&&current.value===old.value)return false;
 const dialog=S.upgradeOfferContext,ownDialog=dialog?.epoch===S.modalEpoch&&dialog.instance===S.selected&&dialog.uid===next.user.id;
 clearUpgradeChoice();if(current?.status!=='owned')S.selected=null;
 if(ownDialog)closeModal();
 return true;
}
async function refresh(){
 if(!S.state||S.busy||S.animating)return false;
 const uid=S.state.user.id,version=S.actionVersion||0;
 if(refresh.running){
  const pending=refresh.running;await pending.promise;
  if(pending.uid!==uid||pending.version!==version)return refresh();
  return pending.applied===true;
 }
 const pending={uid,version};refresh.running=pending;
 pending.promise=(async()=>{try{
  const before=S.state,next=await api('state');
  if(S.busy||S.animating||S.state?.user.id!==uid||(S.actionVersion||0)!==version)return;
  const upgradeSourceChanged=reconcileUpgradeSource(before,next);
  S.state=next;header();pending.applied=true;
  if(before.season!==next.season)S.passPage=Math.floor(Math.max(0,(next.user.level||0)-1)/5);
  if(next.access?.required){closeModal();render();return}
  if(next.rocket)updateRocket.offset=next.rocket.server_time-Date.now()/1000;
  const mode=S.route,roundChanged=['rocket','mines','tower','hilo','blackjack','memory','puzzle','codebreaker'].includes(mode)&&roundViewKey(before,mode)!==roundViewKey(next,mode);
  if(upgradeSourceChanged&&mode==='upgrade')toast(S.selected?'Стоимость твоего подарка обновилась. Выбери цель ещё раз.':'Выбранный подарок уже недоступен. Выбери другой.');
  if(roundChanged){
   if(S.lastRound?.mode===mode)S.lastRound=null;
   if(mode==='mines')S.mineEnd=null;
   if(mode==='rocket'&&before.rocket&&!next.rocket)toast('Полёт завершён. Результат — в истории.');
  }
  if(roundChanged||rewardViewKey(before,mode)!==rewardViewKey(next,mode)||albumRoute()||mode==='profile'||mode==='upgrade'&&(upgradeSourceChanged||JSON.stringify(before.inventory)!==JSON.stringify(next.inventory))||mode==='pvp'&&JSON.stringify(before.inventory)!==JSON.stringify(next.inventory))render();
  if(S.route==='pvp')await loadBattles();
 }catch{}})();
 try{await pending.promise;return pending.applied===true}finally{if(refresh.running===pending)refresh.running=null}
}
async function claimReward(action,data={}){
 const uid=S.state.user.id,route=S.route,epoch=S.modalEpoch,result=await act(action,data);
 if(result||!['day_changed','season_changed','week_changed','reward_claimed','privilege_changed'].includes(S.lastErrorCode))return result;
 const version=S.actionVersion||0;
 const current=()=>S.state.user.id===uid&&S.route===route&&S.modalEpoch===epoch&&(S.actionVersion||0)===version;
 if(!current())return null;
 const applied=await refresh();
 if(current()&&!S.state.access?.required)toast(applied?'Награды обновлены. Проверь доступные задания и бонусы.':'Не удалось обновить награды. Проверь соединение и повтори.');
 return null;
}
function rewardBoundaryDue(now=Date.now()){
 const due=value=>Number.isFinite(value)&&value>0&&now>=value*1000,u=S.state?.user;
 if(!u)return false;
 return due(S.state.daily_missions?.reset_at)||due(S.state.weekly_missions?.reset_at)||!!u.premium&&due(u.premium_until)||!!u.vip&&due(u.vip_until);
}
async function refreshPassiveView(){
 if(document.hidden||!S.state||S.busy||S.animating||$('#modal').open)return;
 const styleDue=S.state.profile?.styles?.some(s=>s.product&&s.available&&s.expires*1000<=Date.now());
 if(['home','cases','puzzle','codebreaker'].includes(S.route)||['tasks','pass','invite','privileges'].includes(S.route)&&rewardBoundaryDue()||styleDue)await refresh();
}
async function buyPremium(){return buyPrivilege('premium')}
async function buyPrivilege(pid){return window.GiftPayments.buy(pid)}
function vipBanner(){const u=S.state.user;return `<a href="#privileges" class="vip-banner"><div class="vip-emblem">♛</div><div><span class="eyebrow">VIP CLUB</span><h3>${u.vip?'Твой VIP активен':'Твоя коллекция заслуживает VIP'}</h3><p>${u.vip?'Ежедневный бонусный кейс ждёт тебя':'30 дней · за Stars или 20 активных друзей'}</p></div><span class="arrow">↗</span></a>`}
function vipReferralCard(){const u=S.state.user,count=Math.min(20,u.referrals);return `<section class="vip-referral-card"><span class="eyebrow">ДРУЗЬЯ ОТКРЫВАЮТ БОЛЬШЕ</span><h3>20 друзей — 30 дней VIP</h3><p>Друг становится активным после первого открытого кейса. Бонусы за 1, 5 и 10 друзей начислятся автоматически. За 20 друзей получишь VIP на 30 дней.</p><div class="progress"><span style="width:${count*5}%"></span></div><div class="referral-steps">${[[1,'1 кейс'],[5,'2 кейса'],[10,'Королевский'],[20,'30 дней VIP']].map(([n,label])=>`<div class="${u.referrals>=n?'done':''}"><b>${u.referrals>=n?'✓':n}</b><span>${label}</span></div>`).join('')}</div><div class="vip-referral-bottom"><b>${count} / 20 активных друзей</b><a href="#invite">${S.state.vip_referral_claimed?'✓ Награда выдана':'Пригласить ↗'}</a></div></section>`}
function profile(){return GiftProfile.render(S.state,S.config.products,S.profileTab)}
window.addEventListener('gift-profile-render',()=>{if(S.route==='profile')render()});
function privileges(){
 const u=S.state.user,products=S.config.products.filter(p=>!p.balance&&!p.style).sort((a,b)=>(a.id==='vip'?-1:1)),expiry=u.vip?new Date(u.vip_until*1000).toLocaleDateString('ru-RU',{timeZone:'Europe/Moscow'}):'';
 return heading('VIP и донаты','Звёзды на баланс, VIP и улучшенный батл-пасс.')+GiftPayments.cards()+`<a class="style-profile-link" href="#profile">✧ Темы, рамки, титулы и эффекты ↗</a><section class="vip-showcase"><div class="vip-showcase-art"><span>♛</span>${image(gift('diamond-ring'))}</div><div><span class="eyebrow">ТВОЙ СТАТУС · ТВОЙ СТИЛЬ</span><h2>${u.vip?'Добро пожаловать в VIP Club':'Больше, чем коллекция.'}</h2><p>${u.vip?'VIP активен до '+expiry:'VIP на 30 дней: заметный профиль и бонусный кейс каждый день.'}</p><div class="vip-profile-preview"><span class="vip-preview-avatar">${esc(u.name.charAt(0))}</span><div><strong>${esc(u.name)}</strong><span class="vip-pill">VIP</span><small>Золотая рамка и значок в профиле</small></div></div><button class="primary gold vip-hero-buy" data-buy-product="vip">${u.vip?'Продлить VIP':'Открыть VIP'} · 159 ★</button><a class="vip-invite-link" href="#invite">Или пригласи 20 активных друзей ↗</a></div></section><div class="privilege-grid">${products.map(p=>{const isVip=p.id==='vip',active=isVip?u.vip:u.premium;return `<article class="privilege-card ${isVip?'vip':'premium'}"><span class="tag">${isVip?'VIP CLUB':'PREMIUM PASS'} · ${p.days} ДНЕЙ</span><div class="privilege-art">${image(gift(isVip?'diamond-ring':'magic-potion'))}</div><h2>${esc(p.name)}</h2><ul>${(isVip?['Значок VIP и золотая рамка','1 кейс «Магия подарков» каждый день','Можно получить за 20 активных друзей']:['Дополнительная дорожка наград','3 ежедневных кейса вместо 1',fmt(S.state.daily_rewards?.premium||400)+' звёзд в день вместо '+fmt(S.state.daily_rewards?.base||200),'Повышенные шансы редкостей в кейсах']).map(x=>'<li>✦ '+x+'</li>').join('')}</ul><button class="primary ${isVip?'gold':''}" data-buy-product="${p.id}">${active?'Продлить':'Активировать'} <b>${p.price} ★</b></button>${active?`<p class="privilege-active">✓ Активен до ${new Date((isVip?u.vip_until:u.premium_until)*1000).toLocaleDateString('ru-RU',{timeZone:'Europe/Moscow'})}</p>`:''}${!isVip?'<a class="privilege-detail" href="#pass">Посмотреть награды →</a>':''}</article>`}).join('')}</div>${u.vip?`<section class="vip-daily-card"><div><span class="eyebrow">ЕЖЕДНЕВНЫЙ VIP-БОНУС</span><h3>Кейс «Магия подарков»</h3><p>Забирай каждый день, пока действует VIP.</p></div>${image(gift('magic-potion'))}<button class="primary gold" data-action="vip_daily" ${S.state.vip_daily_claimed?'disabled':''}>${S.state.vip_daily_claimed?'✓ Уже получен':'Забрать кейс'}</button></section>`:''}${vipReferralCard()}<div class="notice mt">Пакеты звёзд и привилегии оплачиваются настоящими Telegram Stars. VIP и Premium — отдельные покупки, срок каждой — 30 дней без автопродления. VIP за 20 друзей выдаётся один раз на 30 дней. Пакеты добавляют звёзды на баланс игры; вывода нет.</div>`;
}
document.addEventListener('click',e=>{const el=e.target.closest('[data-buy-product]');if(el)buyPrivilege(el.dataset.buyProduct)});

document.addEventListener('click',async e=>{const el=e.target.closest('button,[data-case]');if(!el)return;if(el.classList.contains('modal-close')){closeModal();return}if(S.busy||S.animating)return;if(el.dataset.case)caseModal(el.dataset.case);if(el.dataset.caseFilter){S.caseFilter=el.dataset.caseFilter;render()}if(el.dataset.action)await claimReward(el.dataset.action);if(el.dataset.task)await claimReward('task',{task:el.dataset.task});if(el.dataset.tier){const r=await claimReward('pass',{tier:Number(el.dataset.tier),track:el.dataset.track,season:S.state.season});if(r?.gift)winModal(r.gift,'Награда батл-пасса!',r.stars);else if(r?.case)passCaseReward(r)}if(el.dataset.filter){S.filter=el.dataset.filter;S.page=0;render()}if(el.dataset.resetFilters==='inventory'&&S.route==='inventory'){S.query='';S.filter='all';S.page=0;render()}if(el.dataset.page){S.page=Number(el.dataset.page);render();window.scrollTo(0,0)}if(el.hasAttribute('data-collection')){S.collection=el.dataset.collection;S.query='';S.filter='all';S.page=0;render();window.scrollTo(0,0)}if(el.dataset.gift){const kind=el.dataset.kind,g=kind==='catalog'?gift(el.dataset.gift):S.state.inventory.find(g=>g.instance===el.dataset.gift);if(!g)return;if(kind==='select'){if(g.status!=='owned'){toast('Этот подарок уже участвует в игре. Выбери другой.');return}if(S.selected!==g.instance)clearUpgradeChoice();S.selected=g.instance;render();focusGameControls()}else showGift(g,kind)}if(el.id==='rocket-button'){if(el.dataset.round){const r=await act('rocket_cashout',roundCommand('rocket_cashout',el));if(r?.gift)winModal(r.gift,'Успел забрать!',r.stars);else if(!r&&S.lastErrorCode==='round_changed'){await refresh();if(S.route==='rocket')render()}}else if(S.selected)await act('rocket_start',{instance:S.selected});else toast('Выбери подарок для ставки')}if(el.id==='create-battle'){if(S.selected)await act('pvp_create',{instance:S.selected});else toast('Выбери подарок для дуэли')}if(el.dataset.cancelBattle)await act('pvp_cancel',{battle:el.dataset.cancelBattle});if(el.dataset.joinBattle){const b=S.battles.find(b=>b.id===el.dataset.joinBattle),g=S.state.inventory.find(g=>g.instance===S.selected);if(!g){toast('Сначала выбери свой подарок ниже');return}const chance=g.value/(g.value+b.gift.value)*100;showModal(`<h2 class="modal-title">Участвовать в дуэли?</h2><div class="modal-gift">${image(b.gift)}<p>${esc(b.owner_name)} ставит ${esc(b.gift.name)}</p></div><p class="modal-note">Твоя ставка: ${esc(g.name)} (${fmt(g.value)} ✦)<br>Шанс твоей победы: <strong>${chance.toFixed(1)}%</strong>. При проигрыше подарок получает соперник.</p><button class="primary full mt" id="confirm-join">Участвовать</button>`);$('#confirm-join').onclick=async()=>{const r=await act('pvp_join',{battle:b.id,instance:g.instance});if(r)closeModal()}}if(el.id==='buy-premium')buyPremium();if(el.id==='copy-invite'){try{await navigator.clipboard.writeText(inviteLink());toast('Ссылка скопирована')}catch{toast('Скопируй ссылку из поля')}}if(el.id==='share-invite'){const link='https://t.me/share/url?url='+encodeURIComponent(inviteLink())+'&text='+encodeURIComponent('Собирай подарки со мной 🎁');tg?.openTelegramLink?tg.openTelegramLink(link):window.open(link,'_blank','noopener')}if(el.id==='history-button')location.hash='history';if(el.classList.contains('modal-close'))closeModal()});
document.addEventListener('input',e=>{if(e.target.id!=='search')return;S.query=e.target.value;S.page=0;const focus=e.target.selectionStart;render();$('#search').focus();try{$('#search').setSelectionRange(focus,focus)}catch{}});
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const r=$('#modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal()}});$('#modal').addEventListener('cancel',()=>S.modalEpoch++);
$('#balance').onclick=()=>GiftPayments.balance();
window.addEventListener('hashchange',navigate);
setInterval(()=>{if(!document.hidden&&!S.state?.access?.required)updateRocket()},100);setInterval(()=>{if(!document.hidden&&S.state&&!S.busy&&!S.animating&&!S.state.access?.required&&(S.state.rocket||S.route==='pvp'))refresh()},2500);setInterval(refreshPassiveView,30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&S.state)refresh()});
function rules(){return heading('Правила игры','Коротко о подарках, балансе и привилегии.')+`<div class="notice"><strong>Баланс и подарки.</strong><br>Подарки — виртуальные предметы внутри «Генератора подарков». Баланс «Телеграм звёзды» можно получать за вход, задания и друзей или пополнять пакетами за настоящие Telegram Stars. Перед оплатой показаны стоимость и количество звёзд на баланс. Он не является балансом Telegram Stars в твоём Telegram-аккаунте. Вывода, передачи настоящих подарков и обмена на деньги нет.</div><div class="notice"><strong>Альбомы.</strong><br>В альбоме считается каждая найденная модель один раз. Фон, символ и номер одного и того же подарка не дают дополнительный прогресс. После обмена или проигрыша отметка сохраняется. Награды за этапы выдаются один раз за всё время; подарок для получения награды отдавать не нужно.</div><div class="notice"><strong>Кейсы.</strong><br>Каждое открытие даёт один подарок. Шансы редкостей показаны перед открытием; внутри редкости все доступные модели имеют одинаковый шанс. В магазине доступны конкретные варианты с ценами предложений продавцов. Оценка в звёздах пересчитывается по курсу TON/USD и расчётному эквиваленту $0,013 за звезду; это не прямая цена Telegram-маркета. Проверка предложений — при открытии модели, кэш до 15 минут. Цена купленного экземпляра фиксируется. Подарки из кейсов получают случайный вариант из доступных предложений для выпавшей модели. Характеристики и оценка сохраняются в инвентаре. Если рыночные данные недоступны, открытие не списывает звёзды. У обычных подарков нет коллекционных характеристик; используется цена Telegram Bot API.</div><div class="notice"><strong>Покупки.</strong><br>Улучшенный батл-пасс оплачивается настоящими Telegram Stars и действует 30 дней. Автопродления нет. Он даёт дополнительные кейсы, награды и повышенные шансы в кейсах. VIP приобретается отдельно за 159 Telegram Stars или выдаётся за 20 активных друзей на 30 дней. Он даёт значок, золотую рамку и ежедневный кейс «Магия подарков». Награда за 20 друзей выдаётся один раз. Наборы оформления дают тему, рамку, титул и эффект на 30 дней. Повторная покупка продлевает тот же набор на 30 дней; игровые бонусы не добавляются. Стиль «Лёд» открывается за 20 кейсов, «Экипаж» — за 5 активных друзей. В игровых режимах привилегии не меняют исход. Покупка зачисляется после подтверждения Telegram. Заказ привязан к твоему аккаунту; при повторном подтверждении награда не дублируется. Поддержка покупок — /paysupport в боте, укажи номер заказа. Поддержку оказывает владелец игры.</div><div class="notice"><strong>Приглашения.</strong><br>300 звёзд за нового Telegram-игрока, который открыл один кейс. За одного друга награда выдаётся один раз. Пригласить себя нельзя.</div><div class="notice"><strong>Игры.</strong><br>Поставленный подарок можно потерять. В PvP шанс победы пропорционален стоимости подарков; победитель получает обе ставки. До прихода соперника дуэль можно отменить. В остальных режимах результат заменяет поставленный подарок. Если часть стоимости результата не помещается в подарок, она обменивается на баланс по тому же курсу 60%, что и подарок из инвентаря.</div>`}
function showBootFailure(error){
 const app=$('#app'),intro=app.querySelector('.seo-intro');
 const message=error instanceof TypeError||error instanceof SyntaxError?'Не удалось загрузить данные. Проверь соединение или открой игру через Telegram.':error.message;
 const markup=`<div class="empty boot-error"><h2>Не удалось открыть игру</h2><p>${esc(message)}</p><button class="primary" id="retry">Попробовать снова</button></div>`;
 if(intro){
  const current=intro.querySelector('.loading,.boot-error');
  if(current)current.outerHTML=markup;else intro.insertAdjacentHTML('beforeend',markup);
 }else app.innerHTML=markup;
 $('#retry').onclick=boot;
}
async function boot(){try{S.state=await api('state');[S.catalog,S.config]=await Promise.all([api('catalog').then(r=>{S.collections=r.collections;return r.gifts}),api('config')]);if(S.state.rocket)updateRocket.offset=S.state.rocket.server_time-Date.now()/1000;navigate();GiftPayments.check()}catch(e){showBootFailure(e)}}boot();

function marketTraits(q){return `<div class="gift-traits"><span>Номер<strong>#${fmt(q.number)}</strong></span><span>Модель<strong>${esc(q.model)}</strong></span><span>Фон<strong>${esc(q.backdrop)}</strong></span><span>Символ<strong>${esc(q.symbol)}</strong></span></div>`}
async function refreshMarketGift(g,notice=''){
 if(S.busy)return;
 const epoch=S.modalEpoch,uid=S.state.user.id;await refresh();
 if(epoch===S.modalEpoch&&S.state.user.id===uid)await showMarketGift(g,notice);
}
async function showMarketGift(g,notice=''){
 const uid=S.state.user.id,epoch=showModal(`<div class="modal-gift">${image(g)}<h2>${esc(g.name)}</h2><p class="modal-note">${esc(g.collection_name)}</p></div>${notice?`<p class="notice" role="status">${esc(notice)}</p>`:''}<div id="market-details"><p class="modal-note">Обновляем предложения продавцов…</p></div>`);
 try{
  const data=await api('market?gift='+encodeURIComponent(g.id));if(epoch!==S.modalEpoch||S.state.user.id!==uid)return;
  $('#market-details').innerHTML=`<p class="modal-note">Выбери вариант. Модель, фон, символ и номер относятся к конкретному предложению.</p><div class="market-offers">${data.offers.map(q=>`<div class="market-offer">${marketTraits(q)}<div class="offer-price"><strong>≈ ${fmt(q.value)} ✦</strong><button class="primary" data-market-buy="${esc(q.id)}" ${S.state.user.stars<q.value?'disabled':''}>Купить</button></div></div>`).join('')}</div>${!data.offers.length?`<div class="notice">${data.status==='no_listings'?'Предложений для этой модели сейчас нет.':esc(data.notice||'Цена недоступна.')}</div>`:''}<p class="modal-note">${data.offers.length?'Источник: Portals · Проверено '+new Date(data.checked_at*1000).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})+'<br>Оценка в звёздах по курсу. Подробнее — в правилах игры.':''}</p>`;
  $('#modal-content').querySelectorAll('[data-market-buy]').forEach(b=>b.onclick=async()=>{
   if(S.busy||epoch!==S.modalEpoch)return;const label=b.textContent;b.disabled=true;b.textContent='Покупаем…';
   const r=await act('buy',{gift:g.id,quote:b.dataset.marketBuy});if(epoch!==S.modalEpoch||S.state.user.id!==uid)return;
   if(r)winModal(r.gift,'Подарок в твоей коллекции!');
   else if(S.lastErrorCode==='market_changed')await refreshMarketGift(g,'Цена или вариант обновились. Звёзды не списаны. Выбери новое предложение.');
   else if(b.isConnected){b.disabled=false;b.textContent=label}
  });
 }catch(e){if(epoch===S.modalEpoch&&S.state.user.id===uid)$('#market-details').innerHTML=`<h2>Не удалось обновить цену</h2><p class="modal-note">${esc(e.message)}</p>`}
 if(epoch===S.modalEpoch&&S.state.user.id===uid){$('#market-details').insertAdjacentHTML('beforeend','<button class="secondary full mt" id="market-refresh">Обновить предложения</button>');const button=$('#market-refresh');button.onclick=async()=>{if(S.busy||button.disabled)return;button.disabled=true;try{await refreshMarketGift(g)}finally{if(button.isConnected)button.disabled=false}}}
}

function gameInventory(){return section('Выбери подарок')+`<div class="gift-grid">${S.state.inventory.filter(g=>g.status==='owned').map(g=>card(g,'select')).join('')}</div>`+(S.state.inventory.some(g=>g.status==='owned')?'':'<div class="empty">Нет свободных подарков. <a href="#cases">Открой кейс ↗</a></div>')}
function roundResult(){const r=S.lastRound?.mode===S.route?S.lastRound:S.state.last_rounds?.[S.route];if(!r||r.mode!==S.route)return '';return `<div class="round-result ${r.multiplier?'won':'lost'}"><strong>${r.multiplier?'Результат '+(['tower','hilo'].includes(S.route)?TowerGame.label(r.multiplier):'x'+r.multiplier.toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2})):'Подарок потерян'}</strong>${r.gift?`<div class="selected-gift">${image(r.gift)}<span>${esc(r.gift.name)} · ${fmt(r.gift.value)} ✦</span></div>`:''}${r.stars?`<p>+${fmt(r.stars)} звёзд</p>`:''}<details><summary>Проверка раунда</summary><p class="small-text">Seed: ${esc(r.seed)}<br>SHA-256: ${esc(r.commitment)}</p></details></div>`}
function coin(){return ChanceGames.coin(S,{heading,selectedHtml,roundResult,gameInventory})}
function dice(){return ChanceGames.dice(S,{heading,selectedHtml,roundResult,gameInventory})}
function tower(){return TowerGame.render(S,{heading,selectedHtml,roundResult,gameInventory,image,esc,fmt})}
function hilo(){return HiLoGame.render(S,{heading,selectedHtml,roundResult,gameInventory,image,esc,fmt})}
function rps(){return RpsGame.render(S,{heading,selectedHtml,roundResult,gameInventory,esc})}
function blackjack(){return BlackjackGame.render(S,{heading,selectedHtml,roundResult,gameInventory,image,esc,fmt})}
function memory(){return MemoryGame.render(S,{heading,image,gift,esc,fmt})}
function roundCommand(action,element){const data={round:element.dataset.round};if(action.startsWith('mines_'))data.step=Number(element.dataset.step);return data}
function mines(){const m=S.state.mines,end=m?null:S.mineEnd,opened=m?.opened||end?.opened||[],bombs=end?.bombs||[];return heading('Мины','Открывай безопасные клетки. Одна мина — подарок потерян.')+`<div class="mines-top"><strong>${m?'x'+m.multiplier.toFixed(3):'Поле 5 × 5'}</strong><span>${m?m.bomb_count+' мин · '+opened.length+' открыто':'Выбери количество мин'}</span></div><div class="mines-board">${Array.from({length:25},(_,i)=>`<button class="mine-cell ${opened.includes(i)?'opened':''} ${bombs.includes(i)?'bomb':''}" data-mine-tile="${i}" ${m?`data-round="${esc(m.id)}" data-step="${m.step}"`:""} ${!m||opened.includes(i)||S.busy?'disabled':''} aria-label="Клетка ${i+1}">${bombs.includes(i)?'💣':opened.includes(i)?'💎':'✦'}</button>`).join('')}</div><div class="game-controls"><div class="selected-gift">${m?image(m.gift)+'<span>'+esc(m.gift.name)+'</span>':selectedHtml()}</div>${m?`<button class="primary mint" data-newgame="mines_cashout" data-round="${esc(m.id)}" data-step="${m.step}" ${!opened.length?'disabled':''}>Забрать x${m.multiplier.toFixed(3)}</button>`:'<select class="search" id="mine-bombs" aria-label="Количество мин"><option value="3">3 мины</option><option value="5">5 мин</option><option value="7">7 мин</option><option value="10">10 мин</option></select><button class="primary" data-newgame="mines_start">Начать</button>'}</div>${m?"":roundResult()}<div class="notice">Больше открытых клеток — выше множитель. Поле хранится на сервере, выход из игры его не сбрасывает. Забрать можно после первой безопасной клетки. Кнопка «Забрать» завершает раунд.</div>${m?'<p class="small-text muted">Проверка поля: '+esc(m.commitment)+'</p>':gameInventory()}`}
const PLINKO_MULT=[10,4,2,1.2,.8,.6,.4,.6,.8,1.2,2,4,10];
function plinko(){return heading('Плинко','Выбери подарок и отправь шарик вниз.')+`<div class="plinko-board"><div class="plinko-ball" id="plinko-ball"></div>${Array.from({length:12},(_,row)=>`<div class="peg-row" style="top:${20+row*20}px">${Array.from({length:row+3},()=>'<i></i>').join('')}</div>`).join('')}<div class="plinko-slots">${PLINKO_MULT.map((m,i)=>`<span class="${i===S.lastRound?.slot&&S.lastRound?.mode==='plinko'?'hit':''}">x${m}</span>`).join('')}</div></div><div class="game-controls"><div class="selected-gift">${selectedHtml()}</div><button class="primary" data-newgame="plinko">Бросить шарик</button></div>${roundResult()}<div class="notice">12 шагов. На каждом шаге — равный шанс налево или направо. Множитель зависит от конечной ячейки; при x0,4–x0,8 результат меньше стоимости ставки. Подарок заменяется результатом, остаток стоимости обменивается на звёзды по курсу 60%.</div>${gameInventory()}`}
function wheel(){return heading('Колесо','Выбери подарок, крути и получай результат.')+`<div class="wheel-stage"><span class="wheel-pointer">▼</span><div class="wheel-disc" id="wheel-disc"><span>✦</span></div></div><div class="wheel-odds">${[[0,45],[.5,15],[1,15],[1.5,10],[2,8],[5,5],[10,2]].map(([m,p])=>`<span>x${m}<small>${p}%</small></span>`).join('')}</div><div class="game-controls"><div class="selected-gift">${selectedHtml()}</div><button class="primary gold" data-newgame="wheel">Крутить</button></div>${roundResult()}<div class="notice">При x0 подарок теряется. Результат определяется на сервере. Размер сектора соответствует его вероятности; привилегия их не меняет.</div>${gameInventory()}`}
function upgrade(){const source=S.state.inventory.find(g=>g.instance===S.selected&&g.status==='owned'),target=S.upgradeGift||gift(S.upgradeTarget),chance=source&&S.upgradeTarget&&target.value>source.value ? 0.9*source.value/target.value*100 : 0;const targetPage=source&&S.upgradeRows?.instance===source.instance&&S.upgradeRows.source_value===source.value?S.upgradeRows:null,targets=targetPage?.rows||[];return heading('Апгрейд','Попробуй обменять свой подарок на более дорогой.')+`<div class="upgrade-stage"><div>${source?image(source):'<span>🎁</span>'}<strong>${source?esc(source.name):'Твой подарок'}</strong></div><b>→</b><div>${S.upgradeTarget?image(target):'<span>✨</span>'}<strong>${S.upgradeTarget?esc(target.name):'Желаемый подарок'}</strong></div></div>${S.upgradeGift?.market?`<div class="upgrade-target-price"><span>Стоимость цели</span><strong>${fmt(target.value)} ✦</strong></div>${marketTraits(target.market)}`:''}<div class="upgrade-chance">${chance?chance.toFixed(2)+'%':'Выбери ставку и цель'}</div><div class="game-controls"><div class="selected-gift">${selectedHtml()}</div><button class="primary" data-newgame="upgrade" ${!chance?'disabled':''}>Улучшить</button></div>${roundResult()}<div class="notice">Шанс: 90% × стоимость твоего подарка ÷ стоимость цели. При неудаче ставка теряется. Цена цели и шанс показаны до запуска.</div>${gameInventory()}${source?section('Желаемый подарок')+`<div class="gift-grid">${targets.map(g=>`<button class="gift-card ${g.rarity} ${S.upgradeTarget===g.id?'selected':''}" data-upgrade-target="${esc(g.id)}">${image(g)}<h3>${esc(g.name)}</h3><div class="collection-name">${esc(g.collection_name||'')}</div><div class="gift-value">от ${fmt(g.min_value)} ✦</div></button>`).join('')}</div>${!targetPage?'<p class="notice">Подбираем цели по рыночным ценам…</p>':targetPage.error?`<div class="notice">${esc(targetPage.error)}</div><button class="secondary" data-upgrade-page="${S.upgradePage||0}">Повторить подбор</button>`:!targets.length?'<div class="notice">Сейчас нет оценённых моделей дороже твоей ставки. Рыночные предложения обновляются — попробуй другой подарок.</div>':''}${targetPage?.pages>1?`<div class="pagination"><button class="secondary" data-upgrade-page="${targetPage.page-1}" ${targetPage.page===0?'disabled':''}>←</button><span>${targetPage.page+1} / ${targetPage.pages}</span><button class="secondary" data-upgrade-page="${targetPage.page+1}" ${targetPage.page+1>=targetPage.pages?'disabled':''}>→</button></div>`:''}`:''}`}
async function animateRound(mode,r){
 S.animating=true;playSound('open');const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 try{
  if(mode==='coin'||mode==='dice')await ChanceGames.animate(S,mode,r,reduced);
  if(mode==='tower')await TowerGame.animate(S,r,reduced);
  if(mode==='hilo')await HiLoGame.animate(S,r,reduced);
  if(mode==='rps')await RpsGame.animate(S,r,reduced);
  if(mode==='blackjack')await BlackjackGame.animate(S,r,reduced);
  if(mode==='wheel'&&$('#wheel-disc')){
   const bounds=[0,45,60,75,85,93,98,100],center=(bounds[r.segment]+bounds[r.segment+1])/2*3.6;
   $('#wheel-disc').style.transform=`rotate(${1440-center}deg)`;if(!reduced)await pause(2300);
  }
  if(mode==='plinko'&&$('#plinko-ball')){
   const ball=$('#plinko-ball'),board=ball.parentElement,slots=board.querySelector('.plinko-slots'),slot=slots.children[r.slot];let x=0;
   if(!reduced)for(let i=0;i<r.path.length;i++){
    if(S.route!==mode||!ball.isConnected)break;
    x+=r.path[i]?1:-1;ball.style.transform=`translate(${x*(board.clientWidth-16)/26}px,${24+i*20}px)`;await pause(95);
   }
   if(S.route===mode&&ball.isConnected){
    const endX=slots.offsetLeft+slot.offsetLeft+slot.offsetWidth/2-board.clientWidth/2,endY=slots.offsetTop+slot.offsetTop+slot.offsetHeight/2-5;
    ball.style.transform=`translate(${endX}px,${endY}px)`;slot.classList.add('hit');if(!reduced)await pause(180);
   }
  }
 }finally{S.animating=false;playSound(r.draw?'tick':r.multiplier?'win':'open')}
}

document.addEventListener('click',async e=>{const el=e.target.closest('button');if(!el||S.animating||S.busy)return;if(el.hasAttribute('data-upgrade-page')){S.upgradePage=Math.max(0,Number(el.dataset.upgradePage));S.upgradeRows=null;render();return}if(el.hasAttribute('data-coin-choice')){S.coinChoice=el.dataset.coinChoice;render();return}if(el.hasAttribute('data-dice-choice')){S.diceChoice=el.dataset.diceChoice;render();return}if(el.hasAttribute('data-rps-choice')){S.rpsChoice=el.dataset.rpsChoice;render();return}if(el.dataset.upgradeTarget){await chooseUpgradeGift(gift(el.dataset.upgradeTarget));return}let action=el.dataset.newgame,data={};if(el.hasAttribute('data-mine-tile')){action='mines_reveal';data.tile=Number(el.dataset.mineTile)}if(el.hasAttribute('data-tower-tile')){action='tower_reveal';data.tile=Number(el.dataset.towerTile)}if(el.hasAttribute('data-hilo-choice')){action='hilo_reveal';data.choice=el.dataset.hiloChoice}if(!action)return;const mode=S.route;if(action==='mines_reveal'||action==='mines_cashout')Object.assign(data,roundCommand(action,el));if(action==='blackjack_hit'||action==='blackjack_stand'){data.round=el.dataset.round;data.step=Number(el.dataset.step)}if(action==='hilo_reveal'||action==='hilo_cashout'){data.round=el.dataset.round;data.step=Number(el.dataset.step)}if(action==='tower_reveal'||action==='tower_cashout'){data.round=el.dataset.round;data.floor=Number(el.dataset.floor)}if(['mines_start','plinko','wheel','upgrade','coin','dice','tower_start','hilo_start','rps','blackjack_start'].includes(action)){if(!S.selected){toast('Выбери подарок для игры');return}data.instance=S.selected;if(action==='coin')data.choice=ChanceGames.choice(S,'coin');if(action==='dice')data.choice=ChanceGames.choice(S,'dice');if(action==='rps'){data.choice=RpsGame.choice(S);data.previous=el.dataset.previous||null}if(action==='blackjack_start')data.previous=el.dataset.previous||null;if(action==='mines_start')data.bombs=Number($('#mine-bombs').value);if(action==='upgrade'){data.target=S.upgradeTarget;data.target_quote=S.upgradeGift?.market?.id}}const oldLabel=el.textContent;el.disabled=true;if(!el.hasAttribute('data-mine-tile')&&!el.hasAttribute('data-tower-tile'))el.textContent=action==='wheel'?'Крутим…':action==='plinko'?'Шарик в пути…':action==='coin'?'Подбрасываем…':action==='dice'?'Бросаем кости…':'Проверяем…';const r=await act(action,data,{render:false,silent:true});if(!r){if(el.isConnected){el.disabled=false;el.textContent=oldLabel}if(action==='upgrade'&&S.lastErrorCode==='market_changed'){await recoverUpgradePrice(data.instance,data.target);return;}if(S.lastErrorCode==='round_changed'){S.lastRound=null;await refresh();if(S.route===mode){render();if(mode==='tower'&&S.state.tower)TowerGame.focusFloor()}}return;}if(action==='mines_start'){S.mineEnd=null;S.lastRound=null}if(action==='tower_start'||action==='hilo_start'||action==='blackjack_start')S.lastRound=null;if(mode==='blackjack'&&!r.seed){S.animating=true;try{await BlackjackGame.animate(S,r,matchMedia('(prefers-reduced-motion: reduce)').matches);playSound('tick')}finally{S.animating=false}}if(mode==='hilo'&&r.reveal&&!r.seed){S.animating=true;try{await HiLoGame.animate(S,r,matchMedia('(prefers-reduced-motion: reduce)').matches);playSound('tick')}finally{S.animating=false}}if(mode==='tower'&&r.step&&!r.seed){S.animating=true;try{await TowerGame.animate(S,r,matchMedia('(prefers-reduced-motion: reduce)').matches);playSound('tick')}finally{S.animating=false}}if(r.seed){await animateRound(mode,r);S.lastRound={...r,mode};if(mode==='mines')S.mineEnd=r;S.selected=null;if(mode==='upgrade')clearUpgradeChoice()}if(S.route===mode){render();if(mode==='tower'&&S.state.tower)TowerGame.focusFloor()}toast(r.message)});

async function recoverUpgradePrice(instance,targetId){
 if(S.route!=='upgrade'||S.selected!==instance)return;
 const epoch=S.modalEpoch,uid=S.state.user.id;await refresh();
 if(S.route!=='upgrade'||S.selected!==instance||S.modalEpoch!==epoch||S.state.user.id!==uid)return;
 clearUpgradeChoice();render();
 const model=S.catalog.find(g=>g.id===targetId);if(model)await chooseUpgradeGift(model,'Предложение обновилось. Твой подарок сохранён. Выбери цель ещё раз — цена и шанс могут измениться.');
}
async function chooseUpgradeGift(g,notice=''){
 const source=S.state.inventory.find(x=>x.instance===S.selected&&x.status==='owned');if(!source)return;
 const sourceValue=source.value,uid=S.state.user.id,epoch=showModal(`<h2 class="modal-title">${esc(g.name)}</h2><p class="modal-note">Обновляем варианты для улучшения…</p>`);
 const generation=S.upgradeEpoch||0;S.upgradeOfferContext={epoch,uid,instance:source.instance};
 const valid=()=>S.route==='upgrade'&&generation===(S.upgradeEpoch||0)&&epoch===S.modalEpoch&&S.state.user.id===uid&&S.selected===source.instance&&S.state.inventory.some(x=>x.instance===source.instance&&x.status==='owned');
 try{
  const data=await api('market?gift='+encodeURIComponent(g.id));if(!valid()){if(epoch===S.modalEpoch&&S.state.user.id===uid){closeModal();render();toast('Выбранный подарок изменился. Выбери ставку ещё раз.')}return}
  if(S.state.inventory.find(x=>x.instance===source.instance).value!==sourceValue){await chooseUpgradeGift(g,'Стоимость твоего подарка обновилась. Проверь новый шанс.');return}
  const offers=data.offers.filter(q=>q.value>sourceValue);
  $('#modal-content').innerHTML=`<h2 class="modal-title">${esc(g.name)}</h2>${notice?`<p class="notice" role="status">${esc(notice)}</p>`:''}<p class="modal-note">Выбери фон, символ и номер. Шанс рассчитан по стоимости твоей ставки.</p>${offers.map(q=>`<div class="market-offer">${marketTraits(q)}<div class="offer-price"><strong>${fmt(q.value)} ✦ · ${(90*sourceValue/q.value).toFixed(2)}%</strong><button class="primary" data-upgrade-quote="${esc(q.id)}">Выбрать</button></div></div>`).join('')}${!offers.length?'<div class="notice">Нет подходящих вариантов дороже твоего подарка. Выбери другую модель.</div>':''}`;
  $('#modal-content').querySelectorAll('[data-upgrade-quote]').forEach(b=>b.onclick=()=>{
   if(S.busy||!valid())return;const current=S.state.inventory.find(x=>x.instance===source.instance);
   if(current.value!==sourceValue){chooseUpgradeGift(g,'Стоимость твоего подарка обновилась. Проверь новый шанс.');return}
   const q=offers.find(q=>q.id===b.dataset.upgradeQuote);
   S.upgradeGift={...g,value:q.value,market:q,backdrop:q.backdrop,symbol:q.symbol,number:q.number,model_image:g.image,image:q.media_id?'/gift-media/'+q.media_id+'.img':g.image};S.upgradeTarget=g.id;closeModal();render();focusGameControls();
  });
 }catch(e){if(valid())$('#modal-content').innerHTML=`<h2 class="modal-title">Цена недоступна</h2><p class="modal-note">${esc(e.message)}</p>`}
 if(valid()){$('#modal-content').insertAdjacentHTML('beforeend','<button class="secondary full mt" id="upgrade-market-refresh">Обновить предложения</button>');const button=$('#upgrade-market-refresh');button.onclick=async()=>{if(S.busy||button.disabled)return;button.disabled=true;try{await refresh();if(valid())await chooseUpgradeGift(g,notice)}finally{if(button.isConnected)button.disabled=false}}}
}

document.addEventListener('click',e=>{
 const el=e.target.closest('button');if(!el)return;
 if(el.hasAttribute('data-pass-page')){S.passPage=GiftPass.page(Number(el.dataset.passPage),S.state.battle_pass.levels);render();GiftPass.syncNavigation(S);GiftPass.jump(S.passPage*5+1)}
 if(el.hasAttribute('data-pass-jump'))$('#pass-rewards')?.scrollIntoView({behavior:'smooth',block:'start'});
});

function friendRewards(){return GiftFriends.render(S.state,{esc,fmt,image,gift})}

function loginStreak(){
 const n=S.state.daily_streak||0,cycle=n?Math.floor((n-1)/7):0,current=n-cycle*7,claimed=S.state.daily_claimed;
 const reset=S.state.daily_missions?.reset_at,next=Number.isFinite(reset)?new Date(reset*1000).toLocaleDateString('ru-RU',{day:'numeric',month:'long',timeZone:'Europe/Moscow'}):'завтра';
 const position=n%7,target=position<3?3:7,remaining=target-position,bonus=target===3?'Магия подарков':'Королевский';
 return `<section class="login-streak"><div><span class="eyebrow">ЗАБИРАЙ НАГРАДУ КАЖДЫЙ ДЕНЬ</span><h2>Твоя серия: ${n} ${n===1?'день':'дн.'}</h2><p>День засчитывается после получения ежедневной награды. На 3-й день — ${S.state.daily_rewards?.magic_cases||1} кейса «Магия подарков», на 7-й — ${S.state.daily_rewards?.royal_cases||1} кейса «Королевский». Пропущенная награда сбрасывает серию. Новый день начинается в 00:00 МСК.</p><p class="streak-status" role="status">${claimed?'Сегодня награда получена. Следующая — '+next+' в 00:00 МСК.':'Награда сегодня доступна. Забери её, чтобы '+(n?'продолжить':'начать')+' серию.'}</p></div><div class="streak-days">${Array.from({length:7},(_,i)=>`<div class="${i<current?'done':''}"><small>День ${i+1}</small>${i===2||i===6?`<img src="/art/premium-chest.webp" alt="Кейс ${i===2?'Магия подарков':'Королевский'}" class="${i===6?'gold':''}">`:'<span>✦</span>'}<b>${i<current?'✓':i===2?(S.state.daily_rewards?.magic_cases||1)+' кейса':i===6?(S.state.daily_rewards?.royal_cases||1)+' кейса':(S.state.user.premium?(S.state.daily_rewards?.premium||400):(S.state.daily_rewards?.base||200))+' ✦'}</b></div>`).join('')}</div><p>Следующий бонус: «${bonus}» · ещё ${remaining} ${remaining===1?'награда дня':remaining<5?'награды дня':'наград дня'}.</p><button class="primary mint" data-action="daily" ${claimed?'disabled':''}>${claimed?'Сегодня получено':'Забрать награду дня'}</button></section>`;
}

function homePromotions(){return `<section class="home-promotions">${GiftFriends.homeCard(S.state,{esc,fmt,image,gift})}<a href="#tiktok" class="promo-card tiktok"><div class="promo-art"><img src="/art/premium-chest.webp" alt="Кейс за TikTok"><span class="tiktok-note">♪</span></div><span class="eyebrow">ПОКАЖИ СВОЮ НАХОДКУ</span><h2>Кейсы за TikTok</h2><p>Запиши игру с личным кодом, опубликуй видео и пришли ссылку на проверку.</p><strong>${S.state.promo?.enabled?'1 подтверждённый ролик → 1 кейс':'Личный код и режим записи'}</strong><span class="promo-cta">Записать свою находку ↗</span></a></section>`}

function tiktok(){return GiftPromotions.render(S.state,!!S.recording,S.promoDraft,{heading,esc})}

function passCaseReward(r){
 const c=S.state.cases.find(c=>c.id===r.case);if(!c)return;
 showModal(`<span class="eyebrow">НАГРАДА БАТЛ-ПАССА</span><h2 class="modal-title">${esc(c.name)}</h2><div class="bp-case-prize"><img src="/art/premium-chest.webp" alt="Кейс"><strong>+${r.case_amount}</strong></div><p class="modal-note">Бонусные открытия уже в разделе «Кейсы». За эти открытия звёзды не списываются.</p><button class="primary full mt" id="pass-open-case">Открыть кейс →</button>`);
 $('#pass-open-case').onclick=()=>caseModal(r.case);playSound('win');
}

async function loadUpgradeTargets(){
 const source=S.state.inventory.find(g=>g.instance===S.selected&&g.status==='owned');if(!source||S.route!=='upgrade')return;
 const uid=S.state.user.id,version=S.actionVersion||0,generation=S.upgradeEpoch||0,value=source.value,page=S.upgradePage||0;
 const key=JSON.stringify([uid,version,generation,source.instance,value,page]);
 if(S.upgradePending?.key===key||S.upgradeRows?.instance===source.instance&&S.upgradeRows.source_value===value&&S.upgradeRows.page===page)return;
 const pending={key};S.upgradePending=pending;
 const valid=()=>S.upgradePending===pending&&S.route==='upgrade'&&S.state.user.id===uid&&(S.actionVersion||0)===version&&(S.upgradeEpoch||0)===generation&&S.selected===source.instance&&(S.upgradePage||0)===page&&S.state.inventory.some(g=>g.instance===source.instance&&g.status==='owned'&&g.value===value);
 try{
  const data=await api('upgrade-targets?instance='+encodeURIComponent(source.instance)+'&page='+page);
  if(!valid())return;
  if(data.instance!==source.instance||data.source_value!==value||data.page!==page)throw new Error('Подарок или его стоимость обновились. Повтори подбор целей.');
  S.upgradeRows=data;render();
 }catch(e){if(valid()){S.upgradeRows={instance:source.instance,source_value:value,page,rows:[],error:e.message};render()}}
 finally{if(S.upgradePending===pending)S.upgradePending=null}
}


function bonusCases(){
 const cases=S.state.cases.filter(c=>c.credits>0);if(!cases.length)return '';
 return `<section class="bonus-cases"><div class="bonus-cases-heading"><div><span class="eyebrow">ОТКРЫВАЙ И СОБИРАЙ</span><h2>Кейсы уже твои</h2></div><strong>${cases.reduce((sum,c)=>sum+c.credits,0)} <small>открытий</small></strong></div><p>Бонусные открытия без списания звёзд. Выбери кейс и забери подарок.</p><div class="bonus-case-grid">${cases.map(c=>`<button class="bonus-case-card ${c.color}" data-case="${c.id}"><span class="bonus-case-count">×${c.credits}</span><img src="/art/premium-chest.webp" alt=""><h3>${esc(c.name)}</h3><span>Открыть →</span></button>`).join('')}</div></section>`;
}

function syncRecording(){const enabled=!!S.recording&&!!S.state?.promo?.code&&!S.state.user.demo&&!S.state.access?.required;S.recording=enabled;for(const id of ['recording-ribbon','recording-modal-label']){const label=$('#'+id);if(label){label.classList.toggle('active',enabled);label.innerHTML=GiftPromotions.badge(S.state.promo,enabled,esc)}}}
document.addEventListener('input',e=>{if(e.target.id==='promo-url')S.promoDraft=e.target.value});
document.addEventListener('input',e=>{if(e.target.id!=='album-search')return;S.albumQuery=e.target.value;S.albumPage=0;const position=e.target.selectionStart;render();const field=$('#album-search');field?.focus();try{field?.setSelectionRange(position,position)}catch{}});
document.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b||S.busy||S.animating||!albumRoute())return;
 if(b.hasAttribute('data-album-filter')){S.albumFilter=b.dataset.albumFilter;S.albumPage=0;render()}
 if(b.hasAttribute('data-album-model-filter')){S.albumModelFilter=b.dataset.albumModelFilter;S.albumPage=0;render()}
 if(b.hasAttribute('data-album-page')){S.albumPage=Math.max(0,Number(b.dataset.albumPage));render();$('#app .album-toolbar, #app .album-model-grid')?.scrollIntoView({block:'start',behavior:'instant'})}
 if(b.hasAttribute('data-album-retry')){S.albumCache?.delete(S.route);render()}
 if(b.dataset.albumClaim){
  b.disabled=true;b.textContent='Получаем…';const result=await act('album_claim',{album:b.dataset.albumClaim,target:Number(b.dataset.albumTarget)},{render:false,silent:true});
  if(S.albumCache)for(const entry of S.albumCache.values()){
   entry.created=0;
   if(result&&entry.data){for(const album of entry.data.albums)if(album.id===result.album)for(const stage of album.stages)if(stage.target===result.target){stage.claimed=true;stage.ready=false}}
  }
  render();
  if(result){playSound('win');toast(result.message);haptic('success')}
 }
});
document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b||S.busy||S.animating)return;if(b.hasAttribute('data-promo-code')){b.disabled=true;const result=await act('promo_code',{}, {render:false});render();if(result)$('#app [data-promo-record]')?.focus()}if(b.hasAttribute('data-promo-copy')){try{await navigator.clipboard.writeText(S.state.promo.code);toast('Личный код скопирован')}catch{toast('Скопируй код из карточки')}}if(b.hasAttribute('data-promo-record')){S.recording=!S.recording;render();toast(S.recording?'Режим записи включён. Включи запись экрана на телефоне':'Режим записи выключен')}if(b.dataset.promoRetry){b.disabled=true;await act('promo_retry',{job:b.dataset.promoRetry});render()}});
document.addEventListener('submit',async e=>{if(e.target.id!=='promo-submit-form')return;e.preventDefault();if(S.busy||!S.state.promo?.enabled)return;const url=$('#promo-url').value.trim();S.promoDraft=url;const b=e.target.querySelector('button');b.disabled=true;b.textContent='Отправляем…';const result=await act('promo_submit',{url},{render:false});if(result)S.promoDraft='';render()});
setInterval(async()=>{if(document.hidden||S.busy||S.animating||S.route!=='tiktok'||!S.state?.promo?.jobs?.some(j=>['queued','checking','retry'].includes(j.status)))return;const version=S.actionVersion||0;try{const p=await api('promo');if(S.busy||(S.actionVersion||0)!==version)return;const newlyVerified=p.jobs.some(j=>j.status==='verified'&&!S.state.promo.jobs.some(old=>old.id===j.id&&old.status==='verified'));S.state.promo=p;const jobs=$('.promo-jobs');if(jobs)jobs.innerHTML='<h3>Твои публикации</h3>'+GiftPromotions.jobs(p,esc);if(newlyVerified){toast('Кейс за TikTok добавлен!');await refresh()}}catch{}},5000);

function inviteCard(){return `<section class="invite-share-card"><span aria-hidden="true">✦</span><div><h3>Покажи игру друзьям</h3><p>Карточка с подарками, ссылкой и QR-кодом для приглашения.</p><button class="primary" data-share-kind="invite">Сделать карточку ↗</button></div></section>`}
