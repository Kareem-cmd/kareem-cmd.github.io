window.PRODUCTS = [
 {id:1,name:'بن هرري أبو غزال',category:'coffee',weight:'٥ كجم',brand:'غزال المستنير',image:1,description:'بن هرري أبو غزال في عبوة قماشية بمقبض. يظهر على العبوة اسم المستنير ووزن صافٍ ٥ كجم.',bulk:true},
 {id:4,name:'بن هرري الزهرتين',category:'coffee',weight:'٥ كجم',brand:'الزهرتين',image:4,description:'بن هرري بعلامة الزهرتين، في عبوة قماشية خضراء. الوزن المدوّن ٥ كجم.',bulk:true},
 {id:3,name:'هيل أبو طيارة XL',category:'cardamom',weight:'٥ كجم',brand:'أبو طيارة',image:3,description:'هيل هندي أخضر طبيعي، مقاس XL كما هو مدوّن على العبوة البنفسجية. الوزن الصافي ٥ كجم.',bulk:true},
 {id:6,name:'هيل أبو طيارة',category:'cardamom',weight:'٢٥٠ جم',brand:'أبو طيارة',image:6,description:'هيل هندي أخضر طبيعي في العبوة البرتقالية الصغيرة. الوزن المدوّن ٢٥٠ جم. الصورة أرشيفية ولا تمثل دفعة حالية.',bulk:false},
 {id:5,name:'هيل أبو طيارة',category:'cardamom',weight:'٥ كجم',brand:'أبو طيارة',image:5,description:'هيل هندي أخضر طبيعي في عبوة برتقالية بمقبض. الوزن المدوّن ٥ كجم. الصورة أرشيفية ولا تمثل دفعة حالية.',bulk:true},
 {id:13,name:'هيل أبو طيارة XL — كرتون',category:'cardamom',weight:'١٠ كجم',brand:'أبو طيارة',image:13,description:'كرتون هيل هندي أخضر طبيعي بعلامة أبو طيارة، مقاس XL. الوزن الظاهر ١٠ كجم؛ عدد العبوات الداخلية يحتاج تأكيدًا.',bulk:true},
 {id:11,name:'هيل أبو طيارة XXL — كرتون',category:'cardamom',weight:'١٠ كجم',brand:'أبو طيارة',image:11,description:'كرتون هيل هندي أخضر طبيعي باللون البرتقالي، مقاس XXL كما يظهر على العبوة. عدد العبوات الداخلية يحتاج تأكيدًا.',bulk:true},
 {id:12,name:'بن أبو غزال — كيس خيش',category:'coffee',weight:'الوزن عند التأكيد',brand:'غزال المستنير',image:12,description:'كيس خيش من تشكيلة بن أبو غزال المستنير. يلزم تأكيد الوزن ودرجة البن قبل اعتماد الطلب.',bulk:true},
 {id:2,name:'بن — العبوة الحمراء',category:'coffee',weight:'٥ كجم',brand:'المستنير',image:2,description:'عبوة بن قماشية حمراء بمقبض، الوزن المدوّن ٥ كجم. القراءة المرجحة لاسم الصنف «لقمي» وتحتاج اعتمادًا من التاجر.',bulk:true},
 {id:9,name:'بن الزهرتين — العبوة الحمراء',category:'coffee',weight:'٥ كجم',brand:'الزهرتين',image:9,description:'عبوة بن حمراء بعلامة الزهرتين ووزن ٥ كجم. يلزم تأكيد الاسم التجاري الدقيق للصنف.',bulk:true},
 {id:7,name:'بن سنابل — كيس خيش',category:'coffee',weight:'الوزن عند التأكيد',brand:'سنابل',image:7,description:'كيس بن بعلامة سنابل ضمن صور التشكيلة. الوزن والمنشأ والدرجة تحتاج تأكيدًا قبل الطلب.',bulk:true},
 {id:10,name:'بن سنابل — الطباعة الخضراء',category:'coffee',weight:'الوزن عند التأكيد',brand:'سنابل',image:10,description:'كيس خيش بعلامة سنابل وطباعة خضراء. لا تكفي الصورة لاعتماد الوزن أو علاقة هذا الصنف بالعبوة الأخرى.',bulk:true},
 {id:8,name:'بن — عبوة خيش مربوطة',category:'coffee',weight:'تفاصيل العبوة عند التأكيد',brand:'المستنير',image:8,description:'عبوة خيش مربوطة كما وردت في صور التشكيلة. الاسم التجاري والوزن يحتاجان إلى تأكيد؛ لا تُفترض بيانات غير مقروءة.',bulk:true}
];

// Deliberately fictional preview prices, authorized for this visual demo.
// These values are not quotes, live prices, or inventory data.
const demoPricesSAR = {
  1: 225, 4: 210, 3: 595, 6: 35, 5: 575, 13: 1120, 11: 1190,
  12: 925, 2: 185, 9: 195, 7: 875, 10: 895, 8: 945
};
window.PRODUCTS = window.PRODUCTS.map(product => ({
  ...product,
  demoPrice: demoPricesSAR[product.id]
}));
