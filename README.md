# Netshoes Web Scraper - TypeScript & Node.js

Este é um projeto de Teste Técnico para uma vaga de estágio de backend. O projeto é um Web Scraper desenvolvido em Node.js com TypeScript, capaz de extrair dados de produtos da loja virtual Netshoes (Título, Preço, Imagem e Descrição).

## 🛠️ Tecnologias

- **Node.js**: Plataforma performática e assíncrona, excelente para tarefas de I/O intensivas como Web Scraping e requisições HTTP seguidas.
- **TypeScript**: Adiciona tipagem estática ao JavaScript. Fundamental em um fluxo de Scraping para garantir a estrutura correta dos dados extraídos.
- **Axios**: Cliente HTTP baseado em Promises, fácil de configurar e usar. Facilita muito a manipulação de headers (como o injetado `User-Agent`) e o tratamento de erros em requisições (Status `403`, `404`).
- **Cheerio**: Biblioteca robusta que implementa um subconjunto do jQuery voltado especificamente para o lado do servidor. Muito rápida no parsing do HTML bruto porque não renderiza uma árvore do DOM visual ou executa JavaScript da página cliente, ideal para quando os dados já vêm renderizados no Server-Side.

## 🏗️ Arquitetura Orientada a Objetos (POO)

A arquitetura do scraper foi separada de acordo com as responsabilidades (Clean Code):

- `Product` (Entity): Representa o Domínio. Sua única responsabilidade é estruturar, armazenar e formatar os dados do produto, sem conhecimento de _onde_ os dados vieram.
- `NetshoesScraper` (Service): Engloba as regras de negócio de extração de dados. O Service cuida de realizar a requisição HTTP, consultar e validar o DOM usando seletores CSS e instanciar um `Product`.

## 📦 Como Instalar Dependências

1. Certifique-se de que o [Node.js](https://nodejs.org/) está instalado em sua máquina.
2. Clone este repositório ou baixe os arquivos (pasta `web-scrap-netshoes`).
3. Abra um terminal na pasta raiz do projeto.
4. Execute o comando para baixar as dependências (`axios`, `cheerio`, `typescript`, etc.):

```bash
npm install
```

_(Nota: O projeto conta com as tipagens e o executador em tempo real `ts-node` definidos em devDependencies)._

## ▶️ Como Rodar o Projeto

Você tem duas formas de rodar o código. Com ou sem parâmetros na URL:

Para rodar com a URL padrão do código, apenas utilize:

```bash
npm run start
```

_(Ele irá buscar um tênis de exemplo configurado no `index.ts`)_.

---

Caso queira passar diretamente a **sua** URL da Netshoes pelo terminal, pode fazer isso assim (com npx e ts-node):

```bash
npx ts-node src/index.ts "INSERIR_URL_AQUI"
```

**Exemplo:**

```bash
npx ts-node src/index.ts "https://www.netshoes.com.br/tenis-reserva-type-r-masculino-marinho-E9L-0177-012"
```
