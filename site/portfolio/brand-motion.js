const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
export function initBrandMist(stage,canReveal){
 const wall=document.querySelector('.brand-mist'),pause=document.querySelector('#mist-pause');
 const logos=[...wall.querySelectorAll('.mist-logo')];let active=null,timer=0,frame=0;
 const clear=()=>{if(active){active.classList.remove('is-clear');active.closest('.mist-row').classList.remove('is-held');active=null}};
 const show=logo=>{if(active===logo)return;clear();active=logo;if(logo){logo.classList.add('is-clear');logo.closest('.mist-row').classList.add('is-held')}};
 const at=(x,y)=>{if(!canReveal(x,y)){clear();return}const logo=logos.find(el=>{const r=el.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom});show(logo)};
 stage.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||e.buttons)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>at(e.clientX,e.clientY))});
 stage.addEventListener('pointerleave',clear);
 let start;
 stage.addEventListener('pointerdown',e=>{start=[e.clientX,e.clientY]});
 stage.addEventListener('pointerup',e=>{if(!start||Math.hypot(e.clientX-start[0],e.clientY-start[1])>7)return;at(e.clientX,e.clientY);clearTimeout(timer);timer=setTimeout(clear,2600)});
 logos.forEach(el=>{el.addEventListener('focus',()=>show(el));el.addEventListener('blur',clear);el.addEventListener('click',()=>show(el))});
 pause.addEventListener('click',()=>{const stopped=wall.classList.toggle('is-paused');pause.setAttribute('aria-pressed',String(stopped));pause.setAttribute('aria-label',stopped?'Resume brand logo movement':'Pause brand logo movement');pause.textContent=stopped?'▶':'Ⅱ'});
 document.addEventListener('visibilitychange',()=>wall.classList.toggle('is-inactive',document.hidden));
 addEventListener('hashchange',clear);
}
export function metricsMarkup(){return `<section class="impact-metrics" aria-label="Career in numbers"><div class="impact-heading"><span class="eyebrow">EXPERIENCE, IN NUMBERS</span><h2>Built through<br><em>real partnerships.</em></h2></div><div class="metric-grid">${[[6,'Years of experience'],[100,'Clients collaborated with'],[20,'Brands established']].map(([value,label])=>`<article class="metric-card" aria-label="More than ${value} ${label.toLowerCase()}"><div class="metric-number" aria-hidden="true"><span data-count="${value}">0</span><sup>+</sup></div><p>${label}</p></article>`).join('')}</div></section>`}
let observer;
export function setupMetrics(){
 observer?.disconnect();
 const cards=[...document.querySelectorAll('#about:not([hidden]) .metric-card:not([data-counted])')];
 const run=el=>{el.dataset.counted='true';const number=el.querySelector('[data-count]'),value=Number(number.dataset.count);if(reduced){number.textContent=value;el.classList.add('is-counted');return}
  const state={n:0};el.classList.add('is-counting');
  window.gsap.fromTo(el,{opacity:.25,y:24,filter:'blur(12px)'},{opacity:1,y:0,filter:'blur(0px)',duration:1.4,ease:'power3.out'});
  window.gsap.to(state,{n:value,duration:2.3,ease:'power2.out',onUpdate:()=>number.textContent=Math.round(state.n),onComplete:()=>{number.textContent=value;el.classList.remove('is-counting');el.classList.add('is-counted')}});
 };
 observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){run(e.target);observer.unobserve(e.target)}}),{threshold:.35});
 cards.forEach(el=>observer.observe(el));
}
