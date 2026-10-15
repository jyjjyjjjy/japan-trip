const { createApp, ref, reactive, computed, watch, onMounted, nextTick } = Vue;

/* ---------- static trip data ---------- */
const TRIP_DAYS = ['2026-11-21','2026-11-22','2026-11-23','2026-11-24','2026-11-25','2026-11-26','2026-11-27','2026-11-28','2026-11-29'];
const TRIP_START = '2026-11-21', TRIP_END = '2026-11-29';
const KIX = { lat: 34.4320, lng: 135.2304, name: '關西機場 KIX' };

const FLIGHTS = [
  { id: 'f1', dir: 'out', airline: 'Vietnam Airlines', date: '2026-11-21', no: 'VN680', from: 'KUL', fromCity: 'Kuala Lumpur', to: 'HAN', toCity: 'Hanoi',  dep: '20:10', arr: '22:30', dur: '3h 20m', arrNote: '' },
  { id: 'f2', dir: 'out', airline: 'Vietnam Airlines', date: '2026-11-22', no: 'VN334', from: 'HAN', fromCity: 'Hanoi', to: 'KIX', toCity: 'Osaka Kansai', dep: '01:00', arr: '06:55', dur: '3h 55m', arrNote: '' },
  { id: 'f3', dir: 'in',  airline: 'Vietnam Airlines', date: '2026-11-29', no: 'VN335', from: 'KIX', fromCity: 'Osaka Kansai', to: 'HAN', toCity: 'Hanoi', dep: '10:00', arr: '13:35', dur: '5h 35m', arrNote: '' },
  { id: 'f4', dir: 'in',  airline: 'Vietnam Airlines', date: '2026-11-29', no: 'VN681', from: 'HAN', fromCity: 'Hanoi', to: 'KUL', toCity: 'Kuala Lumpur', dep: '14:50', arr: '19:10', dur: '3h 20m', arrNote: '' },
];

const HOTELS = [
  { city: 'Kyoto', name: 'Daiya Ryokan', dates: '22 – 24 Nov（2 晚）', from: '2026-11-22', to: '2026-11-24',
    address: '〒600-8148 京都府京都市下京区飴屋町292', phone: '', lat: 34.9877, lng: 135.7587 },
  { city: 'Osaka', name: 'Ebisu 804', dates: '24 – 29 Nov（5 晚）', from: '2026-11-24', to: '2026-11-29',
    address: '2-chome-4-14 Ebisuhonmachi, Naniwa, Osaka', phone: '', lat: 34.6537, lng: 135.5013 },
];

/* weather location per day */
const PLACES = {
  '2026-11-21': { name: 'Kuala Lumpur', lat: 3.139, lng: 101.687 },
  '2026-11-22': { name: 'Kyoto', lat: 35.0116, lng: 135.7681 },
  '2026-11-23': { name: 'Kyoto', lat: 35.0116, lng: 135.7681 },
};
const OSAKA = { name: 'Osaka', lat: 34.6937, lng: 135.5023 };

const CATS = ['景點', '住宿', '美食', '購物', '航班', '其他'];
const EXP_CATS = ['交通', '飲食', '住宿', '門票', '購物', '其他'];

const uid = () => Math.random().toString(36).slice(2, 10);

// in-park slot on 25 Nov (USJ): stays inside the park, so no travel connector
const park = (time, name, extra = {}) => ({ id: uid(), date: '2026-11-25', category: '景點', name, time, address: 'Universal Studios Japan, Osaka', lat: 34.6654, lng: 135.4323, noTravel: true, ...extra });

