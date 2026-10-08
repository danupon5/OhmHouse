// Classify before reparenting: child meshes retain their parent assembly names here.
export const deviceLayers=[
 ['furniture','เฟอร์นิเจอร์ / หิ้งพระ',true],
 ['kitchen','เคาน์เตอร์ / ซิงค์ครัว',true],
 ['appliances','เครื่องใช้ไฟฟ้า',true],
 ['bathroom','สุขภัณฑ์ / กระจก / ฉากกั้น',true],
 ['lighting','โคมไฟ',true],
 ['electrical','ปลั๊ก / สวิตช์ / ตู้ไฟ',true],
 ['waterEquipment','ถังน้ำ / เครื่องกรอง / ปั๊ม',true],
 ['waterPipes','ท่อน้ำดี / ก๊อกน้ำ',false],
 ['wastewater','ท่อน้ำทิ้ง / ถังแซท / บ่อซึม',false],
 ['electricalRoutes','ท่อไฟฟ้าใต้ผนัง / ฝ้า',false]
];
export function classifyDevice(names){
 const has=re=>names.some(name=>re.test(name));
 if(has(/^(รางหลักใหม่_|รางย่อยใหม่_|ท่อแขนงใหม่_|ท่อเชื่อมผนังซ่อน_|ระบบไฟใหม่_)/))return 'electricalRoutes';
 if(has(/^(ท่อน้ำทิ้ง|ระบบท่อชักโครก|ถังแซท|บ่อซึม|น้ำทิ้ง|ปลายพักน้ำทิ้ง|ท่อลงใต้โถ|ท่ออากาศ|ท่อโสโครก|ปากท่ออากาศ)/))return 'wastewater';
 if(has(/^(ระบบน้ำดี|น้ำดี_|วาล์วน้ำ_|ก๊อกน้ำ_|ท่อน้ำดี)/))return 'waterPipes';
 if(has(/^(ชุดเครื่องกรอง|ถังน้ำดี_|เครื่องกรอง|ปั๊มน้ำ)/))return 'waterEquipment';
 if(has(/^(สวิตช์_|เต้ารับ_|กล่องฝาทึบ_|กล่องปลั๊ก_CCTV|ตู้คอนซูมเมอร์|ช่องเสาอากาศทีวี)/))return 'electrical';
 if(has(/^ไฟ/))return 'lighting';
 if(has(/^(เครื่องซักผ้า|ตู้เย็น|ทีวี_ติด|แอร์|เครื่องทำน้ำอุ่น)/))return 'appliances';
 if(has(/^ห้องน้ำ[12]_(กระจก|ก๊อกอ่าง|ฉาก|ฉีดชำระ|ชุดฝักบัว|ตัวยึดกระจก|อ่าง|เคาน์เตอร์|โถสุขภัณฑ์)/))return 'bathroom';
 if(has(/^(เคาน์เตอร์ครัว|ซิงค์|ก๊อกซิงค์)/))return 'kitchen';
 if(has(/^(เตียง|โซฟา|ตู้เสื้อผ้า|ตู้วางทีวี|เคาน์เตอร์วางของ|หิ้งพระ|โต๊ะ|เก้าอี้)/))return 'furniture';
 return null;
}
