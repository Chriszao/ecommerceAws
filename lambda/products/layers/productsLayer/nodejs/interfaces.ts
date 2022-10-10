export interface Product {
  id: string;
  productName: string;
  code: string;
  price: number;
  model: string;
}

export interface IProductRepository {
  fetchProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  createProduct(product: Omit<Product, 'id'>): Promise<Product>;
  deleteProduct(id: string): Promise<Product | undefined>;
  updateProduct(id: string, product: Product): Promise<Product>;
}