const defaultItems = () => [
  { id: uid(), date: '2026-11-21', category: '航班', flightId: 'f1', name: 'VN680 KUL → HAN' },
  { id: uid(), date: '2026-11-21', category: '航班', flightId: 'f2', name: 'VN334 HAN → KIX' },
  { id: uid(), date: '2026-11-22', category: '住宿', name: 'Daiya Ryokan 寄放行李 / 入住', address: 'Daiya Ryokan Kyoto', lat: 34.9877, lng: 135.7587, hours: 'Check-in 15:00', note: '06:55 抵達 KIX → 約 09:00–09:30 搭 JR Haruka 到京都站（約 75 分）。先寄放行李（請提前聯絡旅館），約 15:00 才能入住' },
  { id: uid(), date: '2026-11-22', category: '景點', name: '伏見稻荷大社', address: 'Fushimi Inari Taisha, Kyoto', lat: 34.9671, lng: 135.7727, hours: '24 小時開放', ticket: '免費', note: 'JR 奈良線「稻荷」站下車。千本鳥居走到四辻看市景即可，午餐可吃參道攤販的稻荷壽司' },
  { id: uid(), date: '2026-11-22', category: '景點', name: '東福寺', address: 'Tofuku-ji, Kyoto', lat: 34.9768, lng: 135.7740, hours: '紅葉季約 08:30 – 16:30', ticket: '通天橋 紅葉季約 ¥1,000（以官網為準）', note: '稻荷站搭 JR 奈良線 1 站。通天橋紅葉是重點，中午前後最擠，建議 13:30 後入場' },
  { id: uid(), date: '2026-11-22', category: '景點', name: '清水寺', address: 'Kiyomizu-dera, Kyoto', lat: 34.9949, lng: 135.7850, hours: '約 06:00 – 18:00（秋季可能有夜間特別參拜）', ticket: '約 ¥500', note: '舞台俯瞰紅葉主打景點。人多，建議下午抵達、順便等日落；夜間特別參拜日期請查官網' },
  { id: uid(), date: '2026-11-22', category: '景點', name: '二年坂・產寧坂', address: 'Sannenzaka, Kyoto', lat: 34.9979, lng: 135.7800, hours: '商店多數 約 10:00 – 17:30', ticket: '免費', note: '清水寺下坡沿路散步、買伴手禮與抹茶甜點' },
  { id: uid(), date: '2026-11-22', category: '美食', name: '晚餐（待定）', note: '祇園 / 河原町一帶' },
  { id: uid(), date: '2026-11-23', category: '景點', name: '嵐山竹林小徑', address: 'Arashiyama Bamboo Forest, Kyoto', lat: 35.0170, lng: 135.6713, hours: '24 小時開放', ticket: '免費', note: '人潮多，建議 07:30 前到；順路可看野宮神社（免費）' },
  { id: uid(), date: '2026-11-23', category: '景點', name: '天龍寺', address: 'Tenryu-ji, Kyoto', lat: 35.0158, lng: 135.6738, hours: '約 08:30 – 17:00', ticket: '庭園 約 ¥500', note: '曹源池庭園紅葉；北門出口直通竹林' },
  { id: uid(), date: '2026-11-23', category: '景點', name: '大河內山莊庭園', address: 'Okochi Sanso Garden, Kyoto', lat: 35.0183, lng: 135.6747, hours: '約 09:00 – 17:00', ticket: '約 ¥1,000（含抹茶與和菓子）', note: '可遠眺京都市區與紅葉的庭園' },
  { id: uid(), date: '2026-11-23', category: '景點', name: '常寂光寺', address: 'Jojakkoji, Kyoto', lat: 35.0197, lng: 135.6642, hours: '約 09:00 – 17:00', ticket: '約 ¥500', note: '嵐山賞楓名所，仁王門與多寶塔配紅葉很上相，坡道較多' },
  { id: uid(), date: '2026-11-23', category: '景點', name: '渡月橋', address: 'Togetsukyo Bridge, Kyoto', lat: 35.0094, lng: 135.6779, hours: '24 小時', ticket: '免費', note: '嵐山地標，傍晚的河岸與山景很美' },
  { id: uid(), date: '2026-11-23', category: '美食', name: '嵐山午餐（待定）', note: '湯豆腐 / 蕎麥麵 / 抹茶甜點' },
  { id: uid(), date: '2026-11-24', category: '住宿', name: '退房 Daiya Ryokan', address: 'Daiya Ryokan Kyoto', lat: 34.9877, lng: 135.7587, noTravel: true, hours: 'Check-out 請向旅館確認（通常約 10:00–11:00）', note: '退房後請旅館代為保管行李，傍晚前取回。若不想帶行李逛，可跳過下面兩個選擇性景點，直接去大阪' },
  { id: uid(), date: '2026-11-24', category: '景點', name: '永觀堂（選擇性）', address: 'Eikando Zenrinji, Kyoto', lat: 35.0053, lng: 135.7947, hours: '約 09:00 – 17:00（紅葉季可能有夜間特別拜觀）', ticket: '約 ¥1,000（以官網為準）', note: '京都紅葉名所，庭園與池畔倒影很美；與南禪寺步行約 5–10 分鐘' },
  { id: uid(), date: '2026-11-24', category: '景點', name: '南禪寺（選擇性）', address: 'Nanzen-ji, Kyoto', lat: 35.0113, lng: 135.7940, hours: '約 08:40 – 16:40', ticket: '境內免費；方丈庭園、三門各約 ¥600', note: '水路閣紅磚拱橋配紅葉很上相，可只逛境內免費區域' },
  { id: uid(), date: '2026-11-24', category: '住宿', name: 'Ebisu 804 入住', address: 'Ebisuhonmachi Naniwa Osaka', lat: 34.6537, lng: 135.5013, hours: 'Check-in 時間請向房東確認', travelMode: '電車', travelMin: 120, travelNote: '估算：到京都站（取行李）→ JR 新快速到大阪 → 環狀線到新今宮 → 步行；請用 Google Maps 查實際班次', note: '先放行李，請提前聯絡房東能否提早寄放。晚上早點休息，明天要 USJ 頂門' },
  { id: uid(), date: '2026-11-24', category: '景點', name: '新世界・通天閣', address: 'Tsutenkaku, Osaka', lat: 34.6525, lng: 135.5063, hours: '展望台約 10:00 – 19:00（請查官網）', ticket: '展望台約 ¥1,000', note: '離住處步行可到。復古街區、串炸店很多；晚餐可在這邊吃' },
  { id: uid(), date: '2026-11-24', category: '美食', name: '道頓堀晚餐', address: 'Dotonbori, Osaka', lat: 34.6687, lng: 135.5013, hours: '店家各異', note: '看固力果招牌、吃章魚燒。明天要早起，建議 21:00 前回住處' },
  { id: uid(), date: '2026-11-25', category: '景點', name: '前往 USJ・開園前排隊', time: '07:30', address: 'Universal Studios Japan, Osaka', lat: 34.6654, lng: 135.4323, travelMode: '電車', travelMin: 40, travelNote: '估算：Ebisucho 站 → 轉車（新今宮／西九條）→ Universal City，路線規劃約 38 分；06:15 左右出發，請用 Google Maps 查實際班次', hours: '官方 09:00 開園，實際約 08:15–09:00 入園（以官網為準）', ticket: 'Express 4 ～トロッコ＆ジョーズ～', note: '07:30 前到門口排隊。出發前先下載 USJ 官方 App 並登入，票放手機。' },
  park('08:30', '飛天翼龍（直接排）', { note: '開園後直奔，早上排隊最短。身高需 132–198 公分，先寄放隨身物品。' }),
  park('09:30', 'JAWS（直接排）', { note: '早上較好排。與飛天翼龍、侏羅紀公園同一區，走路少。' }),
  park('10:15', '侏羅紀公園乘車游（Express 自選）', { note: '使用 Express「JAWS 或 侏羅紀」二選一的名額，選侏羅紀（JAWS 已直接排）。' }),
  park('11:00', '哈利波特魔法世界（Express 自選）', { note: '禁忌之旅用 Express「飛天翼龍 或 哈利波特」名額，選哈利波特（飛天翼龍已直接排）。再逛鷹馬飛行、喝黃油啤酒。若需區域整理券請看 App。' }),
  park('12:30', '午餐（任天堂入場前吃完）', { category: '美食', note: '13:20 前吃完、上廁所。給自己 20 分鐘從魔法世界走到任天堂的緩衝。' }),
  park('13:50', '超級任天堂世界入場（Express 指定）', { hours: '13:50 起入場，再入場不可', ticket: 'Express 含入場', note: '離開後不能再用同一次入場進去，進去前先安排好。' }),
  park('13:50', '馬力歐賽車 ～庫巴的挑戰書～', { hours: '13:50–14:20（Express 指定時段）' }),
  park('14:20', '咚奇剛的瘋狂礦車', { hours: '14:20–14:50（Express 指定時段）' }),
  park('14:50', '任天堂園區自由逛', { note: '耀西冒險、庫巴城堡、商店與餐廳。14:00 的 NoLimit 遊行會錯過，可放棄。' }),
  park('16:00', '小黃人園區與其他想玩的', { note: '小黃人、好萊塢區。看 App 即時排隊時間調整。' }),
  park('17:30', '晚餐・燈飾', { category: '美食', note: '官方 21:00 關園，建議 20:30 前離園，回住處好好休息。' }),
  { id: uid(), date: '2026-11-26', category: '景點', name: '（待安排）', note: '' },
  { id: uid(), date: '2026-11-27', category: '美食', name: '（待安排）', note: '' },
  { id: uid(), date: '2026-11-28', category: '購物', name: '（待安排）', note: '' },
  { id: uid(), date: '2026-11-29', category: '航班', flightId: 'f3', name: 'VN335 KIX → HAN' },
  { id: uid(), date: '2026-11-29', category: '航班', flightId: 'f4', name: 'VN681 HAN → KUL' },
];

