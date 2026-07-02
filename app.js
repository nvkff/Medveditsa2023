// 1. Инициализация карты
const map = L.map('map', { zoomControl: window.innerWidth > 768 }).setView([56.3, 37.3], 9);

// Топографическая подложка
L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '&copy; OpenTopoMap'
}).addTo(map);

// Список ваших точных треков Suunto
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
    new L.GPX(`gpx/${file}`, {
        async: true,
        polyline_options: {
            color: '#007bef',
            opacity: 0.8,
            weight: 5,
            lineCap: 'round'
        },
        marker_options: { startIconUrl: null, endIconUrl: null, shadowUrl: null }
    }).on('loaded', function(e) {
        totalDistance += e.target.get_distance() / 1000;
        document.getElementById('total-dist').innerText = totalDistance.toFixed(1);
        
        mapBounds.extend(e.target.getBounds());
        map.fitBounds(mapBounds, { padding: [40, 40] });
    }).addTo(map);
});

// Автоматический перебор панорам (проверяет файлы от 1.jpg до 15.jpg)
// Просто переименуйте ваши фото в папке panoramas в 1.jpg, 2.jpg и т.д.
async function loadPanoramas() {
    const thumbnailsContainer = document.getElementById('thumbnails');
    const maxPhotosToCheck = 15; 

    for (let i = 1; i <= maxPhotosToCheck; i++) {
        const imgPath = `panoramas/${i}.jpg`;
        
        try {
            // Быстрая проверка EXIF без загрузки тяжелого изображения
            let gps = await exifr.gps(imgPath);
            
            if (gps && gps.latitude && gps.longitude) {
                const { latitude, longitude } = gps;

                // Добавляем маркер
                const marker = L.marker([latitude, longitude]).addTo(map);
                
                const popupContent = `
                    <div style="text-align:center;">
                        <span style="font-size:11px; color:#888;">Медведица Панорама #${i}</span>
                        <a href="${imgPath}" target="_blank">
                            <img src="${imgPath}" class="popup-panorama" />
                        </a>
                    </div>
                `;
                marker.bindPopup(popupContent);

                // Создаем миниатюру для меню/шторки
                const thumb = document.createElement('img');
                thumb.src = imgPath;
                thumb.className = 'thumb-img';
                
                thumb.addEventListener('click', () => {
                    // На мобилках центрируем чуть выше, учитывая шторку снизу
                    const targetLat = window.innerWidth <= 768 ? latitude - 0.02 : latitude;
                    map.setView([targetLat, longitude], 13, { animate: true });
                    marker.openPopup();
                    
                    // Сворачиваем шторку на мобилках, чтобы открыть обзор
                    if (window.innerWidth <= 768) {
                        document.getElementById('sidebar').classList.add('hidden');
                    }
                });

                thumbnailsContainer.appendChild(thumb);
            }
        } catch (error) {
            // Если файла с таким номером нет (например, всего 5 фото из 15) — скрипт просто пойдет дальше
        }
    }
}

loadPanoramas();

// --- ЛОГИКА ИНТЕРФЕЙСА (ШТОРКА / МЕНЮ) ---
const sidebar = document.getElementById('sidebar');
const closeBtn = document.getElementById('close-sidebar');
const openBtn = document.getElementById('mobile-menu-btn');

// Закрыть (скрыть) меню
closeBtn.addEventListener('click', () => {
    sidebar.classList.add('hidden');
});

// Открыть меню
openBtn.addEventListener('click', () => {
    sidebar.classList.remove('hidden');
});

// Дополнительно: при клике в любое место карты закрывать шторку на мобильном
map.on('click', () => {
    if (window.innerWidth <= 768) {
        sidebar.classList.add('hidden');
    }
});
