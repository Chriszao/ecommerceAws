import type { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { v4 as uuid } from 'uuid';

export interface Product {
  id: string;
  productName: string;
  code: string;
  price: number;
  model: string;
  productUrl: string;
}

interface IProductRepository {
  fetchProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  createProduct(product: Omit<Product, 'id'>): Promise<Product>;
  deleteProduct(id: string): Promise<Product | undefined>;
  updateProduct(id: string, product: Product): Promise<Product>;
}

export class ProductRepository implements IProductRepository {
  constructor(
    private dynamoDbClient: DocumentClient,
    private tableName: string,
  ) {}

  async fetchProducts(): Promise<Product[]> {
    const data = await this.dynamoDbClient
      .scan({
        TableName: this.tableName,
      })
      .promise();

    return (data.Items ?? []) as Product[];
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const data = await this.dynamoDbClient
      .get({
        TableName: this.tableName,
        Key: {
          id,
        },
      })
      .promise();

    return data.Item as Product;
  }

  async createProduct(product: Product): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: uuid(),
    };

    await this.dynamoDbClient
      .put({
        TableName: this.tableName,
        Item: newProduct,
      })
      .promise();

    return newProduct;
  }

  async deleteProduct(id: string): Promise<Product | undefined> {
    const data = await this.dynamoDbClient
      .delete({
        TableName: this.tableName,
        Key: {
          id,
        },
        ReturnValues: 'ALL_OLD',
      })
      .promise();

    return data.Attributes as Product;
  }

  async updateProduct(id: string, product: Product): Promise<Product> {
    const data = await this.dynamoDbClient
      .update({
        TableName: this.tableName,
        Key: {
          id,
        },
        ConditionExpression: 'attribute_exists(id)',
        ReturnValues: 'UPDATED_NEW',
        UpdateExpression: `
          SET
            productName = :productName,
            code = :code,
            price = :price,
            model = :model,
            productUrl = :productUrl
          `,
        ExpressionAttributeValues: {
          ':productName': product.productName,
          ':code': product.code,
          ':price': product.price,
          ':model': product.model,
          ':productUrl': product.productUrl,
        },
      })
      .promise();

    return {
      ...(data.Attributes as Product),
      id,
    };
  }
}
