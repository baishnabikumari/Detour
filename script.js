const map = L.map('map').setView([22.5, 78.9], 5);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributions &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
}).addTo(map);

const selectedPlace = {};
let routeLayer = null;

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

async function fetchPOIs(routeCoords) {
    let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
    for (const c of routeCoords){
        if (c[1] < minLat) minLat = c[1];
        if (c[1] > maxLat) maxLat = c[1];
        if (c[0] < minLon) minLon = c[0];
        if (c[0] > maxLon) maxLon = c[0];
    }
    const pad = 0.1;
    const bbox = `${minLat - pad},${minLon - pad},${maxLat + pad},${maxLon + pad}`;

    const query = `
        [out:json][timeout:60];
        (
            node["tourism"~"attraction|viewpoint|museum"](${bbox});
            node["historic"](${bbox});
            node["natural"~"peak|waterfall"](${bbox});
        );
        out body;
    `;
    try{
        const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded'},
        });
        const data = await res.json();
        const all = data.elements.map(el => ({
            id: el.id,
            name: el.tags.name || 'Unnamed spot',
            lat: el.lat,
            lon: el.lon,
            cat: categorize(el.tags),
            tags: el.tags,
            interest: interestScore(el.tags),
        })).filter(p => p.name !== 'Unnamed spot');
        return filterNearRoute(all, routeCoords, 10);
    } catch (err){
        console.error('overpass failed', err);
        return [];
    }
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
    return closest
}

function interestScore(tags){
    let s = 1;
    if(tags.wikipedia || tags.wikidata) s += 3;
    if(tags.description) s += 1;
    if(tags.website) s += 1;
    if(tags.tourism === 'attraction' || tags.tourism === 'museum') s += 2;
    if(tags.historic === 'castle' || tags.historic === 'fort' || tags.historic === 'monument') s += 2;
    if(tags.natural === 'waterfall') s += 2;
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

function renderSpots(pois){
    const list = document.getElementById('spot-list');
    list.innerHTML = '';
    if(!pois.length){
        list.textContent = 'no worthwhile detour found for this route';
        return;
    }
    pois.slice(0, 20).forEach(p => {
        const card = document.createElement('div');
        card.className = 'spot spot-${p.cat}';
        card.innerHTML = `
            <div class="spot-name">${p.name}</div>
            <div class="spot-meta">
                <span class="spot-cat">${p.cat}</span>
                <span class="spot-detour">${p.detour.toFixed(1)} km off route</span>
            </div>
        `;
        list.appendChild(card);
    });
}

document.getElementById('find-btn').addEventListener('click', async () => {
    if(!selectedPlace.start || !selectedPlace.end){
        alert('Pick a start and destination from the dropdown first.');
        return;
    }
    if (routeLayer) map.removeLayer(routeLayer);

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
        const pois = await fetchPOIs(data.routes[0].geometry.coordinates);
        const routeCoords = data.routes[0].geometry.coordinates;
        pois.forEach(p => {
            p.detour = detourKm(p, routeCoords);
            p.score = p.interest / (p.detour + 0.5);
        });
        pois.sort((a,b) => b.score - a.score);
        renderSpots(pois)
    } catch (err){
        console.error('routing failed', err);
        alert('Could not find a route b/w those points.');
    }
});