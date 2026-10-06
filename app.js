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

// ---- registro (formulario propio) y botones del grupo ----
(function(){
  var CID_KEY='eb2_cid';
  var cid='';
  try{cid=localStorage.getItem(CID_KEY)||''}catch(e){}
  [].forEach.call(document.querySelectorAll('[data-group]'),function(a){
    a.href='/api/grupo'+(cid?'?cid='+encodeURIComponent(cid):'');
  });

  var form=document.getElementById('reg');
  if(!form)return;
  var btn=form.querySelector('button[type=submit]');
  var banner=form.querySelector('.form-err');
  var phoneEl=document.getElementById('f-phone');
  var iti=null;

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
  function busy(on){form.classList.toggle('loading',on);btn.disabled=on;btn.querySelector('.lbl').textContent=on?'Enviando…':'Reservar mi lugar'}

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
        try{if(x.d.id)localStorage.setItem(CID_KEY,x.d.id)}catch(e){}
        window.location.href='/gracias';
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
})();
