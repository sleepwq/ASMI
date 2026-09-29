(function(){
'use strict';
/* ---------- utilidades ---------- */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const ic=(id,cls='')=>`<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}).replace(/\u00a0/g,' ');
const pct1=n=>n.toFixed(1).replace('.',',');
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let toastT;
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2600)}

/* ---------- tema ---------- */
function applyTheme(t){const r=document.documentElement;if(t==='dark'||t==='light')r.setAttribute('data-theme',t);else r.removeAttribute('data-theme')}
applyTheme(store.get('asmi.theme'));
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-theme-toggle]');if(!b)return;
  const cur=document.documentElement.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  const next=cur==='dark'?'light':'dark';applyTheme(next);store.set('asmi.theme',next);
});

/* ---------- dados ---------- */
const SUBJ={mat:'Matemática',por:'Português',his:'História',fis:'Física',bio:'Biologia',qui:'Química',geo:'Geografia',edf:'Educação Física',ing:'Inglês'};
const ABBR={mat:'Mat.',por:'Port.',his:'Hist.',fis:'Fís.',bio:'Bio.',qui:'Quím.',geo:'Geo.',edf:'Ed. Fís.',ing:'Inglês'};
const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const PLAT={classroom:{n:'Google Classroom',c:'#10b981'},moodle:{n:'Moodle',c:'#f97316'},teams:{n:'Microsoft Teams',c:'#4f46e5'}};
const PALETTE=['#3b82f6','#ef4444','#f59e0b','#10b981','#8b5cf6'];
const S={
  user:null, chat:[],
  cal:{month:new Date(2026,9,1),
    cats:[{id:'prova',name:'Semana de prova',color:'#3b82f6'},{id:'externa',name:'Provas externas',color:'#ef4444'}],
    days:{'2026-10-05':'prova','2026-10-06':'prova','2026-10-07':'prova','2026-10-08':'prova','2026-10-15':'externa'}},
  sched:{hours:['07:00','08:00','09:00','10:00','11:00'],grid:{
    '07:00':['mat','fis','qui','bio','geo'],'08:00':['mat','por','qui','his','geo'],'09:00':null,
    '10:00':['por','bio','ing','fis','mat'],'11:00':['his','edf','ing','por','qui']}},
  nFilter:'all',
  notifs:[
    {id:1,plat:'classroom',title:'Trabalho de Matemática - Funções Quadráticas',status:'pend',due:'Entrega: 20 Out 2026, 23:59'},
    {id:2,plat:'moodle',title:'Quiz de História - Era Vargas e a Nova Constituição',status:'done',due:'Entrega: 22 Out 2026, 14:00'},
    {id:3,plat:'teams',title:'Entrega de Relatório - Laboratório de Física',status:'late',due:'Atrasado por: 1 dia'},
    {id:4,plat:'classroom',title:'Resenha Crítica - Dom Casmurro (Português)',status:'pend',due:'Entrega: 25 Out 2026, 10:00'},
    {id:5,plat:'teams',title:'Reunião de Orientação - Trabalho em Grupo Geografia',status:'done',due:'Concluído'}
  ].map(n=>({...n,orig:n.status})),
  fin:{
    saldo:14850.20,receitas:8420.00,despesas:3840.40,economia:4579.80,savedPct:54.3,
    flow:[9800,11200,10500,13100,13900,14850.20],
    cats:[
      {name:'Habitação & Aluguel',spent:1800,limit:2000,color:'#4f46e5'},
      {name:'Alimentação',spent:942,limit:1200,color:'#f59e0b'},
      {name:'Transporte & Mobilidade',spent:380,limit:500,color:'#10b981'},
      {name:'Lazer & Viagens',spent:520,limit:600,color:'#ef4444'},
      {name:'Outros Gastos',spent:198,limit:400,color:'#9c9894'}],
    txs:[
      {name:'Salário Contra Labs',cat:'Salário & Renda',when:'Ontem',val:8420,type:'in'},
      {name:'Supermercado Zona Sul',cat:'Alimentação',when:'26 Out',val:342.10,type:'out'},
      {name:'Assinatura Netflix',cat:'Serviços & Streaming',when:'25 Out',val:55.90,type:'out'},
      {name:'Academia SmartFit',cat:'Saúde & Bem-estar',when:'20 Out',val:119.90,type:'out'},
      {name:'Transferência de Poupança',cat:'Investimentos',when:'18 Out',val:1500,type:'in'}],
    older:[
      {name:'Farmácia Central',cat:'Saúde & Bem-estar',when:'15 Out',val:86.40,type:'out'},
      {name:'Corrida de aplicativo',cat:'Transporte & Mobilidade',when:'12 Out',val:27.80,type:'out'},
      {name:'Cinema',cat:'Lazer & Viagens',when:'10 Out',val:64.00,type:'out'}],
    showAll:false,
    goals:[
      {name:'Reserva de Emergência',when:'Dez 2026',cur:15000,target:20000,icon:'shield'},
      {name:'Viagem para Europa',when:'Jul 2027',cur:4500,target:15000,icon:'globe'}]
  }
};
const dkey=(y,m,d)=>y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
const monthCells=(base)=>{const y=base.getFullYear(),m=base.getMonth();const off=new Date(y,m,1).getDay();const dim=new Date(y,m+1,0).getDate();const total=Math.ceil((off+dim)/7)*7;const out=[];
  for(let i=0;i<total;i++){const dt=new Date(y,m,1-off+i);out.push({y:dt.getFullYear(),m:dt.getMonth(),d:dt.getDate(),out:dt.getMonth()!==m})}return out};

/* ---------- roteamento ---------- */
const PAGES=['assistente','calendario','notificacoes','financas'];
const TITLES={assistente:'Assistente ASMI',calendario:'Meu calendário',cronograma:'Cronograma Escolar',notificacoes:'Notificações',financas:'Finanças',login:'Entrar'};
let current='login';
function go(r){if(location.hash==='#/'+r)route();else location.hash='#/'+r}
function route(){
  let r=(location.hash||'').replace(/^#\/?/,'').split('?')[0];
  if(!S.user)r='login';
  else if(!r||r==='login'||!(PAGES.includes(r)||r==='cronograma'))r='assistente';
  current=r;
  closeModal(true);
  $('#v-login').hidden=r!=='login';
  $('#v-app').hidden=r==='login';
  const pg=r==='cronograma'?'assistente':r;
  document.body.dataset.page=r==='login'?'login':pg;
  PAGES.forEach(p=>$('#page-'+p).hidden=p!==pg);
  document.title='ASMI — '+TITLES[r];
  if(r!=='login'){renderRail();renderPage(pg);if(r==='cronograma')openSchedule();window.scrollTo(0,0)}
  else{window.scrollTo(0,0)}
}
window.addEventListener('hashchange',route);

/* ---------- barra lateral ---------- */
function railItem(o){
  const tag=o.href?'a':'button';
  return `<${tag} class="rail-i ${o.on?'on':''}" ${o.href?`href="${o.href}"`:'type="button"'} ${o.attr||''} ${o.on?'aria-current="page"':''}><span class="rail-ic">${ic(o.icon)}</span><span>${o.label}</span></${tag}>`;
}
let finSub='visao';
function renderRail(){
  const p=current;
  const fin=p==='financas';
  const main=[
    {label:'Calendário',icon:'calendar',href:'#/calendario',on:p==='calendario'},
    {label:'Cronograma',icon:'gantt',href:'#/cronograma',on:p==='cronograma'},
    {label:'Finanças',icon:'wallet',href:'#/financas',on:fin},
    {label:'Notificações',icon:'bell',href:'#/notificacoes',on:p==='notificacoes'}];
  const sub=[
    {label:'Visão Geral',icon:'layout',key:'visao'},{label:'Transações',icon:'up-right',key:'transacoes'},
    {label:'Planejamento',icon:'pie',key:'planejamento'},{label:'Metas',icon:'award',key:'metas'}]
    .map(s=>railItem({...s,on:finSub===s.key,attr:`data-sub="${s.key}"`})).join('');
  $('#rail').innerHTML=`
    <button class="rail-profile" type="button" id="profile-btn" aria-haspopup="true" aria-expanded="false"><span class="avatar">${ic('user')}</span>Meu perfil</button>
    <div class="rail-nav">
      ${fin?sub+'<div class="rail-sep" role="separator"></div>':''}
      ${main.map(railItem).join('')}
    </div>
    <div class="rail-bottom">
      <button class="rail-help" type="button" id="help-btn" aria-label="Ajuda">${ic('help')}</button>
      ${fin?railItem({label:'Sair',icon:'logout',attr:'id="logout-btn"'}):''}
    </div>`;
}
document.addEventListener('click',e=>{
  const sub=e.target.closest('[data-sub]');
  if(sub){finSub=sub.dataset.sub;renderRail();const el=$('#sec-'+finSub);if(el){el.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});if(finSub!=='visao'){el.classList.remove('hl');void el.offsetWidth;el.classList.add('hl')}}return}
  if(e.target.closest('#logout-btn')||e.target.closest('#pop-logout')){logout();return}
  if(e.target.closest('#help-btn')){openHelp();return}
  const pb=e.target.closest('#profile-btn');
  if(pb){togglePop(pb);return}
  if(!e.target.closest('#pop'))closePop();
});
function togglePop(btn){
  if($('#pop')){closePop();return}
  const d=document.createElement('div');d.className='pop';d.id='pop';
  d.innerHTML=`<div><b>${esc(S.user.name||'Minha conta')}</b><span>${esc(S.user.email)}</span></div><button class="btn btn-outline btn-sm" type="button" id="pop-logout">${ic('logout','ic-2')}Sair</button>`;
  document.body.appendChild(d);btn.setAttribute('aria-expanded','true');
}
function closePop(){const p=$('#pop');if(p)p.remove();const b=$('#profile-btn');if(b)b.setAttribute('aria-expanded','false')}

/* ---------- login ---------- */
let signup=false;
function setMode(s){
  signup=s;
  $('#login-title').textContent=s?'Criar conta':'Entrar';
  $('#login-submit').textContent=s?'Criar conta':'Entrar';
  $('#google-label').textContent=s?'Cadastrar com Google':'Entrar com Google';
  $('#switch-text').textContent=s?'Já tem uma conta?':'Não tem uma conta?';
  $('#switch-mode').textContent=s?'Entrar':'Cadastre-se';
  $('#f-name').hidden=!s;
  $('#forgot').hidden=s;
  $('#in-pass').autocomplete=s?'new-password':'current-password';
  clearErrs();
}
function clearErrs(){['name','email','pass'].forEach(k=>{const e=$('#err-'+k);if(e)e.textContent=''});$('#w-email').classList.remove('bad');$('#w-pass').classList.remove('bad')}
const validEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
function enter(email,name){
  S.user={email,name:name||''};
  if($('#in-keep').checked)store.set('asmi.user',JSON.stringify(S.user));
  go('assistente');
}
function logout(){closePop();S.user=null;S.chat=[];store.del('asmi.user');$('#in-pass').value='';go('login')}
$('#switch-mode').addEventListener('click',()=>setMode(!signup));
$('#forgot').addEventListener('click',()=>{
  const v=$('#in-email').value.trim();clearErrs();
  if(!validEmail(v)){$('#err-email').textContent='Digite seu e-mail acima para receber o link de redefinição.';$('#w-email').classList.add('bad');$('#in-email').focus();return}
  toast('Enviamos um link de redefinição para '+v);
});
$('#login-form').addEventListener('submit', e => {
  e.preventDefault();
  clearErrs();
  const email = $('#in-email').value.trim(), pass = $('#in-pass').value, name = $('#in-name').value.trim();
  let bad = false;

  if (signup && !name) { $('#err-name').textContent = 'Digite seu nome.'; bad = true; }
  if (!validEmail(email)) { $('#err-email').textContent = 'Digite um e-mail válido, como nome@empresa.com.'; $('#w-email').classList.add('bad'); bad = true; }
  if (!pass) { $('#err-pass').textContent = 'Digite sua senha.'; $('#w-pass').classList.add('bad'); bad = true; }
  else if (signup && pass.length < 6) { $('#err-pass').textContent = 'Use pelo menos 6 caracteres.'; $('#w-pass').classList.add('bad'); bad = true; }
  
  if (bad) return;

  // Validação restrita para o Administrador
  if (email !== 'admin@gmail.com' || pass !== 'admin123') {
    $('#err-email').textContent = 'Credenciais inválidas.';
    $('#err-pass').textContent = 'Credenciais inválidas.';
    $('#w-email').classList.add('bad');
    $('#w-pass').classList.add('bad');
    return;
  }

  enter(email, name || 'Administrador');
});
// $('#google').addEventListener('click',()=>enter($('#in-email').value.trim()||'voce@gmail.com',$('#in-name').value.trim())); //

/* ---------- modais ---------- */
let modalState=null;
function openModal(html,{wide=false,onMount,onClose}={}){
  closeModal(true);
  const root=$('#modal-root');
  root.innerHTML=`<div class="overlay" id="overlay"><div class="modal ${wide?'wide':''}" role="dialog" aria-modal="true">${html}</div></div>`;
  document.body.classList.add('modal-open');
  const ov=$('#overlay');
  ov.addEventListener('mousedown',e=>{if(e.target===ov)closeModal()});
  modalState={onClose,root:$('.modal',root)};
  if(onMount)onMount(modalState.root);
  const f=$('input,select,button:not(.m-close)',modalState.root);
}
function closeModal(silent){
  const root=$('#modal-root');
  if(!modalState&&!root.innerHTML)return;
  const cb=modalState&&modalState.onClose;
  modalState=null;root.innerHTML='';document.body.classList.remove('modal-open');
  if(cb&&!silent)cb();
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(modalState)closeModal();else closePop()}});
document.addEventListener('click',e=>{if(e.target.closest('[data-close]'))closeModal()});
const mHead=(title,desc)=>`<div class="m-head"><div><h2>${title}</h2><p>${desc}</p></div><button class="m-close" type="button" data-close aria-label="Fechar">×</button></div>`;

/* ajuda */
function openHelp(){
  const items=[['sparkles','Assistente','Pergunte qualquer coisa e receba sugestões.'],['calendar','Calendário','Destaque períodos importantes com cores.'],['gantt','Cronograma','Monte o horário de aulas da semana.'],['wallet','Finanças','Acompanhe gastos, metas e transações.'],['bell','Notificações','Veja entregas do Classroom, Moodle e Teams.']];
  openModal(`${mHead('Como a ASMI ajuda','Cinco áreas em um só lugar.')}
    <ul class="help-list">${items.map(i=>`<li><span class="rail-ic">${ic(i[0])}</span><div><b>${i[1]}</b><span>${i[2]}</span></div></li>`).join('')}</ul>
    <div class="m-actions"><button class="btn btn-primary" type="button" data-close>Entendi</button></div>`);
}

/* ---------- assistente (chat) ---------- */
function botReply(q){
  const t=q.toLowerCase();
  const pend=S.notifs.filter(n=>n.status!=='done');
  if(/planej|meu dia|agenda|rotina/.test(t)){
    const items=['<b>07:00–09:00</b> Aulas da manhã, conforme seu cronograma','<b>09:00</b> Lanche e pausa curta','<b>10:00–12:00</b> Aulas e revisão rápida'];
    pend.slice(0,2).forEach((n,i)=>items.push(`<b>${i?'16:00':'14:00'}–${i?'17:00':'15:30'}</b> ${esc(n.title)}`));
    items.push('<b>19:30</b> Revisar o dia e ajustar o de amanhã');
    return {html:`<p>Montei uma agenda equilibrada para hoje, com base no seu cronograma e nas suas entregas:</p><ul>${items.map(i=>`<li>${i}</li>`).join('')}</ul>`,acts:[['Ver notificações','notificacoes'],['Abrir calendário','calendario']]};
  }
  if(/finan|gasto|dinheiro|saldo|or[cç]amento/.test(t)){
    const f=S.fin;const top=[...f.cats].sort((a,b)=>b.spent/b.limit-a.spent/a.limit).slice(0,2);
    return {html:`<p>Neste mês você recebeu <b>${brl(f.receitas)}</b> e gastou <b>${brl(f.despesas)}</b>, guardando <b>${brl(f.economia)}</b> (${pct1(f.savedPct)}% da renda).</p><p>${esc(top[0].name)} já usa ${Math.round(top[0].spent/top[0].limit*100)}% do limite e ${esc(top[1].name)}, ${Math.round(top[1].spent/top[1].limit*100)}%. Vale segurar esses dois até o fim do mês.</p>`,acts:[['Abrir finanças','financas']]};
  }
  if(/cronograma|hor[aá]rio|aulas?/.test(t)){
    return {html:`<p>Vamos dividir isso em etapas simples. Para o horário de aulas, abri o Cronograma Escolar: escolha uma matéria na legenda e clique nos horários para preencher a semana.</p>`,acts:[['Abrir cronograma','cronograma']]};
  }
  if(/calend|prova|semana/.test(t)){
    return {html:`<p>No seu calendário, a <b>Semana de prova</b> vai de 5 a 8 de outubro e há uma <b>prova externa</b> no dia 15. Você pode trocar cores e marcar novos períodos.</p>`,acts:[['Abrir calendário','calendario']]};
  }
  if(/notific|entrega|trabalho|tarefa|atrasad/.test(t)){
    const late=S.notifs.filter(n=>n.status==='late').length;
    return {html:`<p>Você tem <b>${pend.length}</b> atividade${pend.length===1?'':'s'} em aberto${late?`, sendo ${late} atrasada${late>1?'s':''}`:''}. As entregas vêm do Google Classroom, Moodle e Microsoft Teams.</p>`,acts:[['Ver notificações','notificacoes']]};
  }
  return {html:`<p>Posso ajudar com calendário, cronograma, notificações escolares e finanças. Sobre qual delas você quer falar?</p>`,acts:[['Calendário','calendario'],['Cronograma','cronograma'],['Notificações','notificacoes'],['Finanças','financas']]};
}
function renderChat(typing){
  const th=$('#thread');const has=S.chat.length>0||typing;
  $('#welcome').hidden=has;th.hidden=!has;
  th.innerHTML=S.chat.map(m=>m.role==='user'
    ?`<div class="msg user">${esc(m.text)}</div>`
    :`<div class="msg bot">${m.html}${m.acts?`<div class="acts">${m.acts.map(a=>`<button class="chip-btn" type="button" data-go="${a[1]}">${a[0]}</button>`).join('')}</div>`:''}</div>`).join('')
    +(typing?`<div class="msg bot" aria-label="A ASMI está digitando"><span class="dots"><i></i><i></i><i></i></span></div>`:'');
  if(has)requestAnimationFrame(()=>window.scrollTo({top:document.body.scrollHeight,behavior:reduce?'auto':'smooth'}));
}
let chatBusy=false;
function sendChat(text){
  text=text.trim();if(!text||chatBusy)return;
  S.chat.push({role:'user',text});chatBusy=true;renderChat(true);
  setTimeout(()=>{S.chat.push({role:'bot',...botReply(text)});chatBusy=false;renderChat(false)},reduce?0:800);
}
document.addEventListener('click',e=>{
  const g=e.target.closest('[data-go]');if(g){go(g.dataset.go);return}
  const q=e.target.closest('[data-q]');if(q)sendChat(q.dataset.q);
});
document.addEventListener('submit',e=>{
  const f=e.target.closest('[data-composer]');if(!f)return;
  e.preventDefault();const inp=$('input',f);const v=inp.value;if(!v.trim())return;inp.value='';
  if(current==='assistente'){sendChat(v)}
  else{S.pendingMsg=v;go('assistente')}
});

/* ---------- renderização por página ---------- */
function renderPage(p){
  if(p==='assistente'){renderChat(false);if(S.pendingMsg){const m=S.pendingMsg;S.pendingMsg=null;setTimeout(()=>sendChat(m),60)}}
  if(p==='calendario')renderCalendar();
  if(p==='notificacoes')renderNotifs();
  if(p==='financas')renderFin();
}

/* ---------- calendário ---------- */
function renderCalendar(){
  const b=S.cal.month;
  $('#cal-month').textContent=MESES[b.getMonth()]+' '+b.getFullYear();
  const today=new Date();const tk=dkey(today.getFullYear(),today.getMonth(),today.getDate());
  const catBy=Object.fromEntries(S.cal.cats.map(c=>[c.id,c]));
  $('#cal-grid').innerHTML=monthCells(b).map(c=>{
    const k=dkey(c.y,c.m,c.d);const cat=catBy[S.cal.days[k]];
    return `<button type="button" class="cday ${c.out?'out':''} ${cat?'on':''} ${k===tk?'today':''}" ${cat?`style="--c:${cat.color}" title="${esc(cat.name)}"`:''} data-open-colors>${c.d}</button>`}).join('');
  const count=id=>Object.entries(S.cal.days).filter(([k,v])=>v===id&&k.startsWith(b.getFullYear()+'-'+String(b.getMonth()+1).padStart(2,'0'))).length;
  $('#cal-legend').innerHTML=S.cal.cats.map(c=>`<li style="--c:${c.color}"><i></i>${esc(c.name)} <em>${count(c.id)} dia${count(c.id)===1?'':'s'} neste mês</em></li>`).join('');
}
$('#cal-prev').addEventListener('click',()=>{S.cal.month=new Date(S.cal.month.getFullYear(),S.cal.month.getMonth()-1,1);renderCalendar()});
$('#cal-next').addEventListener('click',()=>{S.cal.month=new Date(S.cal.month.getFullYear(),S.cal.month.getMonth()+1,1);renderCalendar()});
$('#open-colors').addEventListener('click',openColors);
document.addEventListener('click',e=>{if(e.target.closest('[data-open-colors]'))openColors()});

function openColors(){
  const d={cats:S.cal.cats.map(c=>({...c})),days:{...S.cal.days},month:new Date(S.cal.month),active:S.cal.cats[0].id,rename:false};
  const draw=()=>{
    const m=modalState.root;
    const act=d.cats.find(c=>c.id===d.active);
    const catBy=Object.fromEntries(d.cats.map(c=>[c.id,c]));
    m.innerHTML=`${mHead('Cores do calendário','Selecione dias e organize do seu jeito.')}
      <div class="month-sel"><button class="nav-arrow" type="button" data-mprev aria-label="Mês anterior">‹</button><span>${MESES[d.month.getMonth()]} ${d.month.getFullYear()}</span><button class="nav-arrow" type="button" data-mnext aria-label="Próximo mês">›</button></div>
      <div><div class="mweek" aria-hidden="true">${['D','S','T','Q','Q','S','S'].map(x=>`<span>${x}</span>`).join('')}</div>
      <div class="mgrid">${monthCells(d.month).map(c=>{const k=dkey(c.y,c.m,c.d);const cat=catBy[d.days[k]];
        return `<button type="button" class="mday ${c.out?'out':''} ${cat?'on':''}" data-day="${k}" ${cat?`style="--c:${cat.color}"`:''}>${c.d}</button>`}).join('')}</div></div>
      <div class="legend-edit">${d.cats.map(c=>`<div class="leg-row ${c.id===d.active?'act':''}" style="--c:${c.color}"><div class="who"><span class="dot"></span>${c.id===d.active&&d.rename?`<input type="text" value="${esc(c.name)}" data-name aria-label="Nome da categoria">`:`<span>${esc(c.name)}</span>`}</div><button class="link" type="button" data-edit="${c.id}">${c.id===d.active&&d.rename?'Pronto':'Editar'}</button></div>`).join('')}
        <p class="hint">Categoria ativa: <b>${esc(act.name)}</b>. Clique nos dias para marcar ou desmarcar.</p></div>
      <div><div class="p-label">Escolha uma cor</div><div class="palette" role="radiogroup" aria-label="Cor da categoria ativa">${PALETTE.map(c=>`<button type="button" class="sw ${c===act.color?'on':''}" style="--c:${c}" data-color="${c}" role="radio" aria-checked="${c===act.color}" aria-label="Cor ${c}"><i></i></button>`).join('')}</div></div>
      <div class="m-actions"><button class="btn btn-ghost" type="button" data-close>Cancelar</button><button class="btn btn-primary" type="button" data-save>Salvar alterações</button></div>`;
    const ni=$('[data-name]',m);if(ni){ni.addEventListener('input',()=>{act.name=ni.value});ni.focus();ni.select()}
  };
  openModal('',{});draw();
  modalState.root.addEventListener('click',e=>{
    const t=e.target;
    if(t.closest('[data-mprev]')){d.month=new Date(d.month.getFullYear(),d.month.getMonth()-1,1);draw();return}
    if(t.closest('[data-mnext]')){d.month=new Date(d.month.getFullYear(),d.month.getMonth()+1,1);draw();return}
    const day=t.closest('[data-day]');
    if(day){const k=day.dataset.day;if(d.days[k]===d.active)delete d.days[k];else d.days[k]=d.active;draw();return}
    const ed=t.closest('[data-edit]');
    if(ed){const id=ed.dataset.edit;if(d.active===id)d.rename=!d.rename;else{d.active=id;d.rename=true}
      const a=d.cats.find(c=>c.id===d.active);if(!a.name.trim())a.name='Sem nome';draw();return}
    const col=t.closest('[data-color]');
    if(col){d.cats.find(c=>c.id===d.active).color=col.dataset.color;draw();return}
    if(t.closest('[data-save]')){
      d.cats.forEach(c=>{if(!c.name.trim())c.name='Sem nome'});
      S.cal.cats=d.cats;S.cal.days=d.days;closeModal(true);renderCalendar();toast('Alterações salvas');
    }
  });
}

/* ---------- cronograma ---------- */
function openSchedule(){
  const d={grid:JSON.parse(JSON.stringify(S.sched.grid)),brush:'mat'};
  const days=['Seg','Ter','Qua','Qui','Sex'];
  const draw=()=>{
    const m=modalState.root;
    let cells=`<span class="hd h0">Hora</span>${days.map(x=>`<span class="hd">${x}</span>`).join('')}`;
    S.sched.hours.forEach(h=>{
      cells+=`<span class="tm">${h}</span>`;
      const row=d.grid[h];
      for(let i=0;i<5;i++){
        if(!row)cells+=`<span class="cell gap">Lanche</span>`;
        else if(row[i])cells+=`<button type="button" class="cell sub sub-${row[i]}" data-h="${h}" data-i="${i}" aria-label="${days[i]} ${h}: ${SUBJ[row[i]]}"><span class="lg">${row[i]==='edf'?'Ed. Física':SUBJ[row[i]]}</span><span class="sm">${ABBR[row[i]]}</span></button>`;
        else cells+=`<button type="button" class="cell empty" data-h="${h}" data-i="${i}" aria-label="${days[i]} ${h}: vazio">+</button>`;
      }
    });
    m.innerHTML=`${mHead('Cronograma Escolar','Organize seu horário de aulas semanais.')}
      <div class="sched" role="group" aria-label="Grade horária">${cells}</div>
      <div><div class="leg-label">Legenda de Cores</div><div class="leg-chips" role="radiogroup" aria-label="Matéria para preencher">${Object.entries(SUBJ).map(([k,v])=>`<button type="button" class="leg-chip sub sub-${k} ${d.brush===k?'on':''}" data-brush="${k}" role="radio" aria-checked="${d.brush===k}">${v}</button>`).join('')}</div>
      <p class="hint">Escolha uma matéria na legenda e clique nos horários para preencher. Clique de novo na mesma matéria para limpar.</p></div>
      <div class="m-actions"><button class="btn btn-primary" type="button" data-save>Salvar alterações</button></div>`;
  };
  openModal('',{wide:true,onClose:()=>{if(current==='cronograma')go('assistente')}});draw();
  modalState.root.addEventListener('click',e=>{
    const t=e.target;
    const br=t.closest('[data-brush]');if(br){d.brush=br.dataset.brush;draw();return}
    const c=t.closest('[data-h]');
    if(c){const h=c.dataset.h,i=+c.dataset.i;d.grid[h][i]=d.grid[h][i]===d.brush?null:d.brush;draw();return}
    if(t.closest('[data-save]')){S.sched.grid=d.grid;const was=modalState;closeModal(true);if(current==='cronograma')go('assistente');toast('Alterações salvas')}
  });
}

/* ---------- notificações ---------- */
function renderNotifs(){
  const fl=[['all','Todas'],['classroom','Google Classroom'],['moodle','Moodle'],['teams','Microsoft Teams']];
  $('#n-filters').innerHTML=fl.map(f=>`<button type="button" class="chip-btn ${S.nFilter===f[0]?'on':''}" data-f="${f[0]}" aria-pressed="${S.nFilter===f[0]}">${f[1]}</button>`).join('');
  const list=S.notifs.filter(n=>S.nFilter==='all'||n.plat===S.nFilter);
  const lb={pend:'Pendente',done:'Entregue',late:'Atrasado'};
  $('#n-list').innerHTML=list.length?list.map(n=>{
    const p=PLAT[n.plat];
    const due=n.status==='done'&&n.orig==='late'?'Concluído':n.due;
    return `<article class="n-card"><span class="n-bar" style="background:${p.c}"></span><div class="n-body" style="--c:${p.c}">
      <div class="n-row"><span class="plat">${p.n}</span><button type="button" class="badge b-${n.status}" data-toggle="${n.id}" title="${n.status==='done'?'Reabrir atividade':'Marcar como entregue'}">${lb[n.status]}</button></div>
      <div><h3 class="n-title">${esc(n.title)}</h3><p class="n-due">${ic('cal-clock')}<span>${esc(due)}</span></p></div></div></article>`}).join('')
    :`<p class="empty-state">Nenhuma atividade desta plataforma por enquanto.</p>`;
}
document.addEventListener('click',e=>{
  const f=e.target.closest('[data-f]');if(f){S.nFilter=f.dataset.f;renderNotifs();return}
  const t=e.target.closest('[data-toggle]');
  if(t){const n=S.notifs.find(x=>x.id==t.dataset.toggle);
    if(n.status==='done'){n.status=n.orig==='done'?'pend':n.orig;toast('Atividade reaberta')}
    else{n.status='done';toast('Marcada como entregue')}
    renderNotifs()}
});

/* ---------- finanças ---------- */
function renderFin(){
  const f=S.fin;
  const M=[['sparkles','Saldo Total',brl(f.saldo),'+4,2% vs. mês passado'],['line','Receitas do Mês',brl(f.receitas),'+12,0% vs. mês passado'],['list','Despesas do Mês',brl(f.despesas),'-2,5% economia real'],['calendar','Economia Realizada',brl(f.economia),pct1(f.savedPct)+'% da renda guardada']];
  $('#metrics').innerHTML=M.map(m=>`<article class="card metric">${ic(m[0])}<div><b>${m[1]}</b><strong>${m[2]}</strong><span>${m[3]}</span></div></article>`).join('');
  renderFlow();
  const txs=f.showAll?[...f.txs,...f.older]:f.txs;
  $('#tx-list').innerHTML=txs.map(t=>`<div class="tx"><div class="tx-l"><span class="tx-ic ${t.type}">${ic(t.type==='in'?'down-left':'up-right')}</span><div style="min-width:0"><b>${esc(t.name)}</b><span>${esc(t.cat)}</span></div></div><div class="tx-r"><small>${t.when}</small><strong class="${t.type}">${t.type==='in'?'+':'-'} ${brl(t.val)}</strong></div></div>`).join('');
  $('#toggle-tx').textContent=f.showAll?'Mostrar menos':'Ver extrato completo';
  $('#cats').innerHTML=f.cats.map(c=>{const p=Math.min(100,Math.round(c.spent/c.limit*100));
    return `<div class="cat"><div class="cat-top"><b style="font-weight:600">${esc(c.name)}</b><span>${brl(c.spent).replace(',00','')} de ${brl(c.limit).replace(',00','')}</span></div><div class="cat-bar"><div class="track"><i style="width:${p}%;--c:${c.color}"></i></div><b class="${p>=90?'hi':''}">${p}%</b></div></div>`}).join('');
  $('#goals').innerHTML=f.goals.map(g=>{const p=Math.min(100,g.cur/g.target*100);
    return `<div class="goal"><div class="goal-top"><span class="l">${ic(g.icon)}<span>${esc(g.name)}</span></span><small>Meta: ${esc(g.when)}</small></div><div class="goal-val"><b>${brl(g.cur).replace(',00','')}</b><span>alvo ${brl(g.target).replace(',00','')}</span></div><div class="track g" role="progressbar" aria-valuenow="${Math.round(p)}" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso de ${esc(g.name)}"><i style="width:${p}%"></i></div></div>`}).join('');
}
function renderFlow(){
  const v=S.fin.flow,W=600,H=115,n=v.length;
  const lo=Math.min(...v)*.92,hi=Math.max(...v)*1.02;
  const pts=v.map((y,i)=>[(i+.5)/n*W,H-8-((y-lo)/(hi-lo))*(H-24)]);
  const path='M'+pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' L');
  const area=path+` L${pts[n-1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z`;
  const lab=['Semana 1','Semana 2','Semana 3','Semana 4','Semana 5','Hoje'];
  $('#flow').innerHTML=`<div class="flow-plot"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Evolução do saldo líquido por semana, de ${brl(v[0])} a ${brl(v[n-1])}"><path class="ar" d="${area}"/><path class="ln" d="${path}"/></svg>${pts.map((p,i)=>`<button type="button" class="pt" style="left:${(p[0]/W*100).toFixed(2)}%;top:${(p[1]/H*100).toFixed(2)}%" data-tip="${lab[i]} · ${brl(v[i])}" aria-label="${lab[i]}: ${brl(v[i])}"></button>`).join('')}</div><div class="flow-x" aria-hidden="true">${lab.map(l=>`<span>${l}</span>`).join('')}</div>`;
}
$('#toggle-tx').addEventListener('click',()=>{S.fin.showAll=!S.fin.showAll;renderFin()});

