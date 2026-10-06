(function(){
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

  // reveal on scroll
  var els=[].slice.call(document.querySelectorAll('.reveal'));
  if('IntersectionObserver' in window&&!reduce){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}});
    },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    els.forEach(function(el){io.observe(el)});
  }else{els.forEach(function(el){el.classList.add('in')})}

  // sticky header: border on scroll, CTA after the hero
  var top=document.querySelector('.top'),anchor=document.getElementById('registro');
  function onScroll(){
    if(!top)return;
    top.classList.toggle('scrolled',window.scrollY>8);
    if(anchor){var r=anchor.getBoundingClientRect();top.classList.toggle('show-cta',r.bottom<80)}
    else top.classList.add('show-cta');
  }
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();

  // countdown to Tue 20 Oct 2026, 7:00 p. m. Houston (CDT, UTC-5) = 2026-10-21T00:00:00Z
  var target=Date.UTC(2026,9,21,0,0,0);
  var box=document.querySelector('[data-count]');
  if(box){
    var f={d:box.querySelector('[data-d]'),h:box.querySelector('[data-h]'),m:box.querySelector('[data-m]'),s:box.querySelector('[data-s]')};
    var note=document.querySelector('[data-count-note]');
    var pad=function(n){return n<10?'0'+n:''+n};
    var tick=function(){
      var ms=target-Date.now();
      if(ms<=0){box.hidden=true;if(note)note.textContent='El webinar ya comenzó. Entra desde el enlace de Meet.';return}
      var s=Math.floor(ms/1000);
      f.d.textContent=Math.floor(s/86400);f.h.textContent=pad(Math.floor(s%86400/3600));
      f.m.textContent=pad(Math.floor(s%3600/60));f.s.textContent=pad(s%60);
    };
    tick();setInterval(tick,1000);
  }

  // visitor's own local time
  var loc=document.getElementById('localTime');
  if(loc&&window.Intl){
    try{
      var tz=Intl.DateTimeFormat().resolvedOptions().timeZone;
      var fmt=new Intl.DateTimeFormat('es',{weekday:'long',day:'numeric',month:'long',hour:'numeric',minute:'2-digit',hour12:true,timeZone:tz});
      var d1=new Date(Date.UTC(2026,9,21,0,0,0));
      loc.innerHTML='En tu zona horaria ('+tz.replace(/_/g,' ')+'): <b>'+fmt.format(d1)+'</b>';
    }catch(e){}
  }
})();

