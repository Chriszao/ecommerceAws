import type { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { v4 as uuid } from 'uuid';

import type { IProductRepository, Product } from './interfaces';

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

    this.dynamoDbClient
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
        UpdateExpression:
          'SET productName = :productName, code = :code, price = :price, model = :model',
        ExpressionAttributeValues: {
          ':productName': product.productName,
          ':code': product.code,
          ':price': product.price,
          ':model': product.model,
        },
      })
      .promise();

    return {
      ...(data.Attributes as Product),
      id,
    };
  }
}
