import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { NetshoesScraper } from './services/NetshoesScraper';

const port = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  //CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const parsedUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'GET' && parsedUrl.pathname === '/api/scrape') {
      const urlToScrape = parsedUrl.searchParams.get('url');
      if (!urlToScrape) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'A URL é obrigatória' }));
        return;
      }

      const scraper = new NetshoesScraper();
      const product = await scraper.scrape(urlToScrape);

      if (product) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(product));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Falha ao realizar web scraping do produto.' }));
      }
      return;
    }

    // Rota para o Currículo
    if (req.method === 'GET' && parsedUrl.pathname === '/curriculo.pdf') {
      const cvPath = path.join(__dirname, '../Currículo Gabriel Ribeiro.pdf');
      try {
        const fileContent = fs.readFileSync(cvPath);
        res.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="Curriculo_Gabriel_Ribeiro.pdf"'
        });
        res.end(fileContent);
      } catch (e) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Currículo não encontrado no servidor.');
      }
      return;
    }

    // Rota para os arquivos estáticos (HTML, CSS, JS)
    if (req.method === 'GET') {
      const publicPath = path.join(__dirname, '../public');
      let filePath = parsedUrl.pathname;
      if (filePath === '/') {
        filePath = '/index.html';
      }
      const absolutePath = path.join(publicPath, filePath);
      
      try {
        const fileContent = fs.readFileSync(absolutePath);
        const ext = path.extname(absolutePath);
        let contentType = 'text/html; charset=utf-8';
        if (ext === '.css') contentType = 'text/css';
        if (ext === '.js') contentType = 'text/javascript';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(fileContent);
      } catch (e) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Página não encontrada');
      }
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Página não encontrada');

  } catch (err: any) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Um erro inesperado ocorreu.', details: err.message }));
  }
});

server.listen(Number(port), () => {
  console.log(`\n🚀 Servidor UI iniciado com sucesso!`);
  console.log(`🔗 Acesse: http://localhost:${port}\n`);
});
