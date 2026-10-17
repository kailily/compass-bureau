// 极简酬金榜后端：零依赖，单文件，数据存 scores.json
// 启动：node server/score-server.js   （默认 8787 端口）
// 前端把 SCORE_API 指到 http://<主机>:8787/api 即可
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8787;
const FILE = path.join(__dirname, 'scores.json');

const read = () => {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (_) { return []; }
};
const write = list => fs.writeFileSync(FILE, JSON.stringify(list, null, 2));

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

http.createServer((req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }

  if (req.url === '/api/scores' && req.method === 'GET') {
    const list = read().sort((a, b) => b.pts - a.pts).slice(0, 50);
    res.writeHead(200, { ...cors, 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(list));
  }

  if (req.url === '/api/scores' && req.method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 4096) req.destroy(); });
    req.on('end', () => {
      try {
        const { name, pts } = JSON.parse(body || '{}');
        const clean = String(name || '').trim().slice(0, 12) || '无名探员';
        const score = Math.max(0, Math.min(99999, Number(pts) || 0));
        const list = read().concat([{ name: clean, pts: score, at: Date.now() }])
          .sort((a, b) => b.pts - a.pts).slice(0, 50);
        write(list);
        res.writeHead(200, { ...cors, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, cors); res.end('bad request');
      }
    });
    return;
  }

  res.writeHead(404, cors); res.end('not found');
}).listen(PORT, () => console.log('score server on :' + PORT));
