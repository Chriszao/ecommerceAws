import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { DynamoDB, Lambda } from 'aws-sdk';
import { captureAWS } from 'aws-xray-sdk';

import type { ProductEvent } from '/opt/nodejs/productEventsLayer';
import { ProductEventType } from '/opt/nodejs/productEventsLayer';
import type { Product } from '/opt/nodejs/productsLayer';
import { ProductRepository } from '/opt/nodejs/productsLayer';

captureAWS(require('aws-sdk'));

const tableName = process.env.DYNAMO_TABLE_NAME as string;
const productEventsFunctionName = process.env
  .PRODUCT_EVENTS_FUNCTION_NAME as string;

const dynamoDbClient = new DynamoDB.DocumentClient();
const lambdaClient = new Lambda();

const productsRepository = new ProductRepository(dynamoDbClient, tableName);

function sendProductEvent(
  product: Product,
  eventType: ProductEventType,
  email: string,
  lambdaRequestId: string,
) {
  const event: ProductEvent = {
    email,
    eventType,
    requestId: lambdaRequestId,
    price: product.price,
    productCode: product.code,
    productId: product.id,
  };

  return lambdaClient
    .invoke({
      FunctionName: productEventsFunctionName,
      Payload: JSON.stringify(event),
      InvocationType: 'Event',
    })
    .promise();
}

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
      if (httpMethod === 'POST') {
        console.log('#EVENT', event);

        const product: Product = JSON.parse(event.body as string);

        const productCreated = await productsRepository.createProduct(product);

        const response = await sendProductEvent(
          product,
          ProductEventType.CREATED,
          'chris.f.assis18@gmail.com',
          awsRequestId,
        );

        console.log('#RESPONSE', response);

        return {
          statusCode: 201,
          body: JSON.stringify(productCreated),
        };
      }
    }

    if (resource === '/products/{id}') {
      console.log('#EVENT', event);

      const productId = event.pathParameters?.id as string;

      if (httpMethod === 'PUT') {
        const product: Product = JSON.parse(event.body as string);

        try {
          const updatedProduct = await productsRepository.updateProduct(
            productId,
            product,
          );

          const response = await sendProductEvent(
            updatedProduct,
            ProductEventType.UPDATED,
            'chris.f.assis18@gmail.com',
            awsRequestId,
          );

          console.log('#RESPONSE', response);

          return {
            statusCode: 200,
            body: JSON.stringify(updatedProduct),
          };
        } catch (error) {
          return {
            statusCode: 404,
            body: JSON.stringify({
              message: 'Product not Found!',
            }),
          };
        }
      }

      if (httpMethod === 'DELETE') {
        const deletedProduct = await productsRepository.deleteProduct(
          productId,
        );

        if (!deletedProduct) {
          throw new Error(
            `An error ocurred while trying to delete product with id: ${productId}`,
          );
        }

        const response = await sendProductEvent(
          deletedProduct,
          ProductEventType.DELETED,
          'chris.f.assis18@gmail.com',
          awsRequestId,
        );

        console.log('#RESPONSE', response);

        return {
          statusCode: 200,
          body: JSON.stringify(deletedProduct),
        };
      }
    }

    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Bad request',
      }),
    };
  } catch (error) {
    console.error(<Error>error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: (<Error>error).message,
      }),
    };
  }
}
