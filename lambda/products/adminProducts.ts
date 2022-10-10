import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  const { httpMethod, resource, requestContext } = event;

  const { awsRequestId } = context;
  const { requestId } = requestContext;

  console.log(
    `API Gateway RequestId: ${awsRequestId} - Lambda RequestId: ${requestId}`,
  );

  if (resource === '/products') {
    if (httpMethod === 'POST') {
      console.log('#EVENT', event);

      return {
        statusCode: 201,
        body: JSON.stringify({
          message: 'Hello from POST /products',
        }),
      };
    }
  }

  if (resource === '/products/{id}') {
    console.log('#EVENT', event);

    const productId = event.pathParameters?.id as string;

    if (httpMethod === 'PUT') {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `Hello from PUT /products/${productId}`,
        }),
      };
    }

    if (httpMethod === 'DELETE') {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `Hello from DELETE /products/${productId}`,
        }),
      };
    }
  }

  return {
    statusCode: 400,
    body: JSON.stringify({
      message: 'Bad request',
    }),
  };
}
