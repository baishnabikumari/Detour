module.exports = async function handler(req, res) {
    if(req.method !== 'POST'){
        return res.status(405).json({ error: 'POST only' });
    }
    const query = req.body && req.body.data ? req.body.data : '';
    const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded'},
    });
    const data = await response.text();
    res.status(response.status)
        .setHeader('Content-Type', 'application/json')
        .send(data);
}