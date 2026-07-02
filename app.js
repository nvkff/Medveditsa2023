// 1. Инициализация карты
const map = L.map('map', { zoomControl: window.innerWidth > 768 }).setView([57.25, 36.6], 10);

L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '&copy; OpenTopoMap'
}).addTo(map);

// Список треков Suunto
const gpxFiles = [
    'suuntoapp-Paddling-2023-06-28T16-18-39Z-track.gpx',
    'suuntoapp-Paddling-2023-06-29T13-20-59Z-track.gpx',
    'suuntoapp-Paddling-2023-06-30T08-31-03Z-track.gpx',
    'suuntoapp-Paddling-2023-07-01T09-02-42Z-track.gpx',
    'suuntoapp-Paddling-2023-07-01T13-28-14Z-track.gpx',
    'suuntoapp-Paddling-2023-07-02T08-28-28Z-track.gpx',
    'suuntoapp-Paddling-2023-07-03T08-40-08Z-track.gpx',
    'suuntoapp-Paddling-2023-07-05T07-05-18Z-track.gpx'
];

let totalDistance = 0;
const mapBounds = L.latLngBounds();

// Загрузка GPX
gpxFiles.forEach(file => {
    new L.GPX(`./gpx/${file}`, {
        async: true,
        polyline_options: { color: '#ff2a2a', opacity: 0.85, weight: 5, lineCap: 'round' },
        marker_options: { startIconUrl: null, endIconUrl: null, shadowUrl: null }
    }).on('loaded', function(e) {
        totalDistance += e.target.get_distance() / 1000;
        document.getElementById('total-dist').innerText = totalDistance.toFixed(1);
        mapBounds.extend(e.target.getBounds());
        map.fitBounds(mapBounds, { padding: [40, 40] });
    }).addTo(map);
});

// --- SVG ИКОНКИ ДЛЯ СТОЯНОК ---
const svgTent = `<svg viewBox="0 0 24 24" width="24" height="24" fill="#ff2a2a" stroke="#111" stroke-width="1.5"><path d="M4 19h16L12 4z"/><path d="M12 4v15M9 14l3-5 3 5"/></svg>`;
const svgRocket = `<svg viewBox="0 0 24 24" width="24" height="24" fill="#00ff66" stroke="#111" stroke-width="1.5"><path d="M12 2s4 4 4 9H8c0-5 4-9 4-9zM8 11v4c0 2 2 4 4 4s4-2 4-4v-4M4 21h16M12 15v4"/></svg>`;
const svgFinish = `<svg viewBox="0 0 24 24" width="24" height="24" fill="#ffcc00" stroke="#111" stroke-width="1.5"><path d="M5 21V3h14l-3 4.5 3 4.5H5"/></svg>`;

