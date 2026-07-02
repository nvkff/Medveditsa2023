const map = L.map('map', { zoomControl: window.innerWidth > 768 }).setView([56.3, 37.3], 9);

L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '&copy; OpenTopoMap'
}).addTo(map);

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

// Загрузка GPX с исправленными путями под GitHub Pages
gpxFiles.forEach(file => {
    // Явно указываем относительный путь через ./
    new L.GPX(`./gpx/${file}`, {
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
    }).on('error', function(err) {
        console.error("Ошибка загрузки трека: " + file, err);
    }).addTo(map);
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

// На десктопе открыто сразу, на мобилках скрыто
if (window.innerWidth > 768) {
    sidebar.classList.remove('hidden');
}
