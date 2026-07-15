# Detour
- The interesting shit between where you are and where are you going...
- Write in a start and destination, Detour will find the cool stuffs along your driving route - temples, forts, waterfalls, viewpoints and more... and the ranks them how interesting they are vs how far the off-route they would take you.

**Note**- Overpass is a free api that rate limits to ~2 concurrent requests per IP so this will take time(often 45–60s) to load detours(chunks)

**[live At Vercel - Click Me](https://detour-puce.vercel.app/)**

---

## ScreenShots and ScreenRecording(demo-vid)

<img width="1439" height="832" alt="Screenshot 2026-07-09 at 1 34 58 AM" src="https://github.com/user-attachments/assets/c3a593d2-6885-4ba6-98e2-acc414364889" />

<img width="1251" height="721" alt="Screenshot 2026-07-15 at 12 02 31 PM" src="https://github.com/user-attachments/assets/bc4671fa-08bc-4bdc-b084-6446af0709f3" />

<img width="1439" height="832" alt="Screenshot 2026-07-09 at 1 39 13 AM" src="https://github.com/user-attachments/assets/54dd0006-6c49-4ab5-aa27-54155e7344da" />

<img width="1439" height="834" alt="Screenshot 2026-07-09 at 1 39 42 AM" src="https://github.com/user-attachments/assets/dc19da58-9f29-4426-a989-b934500b6ae1" />

<img width="1439" height="831" alt="Screenshot 2026-07-09 at 1 40 05 AM" src="https://github.com/user-attachments/assets/7bc54763-1ff3-4ef9-a6e9-1269b9359a63" />

---

## video - demo

https://github.com/user-attachments/assets/9a6f56f5-4777-4dee-b84a-e1ce1dec44f5

---

## Some SS while i was building the project

<img width="1302" height="659" alt="Screenshot 2026-07-15 at 11 41 23 AM" src="https://github.com/user-attachments/assets/17ed5623-5b5a-41ba-91bf-9bc08f1a1120" />

<img width="1331" height="702" alt="Screenshot 2026-07-15 at 11 41 56 AM" src="https://github.com/user-attachments/assets/07e8bc28-4759-4135-807c-1f4646836a4d" />

<img width="1319" height="655" alt="Screenshot 2026-07-15 at 11 42 17 AM" src="https://github.com/user-attachments/assets/96f45934-2c58-4fad-93af-0baf50ab14d7" />

<img width="1304" height="655" alt="Screenshot 2026-07-15 at 11 42 38 AM" src="https://github.com/user-attachments/assets/f8d1a427-7a7b-40da-8ae3-e5e96c59fd0f" />

<img width="1305" height="694" alt="Screenshot 2026-07-15 at 11 42 57 AM" src="https://github.com/user-attachments/assets/8c6ed322-9ffd-43ea-8f95-3d023cc107fa" />

<img width="1305" height="697" alt="Screenshot 2026-07-15 at 11 43 11 AM" src="https://github.com/user-attachments/assets/6fd06579-4600-4a38-adfc-19655dc0c9b1" />

---

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
