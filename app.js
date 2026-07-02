// 1. Инициализация карты
const map = L.map('map', { zoomControl: window.innerWidth > 768 }).setView([57.25, 36.6], 10);

// Топографическая подложка
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
        polyline_options: {
            color: '#ff2a2a',
            opacity: 0.85,
            weight: 5,
            lineCap: 'round'
        },
        marker_options: { startIconUrl: null, endIconUrl: null, shadowUrl: null }
    }).on('loaded', function(e) {
        totalDistance += e.target.get_distance() / 1000;
        document.getElementById('total-dist').innerText = totalDistance.toFixed(1);
        
        mapBounds.extend(e.target.getBounds());
        map.fitBounds(mapBounds, { padding: [40, 40] });
    }).on('error', function(err) {
        console.error("Ошибка загрузки трека: " + file, err);
    }).addTo(map);
});

// --- КРАСИВЫЕ SVG ИКОНКИ ---
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

// --- ДАННЫЕ СТОЯНОК ---
const camps = [
    { name: "Старт", lat: 57.272745, lng: 36.070653, icon: createCustomIcon(svgRocket) },
    { name: "1-я ночёвка", lat: 57.264138, lng: 36.100641, icon: createCustomIcon(svgTent) },
    { name: "2-я ночёвка (ГЭС)", lat: 57.228429, lng: 36.162023, icon: createCustomIcon(svgTent) },
    { name: "3-я ночёвка", lat: 57.182129, lng: 36.369453, icon: createCustomIcon(svgTent) },
    { name: "4-я ночёвка", lat: 57.188709, mesh: 36.587510, lng: 36.587510, icon: createCustomIcon(svgTent) },
    { name: "5-я ночёвка", lat: 57.271229, lng: 36.757921, icon: createCustomIcon(svgTent) },
    { name: "6-я ночёвка (лагерь)", lat: 57.302809, lng: 36.999370, icon: createCustomIcon(svgTent) },
    { name: "7-я ночёвка (финиш)", lat: 57.252630, lng: 37.149847, icon: createCustomIcon(svgFinish) }
];

// Отрисовка стоянок с постоянными подписями
camps.forEach(camp => {
    const marker = L.marker([camp.lat, camp.lng], { icon: camp.icon }).addTo(map);
    
    // Постоянная текстовая табличка поверх карты
    marker.bindTooltip(camp.name, {
        permanent: true,
        direction: 'top',
        className: 'map-permanent-label',
        offset: [0, -10]
    });

    // При клике на точку — копируем её координаты в буфер обмена
    marker.on('click', () => {
        const coordsString = `${camp.lat}, ${camp.lng}`;
        navigator.clipboard.writeText(coordsString).then(() => {
            alert(`Координаты точки "${camp.name}" скопированы: \n${coordsString}`);
        }).catch(err => {
            console.error('Не удалось скопировать: ', err);
        });
    });
});

// --- СКОРОСТНАЯ ЗАГРУЗКА ПАНОРАМ (Последовательная) ---
async function loadPanoramas() {
    const thumbnailsContainer = document.getElementById('thumbnails');
    const maxPhotosToCheck = 15; 

    for (let i = 1; i <= maxPhotosToCheck; i++) {
        const imgPath = `./panoramas/${i}.jpg`;
        
        try {
            // fetch с методом HEAD проверяет существование файла до того, как exifr начнет его читать
            const response = await fetch(imgPath, { method: 'HEAD' });
            if (!response.ok) continue; // Если файла нет, сразу идем дальше

            let gps = await exifr.gps(imgPath);
            
            if (gps && gps.latitude && gps.longitude) {
                const { latitude, longitude } = gps;
                const marker = L.marker([latitude, longitude]).addTo(map);
                
                const popupContent = `
                    <div style="text-align:center;color:#fff;">
                        <span style="font-size:11px;color:#888;">Панорама #${i}</span>
                        <a href="${imgPath}" target="_blank">
                            <img src="${imgPath}" style="width:100%;max-width:220px;border-radius:6px;margin-top:5px;display:block;" />
                        </a>
                    </div>
                `;
                marker.bindPopup(popupContent);

                const thumb = document.createElement('img');
                thumb.src = imgPath;
                thumb.className = 'thumb-img';
                
                thumb.addEventListener('click', () => {
                    const targetLat = window.innerWidth <= 768 ? latitude - 0.015 : latitude;
                    map.setView([targetLat, longitude], 13, { animate: true });
                    marker.openPopup();
                    
                    if (window.innerWidth <= 768) {
                        document.getElementById('sidebar').classList.add('hidden');
                    }
                });

                thumbnailsContainer.appendChild(thumb);
            }
        } catch (error) {
            // Ошибка чтения или файла нет — игнорируем, чтобы не вешать поток
        }
    }
}

// Запускаем панорамы чуть позже треков, чтобы разгрузить сеть при старте
setTimeout(loadPanoramas, 500);

// Интерфейс меню
const sidebar = document.getElementById('sidebar');
const closeBtn = document.getElementById('close-sidebar');
const openBtn = document.getElementById('mobile-menu-btn');

closeBtn.addEventListener('click', () => sidebar.classList.add('hidden'));
openBtn.addEventListener('click', () => {
    sidebar.classList.remove('hidden');
    setTimeout(() => map.invalidateSize(), 300);
});

map.on('click', () => {
    if (window.innerWidth <= 768) {
        sidebar.classList.add('hidden');
    }
});

if (window.innerWidth > 768) {
    sidebar.classList.remove('hidden');
}