const defaultChecklist = () => [
  { id: uid(), text: '護照', note: '確認有效期', done: false },
  { id: uid(), text: 'Visit Japan Web 填寫', note: '入境審查＋海關申報，取得 QR Code，出發前完成', done: false },
  { id: uid(), text: 'eSIM', note: '出發前先買好並設定，落地後開啟', done: false },
  { id: uid(), text: '旅遊保險', note: '含醫療與行李延誤，保單截圖存手機', done: false },
  { id: uid(), text: '電子機票 / 登機證', note: 'VN680、VN334、VN335、VN681', done: false },
  { id: uid(), text: 'USJ 快速通關 & 官方 App', note: '票放在手機、先登入 App', done: false },
  { id: uid(), text: '聯絡 Daiya Ryokan', note: '22 日上午 10:00 前後寄放行李；24 日退房後寄放行李', done: false },
  { id: uid(), text: '聯絡 Ebisu 804 房東', note: '確認入住時間與 24 日能否提早寄放行李', done: false },
  { id: uid(), text: '日幣現金 / 信用卡', note: '確認海外刷卡與提款手續費', done: false },
  { id: uid(), text: '手機、充電器、行動電源', done: false },
  { id: uid(), text: '轉接頭', done: false },
  { id: uid(), text: '常用藥品', done: false },
  { id: uid(), text: '保暖外套 / 雨具', note: '11 月底京阪早晚約 5–15°C', done: false },
  { id: uid(), text: '行李打包', done: false },
];

/* ---------- storage ---------- */
const KEY = 'trip-kansai-v1';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const saved = load();

