module.exports = async function handler(req, res) {
    if(req.method !== 'POST'){
        return res.status(405).json({ error: 'POST only' });
    }
    let query = '';
    if(typeof req.body === 'string'){
        query = new URLSearchParams(req.body).get('data') || '';
    } else if (req.body && req.body.data){
        query = req.body.data;
    }
    const upstream = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded'},
    });
    const text = await upstream.text();
    res.setHeader('Content-Type', 'application/json');
    res.status(upstream.status).send(text);
}