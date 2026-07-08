# Detour
- The interesting shit between where you are and where are you going...
- Write in a start and destination, Detour will find the cool stuffs along your driving route - temples, forts, waterfalls, viewpoints and more... and the ranks them how interesting they are vs how far the off-route they would take you.

**[live At](https://detour-puce.vercel.app/)**

## ScreenShots and ScreenRecording(demo-vid)

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