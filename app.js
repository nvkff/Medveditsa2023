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

// Загрузка GPX (Цвет изменен на КРАСНЫЙ)
gpxFiles.forEach(file => {
    new L.GPX(`./gpx/${file}`, {
        async: true,
        polyline_options: {
            color: '#ff2a2a', // Ярко-красный цвет трека
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

// --- ДОБАВЛЕНИЕ СТОЯНОК (ТОЧЕК) ---
const camps = [
    { name: "🚀 Старт", lat: 57.272745, lng: 36.070653 },
    { name: "⛺ Первая ночёвка", lat: 57.264138, lng: 36.100641 },
    { name: "⚡ Вторая ночёвка (ГЭС)", lat: 57.228429, lng: 36.162023 },
    { name: "⛺ Третья ночёвка", lat: 57.182129, lng: 36.369453 },
    { name: "⛺ Четвертая ночёвка", lat: 57.188709, lng: 36.587510 },
    { name: "⛺ Пятая ночёвка", lat: 57.271229, lng: 36.757921 },
    { name: "🏕️ Шестая ночёвка (лагерь)", lat: 57.302809, lng: 36.999370 },
    { name: "🏁 Седьмая ночёвка (финиш)", lat: 57.252630, lng: 37.149847 }
];

// Стилизуем маркеры стоянок под стильный темный вид, чтобы они отличались от фото
const campIcon = L.divIcon({
    className: 'custom-camp-icon',
    html: `<div style="background-color: #111; color: #ff2a2a; border: 2px solid #ff2a2a; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 8px rgba(255,42,42,0.6);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

// Отрисовка стоянок на карте
camps.forEach(camp => {
    L.marker([camp.lat, camp.lng], { icon: campIcon })
        .addTo(map)
        .bindPopup(`<b style="color: #fff; font-size: 14px;">${camp.name}</b>`, {
            closeButton: false,
            offset: [0, -5]
        });
});

// Загрузка панорам (1.jpg - 15.jpg)
async function loadPanoramas() {
    const thumbnailsContainer = document.getElementById('thumbnails');
    const maxPhotosToCheck = 15; 

    for (let i = 1; i <= maxPhotosToCheck; i++) {
        const imgPath = `./panoramas/${i}.jpg`;
        
        try {
            let gps = await exifr.gps(imgPath);
            
            if (gps && gps.latitude && gps.longitude) {
                const { latitude, longitude } = gps;
                
                // Для фото оставим дефолтный синий маркер Leaflet (или он заменится на ваш)
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
            // Файл отсутствует или нет EXIF — идем дальше
        }
    }
}

loadPanoramas();

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
