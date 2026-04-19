import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import { Product } from '../entities/Product';

export class NetshoesScraper {
  // User Agent real para evitar o bloqueio de requisições simples
  private readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

  /**
   * Faz o scraping dos detalhes de um produto dado a URL da Netshoes.
   * @param url URL do produto na Netshoes
   * @returns Retorna uma Promise que resolve a entidade Produto, ou null caso falhe.
   */
  public async scrape(url: string): Promise<Product | null> {
    try {
      // 1. Busca o conteúdo HTML usando axios
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      });

      const html = response.data;
      
      // 2. Carrega o HTML no Cheerio
      const $ = cheerio.load(html);

      // 3. Extrai dados usando seletores CSS seguros
      // Os seletores podem mudar dependendo de atualizações na estrutura HTML da Netshoes.
      // Seletores típicos baseados em estruturas comuns de e-commerce e na página da Netshoes.
      const titleElement = $('h1[data-productname], .product-name').first();
      
      // A Imagem geralmente fica na tag principal de galeria ou tag meta
      const imageElement = $('.zoom, .photo-figure img, meta[property="og:image"]').first(); 
      const descriptionElement = $('#features, .summary, .description, p[itemprop="description"]').first();

      // 4. Valida e higieniza os dados extraídos do HTML
      const title = titleElement.text().trim() || null;
      let price: string | null = null;
      
      // Tenta extrair o SKU para a chamada da API
      let sku: string | null = null;
      let ldJsonPrice: number | null = null;

      // 1. Tenta buscar o SKU da variação EXATA e o Preço de fallback do JSON-LD primeiro
      const ldJsonScripts = $('script[type="application/ld+json"]').toArray();
      for (const script of ldJsonScripts) {
         try {
            const jsonData = JSON.parse($(script).html() || '{}');
            if (jsonData['@type'] === 'Product') {
               if (jsonData.sku) sku = jsonData.sku;
               if (jsonData.offers && jsonData.offers.price) {
                  ldJsonPrice = parseFloat(jsonData.offers.price);
               }
               break;
            }
         } catch(e){}
      }

      // 2. Se não houver SKU no JSON-LD, tenta extrair da URL como fallback
      if (!sku) {
         // Limpa a URL removendo parâmetros de query strings e barras no final
         const cleanUrl = url.split('?')[0].replace(/\/$/, '');
         // O SKU geralmente fica bem no final da URL
         const skuMatch = cleanUrl.match(/-([a-zA-Z0-9]{3}-[a-zA-Z0-9]{3,4}-[a-zA-Z0-9]{3}(?:-[0-9]{1,3})?)$/);
         if (skuMatch) sku = skuMatch[1];
      }

      // 3. Busca o Preço em tempo real utilizando a API lazy nativa da Netshoes
      if (sku) {
        try {
          const apiResponse = await axios.get(`https://www.netshoes.com.br/frdmprcsts/${sku}/alternative/lazy?state=SP`, {
            headers: {
              'User-Agent': this.USER_AGENT,
              'Accept': 'application/json'
            }
          });

          if (apiResponse.data && apiResponse.data.salePrice) {
            price = (apiResponse.data.salePrice / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          } else if (apiResponse.data && apiResponse.data.listPrice) {
            price = (apiResponse.data.listPrice / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          }
        } catch (apiError) {
          console.warn(`⚠️ Aviso: Falha ao buscar na API de preços para o SKU ${sku}.`);
        }
      }

      // 4. Fallback 1: Preço do JSON-LD (caso a API falhe ou falte a variação do SKU)
      if (!price && ldJsonPrice) {
         price = ldJsonPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      }

      // 5. Fallback 2: Meta Tag (usada pela Netshoes para SEO)
      if (!price) {
         const metaPrice = $('meta[property="product:price:amount"]').attr('content')?.trim();
         if (metaPrice) {
            price = parseFloat(metaPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
         }
      }

      // 6. Fallback 3: Tenta buscar pelo preço manualmente nos elementos HTML
      if (!price) {
        let extractedPrice = $('.saleInCents-value').first().text().trim() || 
                             $('.listInCents-value').first().text().trim() || 
                             $('.default-price, .sale-price, [data-productprice]').first().text().trim();
        if (extractedPrice) {
          price = extractedPrice;
        }
      }
      
      // Tenta extrair o "src" da img ou o "content" da meta
      const image = imageElement.attr('src') || imageElement.attr('content') || null;

      // 9. Extração aprimorada de Descrição e estruturação de Atributos vindos nativamente do HTML
      let extractedDescription = $('.features--description').text().trim();
      
      const attributes: string[] = [];
      $('.features--attributes li').each((_, el) => {
         // Formata as <li> removendo quebras de linha excessivas/espaços múltiplos (ex: "Nome: Tênis Adidas")
         const attrText = $(el).text().replace(/\s+/g, ' ').trim();
         if (attrText) attributes.push(attrText);
      });

      if (attributes.length > 0) {
         extractedDescription += (extractedDescription ? '\n\n' : '') + 'Atributos:\n- ' + attributes.join('\n- ');
      }

      // Fallback para layouts antigos caso a descrição da classe .features--description não exista
      if (!extractedDescription) {
         extractedDescription = $('#features, .summary, .description, p[itemprop="description"]').first().text().trim();
      }
      
      const description = extractedDescription || null;

      // Garante que nenhum dos dados críticos fique nulo (embora possa retornar dados parciais)
      if (!title && !price && !image) {
        console.warn('⚠️ Aviso: Seletores falharam ao buscar os componentes essenciais do produto. A estrutura do HTML pode ter mudado ou fomos bloqueados como bot.');
        return null;
      }

      // Cria e retorna a Entidade do Produto
      return new Product(
        title ?? 'Título não encontrado',
        price ?? 'Item indisponível ou preço não encontrado',
        image ?? 'Imagem não encontrada',
        description ?? 'Descrição não encontrada'
      );

    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  /**
   * Tratamento de erro centralizado
   * @param error Erro desconhecido
   */
  private handleError(error: unknown): void {
    if (error instanceof AxiosError) {
      console.error(`❌ Erro HTTP durante o scraping: ${error.message}`);
      if (error.response?.status === 403) {
        console.error('🔒 Acesso Negado (403). É necessário usar browsers avançados (headless) ou proxies residenciais para contornar a proteção WAF/Bot.');
      } else if (error.response?.status === 404) {
        console.error('🕵️‍♂️ Não Encontrado (404). Verifique se a URL do produto é válida.');
      }
    } else if (error instanceof Error) {
      console.error(`❌ Erro Inesperado: ${error.message}`);
    } else {
      console.error('❌ Ocorreu um erro desconhecido.');
    }
  }
}
