import type { Callback, Context } from 'aws-lambda';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { captureAWS } from 'aws-xray-sdk';

import type { ProductEvent } from '/opt/nodejs/productEventsLayer';

captureAWS(require('aws-sdk'));

const eventsTableName = process.env.DYNAMO_EVENTS_TABLE_NAME as string;
const dynamoDbClient = new DocumentClient();

function createEvent(event: ProductEvent) {
  const timestamp = Date.now();
  const ttl = ~~(timestamp / 1000 + 5 + 60); // 5 minutes ahead;

  return dynamoDbClient
    .put({
      TableName: eventsTableName,
      Item: {
        pk: `#product_${event.productCode}`,
        sk: `${event.eventType}#${timestamp}`,
        email: event.email,
        eventType: event.eventType,
        requestId: event.requestId,
        info: {
          productId: event.productId,
          price: event.price,
        },
        ttl,
      },
    })
    .promise();
}

export async function handler(
  event: ProductEvent,
  context: Context,
  callback: Callback,
): Promise<void> {
  const { awsRequestId } = context;

  // TODO - to be removed
  console.log('#EVENT', event);

  console.log(`Lambda RequestId: ${awsRequestId}`);

  await createEvent(event);

  callback(
    null,
    JSON.stringify({
      productEventCreated: true,
      message: 'OK',
    }),
  );
}
