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
