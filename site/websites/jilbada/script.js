// ============ LOADER ============
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
    setTimeout(() => {
      if (!sessionStorage.getItem('jilbada_dua_shown')) {
        document.getElementById('duaOverlay').classList.add('show');
        sessionStorage.setItem('jilbada_dua_shown', 'true');
      }
    }, 600);
  }, 1500);
});

function closeDua(){
  document.getElementById('duaOverlay').classList.remove('show');
}

// ============ LANGUAGE TOGGLE ============
const body = document.body;
document.getElementById('langEn').addEventListener('click', () => {
  body.classList.remove('rtl');
  body.setAttribute('dir', 'ltr');
  document.getElementById('langEn').classList.add('active');
  document.getElementById('langAr').classList.remove('active');
});
document.getElementById('langAr').addEventListener('click', () => {
  body.classList.add('rtl');
  body.setAttribute('dir', 'rtl');
  document.getElementById('langAr').classList.add('active');
  document.getElementById('langEn').classList.remove('active');
});

// ============ PAGE ROUTING ============
document.querySelectorAll('[data-page]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    const target = el.dataset.page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + target).classList.add('active');
    document.querySelectorAll('.nav-link[data-page]').forEach(n => n.classList.remove('active'));
    document.querySelectorAll(`.nav-link[data-page="${target}"]`).forEach(n => n.classList.add('active'));
    window.scrollTo({top:0, behavior:'instant'});
    setTimeout(observeReveals, 100);
  });
});

// ============ HEADER SCROLL ============
window.addEventListener('scroll', () => {
  const nav = document.getElementById('mainNav');
  if (window.scrollY > 60) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});

// ============ HERO SLIDER ============
const slides = document.querySelectorAll('.hero-slide');
const dots = document.querySelectorAll('.hero-pagination button');
let currentSlide = 0;
function goToSlide(i){
  slides.forEach(s => s.classList.remove('active'));
  dots.forEach(d => d.classList.remove('active'));
  slides[i].classList.add('active');
  dots[i].classList.add('active');
  currentSlide = i;
}
dots.forEach((dot, i) => dot.addEventListener('click', () => goToSlide(i)));
setInterval(() => goToSlide((currentSlide + 1) % slides.length), 7500);

// ============ SIZE RECOMMENDER ============
function openRecommender(){document.getElementById('recommenderModal').classList.add('show')}
function closeRecommender(){document.getElementById('recommenderModal').classList.remove('show')}
function calculateSize(){
  const h = +document.getElementById('height').value;
  const w = +document.getElementById('weight').value;
  if (!h || !w) return;
  const bmi = w / Math.pow(h/100, 2);
  let size = 'M', equiv = 'XL';
  if (bmi < 19) { size = 'XS'; equiv = 'M'; }
  else if (bmi < 22) { size = 'S'; equiv = 'L'; }
  else if (bmi < 26) { size = 'M'; equiv = 'XL'; }
  else if (bmi < 30) { size = 'L'; equiv = 'XXL'; }
  else if (bmi < 34) { size = 'XL'; equiv = '3XL'; }
  else { size = 'XXL'; equiv = '4XL'; }
  document.getElementById('recommendedSize').textContent = size;
  document.querySelectorAll('#recommendResult strong').forEach(s => s.textContent = equiv);
  document.getElementById('recommendResult').classList.add('show');
}

// ============ INTERACTIVE BUTTONS ============
document.querySelectorAll('.size-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  });
});
document.querySelectorAll('.color-option').forEach(c => {
  c.addEventListener('click', () => {
    document.querySelectorAll('.color-option').forEach(x => x.classList.remove('selected'));
    c.classList.add('selected');
  });
});
document.querySelectorAll('.filter-group button').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
document.querySelectorAll('.qty-selector button').forEach((b, i) => {
  b.addEventListener('click', () => {
    const input = b.parentElement.querySelector('input');
    let v = +input.value;
    if (i % 2 === 0) v = Math.max(1, v - 1); else v++;
    input.value = v;
  });
});

// ============ MOBILE MENU ============
function toggleMobile(){
  document.getElementById('mobileOverlay').classList.toggle('show');
}

// ============ SCROLL REVEAL ============
function observeReveals(){
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  }, {threshold:.12, rootMargin:'-30px 0px -30px 0px'});
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
observeReveals();
