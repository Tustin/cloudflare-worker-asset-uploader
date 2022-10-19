import { Router } from 'itty-router'

const router = Router();

const cacheAge = 60 * 60 * 24 * 30;

router.get('/', () => {
    return Response.redirect('https://tustin.dev/', 301);
});

router.post('/upload', async (request, env) => {
    const apiKey = request.headers.get("X-API-Key");
    if (apiKey !== env.UPLOADER_API_KEY) {
        return new Response(JSON.stringify({
            error: 'Invalid API key'
        }), { status: 401, headers: {'Content-Type': 'application/json' } });
    }

    const contentType = request.headers.get('Content-Type');

    const fileName = crypto.randomUUID();

    try {
        await env.BUCKET.put(fileName, request.body, {
			httpMetadata: {
				contentType: contentType,
				cacheControl: `public, max-age=${cacheAge}`,
			},
        });

        return new Response(JSON.stringify({
            key: fileName
        }), { status: 200, headers: {'Content-Type': 'application/json' } });
        
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({
            error: 'File upload failed. Check log for details.'
        }), { status: 500, headers: {'Content-Type': 'application/json' } });
    }
});

router.get('/:key', async (request, env) => {

    const key = request.params.key;

    try
    {
        const object = await env.BUCKET.get(key)

        if (!object) {
            return new Response('File not found', { status: 404 });
        }

        const data = await object.arrayBuffer();
        const contentType = object.httpMetadata.contentType || '';
        const cacheControl = object.httpMetadata.cacheControl || '';

        return new Response(data, { status: 200, headers: {
            'Cache-Control': cacheControl,
            'Content-Type': contentType
        }});
    }
    catch (err)
    {
        console.log(err);
        return new Response('File not found', { status: 404 })
    }
});

router.all("*", () => new Response('skrrt', { status: 404 }))

export default {
	fetch: router.handle,
};