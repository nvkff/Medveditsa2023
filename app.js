// 1. Инициализация карты (нацелена примерно на среднее течение Медведицы)
const map = L.map('map').setView([56.3, 37.3], 9);

// Красивая топографическая подложка (OpenTopoMap)
L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: 'Map data: &copy; OpenStreetMap, SRTM | Map style: &copy; OpenTopoMap'
}).addTo(map);

// --- НАСТРОЙКА ВАШИХ ФАЙЛОВ ---
// Просто добавляйте сюда имена файлов, которые закинули в папки
const gpxFiles = ['day1.gpx', 'day2.gpx']; 
const photoFiles = ['photo1.jpg', 'photo2.jpg']; 
// ---------------------------------

let totalDistance = 0;

// 2. Загрузка и отображение GPX треков
gpxFiles.forEach(file => {
    new L.GPX(`gpx/${file}`, {
        async: true,
        polyline_options: {
            color: '#0088ff',
            opacity: 0.75,
            weight: 5,
            lineCap: 'round'
        }
    }).on('loaded', function(e) {
        // Считаем общую дистанцию (переводим в км)
        totalDistance += e.target.get_distance() / 1000;
        document.getElementById('total-dist').innerText = totalDistance.toFixed(1);
        
        // Автоматически масштабируем карту, чтобы трек помещался в экран
        map.fitBounds(e.target.getBounds());
    }).addTo(map);
});

// 3. Функция для чтения EXIF и добавления фото на карту
async function loadPanoramas() {
    const thumbnailsContainer = document.getElementById('thumbnails');

    for (const fileName of photoFiles) {
        const imgPath = `panoramas/${fileName}`;
        
        try {
            // exifr извлекает только GPS данные, не загружая весь тяжелый файл картинки целиком
            let gps = await exifr.gps(imgPath);
            
            if (gps && gps.latitude && gps.longitude) {
                const { latitude, longitude } = gps;

                // Создаем маркер на карте
                const marker = L.marker([latitude, longitude]).addTo(map);
                
                // Красивый попап с превью при клике на маркер
                const popupContent = `
                    <div style="text-align:center;">
                        <strong>Панорама на Медведице</strong><br>
                        <a href="${imgPath}" target="_blank">
                            <img src="${imgPath}" class="popup-panorama" />
                        </a>
                    </div>
                `;
                marker.bindPopup(popupContent);

                // Добавляем миниатюру в боковую панель
                const thumb = document.createElement('img');
                thumb.src = imgPath;
                thumb.className = 'thumb-img';
                thumb.title = 'Посмотреть на карте';
                
                // При клике на миниатюру — плавно перемещаемся к маркеру и открываем попап
                thumb.addEventListener('click', () => {
                    map.setView([latitude, longitude], 14, { animate: true });
                    marker.openPopup();
                });

                thumbnailsContainer.appendChild(thumb);
            } else {
                console.warn(`В файле ${fileName} не найдены геотеги EXIF.`);
            }
        } catch (error) {
            console.error(`Ошибка обработки файла ${fileName}:`, error);
        }
    }
}

// Запускаем парсинг фото
loadPanoramas();
