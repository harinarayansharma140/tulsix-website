// TulsiX shared client-side JS — runs on every page.
// All sections guard for missing DOM nodes so it's safe to load anywhere.

(function(){
  'use strict';

  // ── PRELOADER + COOKIE BANNER ──
  document.addEventListener('DOMContentLoaded',function(){
    const preloader=document.getElementById('preloader');
    if(preloader){setTimeout(function(){preloader.classList.add('hide')},700)}
    const cookieBanner=document.getElementById('cookieBanner');
    if(cookieBanner&&!localStorage.getItem('cookieConsent')){
      setTimeout(function(){cookieBanner.classList.add('visible')},1400);
    }
  });

  // Cookie accept (called from button onclick)
  window.acceptCookies=function(){
    localStorage.setItem('cookieConsent','true');
    const cb=document.getElementById('cookieBanner');
    if(cb)cb.classList.remove('visible');
  };

  // ── FAQ TOGGLE ──
  window.toggleFaq=function(btn){
    const item=btn.parentElement;
    const answer=item.querySelector('.faq-answer');
    const isOpen=item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(function(i){
      i.classList.remove('open');
      const a=i.querySelector('.faq-answer');if(a)a.style.maxHeight=null;
      const q=i.querySelector('.faq-question');if(q)q.setAttribute('aria-expanded','false');
    });
    if(!isOpen){
      item.classList.add('open');
      answer.style.maxHeight=answer.scrollHeight+'px';
      btn.setAttribute('aria-expanded','true');
    }
  };

  // ── NAV SCROLL + BACK-TO-TOP ──
  const navbar=document.getElementById('navbar');
  const backToTop=document.getElementById('backToTop');
  if(navbar||backToTop){
    window.addEventListener('scroll',function(){
      if(navbar)navbar.classList.toggle('scrolled',window.scrollY>60);
      if(backToTop)backToTop.classList.toggle('visible',window.scrollY>500);
    },{passive:true});
  }

  // ── HAMBURGER MENU ──
  const hamburger=document.getElementById('hamburger');
  const navLinks=document.getElementById('navLinks');
  if(hamburger&&navLinks){
    hamburger.addEventListener('click',function(){
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded',navLinks.classList.contains('open'));
    });
    navLinks.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click',function(){
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }

  // ── REVEAL OBSERVER ──
  if('IntersectionObserver' in window){
    const revealObs=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){e.target.classList.add('visible');revealObs.unobserve(e.target)}
      });
    },{threshold:.08,rootMargin:'0px 0px -40px 0px'});
    document.querySelectorAll('.reveal').forEach(function(el){revealObs.observe(el)});
  }

  // ── SMOOTH SCROLL ON HASH LINKS (only same-page anchors) ──
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click',function(e){
      const href=a.getAttribute('href');
      if(href==='#'||href.length<2)return;
      const t=document.querySelector(href);
      if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'})}
    });
  });

  // ── ANIMATED NUMBER COUNTER (trust metrics) ──
  if('IntersectionObserver' in window){
    const counterObs=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){animateCounter(e.target);counterObs.unobserve(e.target)}
      });
    },{threshold:.5});
    document.querySelectorAll('.trust-metric .num').forEach(function(el){counterObs.observe(el)});
    function animateCounter(el){
      const text=el.textContent.trim();
      const match=text.match(/^([\d,]+\.?\d*)/);
      if(!match)return;
      const suffix=text.replace(match[0],'');
      const target=parseFloat(match[0].replace(/,/g,''));
      const hasDecimal=match[0].includes('.');
      const duration=1800;
      const start=performance.now();
      function update(now){
        const elapsed=now-start;
        const progress=Math.min(elapsed/duration,1);
        const eased=1-Math.pow(1-progress,3);
        let current=eased*target;
        if(hasDecimal){current=current.toFixed(1)}
        else{current=Math.floor(current).toLocaleString('en-IN')}
        el.textContent=current+suffix;
        if(progress<1)requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
    }
  }

  // ── BUTTON RIPPLE ──
  document.querySelectorAll('.btn-teal,.btn-ghost,.btn-dark,.pricing-cta,.form-submit').forEach(function(btn){
    btn.addEventListener('click',function(e){
      const ripple=document.createElement('span');
      ripple.classList.add('ripple');
      const rect=this.getBoundingClientRect();
      const size=Math.max(rect.width,rect.height);
      ripple.style.width=ripple.style.height=size+'px';
      ripple.style.left=(e.clientX-rect.left-size/2)+'px';
      ripple.style.top=(e.clientY-rect.top-size/2)+'px';
      this.appendChild(ripple);
      setTimeout(function(){ripple.remove()},700);
    });
  });

  // ── CONTACT FORM (Web3Forms) ──
  const contactForm=document.getElementById('contactForm');
  if(contactForm){
    const emailField=document.getElementById('field-email');
    const replyTo=document.getElementById('replyTo');
    if(emailField&&replyTo){
      emailField.addEventListener('input',function(){replyTo.value=this.value});
    }
    window.handleSubmit=async function(e){
      e.preventDefault();
      const btn=document.getElementById('submitBtn');
      const form=e.target;
      btn.textContent='Sending...';btn.disabled=true;btn.style.opacity='.7';
      try{
        const controller=new AbortController();
        const timeout=setTimeout(function(){controller.abort()},10000);
        const fd=new FormData(form);
        const res=await fetch('https://api.web3forms.com/submit',{method:'POST',body:fd,signal:controller.signal});
        clearTimeout(timeout);
        const data=await res.json();
        if(data.success){
          btn.textContent='✓ Message Sent!';
          btn.classList.add('form-submit--success');
          form.reset();
          setTimeout(function(){btn.textContent='Send Message →';btn.classList.remove('form-submit--success');btn.disabled=false},4000);
        }else{throw new Error('Submission failed')}
      }catch(err){
        console.error('Form submission error:',err);
        btn.textContent='✗ Failed — Retry';
        btn.classList.add('form-submit--error');
        btn.disabled=false;
        setTimeout(function(){btn.textContent='Send Message →';btn.classList.remove('form-submit--error')},3000);
      }
    };
  }

  // ── HERO FLOATING ELEMENTS (homepage only, desktop only) ──
  const floatsContainer=document.getElementById('heroFloats');
  if(floatsContainer&&window.innerWidth>=960){
    const leafSVG='<svg aria-hidden="true" viewBox="0 0 148 140" width="WW" height="HH" fill="currentColor"><path d="M30 0 Q74 55 74 120 Q74 130 64 130 Q58 130 50 120 Q10 55 30 0Z" opacity="0.85"/><path d="M118 0 Q74 55 74 120 Q74 130 84 130 Q90 130 98 120 Q138 55 118 0Z" opacity="0.85"/><path d="M74 50 Q62 75 74 100 Q86 75 74 50Z" opacity="0.4"/></svg>';
    const codeSnippets=['const app = new CAPilot()','async fetchClients()','{status: "production"}','deploy --azure','git push origin main','npm run build','interface Client {','export default App','SELECT * FROM clients','res.status(200).json()','// production ready','dotnet publish -c Release','<Dashboard />','useEffect(() => {','border-radius: 8px;','JWT.verify(token)','pipeline: CI/CD','container.start()','api/v1/invoices','schema.validate()'];
    const brackets=['{ }','< />','( )','[ ]','=> { }','/**/',';'];
    function spawnFloat(){
      const el=document.createElement('div');
      el.classList.add('hero-float');
      const type=Math.random();
      if(type<0.35){
        el.classList.add('hero-float--code');
        el.textContent=codeSnippets[Math.floor(Math.random()*codeSnippets.length)];
      }else if(type<0.55){
        el.classList.add('hero-float--leaf');
        const s=Math.random()*20+14;
        el.innerHTML=leafSVG.replace('WW',s).replace('HH',s);
      }else if(type<0.75){
        el.classList.add('hero-float--dot');
      }else if(type<0.9){
        el.classList.add('hero-float--bracket');
        el.textContent=brackets[Math.floor(Math.random()*brackets.length)];
      }else{
        el.classList.add('hero-float--ring');
        const sz=Math.random()*30+10;
        el.style.width=sz+'px';el.style.height=sz+'px';
      }
      el.style.left=Math.random()*100+'%';
      el.style.bottom='-20px';
      const dur=Math.random()*15+12;
      el.style.animationDuration=dur+'s';
      el.style.animationDelay=Math.random()*2+'s';
      floatsContainer.appendChild(el);
      setTimeout(function(){el.remove()},(dur+2)*1000);
    }
    for(let i=0;i<12;i++)setTimeout(spawnFloat,i*800);
    const floatInterval=setInterval(spawnFloat,2200);
    const heroEl=document.querySelector('.hero');
    if(heroEl&&'IntersectionObserver' in window){
      const hObs=new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(!e.isIntersecting){clearInterval(floatInterval);hObs.disconnect()}
        });
      },{threshold:0});
      hObs.observe(heroEl);
    }
  }

  // ── CURSOR SPOTLIGHT (homepage hero, desktop only) ──
  const hero=document.querySelector('.hero');
  const spot=document.getElementById('heroSpotlight');
  if(hero&&spot&&window.innerWidth>=960){
    hero.addEventListener('mousemove',function(e){
      const rect=hero.getBoundingClientRect();
      spot.style.transform='translate('+(e.clientX-rect.left)+'px,'+(e.clientY-rect.top)+'px) translate(-50%,-50%)';
    });
  }

  // ── PARALLAX HERO GLOW (desktop only) ──
  if(window.innerWidth>=960){
    const glows=document.querySelectorAll('.hero-glow');
    const orbit=document.querySelector('.hero-orbit');
    if(glows.length||orbit){
      let ticking=false;
      window.addEventListener('scroll',function(){
        if(!ticking){
          requestAnimationFrame(function(){
            const y=window.scrollY;
            if(y<=800){
              glows.forEach(function(g,i){g.style.transform='translateY('+y*(0.08+i*0.03)+'px)'});
              if(orbit)orbit.style.transform='translateY('+y*0.12+'px)';
            }
            ticking=false;
          });
          ticking=true;
        }
      },{passive:true});
    }
  }
})();
