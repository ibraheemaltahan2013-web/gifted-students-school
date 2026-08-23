const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

console.log('Starting server...');
console.log('Public directory:', PUBLIC_DIR);

const server = http.createServer((req, res) => {
    try {
        let filePath;
        
        if (req.url === '/' || req.url === '/index.html') {
            filePath = path.join(PUBLIC_DIR, 'index.html');
        } else {
            filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url.replace(/^\/+/, ''));
        }
        
        // Security: ensure file path is within public directory
        const normalizedPath = path.normalize(filePath);
        if (!normalizedPath.startsWith(PUBLIC_DIR + path.sep) && normalizedPath !== PUBLIC_DIR) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }
        
        fs.readFile(normalizedPath, (err, content) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404);
                    res.end('404 Not Found');
                } else {
                    console.error('Read error:', err);
                    res.writeHead(500);
                    res.end('Server Error: ' + err.code);
                }
            } else {
                const ext = path.extname(normalizedPath).toLowerCase();
                const contentTypes = {
                    '.html': 'text/html',
                    '.css': 'text/css',
                    '.js': 'application/javascript',
                    '.png': 'image/png',
                    '.jpg': 'image/jpeg'
                };
                const ct = contentTypes[ext] || 'application/octet-stream';
                res.writeHead(200, { 'Content-Type': ct });
                res.end(content);
            }
        });
    } catch (e) {
        console.error('Server error:', e);
        res.writeHead(500);
        res.end('Server Error: ' + e.message);
    }
});

server.on('error', (e) => {
    console.error('Server error:', e.code);
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Press Ctrl+C to stop');
});