function createCustomIcon(svgContent) {
    return L.divIcon({
        className: 'custom-svg-icon',
        html: `<div style="display:flex; justify-content:center; align-items:center; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5));">${svgContent}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
}

const camps = [
    { name: "Старт", lat: 57.272745, lng: 36.070653, icon: createCustomIcon(svgRocket) },
    { name: "1-я ночёвка", lat: 57.264138, lng: 36.100641, icon: createCustomIcon(svgTent) },
    { name: "2-я ночёвка (ГЭС)", lat: 57.228429, lng: 36.162023, icon: createCustomIcon(svgTent) },
    { name: "3-я ночёвка", lat: 57.182129, lng: 36.369453, icon: createCustomIcon(svgTent) },
    { name: "4-я ночёвка", lat: 57.188709, lng: 36.587510, icon: createCustomIcon(svgTent) },
    { name: "5-я ночёвка", lat: 57.271229, lng: 36.757921, icon: createCustomIcon(svgTent) },
    { name: "6-я ночёвка (лагерь)", lat: 57.302809, lng: 36.999370, icon: createCustomIcon(svgTent) },
    { name: "7-я ночёвка (финиш)", lat: 57.252630, lng: 37.149847, icon: createCustomIcon(svgFinish) }
];

camps.forEach(camp => {
    const marker = L.marker([camp.lat, camp.lng], { icon: camp.icon }).addTo(map);
    marker.bindTooltip(camp.name, { permanent: true, direction: 'top', className: 'map-permanent-label', offset: [0, -10] });
    marker.on('click', () => {
        const coordsString = `${camp.lat}, ${camp.lng}`;
        navigator.clipboard.writeText(coordsString).then(() => {
            alert(`Координаты точки "${camp.name}" скопированы: \n${coordsString}`);
        });
    });
});

// --- ДАННЫЕ ПАНOРАМ (ОТКОРРЕКТИРОВАННЫЕ И ОРГАНИЗОВАННЫЕ ПО ХРОНОЛОГИИ) ---
const panoramasData = [
    // 28 июня
    { file: "dji_fly_20230628_171514_612_1718743637645_pano_optimized.jpg", lat: 57.272317, lng: 36.071526 },
    { file: "dji_fly_20230628_211126_619_1718747835822_pano_optimized.jpg", lat: 57.263988, lng: 36.100785 },
    
    // 29 июня
    { file: "dji_fly_20230629_210930_628_1718742455660_pano_optimized.jpg", lat: 57.229069, lng: 36.161858 },
    
    // 1 июля
    { file: "dji_fly_20230701_075408_675_1718742507484_pano_optimized.jpg", lat: 57.181925, lng: 36.369517 },
    { file: "dji_fly_20230701_075702_678_1718742531960_pano_optimized.jpg", lat: 57.182164, lng: 36.369940 },
    { file: "dji_fly_20230701_200752_683_1718742533568_pano_optimized.jpg", lat: 57.188061, lng: 36.588817 },
    { file: "dji_fly_20230701_200918_684_1718742535194_pano_optimized.jpg", lat: 57.188617, lng: 36.587292 },
    
    // 2 июля
    { file: "Dji_fly_20230702_182558_690_1718742537039_pano_optimized.jpg", lat: 57.271147, lng: 36.758015 },
    
    // 3 июля
    { file: "dji_fly_20230703_202238_726_1718743208552_pano_optimized.jpg", lat: 57.302488, lng: 36.999095 },
    
    // 4 июля
    { file: "dji_fly_20230704_112230_727_1718742538918_pano_optimized.jpg", lat: 57.301248, lng: 37.003891 },
    { file: "dji_fly_20230704_112408_728_1718743206971_pano_optimized.jpg", lat: 57.302353, lng: 36.998754 }
];

const photoIcon = L.divIcon({
    className: 'custom-photo-icon',
    html: `<div style="background: #111; border: 2px solid #4cabff; width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 8px rgba(76,171,255,0.8);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
});

// Глобальная переменная для инстанса Pannellum
let pViewer = null;

function openPanorama360(src, captionText) {
    const viewerEl = document.getElementById('photo-viewer');
    viewerEl.style.display = "flex";
    document.getElementById('viewer-caption').innerText = captionText;

    if (pViewer) {
        pViewer.destroy();
    }

    // Инициализация Pannellum
    pViewer = pannellum.viewer('panorama-360', {
        type: 'equirectangular',
        panorama: src,
        autoLoad: true,
        compass: false,
        mouseZoom: true
    });
}

// Закрытие плеера
document.querySelector('.viewer-close').addEventListener('click', () => {
    document.getElementById('photo-viewer').style.display = "none";
    if (pViewer) { pViewer.destroy(); pViewer = null; }
});

// Рендеринг панорам на карту и в боковую панель
const thumbnailsContainer = document.getElementById('thumbnails');

panoramasData.forEach((photo, idx) => {
    const imgPath = `./panoramas/${photo.file}`;
    const marker = L.marker([photo.lat, photo.lng], { icon: photoIcon }).addTo(map);

    const title = `Панорама #${idx + 1}`;

    marker.on('click', () => {
        openPanorama360(imgPath, title);
    });

    // Создаем крупную карточку в меню
    const card = document.createElement('div');
    card.className = 'thumb-card';
    
    card.innerHTML = `
        <img src="${imgPath}" class="thumb-img" alt="${title}">
        <div class="thumb-btn">Открыть 360°</div>
    `;
    
    card.addEventListener('click', () => {
        const targetLat = window.innerWidth <= 768 ? photo.lat - 0.015 : photo.lat;
        map.setView([targetLat, photo.lng], 13, { animate: true });
        
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.add('hidden');
        }
        setTimeout(() => openPanorama360(imgPath, title), 400);
    });

    thumbnailsContainer.appendChild(card);
});

// Логика меню
const sidebar = document.getElementById('sidebar');
const closeBtn = document.getElementById('close-sidebar');
const openBtn = document.getElementById('mobile-menu-btn');

closeBtn.addEventListener('click', () => sidebar.classList.add('hidden'));
openBtn.addEventListener('click', () => {
    sidebar.classList.remove('hidden');
    setTimeout(() => map.invalidateSize(), 300);
});

map.on('click', () => {
    if (window.innerWidth <= 768) sidebar.classList.add('hidden');
});

if (window.innerWidth > 768) {
    sidebar.classList.remove('hidden');
}
