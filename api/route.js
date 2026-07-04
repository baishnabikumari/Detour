export default{
    async fetch(request){
        const url = new URL(request.url);
        const start = url.searchParams.get('start');
        const end = url.searchParams.get('end');
        const orsUrl = `https://api.openrouteservice.org/v2/directions/driving-car/geojson?api_key=${process.env.ORS_API_KEY}&start=${start}&end=${end}`;

        try{
            const res = await fetch(orsUrl);
            const data = await res.json();
            return Response.json(data);
        } catch (err){
            return Response.json({ error: 'routing failed' }, { status: 500 });
        }
    },
};