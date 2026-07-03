const map = L.map('map').setView([22.5, 78.9], 5);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributions &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
}).addTo(map);

const selectedPlace = {};

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