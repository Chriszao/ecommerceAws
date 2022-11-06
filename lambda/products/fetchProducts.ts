import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { captureAWS } from 'aws-xray-sdk';

import { ProductRepository } from '/opt/nodejs/productsLayer';

captureAWS(require('aws-sdk'));

const tableName = process.env.DYNAMO_TABLE_NAME as string;
const dynamoDbClient = new DynamoDB.DocumentClient();
const productsRepository = new ProductRepository(dynamoDbClient, tableName);

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  try {
    const { httpMethod, resource, requestContext } = event;

    const { awsRequestId } = context;
    const { requestId } = requestContext;

    console.log(
      `API Gateway RequestId: ${awsRequestId} - Lambda RequestId: ${requestId}`,
    );

    if (resource === '/products') {
      if (httpMethod === 'GET') {
        const products = await productsRepository.fetchProducts();

        return {
          statusCode: 200,
          body: JSON.stringify({
            products,
          }),
        };
      }
    }

    if (resource === '/products/{id}') {
      const productId = event.pathParameters?.id as string;

      const product = await productsRepository.getProductById(productId);

      if (!product) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            message: 'Product not found!',
          }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          product,
        }),
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Bad request',
      }),
    };
  } catch (error) {
    console.error((<Error>error).message);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: (<Error>error).message ?? 'Internal error!',
      }),
    };
  }
}
