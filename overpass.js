export default async function handler(req, res) {
    if(req.method !== 'POST'){
        return res.status(405).json({ error: 'POST only' });
    }
    const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: req.body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded'},
    });
    const data = await response.text();
    res.status(response.status).send(data);
}