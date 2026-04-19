import { NetshoesScraper } from './services/NetshoesScraper';

/**
 * Função principal de execução
 */
async function run() {
  console.log('🚀 Iniciando Web Scraper da Netshoes...\n');

  // URL padrão de exemplo para testes (Pode ser fornecida via argumentos no terminal)
  const defaultUrl = 'https://www.netshoes.com.br/p/tenis-de-corrida-under-armour-starlight-2-R5M-2A5R-008';
  const targetUrl = process.argv[2] || defaultUrl;

  console.log(`🔗 URL Alvo: ${targetUrl}\n`);

  const scraper = new NetshoesScraper();
  
  // Extrai os dados
  const product = await scraper.scrape(targetUrl);

  if (product) {
    // Requisito Obrigatório: Imprimir no console o objeto formatado
    product.print();
    // Alternativa testável: console.log(product.toJSON());
  } else {
    console.log('\n❌ Falha ao tentar fazer o web scraping do produto. Verifique os avisos/logs acima para saber os detalhes.');
  }
}

// Executa a aplicação
run();