/* ---------- helpers ---------- */
const haversine = (a, b) => {
  const R = 6371, rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const fmtMin = m => m >= 60 ? `${Math.floor(m / 60)} 小時${m % 60 ? ' ' + (m % 60) + ' 分' : ''}` : `${m} 分`;
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const WCODE = code => {
  if (code === 0) return ['☀️', '晴'];
  if (code <= 3) return ['⛅', code === 1 ? '大致晴朗' : '多雲'];
  if (code <= 48) return ['☁️', '陰 / 霧'];
  if (code <= 67 || (code >= 80 && code <= 82)) return ['🌧️', '下雨'];
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return ['❄️', '下雪'];
  return ['⛈️', '雷雨'];
};

const ICONS = {
  home: '<path d="M3 11l9-8 9 8M5 9.5V20h5v-6h4v6h5V9.5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
  palette: '<circle cx="13.5" cy="6.5" r=".8" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".8" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".8" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".8" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.7-.8 1.7-1.7 0-.4-.2-.8-.5-1.1-.3-.3-.4-.7-.4-1.1 0-.9.8-1.7 1.7-1.7H16c3.3 0 6-2.7 6-6 0-4.9-4.5-8.4-10-8.4z"/>',
  type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  moon: '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>',
  sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  basket: '<path d="M4 10h16l-1.6 9a2 2 0 01-2 1.7H7.6a2 2 0 01-2-1.7zM8 10l3-6M16 10l-3-6M9.5 14v3M12 14v3M14.5 14v3"/>',
  yen: '<circle cx="12" cy="12" r="10"/><path d="M8.5 7l3.5 5 3.5-5M12 12v6M9 14h6M9 17h6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16z"/>',
  nav: '<path d="M3 11l18-8-8 18-2-8z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  ticket: '<path d="M3 9a2 2 0 002-2h14a2 2 0 002 2v0a2 2 0 000 6v0a2 2 0 00-2 2H5a2 2 0 00-2-2v0a2 2 0 000-6z"/>',
  dots: '<circle cx="12" cy="5" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/><circle cx="12" cy="19" r="1.7" fill="currentColor"/>',
  grip: '<circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/>',
  plane: '<path d="M2 14l8-2-3-8 2-1 6 8 5-1.5a1.6 1.6 0 01.6 3L15 15l-1 6-2 .5-1-6.5-8-1z" stroke-linejoin="round"/>',
};

/* ---------- components ---------- */
const Ic = {
  props: ['name'],
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" v-html="path"></svg>`,
  computed: { path() { return ICONS[this.name] || ''; } },
};

const FlightCard = {
  props: { f: Object, handle: Boolean },
  emits: ['edit', 'nav'],
  methods: { wd(d) { return WD[new Date(d + 'T00:00:00').getDay()] + ' ' + new Date(d + 'T00:00:00').getDate() + ' Nov'; } },
  template: `
  <div v-if="f" class="relative rounded-2xl bg-white shadow-sm">
    <div class="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-sky to-sky-deep px-4 py-2 text-white">
      <div class="flex items-center gap-2">
        <span v-if="handle" class="drag-handle -ml-1 cursor-grab touch-none opacity-80"><ic name="grip" class="h-5 w-5"></ic></span>
        <span class="text-xs font-medium tracking-wide">{{ f.airline }}</span>
      </div>
      <span class="text-xs">{{ wd(f.date) }}</span>
    </div>
    <div class="px-4 pb-4 pt-3">
      <div class="flex items-center justify-between">
        <div><div class="font-maru text-3xl font-bold">{{ f.from }}</div><div class="text-[11px] text-ink/45">{{ f.fromCity }}</div></div>
        <div class="flex flex-1 flex-col items-center px-3">
          <div class="text-[11px] text-ink/45">{{ f.dur }}</div>
          <div class="my-1 flex w-full items-center text-sky-deep"><span class="h-px flex-1 border-t border-dashed border-sky"></span><ic name="plane" class="mx-1 h-5 w-5 rotate-45"></ic><span class="h-px flex-1 border-t border-dashed border-sky"></span></div>
          <div class="text-[11px] font-medium text-sky-deep">{{ f.no }}</div>
        </div>
        <div class="text-right"><div class="font-maru text-3xl font-bold">{{ f.to }}</div><div class="text-[11px] text-ink/45">{{ f.toCity }}</div></div>
      </div>
      <div class="mt-3 flex justify-between border-t border-dashed border-ink/15 pt-3 text-sm">
        <div><div class="text-[11px] text-ink/45">起飛</div><div class="font-bold">{{ f.dep }}</div></div>
        <div class="text-center"><div class="text-[11px] text-ink/45">飛行時間</div><div class="font-bold">{{ f.dur }}</div></div>
        <div class="text-right"><div class="text-[11px] text-ink/45">抵達</div><div class="font-bold">{{ f.arr }}</div></div>
      </div>
    </div>
  </div>`,
  components: { Ic },
};

/* ---------- app ---------- */
createApp({
  components: { Ic, FlightCard },
  setup() {
    const tabs = [
      { id: 'home', icon: 'home', label: '主頁' },
      { id: 'plan', icon: 'pin', label: '行程' },
      { id: 'info', icon: 'info', label: '資訊' },
      { id: 'shop', icon: 'basket', label: '購物' },
      { id: 'cost', icon: 'yen', label: '花費' },
      { id: 'settings', icon: 'gear', label: '設置' },
    ];
    const tab = ref('home');
    const days = TRIP_DAYS;
    const t = todayStr();
    const selectedDate = ref(days.includes(t) ? t : days[0]);

    const items = ref(saved.items || defaultItems());
    const shop = ref(saved.shop || []);
    const exps = ref(saved.exps || []);
    const budget = ref(saved.budget || { total: 3000 }); // MYR
    const checklist = ref(saved.checklist || defaultChecklist());
    const flights = FLIGHTS, hotels = HOTELS;

    watch([items, shop, exps, budget, checklist], () => {
      try { localStorage.setItem(KEY, JSON.stringify({ items: items.value, shop: shop.value, exps: exps.value, budget: budget.value, checklist: checklist.value })); }
      catch (e) { console.warn('storage full', e); }
    }, { deep: true });

    /* ----- settings: theme colour, font size, dark mode, falling effect (per device, not synced) ----- */
    const SETTINGS_KEY = 'trip-settings-v1';
    let savedS = {};
    try { savedS = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch {}
    const settings = reactive({ theme: savedS.theme || '#4A9CC7', font: savedS.font || 16, dark: !!savedS.dark, fx: savedS.fx !== undefined ? savedS.fx : 'maple' });
    const customColor = ref(settings.theme);
    const themeColors = [
      { name: '天空藍', hex: '#4A9CC7' }, { name: '櫻花粉', hex: '#E58CA0' }, { name: '抹茶綠', hex: '#6E9B5B' },
      { name: '楓葉橘', hex: '#D9763A' }, { name: '薰衣草紫', hex: '#8E7CC3' }, { name: '琥珀黃', hex: '#D9A441' },
    ];
    const fxOptions = [
      { id: 'none', icon: '✖️', label: '無' }, { id: 'maple', icon: '🍁', label: '楓葉' },
      { id: 'snow', icon: '❄️', label: '雪花' }, { id: 'sakura', icon: '🌸', label: '櫻花' },
    ];
    const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
    const mixRgb = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
    const applyTheme = () => {
      const root = document.documentElement, p = hexRgb(/^#[0-9a-f]{6}$/i.test(settings.theme) ? settings.theme : '#4A9CC7');
      root.dataset.theme = settings.dark ? 'dark' : 'light';
      root.style.fontSize = settings.font + 'px';
      const set = (k, rgb) => root.style.setProperty(k, rgb.join(' '));
      set('--sky-deep', settings.dark ? mixRgb(p, [255, 255, 255], .2) : p);
      set('--sky', mixRgb(p, [255, 255, 255], settings.dark ? .1 : .42));
      set('--sky-soft', settings.dark ? mixRgb(p, [28, 31, 36], .78) : mixRgb(p, [255, 255, 255], .88));
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', settings.dark ? '#1C1F24' : '#' + mixRgb(p, [255, 255, 255], .42).map(v => v.toString(16).padStart(2, '0')).join(''));
    };
    const setTheme = hex => { settings.theme = hex; customColor.value = hex; };
    watch(settings, () => {
      applyTheme();
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
    }, { deep: true, immediate: true });

    // falling leaves / snow / petals on a fixed canvas (emoji glyphs, pauses when the tab is hidden)
    const fxCanvas = ref(null);
    const FX = {
      maple: { chars: ['🍁', '🍂', '🍁'], n: 16, size: [16, 28], vy: [.5, 1.3] },
      snow: { chars: ['❄️', '❅', '❆'], n: 26, size: [10, 22], vy: [.4, 1.1] },
      sakura: { chars: ['🌸', '🌸', '💮'], n: 18, size: [14, 24], vy: [.4, 1] },
    };
    let fxRaf = 0, fxParts = [];
    const stopFx = () => {
      cancelAnimationFrame(fxRaf); fxRaf = 0; fxParts = [];
      const c = fxCanvas.value; if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height);
    };
    const startFx = () => {
      stopFx();
      const kind = FX[settings.fx], c = fxCanvas.value;
      if (!kind || !c || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2), ctx = c.getContext('2d');
      c.width = innerWidth * dpr; c.height = innerHeight * dpr;
      const rnd = (a, b) => a + Math.random() * (b - a);
      fxParts = Array.from({ length: kind.n }, () => ({
        x: rnd(0, innerWidth), y: rnd(-innerHeight, innerHeight), s: rnd(...kind.size), vy: rnd(...kind.vy),
        ph: rnd(0, 6.28), sw: rnd(.4, 1.4), rot: rnd(0, 6.28), vr: rnd(-.025, .025), a: rnd(.6, .95),
        ch: kind.chars[Math.floor(Math.random() * kind.chars.length)],
      }));
      const tick = () => {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
        for (const p of fxParts) {
          p.y += p.vy; p.ph += .02; p.x += Math.sin(p.ph) * p.sw; p.rot += p.vr;
          if (p.y > innerHeight + 30) { p.y = -30; p.x = rnd(0, innerWidth); }
          ctx.save(); ctx.globalAlpha = p.a; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.font = `${p.s}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.ch, 0, 0); ctx.restore();
        }
        fxRaf = requestAnimationFrame(tick);
      };
      tick();
    };
    watch(() => settings.fx, () => nextTick(startFx));
    onMounted(() => {
      nextTick(startFx);
      window.addEventListener('resize', () => { if (fxRaf) startFx(); });
      document.addEventListener('visibilitychange', () => (document.hidden ? stopFx() : startFx()));
    });

    /* ----- cloud sync (Firebase Firestore, optional) ----- */
    const cfg = window.FIREBASE_CONFIG || {};
    const syncOn = !!(cfg.apiKey && window.firebase);
    const sync = reactive({ available: syncOn, code: localStorage.getItem('trip-code') || '', input: localStorage.getItem('trip-code') || '', status: syncOn ? '未連線' : '尚未設定 Firebase', ok: false });
    const stores = { items, shop, exps, budget, checklist };
    const lastRemote = {};
    let fdb = null, unsubs = [], timers = {};
    const docOf = key => fdb.collection('trips').doc(sync.code).collection('data').doc(key);
    const clone = v => JSON.parse(JSON.stringify(v));

    const stopSync = () => { unsubs.forEach(u => u()); unsubs = []; sync.ok = false; };
    const startSync = () => {
      stopSync();
      if (!syncOn || !sync.code) { sync.status = syncOn ? '未連線' : sync.status; return; }
      if (!fdb) {
        firebase.initializeApp(cfg); fdb = firebase.firestore();
        fdb.enablePersistence({ synchronizeTabs: true }).catch(() => {});
      }
      sync.status = '連線中…';
      Object.keys(stores).forEach(key => {
        unsubs.push(docOf(key).onSnapshot(snap => {
          sync.ok = true; sync.status = '已同步 ✓';
          if (snap.metadata.hasPendingWrites) return;
          if (!snap.exists) { pushRemote(key); return; } // first device uploads its data
          const remote = snap.data().data;
          if (remote === undefined) return;
          const str = JSON.stringify(remote);
          if (str === lastRemote[key]) return;
          lastRemote[key] = str;
          if (str !== JSON.stringify(stores[key].value)) stores[key].value = remote;
        }, err => { sync.ok = false; sync.status = '同步失敗：' + (err.code || err.message); }));
      });
    };
    const pushRemote = key => {
      if (!fdb || !sync.code) return;
      const val = clone(stores[key].value), str = JSON.stringify(val);
      if (str === lastRemote[key]) return;
      lastRemote[key] = str;
      docOf(key).set({ data: val, updatedAt: Date.now() }).catch(e => { sync.status = '上傳失敗：' + (e.code || e.message); });
    };
    Object.keys(stores).forEach(key => watch(stores[key], () => {
      clearTimeout(timers[key]); timers[key] = setTimeout(() => pushRemote(key), 500);
    }, { deep: true }));
    const connectSync = () => {
      const c = sync.input.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (c.length < 4) { sync.status = '代碼至少 4 個英數字'; return; }
      sync.code = c; sync.input = c; localStorage.setItem('trip-code', c); startSync();
    };
    const disconnectSync = () => { stopSync(); sync.code = ''; localStorage.removeItem('trip-code'); sync.status = '未連線'; };
    onMounted(startSync);

    const wd = d => WD[new Date(d + 'T00:00:00').getDay()];
    const flightById = id => FLIGHTS.find(f => f.id === id);
    const dayItems = computed(() => items.value.filter(i => i.date === selectedDate.value));

    /* ----- category styling ----- */
    const catEmoji = c => ({ 景點: '🏯', 住宿: '🏨', 美食: '🍜', 購物: '🛍️', 航班: '✈️', 其他: '📌' }[c] || '📌');
    const catStyle = c => ({
      景點: 'bg-moss-soft text-moss-deep', 住宿: 'bg-sky-soft text-sky-deep', 美食: 'bg-orange-50 text-orange-500',
      購物: 'bg-sakura-soft text-sakura-deep', 航班: 'bg-sky-soft text-sky-deep', 其他: 'bg-stone-100 text-stone-500',
    }[c]);
    const hasHours = c => ['景點', '住宿', '美食', '購物'].includes(c);
    const expEmoji = c => ({ 交通: '🚆', 飲食: '🍱', 住宿: '🏨', 門票: '🎟️', 購物: '🛍️', 其他: '📌' }[c] || '📌');

    /* ----- travel time ----- */
    const hotelOfNight = d => HOTELS.find(h => h.from <= d && d < h.to);
    const prevDate = d => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() - 1); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
    const originOf = (it, idx) => {
      const list = dayItems.value;
      if (idx > 0) {
        const p = list[idx - 1];
        if (p.category !== '航班' && p.lat != null) return { lat: p.lat, lng: p.lng, name: p.name };
        if (p.category !== '航班') return null;
      }
      const prev = prevDate(it.date);
      const h = hotelOfNight(prev);
      if (h) return { lat: h.lat, lng: h.lng, name: h.name };
      if (it.date === '2026-11-22') return KIX;
      return null;
    };
    const MODE_ICON = { 步行: '🚶', 電車: '🚇', 巴士: '🚌', 開車: '🚗', 計程車: '🚕' };
    const travel = (it, idx) => {
      if (+it.travelMin > 0) { // manual entry wins over the estimate
        return { icon: MODE_ICON[it.travelMode] || '🚇', text: fmtMin(Math.round(+it.travelMin)), from: it.travelNote || '', manual: true };
      }
      if (it.lat == null) return null;
      const o = originOf(it, idx);
      if (!o) return null;
      const d = haversine(o, it) * 1.3; // detour factor
      if (d <= 1.5) return { icon: '🚶', text: fmtMin(Math.max(1, Math.round(d / 4.8 * 60))), from: o.name };
      return { icon: '🚇', text: fmtMin(Math.round(12 + d / 30 * 60)), from: o.name };
    };

    /* ----- navigation ----- */
    const navUrl = ({ q, lat, lng }) => {
      const dest = lat != null ? `${lat},${lng}` : q;
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=transit`;
    };
    // Google Maps route from the previous stop (or last night's hotel) to this item
    const routeUrl = (it, idx) => {
      const o = originOf(it, idx);
      const dest = it.lat != null ? `${it.lat},${it.lng}` : (it.address || it.name) + ' Japan';
      let url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=transit`;
      if (o) url += `&origin=${encodeURIComponent(o.lat + ',' + o.lng)}`;
      return url;
    };
    const openNav = it => {
      let url;
      if (it.flightId) {
        const f = flightById(it.flightId);
        url = navUrl({ q: (f.from === 'KIX' ? 'Kansai International Airport' : f.from === 'KUL' ? 'Kuala Lumpur International Airport' : 'Noi Bai International Airport') });
      } else {
        const q = (it.address || it.name) + (it.lat == null ? ' Japan' : '');
        url = navUrl({ q, lat: it.lat, lng: it.lng });
      }
      window.open(url, '_blank', 'noopener');
    };

    /* ----- weather ----- */
    const weather = reactive({ icon: '🌤️', label: '', temp: null, feels: null, hi: null, lo: null, loading: false });
    const placeOf = d => (PLACES[d] || OSAKA).name;
    const wCache = {};
    const loadWeather = async d => {
      const p = PLACES[d] || OSAKA;
      weather.loading = true; weather.temp = null; weather.hi = null; weather.lo = null; weather.icon = '🌤️'; weather.label = '';
      const key = d;
      try {
        if (!wCache[key]) {
          let data = null;
          try {
            const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min&timezone=auto&start_date=${d}&end_date=${d}`);
            if (r.ok) {
              const j = await r.json();
              const dd = j.daily;
              if (dd && dd.temperature_2m_max?.[0] != null) {
                const [ic, lb] = WCODE(dd.weather_code[0]);
                data = { icon: ic, label: lb + '（預報）', temp: Math.round((dd.temperature_2m_max[0] + dd.temperature_2m_min[0]) / 2), feels: Math.round((dd.apparent_temperature_max[0] + dd.apparent_temperature_min[0]) / 2), hi: Math.round(dd.temperature_2m_max[0]), lo: Math.round(dd.temperature_2m_min[0]) };
              }
            }
          } catch {}
          if (!data) { // forecast not yet available -> current conditions
            const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lng}&current=temperature_2m,apparent_temperature,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto`);
            const j = await r.json();
            const [ic, lb] = WCODE(j.current.weather_code);
            data = { icon: ic, label: lb + '（目前；行前 16 天內自動顯示當日預報）', temp: Math.round(j.current.temperature_2m), feels: Math.round(j.current.apparent_temperature), hi: Math.round(j.daily.temperature_2m_max[0]), lo: Math.round(j.daily.temperature_2m_min[0]) };
          }
          wCache[key] = data;
        }
        Object.assign(weather, wCache[key]);
      } catch { weather.label = '無法取得天氣'; }
      weather.loading = false;
    };
    watch(selectedDate, loadWeather, { immediate: true });

    /* ----- exchange ----- */
    const jpy = ref(null), myr = ref(null);
    const rate = reactive({ v: 0.029, note: '離線預設值' });
    const onJpy = () => { myr.value = jpy.value ? +(jpy.value * rate.v).toFixed(2) : null; };
    const onMyr = () => { jpy.value = myr.value ? Math.round(myr.value / rate.v) : null; };
    const fmt = (n, dp = 0) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
    onMounted(async () => {
      try {
        const r = await fetch('https://open.er-api.com/v6/latest/JPY');
        const j = await r.json();
        if (j.rates?.MYR) { rate.v = j.rates.MYR; rate.note = '更新：' + (j.time_last_update_utc || '').slice(0, 16); onJpy(); }
      } catch {}
      scrollDateIntoView();
    });

    /* ----- plan modal ----- */
    const modal = ref(null);
    const confirmDel = ref(false);
    const saving = ref(false);
    const blank = () => ({ id: null, date: selectedDate.value, category: '景點', name: '', address: '', hours: '', ticket: '', note: '', time: '', cost: null, lat: null, lng: null, travelMode: '', travelMin: null, travelNote: '' });
    const form = reactive(blank());
    const openAdd = () => { Object.assign(form, blank()); confirmDel.value = false; modal.value = 'plan'; };
    const openEdit = it => { Object.assign(form, blank(), JSON.parse(JSON.stringify(it))); confirmDel.value = false; modal.value = 'plan'; };
    const closeModal = () => { modal.value = null; confirmDel.value = false; };

    const geocode = async q => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=jp&q=${encodeURIComponent(q)}`);
        const j = await r.json();
        if (j[0]) return { lat: +j[0].lat, lng: +j[0].lon };
      } catch {}
      return null;
    };
    const saveItem = async () => {
      const data = JSON.parse(JSON.stringify(form));
      const old = data.id ? items.value.find(i => i.id === data.id) : null;
      const q = (data.address || data.name).trim();
      const changed = !old || (old.address || old.name) !== q;
      if (changed && !data.flightId) {
        saving.value = true;
        const g = await geocode(q);
        saving.value = false;
        data.lat = g ? g.lat : null; data.lng = g ? g.lng : null;
      }
      if (old) Object.assign(old, data);
      else { data.id = uid(); items.value.push(data); }
      closeModal();
    };
    const deleteItem = () => { items.value = items.value.filter(i => i.id !== form.id); closeModal(); };

    /* ----- drag sort ----- */
    const listEl = ref(null);
    let sortable = null;
    const setupSortable = () => {
      if (sortable) { sortable.destroy(); sortable = null; }
      if (!listEl.value) return;
      sortable = Sortable.create(listEl.value, {
        handle: '.drag-handle', animation: 180, ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen',
        onEnd(evt) {
          const { item, from, oldIndex, newIndex } = evt;
          if (oldIndex === newIndex) return;
          from.removeChild(item); // let Vue own the DOM
          from.insertBefore(item, from.children[oldIndex] || null);
          const ids = dayItems.value.map(i => i.id);
          const [m] = ids.splice(oldIndex, 1); ids.splice(newIndex, 0, m);
          const map = Object.fromEntries(items.value.map(i => [i.id, i]));
          const rest = items.value.filter(i => i.date !== selectedDate.value);
          items.value = [...rest, ...ids.map(id => map[id])];
        },
      });
    };
    watch([tab, selectedDate], () => nextTick(setupSortable));
    onMounted(() => nextTick(setupSortable));

    const dateStrip = ref(null);
    const scrollDateIntoView = () => {
      const el = dateStrip.value?.querySelector(`[data-date="${selectedDate.value}"]`);
      el?.scrollIntoView({ inline: 'center', block: 'nearest' });
    };

    /* ----- shopping ----- */
    const blankShop = () => ({ id: null, name: '', img: '', category: '零食', priority: '一般', note: '' });
    const sform = reactive(blankShop());
    const openShop = s => { Object.assign(sform, s && s.id ? { ...blankShop(), ...s } : blankShop()); confirmDel.value = false; modal.value = 'shop'; };
    const shopCat = s => s.category || '其它';
    const shopEmoji = c => ({ 零食: '🍫', 護膚品: '🧴', 護髮品: '💆', 衣服: '👕', 鞋子: '👟', 其它: '📦' }[c] || '📦');
    const shopFilter = ref('全部');
    const onlyImportant = ref(false);
    const shopMatch = s => (shopFilter.value === '全部' || shopCat(s) === shopFilter.value) && (!onlyImportant.value || s.priority === '重要');
    const shopTodo = computed(() => shop.value.filter(s => !s.done && shopMatch(s)));
    const shopBought = computed(() => shop.value.filter(s => s.done && shopMatch(s)));
    const todoCount = computed(() => shop.value.filter(s => !s.done).length);
    const boughtCount = computed(() => shop.value.filter(s => s.done).length);
    const catCount = c => shop.value.filter(s => !s.done && (c === '全部' || shopCat(s) === c)).length;
    const onPhoto = e => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => { // downscale so localStorage stays small
          const s = Math.min(1, 400 / Math.max(img.width, img.height));
          const c = document.createElement('canvas'); c.width = img.width * s; c.height = img.height * s;
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          sform.img = c.toDataURL('image/jpeg', 0.6);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    };
    const saveShop = () => {
      const d = { ...sform, name: sform.name.trim() };
      if (d.id) Object.assign(shop.value.find(x => x.id === d.id), d);
      else { d.id = uid(); d.done = false; shop.value.unshift(d); }
      closeModal();
    };
    const deleteShop = () => { shop.value = shop.value.filter(x => x.id !== sform.id); closeModal(); };

    /* ----- expenses ----- */
    const eform = reactive({ id: null, category: '飲食', name: '', date: todayStr(), amount: null, pay: '現金', note: '' });
    const openExp = e => {
      Object.assign(eform, e ? { ...e } : { id: null, category: '飲食', name: '', date: todayStr(), amount: null, pay: '現金', note: '' });
      confirmDel.value = false; modal.value = 'cost';
    };
    const saveExp = () => {
      const d = { ...eform, amount: +eform.amount };
      if (d.id) Object.assign(exps.value.find(x => x.id === d.id), d);
      else { d.id = uid(); exps.value.push(d); }
      closeModal();
    };
    const deleteExp = () => { exps.value = exps.value.filter(x => x.id !== eform.id); closeModal(); };
    const totalExp = computed(() => exps.value.reduce((s, e) => s + (+e.amount || 0), 0));
    const sortedExp = computed(() => [...exps.value].sort((a, b) => b.date.localeCompare(a.date)));

    /* ----- budget (MYR) ----- */
    const spentMyr = computed(() => totalExp.value * rate.v);
    const plannedJpy = computed(() => items.value.reduce((s, i) => s + (+i.cost || 0), 0));
    const plannedMyr = computed(() => plannedJpy.value * rate.v);
    const remaining = computed(() => (+budget.value.total || 0) - spentMyr.value);
    const overBudget = computed(() => remaining.value < 0);
    const budgetPct = computed(() => budget.value.total > 0 ? Math.min(100, spentMyr.value / budget.value.total * 100) : 0);
    const CAT_COLORS = ['#8FCDEB', '#F4B9C4', '#9DC18A', '#F5C26B', '#B7A6E0', '#C9C5BD'];
    const expByCat = computed(() => {
      const total = totalExp.value;
      return EXP_CATS.map((c, i) => ({ c, color: CAT_COLORS[i], jpy: exps.value.filter(e => e.category === c).reduce((s, e) => s + (+e.amount || 0), 0) }))
        .filter(x => x.jpy > 0).map(x => ({ ...x, pct: total ? x.jpy / total * 100 : 0 }));
    });
    const donut = computed(() => {
      let acc = 0;
      const stops = expByCat.value.map(x => { const a = acc; acc += x.pct; return `${x.color} ${a}% ${acc}%`; });
      return stops.length ? `conic-gradient(${stops.join(',')})` : '#E7E2D6';
    });
    const editBudget = ref(false);

    /* ----- checklist ----- */
    const newCheck = ref('');
    const doneCount = computed(() => checklist.value.filter(c => c.done).length);
    const checkPct = computed(() => checklist.value.length ? doneCount.value / checklist.value.length * 100 : 0);
    const addCheck = () => { const t = newCheck.value.trim(); if (!t) return; checklist.value.push({ id: uid(), text: t, done: false }); newCheck.value = ''; };
    const removeCheck = c => { checklist.value = checklist.value.filter(x => x.id !== c.id); };

    /* ----- home: countdown card ----- */
    const countInfo = computed(() => {
      const n = new Date(), today = new Date(n.getFullYear(), n.getMonth(), n.getDate());
      const s = new Date(TRIP_START + 'T00:00:00'), e = new Date(TRIP_END + 'T00:00:00');
      const d = Math.round((s - today) / 864e5);
      if (d > 0) return { mode: 'before', n: d };
      if (today <= e) return { mode: 'during', n: 1 - d };
      return { mode: 'after', n: 0 };
    });
    // a day counts as planned when it has at least one item that isn't a "待安排 / 待定" placeholder
    const plannedDays = computed(() => days.filter(d => items.value.some(i => i.date === d && !/待/.test(i.name))).length);
    const progress = computed(() => {
      const c = countInfo.value;
      if (c.mode === 'before') return { pct: Math.round(plannedDays.value / days.length * 100), label: `行程規劃 ${plannedDays.value}/${days.length} 天已排` };
      if (c.mode === 'during') return { pct: Math.round(c.n / days.length * 100), label: `旅程進行 第 ${c.n}/${days.length} 天` };
      return { pct: 100, label: '旅程完成' };
    });
    const nextFlight = computed(() => {
      const now = Date.now();
      return FLIGHTS.find(f => new Date(`${f.date}T${f.dep}:00`).getTime() > now) || null;
    });
    const shopDone = computed(() => shop.value.filter(s => s.done).length);
    const todayItems = computed(() => countInfo.value.mode === 'during' ? items.value.filter(i => i.date === todayStr()) : []);
    const goTo = id => { tab.value = id; window.scrollTo({ top: 0, behavior: 'smooth' }); };

    const fabAction = () => ({ plan: openAdd, shop: openShop, cost: () => openExp(null) }[tab.value]());
    const resetAll = () => { if (confirm('用程式內建的行程覆蓋目前所有行程（購物清單與花費不受影響）？你手動新增或修改的行程會被取代。')) { items.value = defaultItems(); selectedDate.value = days[0]; } };

    return {
      sync, connectSync, disconnectSync,
      settings, customColor, themeColors, fxOptions, setTheme, fxCanvas,
      budget, editBudget, spentMyr, plannedJpy, plannedMyr, remaining, overBudget, budgetPct, expByCat, donut,
      checklist, newCheck, doneCount, checkPct, addCheck, removeCheck, myr, onJpy, onMyr,
      countInfo, progress, nextFlight, shopDone, todayItems, goTo,
      tabs, tab, days, selectedDate, wd, dayItems, flights, hotels, flightById, catEmoji, catStyle, hasHours, expEmoji,
      travel, routeUrl, modes: Object.keys(MODE_ICON), navUrl, openNav, weather, placeOf, jpy, rate, fmt,
      modal, form, cats: CATS, confirmDel, saving, openEdit, closeModal, saveItem, deleteItem,
      listEl, dateStrip, shop, sform, onPhoto, saveShop, deleteShop, openShop, shopCats: ['零食', '護膚品', '護髮品', '衣服', '鞋子', '其它'],
      shopEmoji, shopCat, shopFilter, onlyImportant, shopTodo, shopBought, todoCount, boughtCount, catCount,
      exps, eform, expCats: EXP_CATS, openExp, saveExp, deleteExp, totalExp, sortedExp, fabAction, resetAll,
    };
  },
}).mount('#app');
