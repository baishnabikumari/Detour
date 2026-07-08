# Detour
- The interesting shit between where you are and where are you going...
- Write in a start and destination, Detour will find the cool stuffs along your driving route - temples, forts, waterfalls, viewpoints and more... and the ranks them how interesting they are vs how far the off-route they would take you.

**[live At Vercel - Click Me](https://detour-puce.vercel.app/)**

## ScreenShots and ScreenRecording(demo-vid)
<img width="1439" height="832" alt="Screenshot 2026-07-09 at 1 34 58 AM" src="https://github.com/user-attachments/assets/c3a593d2-6885-4ba6-98e2-acc414364889" />

<img width="721" height="416" alt="Screenshot 2026-07-09 at 1 35 56 AM" src="https://github.com/user-attachments/assets/6c4791dc-7f0c-4422-867b-dc67ebff1c22" />

<img width="1439" height="832" alt="Screenshot 2026-07-09 at 1 39 13 AM" src="https://github.com/user-attachments/assets/54dd0006-6c49-4ab5-aa27-54155e7344da" />

<img width="1439" height="834" alt="Screenshot 2026-07-09 at 1 39 42 AM" src="https://github.com/user-attachments/assets/dc19da58-9f29-4426-a989-b934500b6ae1" />

<img width="1439" height="831" alt="Screenshot 2026-07-09 at 1 40 05 AM" src="https://github.com/user-attachments/assets/7bc54763-1ff3-4ef9-a6e9-1269b9359a63" />

## Features
- Autocomplete search for the start and destination.
- Driving route will drawn on the map with yellow line.
- POIs will be live from OpenStreetMap.
- Smart scoring.
- spread algo so the spots will cover all the route not just one city.
- filter by category: weird, food, nature, history.
- sort by the best detour or shortest detour.
- click any card to go to that spot in the map.
- works entire on the client side - no backend, no API and no acc at all just like plug and play.

## How it works
1. Type start and destination -> autocomplete via nominatim.
2. OSRM draws you the driving route on the map.
3. Route gets chunked in to parts, each queries Overpass an API for nearly POI(tourism, historic, nature and food).
4. POIs scored by `interest / (detour_km + 0.5)` - interesting spots close to the high rank of the route.
5. Picks route are evenly along with the route so you dont get the 20 or more spots chunks in only one city.
6. filter by category or the shortest detour's.

## Tech used
- **Leaflet.js**
- **OSRM**
- **Overpass Api**
- **Nominatim**
- **Vanilla Html, CSS and the one n only JS**

## Run it locally
```bash
git clone https://github.com/baishnabikumari/Detour.git

cd Detour &

npx serve.
```

or open the `index.html` directly - everything will run on the client-side.

Thanks made with 💖 by Baishuuu.
