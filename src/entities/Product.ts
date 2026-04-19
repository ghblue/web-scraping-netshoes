export class Product {
  private title: string;
  private price: string;
  private image: string;
  private description: string;

  constructor(title: string, price: string, image: string, description: string) {
    this.title = title;
    this.price = price;
    this.image = image;
    this.description = description;
  }

  // Objeto JSON formatado para integrações ou saídas
  public toJSON(): object {
    return {
      title: this.title,
      price: this.price,
      image: this.image,
      description: this.description,
    };
  }

  public print(): void {
    console.log("=== Produto Extraído ===");
    console.log(`Título:    ${this.title}`);
    console.log(`Preço:     ${this.price}`);
    console.log(`URL Imag.: ${this.image}`);
    console.log(`Descrição: ${this.description}`);
    console.log("========================");
  }
}
