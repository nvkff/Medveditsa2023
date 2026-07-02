// 1. Инициализация карты (ориентировочно среднее течение Медведицы)
const map = L.map('map').setView([56.3, 37.3], 9);

// Использование красивой топографической карты
L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: 'Map data: &copy; OpenStreetMap | Style: &copy; OpenTopoMap'
}).addTo(map);

// --- НАСТРОЙКА ВАШИХ ФАЙЛОВ ---
// Просто перечисляйте здесь имена файлов, которые вы закинули в папки
const gpxFiles = ['day1.gpx', 'day2.gpx']; 
const photoFiles = ['photo1.jpg', 'photo2.jpg']; 
// ---------------------------------

let totalDistance = 0;
const bounds = L.latLngBounds();

// 2. Загрузка и обработка GPX треков
gpxFiles.forEach(file => {
    new L.GPX(`gpx/${file}`, {
        async: true,
        polyline_options: {
            color: '#0088ff',
            opacity: 0.8,
            weight: 5,
            lineCap: 'round'
        },
        marker_options: {
            startIconUrl: null, // Убираем дефолтные маркеры старта/финиша
            endIconUrl: null,
            shadowUrl: null
        }
    }).on('loaded', function(e) {
        // Добавляем дистанцию текущего трека к общей
        totalDistance += e.target.get_distance() / 1000;
        document.getElementById('total-dist').innerText = totalDistance.toFixed(1);
        
        // Расширяем границы видимости карты под этот трек
        bounds.extend(e.target.getBounds());
        map.fitBounds(bounds, { padding: [30, 30] });
    }).addTo(map);
});

// 3. Чтение EXIF и вывод панорам на карту
async function loadPanoramas() {
    const thumbnailsContainer = document.getElementById('thumbnails');

    for (const fileName of photoFiles) {
        const imgPath = `panoramas/${fileName}`;
        
        try {
            // Библиотека exifr быстро извлекает только GPS-теги, не загружая само фото целиком
            let gps = await exifr.gps(imgPath);
            
            if (gps && gps.latitude && gps.longitude) {
                const { latitude, longitude } = gps;

                // Создаем маркер
                const marker = L.marker([latitude, longitude]).addTo(map);
                
                // Наполняем попап для карты
                const popupContent = `
                    <div style="text-align:center; color: #fff;">
                        <span style="font-size:12px; color:#aaa;">Панорама из EXIF</span>
                        <a href="${imgPath}" target="_blank">
                            <img src="${imgPath}" class="popup-panorama" alt="Панорама" />
                        </a>
                    </div>
                `;
                marker.bindPopup(popupContent);

                // Добавляем миниатюру в боковую галерею
                const thumb = document.createElement('img');
                thumb.src = imgPath;
                thumb.className = 'thumb-img';
                thumb.alt = fileName;
                
                // При клике на фото в меню — плавно центрируем карту и открываем маркер
                thumb.addEventListener('click', () => {
                    map.setView([latitude, longitude], 14, { animate: true });
                    marker.openPopup();
                });

                thumbnailsContainer.appendChild(thumb);
            } else {
                console.warn(`В файле ${fileName} не найдены GPS координаты.`);
            }
        } catch (error) {
            console.error(`Ошибка обработки файла ${fileName}:`, error);
        }
    }
}

// Запуск парсинга фотографий
loadPanoramas();

// 4. Логика сворачивания/разворачивания боковой панели
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggle-sidebar');

toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    
    // Пересчитываем размер карты после анимации меню, чтобы избежать серых зон
    setTimeout(() => map.invalidateSize(), 300);
});

// На мобильных устройствах скрываем панель при выборе фотографии из списка
thumbnailsContainer = document.getElementById('thumbnails');
thumbnailsContainer.addEventListener('click', (e) => {
    if (e.target.tagName === 'IMG' && window.innerWidth <= 768) {
        sidebar.classList.add('collapsed');
        setTimeout(() => map.invalidateSize(), 300);
    }
});

// Открываем панель по умолчанию, если пользователь зашел с ПК
if (window.innerWidth > 768) {
    sidebar.classList.remove('collapsed');
    setTimeout(() => map.invalidateSize(), 100);
}