/* nova transação */
$('#new-tx').addEventListener('click',()=>{
  const cats=[...S.fin.cats.map(c=>c.name),'Salário & Renda','Saúde & Bem-estar','Serviços & Streaming','Investimentos'];
  const st={type:'out'};
  openModal(`${mHead('Nova transação','Registre uma receita ou despesa.')}
    <form class="mform" id="tx-form" novalidate>
      <div class="seg" role="group" aria-label="Tipo"><button type="button" data-type="out" class="on">Despesa</button><button type="button" data-type="in">Receita</button></div>
      <div class="field"><label for="tx-name">Descrição</label><div class="input"><input id="tx-name" type="text" placeholder="Ex.: Mercado do bairro" maxlength="40"></div><p class="err" id="tx-e1"></p></div>
      <div class="field"><label for="tx-cat">Categoria</label><div class="input"><select id="tx-cat">${cats.map(c=>`<option>${esc(c)}</option>`).join('')}</select></div></div>
      <div class="field"><label for="tx-val">Valor (R$)</label><div class="input"><input id="tx-val" type="text" inputmode="decimal" placeholder="0,00"></div><p class="err" id="tx-e2"></p></div>
      <div class="m-actions"><button class="btn btn-ghost" type="button" data-close>Cancelar</button><button class="btn btn-primary" type="submit">Salvar transação</button></div>
    </form>`,{onMount:m=>{
      $('#tx-name',m).focus();
      $$('[data-type]',m).forEach(b=>b.addEventListener('click',()=>{st.type=b.dataset.type;$$('[data-type]',m).forEach(x=>x.classList.toggle('on',x===b));
        if(st.type==='in')$('#tx-cat',m).value='Salário & Renda'}));
      $('#tx-form',m).addEventListener('submit',e=>{
        e.preventDefault();
        const name=$('#tx-name',m).value.trim(),raw=$('#tx-val',m).value.trim().replace(/\./g,'').replace(',','.');
        const val=parseFloat(raw);let bad=false;
        $('#tx-e1',m).textContent='';$('#tx-e2',m).textContent='';
        if(!name){$('#tx-e1',m).textContent='Digite uma descrição.';bad=true}
        if(!(val>0)){$('#tx-e2',m).textContent='Digite um valor maior que zero, como 45,90.';bad=true}
        if(bad)return;
        const cat=$('#tx-cat',m).value,f=S.fin;
        f.txs.unshift({name,cat,when:'Hoje',val,type:st.type});
        if(st.type==='in'){f.saldo+=val;f.receitas+=val;f.economia+=val}
        else{f.saldo-=val;f.despesas+=val;f.economia-=val;const bc=f.cats.find(c=>c.name===cat);if(bc)bc.spent+=val}
        f.flow[f.flow.length-1]=f.saldo;f.savedPct=f.economia/f.receitas*100;
        closeModal(true);renderFin();toast(st.type==='in'?'Receita adicionada':'Despesa adicionada');
      });
    }});
});

