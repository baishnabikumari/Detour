const OVERPASS = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'https://overpass-api.de/api/interpreter'
    : '/api/overpass';

const map = L.map('map').setView([22.5, 78.9], 5);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributions &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
}).addTo(map);

const selectedPlace = {};
let routeLayer = null;
let currentPois = [];
let poiMarkers = [];
let endpointMarkers = [];

function debounce(fn, delay){
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

async function searchPlace(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
    try{
        const res = await fetch(url);
        return await res.json();
    } catch (err){
        console.error('geocoding failed', err);
        return [];
    }
}

function setupAutocomplete(inputId){
    const input = document.getElementById(inputId);
    const list = document.createElement('ul');
    list.className = 'suggestions';
    input.insertAdjacentElement('afterend', list);

    input.addEventListener('input', debounce(async () => {
        const query = input.value.trim();
        list.innerHTML = '';
        if(query.length < 3) return;

        const results = await searchPlace(query);
        results.forEach((place) => {
            const item = document.createElement('li');
            item.textContent = place.display_name;
            item.addEventListener('click', () => {
                input.value = place.display_name;
                selectedPlace[inputId] = { lat: +place.lat, lon: +place.lon };
                list.innerHTML = '';
            });
            list.appendChild(item);
        });
    }, 400));

    document.addEventListener('click', (e) => {
        if(e.target !== input) list.innerHTML = '';
    });
}

setupAutocomplete('start');
setupAutocomplete('end');
function sleep(ms){
    return new Promise(r => setTimeout(r, ms));
}

async function fetchPOIs(routeCoords) {
    const numChunks = Math.min(8, Math.max(3, Math.ceil(routeCoords.length / 200)));
    const chunkSize = Math.max(1, Math.floor(routeCoords.length / numChunks));
    const chunks = [];
    for(let i = 0; i < routeCoords.length; i += chunkSize){
        chunks.push(routeCoords.slice(i, i + chunkSize));
    }
    const all = [];
    const seen = new Set();

    for(let ci = 0; ci < chunks.length; ci++){
        if(ci > 0) await sleep(2500);
        const chunk = chunks[ci];
        let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
        for (const c of chunk){
            if (c[1] < minLat) minLat = c[1];
            if (c[1] > maxLat) maxLat = c[1];
            if (c[0] < minLon) minLon = c[0];
            if (c[0] > maxLon) maxLon = c[0];
        }
        const pad = 0.08;
        const bbox = `${minLat - pad},${minLon - pad},${maxLat + pad},${maxLon + pad}`;

        const query = `
            [out:json][timeout:25];
            (
                node["tourism"~"attraction|viewpoint|museum"](${bbox});
                node["historic"](${bbox});
                node["natural"~"peak|waterfall"](${bbox});
                node["amenity"~"restaurant|cafe|bar"]["name"](${bbox});
            );
            out body;
        `;
        try{
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000);
            const res = await fetch(OVERPASS, {
                method: 'POST',
                body: `data=${encodeURIComponent(query)}`,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded'},
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if(!res.ok){
                console.warn(`chunk ${ci + 1} returned ${res.status}, skipping`);
                continue;
            }
            const data = await res.json();
            data.elements.forEach(el => {
                if(!el.tags || !el.tags.name || seen.has(el.id)) return;
                seen.add(el.id);
                all.push({
                    id: el.id,
                    name: el.tags.name,
                    lat: el.lat,
                    lon: el.lon,
                    cat: categorize(el.tags),
                    tags: el.tags,
                    interest: interestScore(el.tags),
                });
            });
        } catch(err){
            console.warn(`chunk ${ci + 1} failed, skipping`, err);
        }
    }
    return filterNearRoute(all, routeCoords, 10);
}

function distKm(lat1, lon1, lat2, lon2){
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function filterNearRoute(pois, routeCoords, maxKm){
    const step = Math.max(1, Math.floor(routeCoords.length / 50));
    const sampled = [];
    for (let i = 0; i < routeCoords.length; i += step) sampled.push(routeCoords[i]);
    return pois.filter(p => {
        for(const c of sampled){
            if(distKm(p.lat, p.lon, c[1], c[0]) <= maxKm) return true;
        }
        return false;
    });
}

function detourKm(poi, routeCoords){
    const step = Math.max(1, Math.floor(routeCoords.length / 50));
    let closest = Infinity;
    for(let i = 0; i < routeCoords.length; i += step){
        const d = distKm(poi.lat, poi.lon, routeCoords[i][1], routeCoords[i][0]);
        if(d < closest) closest = d;
    }
    return closest;
}

function interestScore(tags){
    let s = 1;
    if(tags.wikipedia || tags.wikidata) s += 3;
    if(tags.description) s += 1;
    if(tags.website) s += 1;
    if(tags.tourism === 'attraction' || tags.tourism === 'museum') s += 2;
    if(tags.historic === 'castle' || tags.historic === 'fort' || tags.historic === 'monument') s += 2;
    if(tags.natural === 'waterfall') s += 2;
    if(tags.amenity === 'restaurant' || tags.amenity === 'cafe') s += 1;
    return s;
}

function categorize(tags){
    if (tags.amenity === 'restaurant' || tags.amenity === 'cafe' || tags.amenity === 'bar') return 'food';
    if (tags.historic) return 'history';
    if (tags.natural || tags.leisure) return 'nature';
    if(tags.tourism === 'museum') return 'history';
    if(tags.tourism === 'viewpoint') return 'nature';
    return 'weird';
}

function spreadAlongRoute(pois, routeCoords, buckets, perBucket){

    const total = buckets * perBucket;
    pois.forEach(p => {
        let nearestIdx = 0;
        let nearestDist = Infinity;
        const step = Math.max(1, Math.floor(routeCoords.length / 100));
        for(let i = 0; i < routeCoords.length; i += step){
            const d = distKm(p.lat, p.lon, routeCoords[i][1], routeCoords[i][0]);
            if(d < nearestDist){
                nearestDist = d;
                nearestIdx = i;
            }
        }
        p.routePos = nearestIdx / routeCoords.length;
    });

    const used = new Set();
    const picked = [];
    for(let b = 0; b < buckets; b++){
        const lo = b / buckets;
        const hi = (b + 1) / buckets;
        const inBucket = pois
            .filter(p => p.routePos >= lo && p.routePos < hi)
            .sort((a, b) => b.score - a.score)
            .slice(0, perBucket);
        inBucket.forEach(p => {
            picked.push(p);
            used.add(p.id);
        });
    }

    if(picked.length < total){
        const remaining = pois
            .filter(p => !used.has(p.id))
            .sort((a, b) => b.score - a.score)
            .slice(0, total - picked.length);
        picked.push(...remaining);
    }
    picked.sort((a, b) => b.score - a.score);
    return picked;
}

function esc(str){
    const d = document.createElement('span');
    d.textContent = str;
    return d.innerHTML;
}

function renderSpots(pois){
    const list = document.getElementById('spot-list');
    list.innerHTML = '';
    if(!pois.length){
        list.textContent = 'no worthwhile detour found for this route';
        return;
    }
    pois.slice(0, 20).forEach(p => {
        const card = document.createElement('div');
        card.className = `spot spot-${p.cat}`;
        card.innerHTML = `
            <div class="spot-name">${esc(p.name)}</div>
            <div class="spot-meta">
                <span class="spot-cat">${p.cat}</span>
                <span class="spot-detour">${p.detour.toFixed(1)} km off route</span>
            </div>
        `;
        list.appendChild(card);
        card.addEventListener('click', () => {
            const marker = poiMarkers.find(m => m._poiId === p.id);
            if(marker){
                map.setView([p.lat, p.lon], 13);
                marker.openPopup();
            }
        });
    });
}

const catColors = {
    food: '#e8631c',
    history: '#8b5a2b',
    nature: '#4a7c3f',
    weird: '#6b4c8f',
};

function renderMarkers(pois){
    poiMarkers.forEach(m => map.removeLayer(m));
    poiMarkers = [];
    pois.slice(0, 20).forEach(p => {
        const marker = L.circleMarker([p.lat, p.lon], {
            radius: 6,
            color: '#1c1a17',
            weight: 2,
            fillColor: catColors[p.cat] || '#999',
            fillOpacity: 0.9,
        }).addTo(map);
        marker.bindPopup(`
            <strong>${esc(p.name)}</strong><br>
            <span style="text-transform:uppercase;font-size:0.75rem;color:#7a7261">${p.cat} · ${p.detour.toFixed(1)} km off route</span>
        `);
        marker._poiId = p.id;
        poiMarkers.push(marker);
    });
}

function applyFilters(){
    const cat = document.getElementById('category-filter').value;
    const sort = document.getElementById('sort-by').value;

    let filtered = currentPois;
    if(cat !== 'all'){
        filtered = filtered.filter(p => p.cat === cat);
    }
    if(sort === 'time'){
        filtered = [...filtered].sort((a, b) => a.detour - b.detour);
    } else {
        filtered = [...filtered].sort((a, b) => b.score - a.score);
    }
    renderSpots(filtered);
    renderMarkers(filtered);
}

document.getElementById('find-btn').addEventListener('click', async () => {
    if(!selectedPlace.start || !selectedPlace.end){
        alert('Pick a start and destination from the dropdown first.');
        return;
    }
    if (routeLayer) map.removeLayer(routeLayer);

    poiMarkers.forEach(m => map.removeLayer(m));
    poiMarkers = [];
    document.getElementById('spot-list').innerHTML = '';
    endpointMarkers.forEach(m => map.removeLayer(m));
    endpointMarkers = [];
    const s = selectedPlace.start;
    const e = selectedPlace.end;
    const url = `https://router.project-osrm.org/route/v1/driving/${s.lon},${s.lat};${e.lon},${e.lat}?overview=full&geometries=geojson`;

    try{
        const res = await fetch(url);
        const data = await res.json();
        if(data.code !== 'Ok'){
            alert('No route found b/w those points.');
            return;
        }
        const geojson = { type: 'Feature', geometry: data.routes[0].geometry };
        routeLayer = L.geoJSON(geojson, { style: {color: '#f4b740', weight: 5 } }).addTo(map);
        map.fitBounds(routeLayer.getBounds());
        const startPin = L.marker([s.lat, s.lon]).addTo(map).bindPopup('Start');
        const endPin = L.marker([e.lat, e.lon]).addTo(map).bindPopup('Destination');
        endpointMarkers.push(startPin, endPin);
        const list = document.getElementById('spot-list');
        list.innerHTML = '<div class="loading"><div class="spinner"></div>scanning for the detours...</div>';
        const pois = await fetchPOIs(data.routes[0].geometry.coordinates);
        const routeCoords = data.routes[0].geometry.coordinates;
        pois.forEach(p => {
            p.detour = detourKm(p, routeCoords);
            p.score = p.interest / (p.detour + 0.5);
        });
        //pois.sort((a,b) => b.score - a.score);
        const spread = spreadAlongRoute(pois, routeCoords, 5, 4);
        renderSpots(spread);
        renderMarkers(spread);
        currentPois = spread;
    } catch (err){
        console.error('routing failed', err);
        alert('Could not find a route b/w those points.');
    }
});

document.getElementById('category-filter').addEventListener('change', applyFilters);
document.getElementById('sort-by').addEventListener('change', applyFilters);