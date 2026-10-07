/* ============================================================
   KIRA — project catalogue. Consumed by project.html (?p=slug).
   Each entry: { title, cat, images:[...] }. Social projects build
   their gallery from the per-project folder; Chamelo covers are single.
   ============================================================ */
(function () {
  function g(dir, n) { var a = []; for (var i = 1; i <= n; i++) a.push('Assets/work/' + dir + '/' + (i < 10 ? '0' : '') + i + '.jpg'); return a; }
  function one(file) { return ['Assets/work/' + file]; }

  window.KIRA_PROJECTS = {
    /* Chamelo — single cover each */
    'cf-01': { title: 'Chamelo', cat: 'Branding', images: one('cf-01.webp') },
    'cf-02': { title: 'Linepack', cat: 'Packaging', images: one('cf-02.webp') },
    'cf-03': { title: 'FORK Agency', cat: 'Branding', images: one('cf-03.webp') },
    'cf-04': { title: 'DRAX', cat: 'Branding', images: one('cf-04.webp') },
    'cf-05': { title: 'VLORA', cat: 'Identity', images: one('cf-05.webp') },
    'cf-06': { title: 'Meow Shop', cat: 'Social', images: one('cf-06.webp') },
    'cf-07': { title: 'Irtiqaa', cat: 'Branding', images: one('cf-07.webp') },
    'cf-08': { title: 'TAR', cat: 'Branding', images: one('cf-08.webp') },
    'cf-09': { title: 'Nano Shield', cat: 'Packaging', images: one('cf-09.webp') },
    'cf-10': { title: 'Narmer', cat: 'Branding', images: one('cf-10.webp') },
    'cf-11': { title: 'Tharad Tech', cat: 'Branding', images: one('cf-11.webp') },
    'cf-12': { title: 'ORA', cat: 'Identity', images: one('cf-12.webp') },
    'cf-13': { title: 'Novix', cat: 'Branding', images: one('cf-13.webp') },
    'cf-14': { title: 'E Cart', cat: 'Branding', images: one('cf-14.webp') },
    'cf-15': { title: 'Velura', cat: 'Identity', images: one('cf-15.webp') },
    'cf-16': { title: 'Convert X', cat: 'Branding', images: one('cf-16.webp') },
    'cf-17': { title: 'LORA', cat: 'Packaging', images: one('cf-17.webp') },
    'cf-18': { title: 'NAQAA', cat: 'Branding', images: one('cf-18.webp') },
    'cf-19': { title: 'CHICK', cat: 'Identity', images: one('cf-19.webp') },
    'cf-20': { title: 'Koronfulah', cat: 'Packaging', images: one('cf-20.webp') },
    'cf-21': { title: 'AREEZA', cat: 'Packaging', images: one('cf-21.webp') },
    'cf-22': { title: 'Funny Brands', cat: 'Branding', images: one('cf-22.webp') },
    'cf-23': { title: 'Path Pharmacy', cat: 'Branding', images: one('cf-23.webp') },
    'cf-24': { title: 'Abaya', cat: 'Identity', images: one('cf-24.webp') },
    'cf-25': { title: 'Murjan', cat: 'Branding', images: one('cf-25.webp') },
    'cf-26': { title: 'Sneakers', cat: 'Packaging', images: one('cf-26.webp') },
    'cf-27': { title: 'SCOOP', cat: 'Identity', images: one('cf-27.webp') },
    'cf-28': { title: "Mutma'inna", cat: 'Branding', images: one('cf-28.webp') },
    'cf-29': { title: 'Al-Sham Roastery', cat: 'Social', images: one('cf-29.webp') },
    'cf-30': { title: 'GROOVY', cat: 'Social', images: one('cf-30.webp') },
    'cf-31': { title: 'Arabic Calligraphy', cat: 'Art', images: one('cf-31.webp') },
    'cf-32': { title: 'Bionic', cat: 'Branding', images: one('cf-32.webp') },
    'cf-33': { title: 'Eid Al-Adha', cat: 'Social', images: one('cf-33.webp') },

    /* Social-media projects — full galleries */
    'kandi': { title: 'KANDI', cat: 'Social media', images: g('kandi', 7) },
    'drill': { title: 'DRILL', cat: 'Social media', images: g('drill', 12) },
    'sera': { title: 'Sera', cat: 'Social media', images: g('sera', 26) },
    'fat-boy': { title: 'Fat Boy', cat: 'Social media', images: g('fat-boy', 10) },
    'chick': { title: 'CHICK', cat: 'Social media', images: g('chick', 50) },
    'de-samrt': { title: 'De Smart', cat: 'Social media', images: g('de-samrt', 3) },
    'hack': { title: 'HACK', cat: 'Social media', images: g('hack', 10) },
    'convert-x': { title: 'Convert X', cat: 'Social media', images: g('convert-x', 12) },
    'loran': { title: 'LORAN', cat: 'Social media', images: g('loran', 12) },
    'edufiy': { title: 'Edufiy', cat: 'Social media', images: g('edufiy', 7) },
    'imagen-interior': { title: 'Imagen Interiors', cat: 'Social media', images: g('imagen-interior', 42) },
    'voxel': { title: 'VOXEL', cat: 'Social media', images: g('voxel', 11) },
    'quiet-place': { title: 'Quiet Place', cat: 'Social media', images: g('quiet-place', 20) },
    'bono': { title: 'Bono', cat: 'Social media', images: g('bono', 28) },
    'rashaqa': { title: 'Rashaqa', cat: 'Social media', images: g('rashaqa', 11) }
  };
})();
