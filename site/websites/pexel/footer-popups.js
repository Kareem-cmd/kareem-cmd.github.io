(()=>{
 const content=window.pixelFooterContent;if(!content)return;
 const modal=document.createElement('dialog');modal.className='pixel-dialog';modal.setAttribute('aria-labelledby','pixel-dialog-title');
 modal.innerHTML='<div class="pixel-dialog-head"><span class="pixel-dialog-mark" aria-hidden="true">PIXEL / AGENCY</span><button type="button" class="pixel-dialog-close" aria-label="إغلاق / Close">×</button></div><div class="pixel-dialog-scroll"><h2 id="pixel-dialog-title"></h2><div class="pixel-dialog-content"></div></div><div class="pixel-dialog-edge" aria-hidden="true"></div>';
 document.body.append(modal);const body=modal.querySelector('.pixel-dialog-content'),heading=modal.querySelector('h2'),closeButton=modal.querySelector('button');let opener,oldOverflow,timer;
 for(let i=0;i<20;i++){let tile=document.createElement('i');tile.style.setProperty('--i',i);modal.querySelector('.pixel-dialog-edge').append(tile)}
 function close(){if(!modal.open||modal.classList.contains('leaving'))return;modal.classList.add('leaving');timer=setTimeout(()=>modal.close(),matchMedia('(prefers-reduced-motion: reduce)').matches?0:220)}
 modal.addEventListener('close',()=>{clearTimeout(timer);modal.classList.remove('leaving');document.body.style.overflow=oldOverflow;opener?.focus()});modal.addEventListener('cancel',e=>{e.preventDefault();close()});closeButton.onclick=close;modal.addEventListener('click',e=>{const r=modal.getBoundingClientRect();if(e.target===modal&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))close()});
 document.querySelectorAll('.footer-links li a').forEach(link=>{
  const href=link.getAttribute('href');const key=href.includes('about.html')?'about':href.includes('privacy.html')?'privacy':href.includes('terms.html')?'terms':href.endsWith('#contact')?'contact':null;if(!key)return;
  link.setAttribute('aria-haspopup','dialog');link.addEventListener('click',e=>{
   e.preventDefault();opener=link;body.replaceChildren();modal.dir='rtl';const en=document.documentElement.lang==='en';
   if(key==='contact'){
    heading.textContent=en?'Contact us':'اتصل بنا';modal.dir=en?'ltr':'rtl';const intro=document.createElement('p');intro.textContent=en?'Tell us about your project. Reach our team directly by phone or email.':'احكِ لنا عن مشروعك، وتواصل مع فريقنا مباشرة عبر الهاتف أو البريد الإلكتروني.';body.append(intro);
    const items=[['mailto:info@pixelagencysa.com','info@pixelagencysa.com'],['tel:+966574857090','+966 57 485 7090'],['tel:+966574540507','+966 57 454 0507']];items.forEach(([href,text])=>{const a=document.createElement('a');a.className='pixel-contact-link';a.href=href;a.textContent=text;a.dir='ltr';body.append(a)});const address=document.createElement('p');address.className='pixel-contact-address';address.lang='en';address.dir='ltr';address.textContent='Riyadh — Al Malaz';body.append(address);
   }else{
    const doc=content[key];heading.textContent=doc.title;let list=null;doc.rows.forEach(([tag,text])=>{const el=document.createElement(tag==='h1'?'h3':tag);el.textContent=text;if(tag==='li'){if(!list){list=document.createElement('ul');body.append(list)}list.append(el)}else{list=null;body.append(el)}});
   }
   oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';modal.classList.remove('leaving');modal.showModal();modal.querySelector('.pixel-dialog-scroll').scrollTop=0;closeButton.focus();
  });
 });
})();