/* nova meta */
$('#add-goal').addEventListener('click',()=>{
  openModal(`${mHead('Nova meta','Defina um objetivo e acompanhe o progresso.')}
    <form class="mform" id="g-form" novalidate>
      <div class="field"><label for="g-name">Nome da meta</label><div class="input"><input id="g-name" type="text" placeholder="Ex.: Notebook novo" maxlength="32"></div><p class="err" id="g-e1"></p></div>
      <div class="field"><label for="g-target">Valor alvo (R$)</label><div class="input"><input id="g-target" type="text" inputmode="decimal" placeholder="0,00"></div><p class="err" id="g-e2"></p></div>
      <div class="field"><label for="g-cur">Já guardado (R$)</label><div class="input"><input id="g-cur" type="text" inputmode="decimal" placeholder="0,00"></div></div>
      <div class="field"><label for="g-when">Mês da meta</label><div class="input"><input id="g-when" type="month" value="2027-06"></div></div>
      <div class="m-actions"><button class="btn btn-ghost" type="button" data-close>Cancelar</button><button class="btn btn-primary" type="submit">Salvar meta</button></div>
    </form>`,{onMount:m=>{
      $('#g-name',m).focus();
      const num=v=>parseFloat(v.trim().replace(/\./g,'').replace(',','.'));
      $('#g-form',m).addEventListener('submit',e=>{
        e.preventDefault();
        const name=$('#g-name',m).value.trim(),target=num($('#g-target',m).value),cur=num($('#g-cur',m).value)||0;
        $('#g-e1',m).textContent='';$('#g-e2',m).textContent='';let bad=false;
        if(!name){$('#g-e1',m).textContent='Digite um nome para a meta.';bad=true}
        if(!(target>0)){$('#g-e2',m).textContent='Digite um valor alvo maior que zero.';bad=true}
        if(bad)return;
        const w=$('#g-when',m).value;let label='Sem prazo';
        if(w){const [y,mo]=w.split('-');label=MESES[+mo-1].slice(0,3)+' '+y}
        S.fin.goals.push({name,when:label,cur,target,icon:'award'});
        closeModal(true);renderFin();toast('Meta adicionada');
      });
    }});
});

/* ---------- início ---------- */
try{const u=JSON.parse(store.get('asmi.user')||'null');if(u&&u.email)S.user=u}catch(e){}
route();
})();
