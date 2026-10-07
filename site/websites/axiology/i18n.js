/* =============================================================================
   AXIOLOGY — Bilingual EN/AR
   Translations + apply + toggle. Persists choice in localStorage.
   ========================================================================== */

(function () {
  'use strict';

  const I18N = {
    en: {
      'nav.shop': 'Shop',
      'nav.rituals': 'Rituals',
      'nav.story': 'Story',
      'nav.journal': 'Journal',
      'nav.cart': 'Cart',
      'nav.contact': 'Contact',

      'hero.est': 'EST.',
      'hero.tagline': 'Cairo · Rooted in Africa',
      'hero.title': '<span class="line">Beauty in every</span><span class="line"><em>bottle.</em></span>',
      'hero.lede': 'Single-origin frankincense, coconut, and rose — hand-blended in Cairo, worn as a ritual.',
      'hero.lede2': 'Wild-harvested resin from Oman. Cold-pressed coconut from the African coast. Egyptian rose, in season only.',
      'hero.lede3': 'Three drops, every morning. The hands that mix it understand the skin that wears it.',
      'hero.lede4': 'Rose-infused exfoliation. The Pink Puff ritual — three minutes, twice a week, lifelong glow.',
      'hero.cta': 'Begin the ritual',
      'hero.cta2': 'Discover the origin',
      'hero.cta3': 'See the ritual',
      'hero.cta4': 'Shop Pink Puff',
      'hero.secondary': 'Watch our story',
      'hero.secondary2': 'View the ingredients',
      'hero.secondary3': 'Shop the bundle',
      'hero.secondary4': 'The scrub ritual',
      'hero.support': 'Free shipping across Egypt',
      'hero.guarantee': '14-day promise',
      'hero.scroll': 'Scroll',

      'marquee.items': '100% Natural <i></i> No Fillers <i></i> Cruelty-Free <i></i> Made in Egypt <i></i> Rooted in Africa <i></i>',

      'products.title': 'You make<br/><em>skin look good.</em>',
      'products.sub': 'Four signature rituals, hand-blended in Cairo from single-origin botanicals. Dark spots, dryness, dullness — handled.',

      'badge.bestseller': 'Bestseller',
      'badge.sale': 'Sale',
      'card.quick': 'Quick add',
      'card.cat.bundle': 'Complete Routine',
      'card.name.bundle': 'Pure Skin Bundle',
      'card.cat.scrub': 'Body Scrub Set',
      'card.name.puff': 'Pink Puff Set',
      'card.cat.frank': 'Natural Oil · 75ml',
      'card.name.frank': 'Frankincense Oil',
      'card.cat.coco': 'Natural Oil · 150g',
      'card.name.coco': 'Coconut Oil',

      'bottle.eyebrow': 'Crafted, drop by drop',
      'bottle.title': 'Every bottle.<br/><em>Held in two hands.</em>',
      'bottle.body': "No assembly lines. No fillers. Just slow hands in a Cairo workshop, decanting cold-pressed oil into glass — three drops at a time.",
      'bottle.l1': 'Single-origin frankincense from Oman',
      'bottle.l2': 'Hand-poured in Cairo workshop',
      'bottle.l3': 'Recyclable glass, refillable in store',
      'bottle.hint': 'Drag to spin · Move cursor to explore',

      'hscroll.eyebrow': 'The Walk-Through',
      'hscroll.title': 'A side-step through<br/><em>our apothecary shelf.</em>',

      'collections.eyebrow': 'The Apothecary',
      'collections.title': 'Explore <em>by ritual.</em>',
      'col.face': 'Face Care',
      'col.body': 'Body Care',
      'col.hair': 'Hair Care',
      'col.toner': 'Natural Toners',
      'col.soap': 'Natural Soaps',
      'col.bundle': 'Bundles',
      'col.scrub': 'The Scrub Club',

      'story.eyebrow': 'Our Story',
      'story.title': 'From a small Cairo apothecary,<br/><em>to your morning ritual.</em>',
      'story.body': 'Axiology began with a quiet conviction — that skincare should be sourced from where the earth breathes, not synthesized in a lab. We blend single-origin frankincense, cold-pressed coconut, and Egyptian rose in small batches, by hand, the old way.',
      'story.link': 'Read the full story →',

      'feature.eyebrow': 'The Complete Routine',
      'feature.title': 'Pure Skin <em>Bundle.</em>',
      'feature.body': 'The signature four-step ritual — frankincense water toner, frankincense & myrrh serum, frankincense cream, and our cult frankincense soap. Hand-blended in Cairo, worn as a ritual.',
      'feature.size': 'Complete · 4-step',
      'feature.cta': 'Add the bundle',

      'ritual.eyebrow': 'How African Cosmetics Works',
      'ritual.title': 'From worry<br/><em>to wellness.</em>',
      'ritual.sub': 'A four-step transformation, designed for Egyptian skin. Real ingredients. Real results.',
      'ritual.1.title': 'Powerful naturals',
      'ritual.1.body': 'Turmeric, frankincense, and plant oils that actually benefit your skin — sourced single-origin from Egypt and Africa.',
      'ritual.2.title': 'Targets skin issues',
      'ritual.2.body': 'Helps with acne, dark spots, and uneven texture. Made for the climate, the water, and the skin we actually live in.',
      'ritual.3.title': 'Visible difference',
      'ritual.3.body': '95% of customers report visibly clearer skin within 4 weeks of starting the ritual. Backed by results, not promises.',
      'ritual.4.title': 'Made to last',
      'ritual.4.body': 'No fillers, no fragrance, no compromise. Clean formulas in glass and recyclable packaging. Daily care, lifetime impact.',

      'press.eyebrow': 'As seen in',

      'trust.title': 'Trusted by <em>5,000+ </em>women across Egypt.',
      'trust.body': "Built quietly out of Cairo. Loved publicly by chefs, presenters, and women who simply want better skin — without the marketing noise.",
      'trust.m1': 'Happy customers',
      'trust.m2': 'Satisfying treatment',
      'trust.m3': 'Natural origin',

      'test.eyebrow': 'Worn as a Ritual',
      'test.role1': 'Chef',
      'test.role2': 'TV Presenter',
      'test.quote': 'It changed my skin.<br/><em>It changed my mornings.</em>',

      'news.eyebrow': 'Join the ritual',
      'news.title': 'Get 10% off your<br/><em>first ritual.</em>',
      'news.body': 'Quiet emails about new launches, founder notes, and the occasional ingredient story. No noise — just the things worth knowing.',
      'news.placeholder': 'your@email.com',
      'news.btn': 'Subscribe',
      'news.fine': 'No spam, ever. Unsubscribe in one click.',

      'cta.eyebrow': 'Begin',
      'cta.title': 'Begin your <em>ritual.</em>',
      'cta.btn': 'Shop the collection',
      'cta.support': 'Free shipping across Egypt · 14-day promise',

      'footer.credit': '© 2026 Axiology Cosmetics · Beauty in every bottle'
    },

    ar: {
      'nav.shop': 'المتجر',
      'nav.rituals': 'الطقوس',
      'nav.story': 'القصة',
      'nav.journal': 'المجلة',
      'nav.cart': 'السلة',
      'nav.contact': 'تواصل',

      'hero.est': 'تأسس',
      'hero.tagline': 'القاهرة · ضارب جذوره في إفريقيا',
      'hero.title': '<span class="line">الجمال في كل</span><span class="line"><em>زجاجة.</em></span>',
      'hero.lede': 'لبان ذكر، جوز هند، وورد مصري — مخلوط يدوياً في القاهرة، يُلبس كطقس.',
      'hero.lede2': 'لبان بري من عُمان. جوز هند معصور بارد من الساحل الإفريقي. ورد مصري — في موسمه فقط.',
      'hero.lede3': 'ثلاث قطرات كل صباح. الأيدي اللي بتخلطه تفهم البشرة اللي تلبسه.',
      'hero.lede4': 'تقشير بالورد. طقس البينك بَف — ثلاث دقائق، مرّتين في الأسبوع، لمعان مدى الحياة.',
      'hero.cta': 'ابدأ الطقس',
      'hero.cta2': 'اكتشف الأصل',
      'hero.cta3': 'شاهد الطقس',
      'hero.cta4': 'تسوّق البينك بَف',
      'hero.secondary': 'شاهد قصتنا',
      'hero.secondary2': 'استعرض المكونات',
      'hero.secondary3': 'تسوّق الحزمة',
      'hero.secondary4': 'طقس التقشير',
      'hero.support': 'شحن مجاني داخل مصر',
      'hero.guarantee': 'ضمان ١٤ يوم',
      'hero.scroll': 'انزل',

      'marquee.items': '١٠٠٪ طبيعي <i></i> بدون إضافات <i></i> صديق للحيوان <i></i> صُنع في مصر <i></i> ضارب في إفريقيا <i></i>',

      'products.title': 'بشرتك دلوقتي<br/><em>هتبان مختلفة.</em>',
      'products.sub': 'أربع طقوس مميزة، مخلوطة يدوياً في القاهرة من نباتات أصلية. البقع الداكنة، الجفاف، البهتان — كله بقى محلول.',

      'badge.bestseller': 'الأكثر مبيعاً',
      'badge.sale': 'تخفيض',
      'card.quick': 'أضف بسرعة',
      'card.cat.bundle': 'روتين كامل',
      'card.name.bundle': 'حزمة البشرة النقية',
      'card.cat.scrub': 'مقشّر للجسم',
      'card.name.puff': 'مجموعة بينك بَف',
      'card.cat.frank': 'زيت طبيعي · ٧٥مل',
      'card.name.frank': 'زيت اللبان الذكر',
      'card.cat.coco': 'زيت طبيعي · ١٥٠جم',
      'card.name.coco': 'زيت جوز الهند',

      'bottle.eyebrow': 'مصنوعة قطرة قطرة',
      'bottle.title': 'كل زجاجة.<br/><em>محمولة بإيدين.</em>',
      'bottle.body': 'لا خطوط إنتاج. لا إضافات. بس أيدي هادية في ورشة بالقاهرة، بتسكب الزيت المعصور بارد في الزجاج — ثلاث قطرات في كل مرة.',
      'bottle.l1': 'لبان ذكر أصلي من عُمان',
      'bottle.l2': 'مسكوب يدوياً في ورشة بالقاهرة',
      'bottle.l3': 'زجاج قابل لإعادة التدوير، يُعاد ملؤه في المتجر',
      'bottle.hint': 'اسحب للف · حرّك الماوس للاستكشاف',

      'hscroll.eyebrow': 'جولة الرف',
      'hscroll.title': 'خطوة جانبية على<br/><em>رف صيدليتنا.</em>',

      'collections.eyebrow': 'الصيدلية',
      'collections.title': 'اكتشف <em>حسب الطقس.</em>',
      'col.face': 'عناية بالوجه',
      'col.body': 'عناية بالجسم',
      'col.hair': 'عناية بالشعر',
      'col.toner': 'تونرات طبيعية',
      'col.soap': 'صابون طبيعي',
      'col.bundle': 'حِزم',
      'col.scrub': 'نادي المقشرات',

      'story.eyebrow': 'قصتنا',
      'story.title': 'من صيدلية صغيرة في القاهرة،<br/><em>إلى طقسك الصباحي.</em>',
      'story.body': 'بدأت أكسيولوجي بقناعة هادية — إن العناية بالبشرة لازم تيجي من الأرض اللي بتتنفس، مش من معمل. بنخلط لبان ذكر أصلي، زيت جوز هند معصور بارد، وورد مصري في دفعات صغيرة، يدوياً، بالطريقة القديمة.',
      'story.link': 'اقرأ القصة كاملة ←',

      'feature.eyebrow': 'الروتين الكامل',
      'feature.title': 'حزمة <em>البشرة النقية.</em>',
      'feature.body': 'الطقس الرسمي من أربع خطوات — تونر ماء اللبان، سيروم اللبان والمر، كريم اللبان، وصابوننا الأسطوري باللبان. مخلوط يدوياً في القاهرة.',
      'feature.size': 'كاملة · ٤ خطوات',
      'feature.cta': 'أضف الحزمة',

      'ritual.eyebrow': 'إزاي بتشتغل مستحضرات إفريقيا',
      'ritual.title': 'من القلق<br/><em>للعافية.</em>',
      'ritual.sub': 'تحوّل من أربع خطوات، مصمم للبشرة المصرية. مكونات حقيقية. نتائج حقيقية.',
      'ritual.1.title': 'مكونات طبيعية قوية',
      'ritual.1.body': 'كركم، لبان، وزيوت نباتية بتفيد بشرتك فعلاً — مصدرها أصلي من مصر وإفريقيا.',
      'ritual.2.title': 'بتستهدف مشاكل البشرة',
      'ritual.2.body': 'بتساعد على معالجة الحبوب، البقع الداكنة، وعدم انتظام الملمس. مصممة للجو والمياه والبشرة اللي بنعيش فيها.',
      'ritual.3.title': 'فرق ظاهر',
      'ritual.3.body': '٩٥٪ من العملاء بيشوفوا بشرة أنظر خلال ٤ أسابيع من بداية الطقس. مدعومة بالنتائج، مش بالوعود.',
      'ritual.4.title': 'مصنوعة لتدوم',
      'ritual.4.body': 'بدون إضافات، بدون عطور، بدون تنازلات. تركيبات نظيفة في زجاج وتغليف قابل لإعادة التدوير. عناية يومية، تأثير مدى الحياة.',

      'press.eyebrow': 'صدرنا في',

      'trust.title': 'موضع ثقة <em>+٥٠٠٠ </em>سيدة في مصر.',
      'trust.body': 'بُنيت بهدوء من القاهرة. وأحبتها علناً طبّاخات، مذيعات، وكل سيدة عايزة بشرة أفضل — بدون ضوضاء تسويق.',
      'trust.m1': 'عميلة سعيدة',
      'trust.m2': 'علاج مرضي',
      'trust.m3': 'منشأ طبيعي',

      'test.eyebrow': 'تُلبس كطقس',
      'test.role1': 'طبّاخة',
      'test.role2': 'مذيعة تلفزيونية',
      'test.quote': 'غيّرت بشرتي.<br/><em>غيّرت صبحي.</em>',

      'news.eyebrow': 'انضم للطقس',
      'news.title': 'احصل على خصم ١٠٪<br/><em>على أول طقس.</em>',
      'news.body': 'إيميلات هادية عن إطلاقات جديدة، ملاحظات من المؤسس، وأحياناً قصة مكوّن. بدون ضوضاء — بس الحاجات اللي تستاهل.',
      'news.placeholder': 'بريدك@الإلكتروني.com',
      'news.btn': 'اشترك',
      'news.fine': 'بدون رسائل مزعجة أبداً. إلغاء بضغطة واحدة.',

      'cta.eyebrow': 'ابدأ',
      'cta.title': 'ابدأ <em>طقسك.</em>',
      'cta.btn': 'تسوّق المجموعة',
      'cta.support': 'شحن مجاني داخل مصر · ضمان ١٤ يوم',

      'footer.credit': '© ٢٠٢٦ أكسيولوجي كوزمتكس · الجمال في كل زجاجة'
    }
  };

  function apply(lang) {
    const html = document.documentElement;
    html.setAttribute('data-lang', lang);
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    const dict = I18N[lang] || I18N.en;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const key = el.getAttribute('data-i18n-html');
      if (dict[key] !== undefined) el.innerHTML = dict[key];
    });
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const parts = el.getAttribute('data-i18n-attr').split('|');
      if (parts.length === 2 && dict[parts[1]] !== undefined) {
        el.setAttribute(parts[0], dict[parts[1]]);
      }
    });

    try { localStorage.setItem('axiology.lang', lang); } catch (_) {}

    // Notify other scripts (re-run any pending animations on translated nodes)
    window.dispatchEvent(new CustomEvent('axiology:langchange', { detail: { lang } }));
  }

  function toggle() {
    const cur = document.documentElement.getAttribute('data-lang') || 'en';
    apply(cur === 'en' ? 'ar' : 'en');
  }

  // initial
  let stored = 'en';
  try { stored = localStorage.getItem('axiology.lang') || 'en'; } catch (_) {}
  apply(stored);

  // wire toggle buttons
  document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
    btn.addEventListener('click', (e) => { e.preventDefault(); toggle(); });
  });

  window.AxiologyI18n = { apply, toggle, dict: I18N };
})();