// ---- oferta, registro en 3 pasos, pago integrado y botones del grupo ----
(function(){
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CID_KEY='eb2_cid',STEP_KEY='eb2_step',PAID_KEY='eb2_paid';
  var DEADLINE=Date.UTC(2026,9,22,4,59,59); // mié 21 oct 2026, 11:59:59 p. m. Houston (UTC-5)
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  var ls={
    get:function(k){try{return localStorage.getItem(k)||''}catch(e){return ''}},
    set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  };
  var cid=ls.get(CID_KEY);

  // Página cargada dentro del iframe de pago (/compra o /pago-ok): avisar a la tarjeta y salir.
  var framed=false;
  try{framed=window.parent!==window}catch(e){framed=true}
  if(framed&&/^\/(compra|pago-ok)\/?$/.test(location.pathname)){
    document.documentElement.classList.add('framed');
    try{window.parent.postMessage({type:'eb2-paid'},location.origin)}catch(e){}
  }

  // ----- oferta: precio verdadero según la fecha -----
  var oferta={phase:Date.now()<=DEADLINE?'promo':'regular',price:null,was:null,endsAt:DEADLINE,payUrl:document.body.getAttribute('data-pay')||null,offset:0};
  oferta.price=oferta.phase==='promo'?9:22;oferta.was=oferta.phase==='promo'?22:null;
  if(oferta.phase!=='promo')oferta.payUrl=null; // el enlace regular lo entrega /api/oferta
  var offerListeners=[];

  function applyOferta(){
    var promo=oferta.phase==='promo';
    $$('[data-price]').forEach(function(e){e.textContent='US$'+oferta.price});
    $$('[data-was]').forEach(function(e){e.textContent='US$'+(oferta.was||22)});
    $$('[data-promo-only]').forEach(function(e){e.hidden=!promo});
    $$('[data-t-promo]').forEach(function(e){e.textContent=e.getAttribute(promo?'data-t-promo':'data-t-reg')});
    $$('[data-pay-link]').forEach(function(a){if(oferta.payUrl){a.href=oferta.payUrl;a.hidden=false}else a.hidden=true});
    var nt=$('[data-pay-newtab]');if(nt&&oferta.payUrl)nt.href=oferta.payUrl;
    offerListeners.forEach(function(f){f()});
  }
  function offerTick(){
    var els=$$('[data-oferta-count]');if(!els.length||oferta.phase!=='promo')return;
    var ms=oferta.endsAt-(Date.now()+oferta.offset);
    if(ms<=0){oferta.phase='regular';oferta.price=22;oferta.was=null;oferta.payUrl=null;applyOferta();refreshOferta();return}
    var s=Math.floor(ms/1000),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),x=s%60;
    var t=d+'d '+(h<10?'0':'')+h+'h '+(m<10?'0':'')+m+'m '+(x<10?'0':'')+x+'s';
    els.forEach(function(e){var b=e.querySelector('b');if(b)b.textContent=t});
  }
  function refreshOferta(){
    return fetch('/api/oferta',{cache:'no-store'}).then(function(r){return r.json()}).then(function(d){
      if(!d||!d.ok)return;
      oferta.phase=d.phase;oferta.price=d.price;oferta.was=d.was;oferta.payUrl=d.payUrl||null;
      oferta.endsAt=d.endsAt?Date.parse(d.endsAt):DEADLINE;
      if(d.now)oferta.offset=d.now-Date.now();
      applyOferta();offerTick();
    }).catch(function(){});
  }
  applyOferta();offerTick();setInterval(offerTick,1000);refreshOferta();

  // ----- enlaces del grupo -----
  function setGroupLinks(){
    $$('[data-group]').forEach(function(a){a.href='/api/grupo'+(cid?'?cid='+encodeURIComponent(cid):'')});
  }
  setGroupLinks();

  // ----- contador de registrados (solo si N >= 20) -----
  var proof=$('[data-registrados]');
  if(proof){
    fetch('/api/registrados').then(function(r){return r.json()}).then(function(d){
      if(d&&d.ok&&d.n>=20){proof.querySelector('[data-n]').textContent=d.n.toLocaleString('es');proof.hidden=false}
    }).catch(function(){});
  }

  var card=document.getElementById('registro');
  if(!card||!card.hasAttribute('data-flow'))return;

  // ----- tarjeta de 3 pasos -----
  var vp=$('[data-vp]',card),steps=$$('.fstep',card),bar=$('[data-bar]',card),progTxt=$('[data-prog-txt]',card),barWrap=$('.bar',card);
  var cur=1;
  function offerAvailable(){return !!oferta.payUrl}
  function show(n,instant){
    var from=steps[cur-1],to=steps[n-1];
    cur=n;
    card.setAttribute('data-step',n);
    progTxt.textContent='Paso '+n+' de 3';
    bar.style.width=(n/3*100)+'%';
    barWrap.setAttribute('aria-valuenow',n);
    if(from===to&&!to.hidden)return;
    if(n!==2)stopPoll();
    if(instant||reduce){steps.forEach(function(s){s.hidden=s!==to});return}
    vp.style.height=from.offsetHeight+'px';vp.style.overflow='hidden';
    from.classList.add('out');
    setTimeout(function(){
      from.hidden=true;from.classList.remove('out');
      to.hidden=false;
      var h=to.offsetHeight;
      requestAnimationFrame(function(){vp.style.height=h+'px'});
      setTimeout(function(){vp.style.height='';vp.style.overflow=''},460);
      var r=card.getBoundingClientRect();
      if(r.top<0||r.top>window.innerHeight*.5)card.scrollIntoView({behavior:'smooth',block:'start'});
    },200);
  }

  // paso 1: datos
  var form=$('#reg',card),btn=form.querySelector('button[type=submit]'),banner=form.querySelector('.form-err'),phoneEl=document.getElementById('f-phone'),iti=null;
  function initPhone(){
    if(iti||!window.intlTelInput)return;
    var opts={initialCountry:'ec',countryOrder:['ec','co','pe','mx','cl','us'],separateDialCode:true,nationalMode:true,autoPlaceholder:'polite',strictMode:true};
    import('https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/js/i18n/es/index.js')
      .then(function(m){opts.i18n=m.default}).catch(function(){})
      .then(function(){iti=window.intlTelInput(phoneEl,opts)});
  }
  if(window.intlTelInput)initPhone();else window.addEventListener('load',initPhone);

  function setErr(name,msg){
    var p=form.querySelector('.err[data-for="'+name+'"]');
    var inp=form.elements[name];
    if(p)p.textContent=msg||'';
    if(inp&&inp.setAttribute){msg?inp.setAttribute('aria-invalid','true'):inp.removeAttribute('aria-invalid')}
  }
  function clearErrs(){['name','email','phone','consent'].forEach(function(n){setErr(n,'')});banner.hidden=true;banner.textContent=''}
  function validate(){
    var e={};
    var name=form.elements.name.value.trim();
    var email=form.elements.email.value.trim();
    if(name.length<2)e.name='Escribe tu nombre.';
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))e.email='Escribe un correo válido.';
    var phone='';
    if(iti){phone=iti.getNumber();if(!phone||!iti.isValidNumber())e.phone='Escribe un teléfono válido para el país elegido.'}
    else{phone=phoneEl.value.replace(/[^\d+]/g,'');if(!/^\+[1-9]\d{7,14}$/.test(phone))e.phone='Escribe tu teléfono con el prefijo del país, por ejemplo +593…'}
    if(!form.elements.consent.checked)e.consent='Necesitamos tu consentimiento para enviarte la información.';
    return {errors:e,phone:phone,name:name,email:email};
  }
  function busy(on){form.classList.toggle('loading',on);btn.disabled=on;btn.querySelector('.lbl').textContent=on?'Reservando…':'Reservar mi lugar'}

  form.addEventListener('submit',function(ev){
    ev.preventDefault();
    clearErrs();
    var v=validate();
    var keys=Object.keys(v.errors);
    if(keys.length){
      keys.forEach(function(k){setErr(k,v.errors[k])});
      var first=form.elements[keys[0]];if(first&&first.focus)first.focus();
      return;
    }
    busy(true);
    fetch('/api/registro',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name:v.name,email:v.email,phone:v.phone,consent:true,website:form.elements.website.value})
    }).then(function(r){return r.json().catch(function(){return {}}).then(function(d){return {status:r.status,d:d}})})
    .then(function(x){
      if(x.d&&x.d.ok){
        if(x.d.id){cid=x.d.id;ls.set(CID_KEY,cid)}
        setGroupLinks();
        busy(false);
        var next=offerAvailable()?2:3;
        ls.set(STEP_KEY,String(next));
        show(next);
        return;
      }
      busy(false);
      if(x.d&&x.d.errors){Object.keys(x.d.errors).forEach(function(k){setErr(k,x.d.errors[k])})}
      banner.textContent=(x.d&&x.d.error)||'No pudimos completar tu registro. Intenta de nuevo.';
      banner.hidden=false;
    }).catch(function(){
      busy(false);
      banner.textContent='No hay conexión en este momento. Revisa tu internet e intenta de nuevo; tus datos siguen aquí.';
      banner.hidden=false;
    });
  });

  // paso 2: oferta y pago integrado
  var addBtn=$('[data-add]',card),pay=$('[data-pay]',card),frame=$('[data-pay-frame]',card),payLoad=$('[data-pay-load]',card),paidBtn=$('[data-paid]',card),skipBtn=$('[data-skip]',card);
  var poll=null,bought=false;
  function stopPoll(){if(poll){clearInterval(poll);poll=null}}
  function check(cb){
    if(!cid){cb&&cb(false);return}
    fetch('/api/comprado?cid='+encodeURIComponent(cid),{cache:'no-store'}).then(function(r){return r.json()})
      .then(function(d){cb&&cb(!!(d&&d.paid))}).catch(function(){cb&&cb(false)});
  }
  function startPoll(){
    stopPoll();if(!cid)return;
    poll=setInterval(function(){check(function(p){if(p)goPaid(true)})},4000);
  }
  function renderStep3(){
    $('[data-bought]',card).hidden=!bought;
    $('[data-pending]',card).hidden=bought||ls.get(PAID_KEY)!=='pending';
  }
  function goPaid(confirmed){
    stopPoll();
    bought=!!confirmed;
    ls.set(PAID_KEY,confirmed?'1':'pending');ls.set(STEP_KEY,'3');
    renderStep3();show(3);
  }
  addBtn.addEventListener('click',function(){
    if(!oferta.payUrl)return;
    var open=pay.classList.toggle('open');
    addBtn.setAttribute('aria-expanded',open?'true':'false');
    if(open){
      if(!frame.getAttribute('src')){
        frame.addEventListener('load',function(){payLoad.classList.add('done')},{once:true});
        frame.src=oferta.payUrl;
        setTimeout(function(){payLoad.classList.add('done')},9000);
      }
      startPoll();
      setTimeout(function(){pay.scrollIntoView({behavior:reduce?'auto':'smooth',block:'nearest'})},520);
    }else stopPoll();
  });
  paidBtn.addEventListener('click',function(){
    paidBtn.disabled=true;
    check(function(p){paidBtn.disabled=false;goPaid(p)});
  });
  skipBtn.addEventListener('click',function(){ls.set(STEP_KEY,'3');ls.set(PAID_KEY,'');bought=false;renderStep3();show(3)});
  window.addEventListener('message',function(e){
    if(e.origin!==location.origin)return;
    if(e.data&&e.data.type==='eb2-paid')goPaid(true);
  });

  // paso 3: calendario
  var calBtn=$('[data-cal]',card),calPanel=$('[data-cal-panel]',card);
  calBtn.addEventListener('click',function(){
    var open=calPanel.classList.toggle('open');
    calBtn.setAttribute('aria-expanded',open?'true':'false');
  });

  // retomar a mitad del flujo
  var saved=ls.get(STEP_KEY),paidSaved=ls.get(PAID_KEY);
  if(cid&&(saved==='2'||saved==='3')){
    bought=paidSaved==='1';
    if(saved==='2'&&!offerAvailable()){/* la oferta aún se está cargando */}
    var wanted=parseInt(saved,10);
    var go=function(){show(wanted,true);if(wanted===3)renderStep3()};
    go();
    if(wanted===2)offerListeners.push(function(){if(!offerAvailable()&&cur===2){ls.set(STEP_KEY,'3');show(3,true);renderStep3()}});
    if(wanted===3&&paidSaved==='pending')check(function(p){if(p){bought=true;ls.set(PAID_KEY,'1');renderStep3()}});
  }
})();
