/**
 * EVENTOS-IMO - Multi-Event HTTP Server & Internal Rewrite Engine
 * - Zero-dependency Node.js HTTP server for Railway deployment
 * - Internal rewrite routing for event subfolders (/26-09-30_BeLight/ -> /26-09-30_BeLight/Client/index.html)
 * - Transparent sub-asset resolution (Client/style.css, Client/script.js)
 * - Cross-Origin Resource Sharing (CORS) for external embed.js host injection
 * - Structured diagnostic request logging
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain; charset=utf-8'
};

function sendResponse(res, statusCode, contentType, data, extraHeaders = {}) {
    const headers = {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
        'Cache-Control': contentType.includes('html') || contentType.includes('json') ? 'no-cache' : 'public, max-age=3600',
        ...extraHeaders
    };
    res.writeHead(statusCode, headers);
    res.end(data);
}

function serveFile(res, filePath, logTag = '') {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error(`[Server Error] Failed reading: ${filePath}`, err.message);
            return sendResponse(res, 500, 'text/plain', '500 Internal Server Error');
        }
        sendResponse(res, 200, contentType, data);
        if (logTag) {
            console.log(`[HTTP 200] ${logTag} -> ${filePath}`);
        }
    });
}

const server = http.createServer((req, res) => {
    const startTime = Date.now();

    // 1. CORS Preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Range',
            'Access-Control-Max-Age': '86400'
        });
        res.end();
        return;
    }

    // Only allow GET and HEAD requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return sendResponse(res, 405, 'text/plain', '405 Method Not Allowed');
    }

    // 2. Parse URL and Normalize Safe Path
    const [pathname, rawQuery] = req.url.split('?');
    const querySuffix = rawQuery ? `?${rawQuery}` : '';

    // Prevent directory traversal
    let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    if (safePath.startsWith('/')) safePath = safePath.slice(1);

    const targetFullPath = path.join(ROOT_DIR, safePath);

    // Security check: ensure path remains within ROOT_DIR
    if (!targetFullPath.startsWith(ROOT_DIR)) {
        console.warn(`[Security Alert] Traversal attempt blocked: ${pathname}`);
        return sendResponse(res, 403, 'text/plain', '403 Forbidden');
    }

    // 3. Root URL Resolution
    if (!safePath || safePath === '' || safePath === 'index.html') {
        const rootIndex = path.join(ROOT_DIR, 'index.html');
        return serveFile(res, rootIndex, `Root Landing`);
    }

    // 4. File / Directory Inspection
    fs.stat(targetFullPath, (err, stats) => {
        // A. Direct file hit (e.g. /style.css, /26-09-30_BeLight/embed.js, /26-09-30_BeLight/config.json)
        if (!err && stats.isFile()) {
            return serveFile(res, targetFullPath, `Direct File`);
        }

        // B. Directory hit
        if (!err && stats.isDirectory()) {
            // Enforce trailing slash on directory access to ensure browser relative link resolution works properly
            if (!pathname.endsWith('/')) {
                res.writeHead(301, {
                    'Location': `${pathname}/${querySuffix}`,
                    'Access-Control-Allow-Origin': '*'
                });
                res.end();
                return;
            }

            // 1. Direct index.html in directory (e.g. /26-09-30_BeLight/index.html -> Event Sub-Landing, or /26-09-30_BeLight/player/index.html -> Player)
            const directIndex = path.join(targetFullPath, 'index.html');
            if (fs.existsSync(directIndex)) {
                return serveFile(res, directIndex, `Directory Index (${safePath})`);
            }

            // 2. Rewrite: player/index.html
            const playerIndex = path.join(targetFullPath, 'player', 'index.html');
            if (fs.existsSync(playerIndex)) {
                return serveFile(res, playerIndex, `Player Rewrite (${safePath} -> player/index.html)`);
            }

            // 3. Rewrite: Client/index.html (backward compatibility)
            const clientIndex = path.join(targetFullPath, 'Client', 'index.html');
            if (fs.existsSync(clientIndex)) {
                return serveFile(res, clientIndex, `Client Rewrite (${safePath} -> Client/index.html)`);
            }
        }

        // C. Sub-asset Resolution for Event Folders
        const pathSegments = safePath.split('/');
        if (pathSegments.length >= 2) {
            const eventDir = pathSegments[0]; // e.g. "26-09-30_BeLight"
            const subResource = pathSegments.slice(1).join('/'); // e.g. "player/config.json", "style.css"

            // If player/Client requests config.json and it lives at event root:
            if (subResource === 'player/config.json' || subResource === 'Client/config.json') {
                const eventConfigPath = path.join(ROOT_DIR, eventDir, 'config.json');
                if (fs.existsSync(eventConfigPath) && fs.statSync(eventConfigPath).isFile()) {
                    return serveFile(res, eventConfigPath, `Event Config Fallback (${safePath} -> ${eventDir}/config.json)`);
                }
            }

            // Check under player/
            const playerAssetPath = path.join(ROOT_DIR, eventDir, 'player', subResource);
            if (fs.existsSync(playerAssetPath) && fs.statSync(playerAssetPath).isFile()) {
                return serveFile(res, playerAssetPath, `Player Sub-Asset Rewrite (${safePath} -> ${eventDir}/player/${subResource})`);
            }

            // Check under Client/
            const clientAssetPath = path.join(ROOT_DIR, eventDir, 'Client', subResource);
            if (fs.existsSync(clientAssetPath) && fs.statSync(clientAssetPath).isFile()) {
                return serveFile(res, clientAssetPath, `Client Sub-Asset Rewrite (${safePath} -> ${eventDir}/Client/${subResource})`);
            }
        }

        // D. Fallback 404
        console.warn(`[HTTP 404] Not Found: ${req.url} (Elapsed: ${Date.now() - startTime}ms)`);
        sendResponse(res, 404, 'text/html; charset=utf-8', `
            <!DOCTYPE html>
            <html lang="es">
            <head><title>404 - No Encontrado | EVENTOS-IMO</title><meta charset="UTF-8"></head>
            <body style="font-family: -apple-system, sans-serif; text-align: center; padding: 60px 20px; background: #F7F9FA; color: #002D62;">
                <h1 style="font-size: 2.5rem; margin-bottom: 12px;">404</h1>
                <p style="font-size: 1.1rem; color: #475569; margin-bottom: 24px;">La página o recurso solicitado no existe en la plataforma EVENTOS-IMO.</p>
                <a href="/" style="background: #00669D; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600;">Volver a EVENTOS-IMO</a>
            </body>
            </html>
        `);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`  EVENTOS-IMO Platform HTTP Server`);
    console.log(`  Running on: http://0.0.0.0:${PORT}`);
    console.log(`  Mode: Multi-Event Internal Rewrite`);
    console.log(`====================================================`);
});
