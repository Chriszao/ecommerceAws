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
    if (httpMethod === 'GET') {
      console.log('#EVENT', event);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Hello World',
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
