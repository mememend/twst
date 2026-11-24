'use strict';
window.CasePrices={
 sameTerms(before,after){
  if(!after||after.available===false||after.id!==before.id||after.id==='daily'&&!after.remaining)return false;
  const cost=c=>c.credits?0:c.price;
  return cost(before)===cost(after)&&Boolean(before.credits)===Boolean(after.credits)&&before.min_value===after.min_value&&before.max_value===after.max_value&&before.floor===after.floor&&before.ceiling===after.ceiling&&JSON.stringify(before.odds)===JSON.stringify(after.odds);
 },
 async contents(c,page=0,version=null){
  const epoch=showModal(`<h2 class="modal-title">${esc(c.name)}</h2><p class="modal-note">Загружаем состав кейса…</p>`);
  try{
   const data=await api('case-contents?case='+encodeURIComponent(c.id)+'&page='+page+(version?'&version='+encodeURIComponent(version):''));if(epoch!==S.modalEpoch)return;page=data.page;
   $('#modal-content').innerHTML=`<span class="eyebrow">СОСТАВ КЕЙСА</span><h2 class="modal-title">${esc(c.name)}</h2><p class="modal-note">Моделей в текущем составе: ${fmt(data.total)}. Подарок и его параметры выпадают автоматически.</p><div class="case-preview-grid contents-grid">${data.rows.map(g=>`<article class="case-preview ${g.rarity}">${image(g)}<h3>${esc(g.name)}</h3><span>${esc(g.collection_name||labels[g.rarity])}</span><strong>${fmt(g.min_value)}${g.min_value===g.max_value?'':'–'+fmt(g.max_value)} ✦</strong><small>Шанс модели: ${g.chance.toLocaleString('ru-RU',{maximumFractionDigits:4})}%</small></article>`).join('')}</div>${!data.total?'<div class="notice">Рыночные данные для этого диапазона обновляются. Открытие пока недоступно.</div>':''}<div class="pagination"><button class="secondary" data-contents-page="${page-1}" ${page===0?'disabled':''}>←</button><span>${page+1} / ${data.pages}</span><button class="secondary" data-contents-page="${page+1}" ${page+1>=data.pages?'disabled':''}>→</button></div><button class="primary full mt" id="back-to-case">Вернуться к кейсу</button>`;
   $('#back-to-case').onclick=()=>caseModal(c.id);$('#modal-content').querySelectorAll('[data-contents-page]').forEach(b=>b.onclick=()=>CasePrices.contents(c,Number(b.dataset.contentsPage),data.version));
  }catch(e){if(epoch!==S.modalEpoch)return;$('#modal-content').innerHTML=`<h2 class="modal-title">${e.code==='case_contents_changed'?'Состав обновился':'Состав недоступен'}</h2><p class="modal-note">${esc(e.message)}</p><button class="primary full mt" id="reload-contents">Обновить список</button>`;$('#reload-contents').onclick=()=>CasePrices.contents(c)}
 }
};
