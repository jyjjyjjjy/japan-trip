const { createApp, ref, reactive, computed, watch, onMounted, nextTick } = Vue;

/* ---------- static trip data ---------- */
const TRIP_DAYS = ['2026-11-21','2026-11-22','2026-11-23','2026-11-24','2026-11-25','2026-11-26','2026-11-27','2026-11-28','2026-11-29'];
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

const defaultItems = () => [
  { id: uid(), date: '2026-11-21', category: '航班', flightId: 'f1', name: 'VN680 KUL → HAN' },
  { id: uid(), date: '2026-11-21', category: '航班', flightId: 'f2', name: 'VN334 HAN → KIX' },
  { id: uid(), date: '2026-11-22', category: '住宿', name: 'Daiya Ryokan 寄放行李 / 入住', address: 'Daiya Ryokan Kyoto', lat: 34.9877, lng: 135.7587, hours: 'Check-in 15:00', note: '關西機場 06:55 抵達後前往京都' },
  { id: uid(), date: '2026-11-22', category: '其他', name: '（待安排）', note: '' },
  { id: uid(), date: '2026-11-23', category: '景點', name: '（待安排）', note: '' },
  { id: uid(), date: '2026-11-24', category: '住宿', name: 'Ebisu 804 入住', address: 'Ebisuhonmachi Naniwa Osaka', lat: 34.6537, lng: 135.5013, hours: 'Check-in 15:00', note: '上午退房 Daiya Ryokan，前往大阪' },
  { id: uid(), date: '2026-11-25', category: '景點', name: '（待安排）', note: '' },
  { id: uid(), date: '2026-11-26', category: '景點', name: '（待安排）', note: '' },
  { id: uid(), date: '2026-11-27', category: '美食', name: '（待安排）', note: '' },
  { id: uid(), date: '2026-11-28', category: '購物', name: '（待安排）', note: '' },
  { id: uid(), date: '2026-11-29', category: '航班', flightId: 'f3', name: 'VN335 KIX → HAN' },
  { id: uid(), date: '2026-11-29', category: '航班', flightId: 'f4', name: 'VN681 HAN → KUL' },
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
      { id: 'plan', icon: 'pin', label: '每日行程' },
      { id: 'info', icon: 'info', label: '資訊' },
      { id: 'shop', icon: 'basket', label: '購物清單' },
      { id: 'cost', icon: 'yen', label: '花費' },
    ];
    const tab = ref('plan');
    const days = TRIP_DAYS;
    const t = todayStr();
    const selectedDate = ref(days.includes(t) ? t : days[0]);

    const items = ref(saved.items || defaultItems());
    const shop = ref(saved.shop || []);
    const exps = ref(saved.exps || []);
    const flights = FLIGHTS, hotels = HOTELS;

    watch([items, shop, exps], () => {
      try { localStorage.setItem(KEY, JSON.stringify({ items: items.value, shop: shop.value, exps: exps.value })); }
      catch (e) { console.warn('storage full', e); }
    }, { deep: true });

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
    const travel = (it, idx) => {
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
    const weather = reactive({ icon: '🌤️', label: '', temp: null, feels: null, loading: false });
    const placeOf = d => (PLACES[d] || OSAKA).name;
    const wCache = {};
    const loadWeather = async d => {
      const p = PLACES[d] || OSAKA;
      weather.loading = true; weather.temp = null; weather.icon = '🌤️'; weather.label = '';
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
                data = { icon: ic, label: lb + '（預報）', temp: Math.round((dd.temperature_2m_max[0] + dd.temperature_2m_min[0]) / 2), feels: Math.round((dd.apparent_temperature_max[0] + dd.apparent_temperature_min[0]) / 2) };
              }
            }
          } catch {}
          if (!data) { // forecast not yet available -> current conditions
            const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lng}&current=temperature_2m,apparent_temperature,weather_code&timezone=auto`);
            const j = await r.json();
            const [ic, lb] = WCODE(j.current.weather_code);
            data = { icon: ic, label: lb + '（目前；行前 16 天內自動顯示當日預報）', temp: Math.round(j.current.temperature_2m), feels: Math.round(j.current.apparent_temperature) };
          }
          wCache[key] = data;
        }
        Object.assign(weather, wCache[key]);
      } catch { weather.label = '無法取得天氣'; }
      weather.loading = false;
    };
    watch(selectedDate, loadWeather, { immediate: true });

    /* ----- exchange ----- */
    const jpy = ref(null);
    const rate = reactive({ v: 0.029, note: '離線預設值' });
    const fmt = (n, dp = 0) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
    onMounted(async () => {
      try {
        const r = await fetch('https://open.er-api.com/v6/latest/JPY');
        const j = await r.json();
        if (j.rates?.MYR) { rate.v = j.rates.MYR; rate.note = '更新：' + (j.time_last_update_utc || '').slice(0, 16); }
      } catch {}
      scrollDateIntoView();
    });

    /* ----- plan modal ----- */
    const modal = ref(null);
    const confirmDel = ref(false);
    const saving = ref(false);
    const blank = () => ({ id: null, date: selectedDate.value, category: '景點', name: '', address: '', hours: '', ticket: '', note: '', lat: null, lng: null });
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
    const sform = reactive({ name: '', img: '' });
    const openShop = () => { sform.name = ''; sform.img = ''; modal.value = 'shop'; };
    const onPhoto = e => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => { // downscale so localStorage stays small
          const s = Math.min(1, 640 / Math.max(img.width, img.height));
          const c = document.createElement('canvas'); c.width = img.width * s; c.height = img.height * s;
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          sform.img = c.toDataURL('image/jpeg', 0.75);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    };
    const saveShop = () => { shop.value.unshift({ id: uid(), name: sform.name.trim(), img: sform.img, done: false }); closeModal(); };
    const removeShop = s => { if (confirm(`刪除「${s.name}」？`)) shop.value = shop.value.filter(x => x.id !== s.id); };

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

    const fabAction = () => ({ plan: openAdd, shop: openShop, cost: () => openExp(null) }[tab.value]());
    const resetAll = () => { if (confirm('清除所有已儲存資料並還原預設？')) { localStorage.removeItem(KEY); location.reload(); } };

    return {
      tabs, tab, days, selectedDate, wd, dayItems, flights, hotels, flightById, catEmoji, catStyle, hasHours, expEmoji,
      travel, navUrl, openNav, weather, placeOf, jpy, rate, fmt,
      modal, form, cats: CATS, confirmDel, saving, openEdit, closeModal, saveItem, deleteItem,
      listEl, dateStrip, shop, sform, onPhoto, saveShop, removeShop,
      exps, eform, expCats: EXP_CATS, openExp, saveExp, deleteExp, totalExp, sortedExp, fabAction, resetAll,
    };
  },
}).mount('#app');
