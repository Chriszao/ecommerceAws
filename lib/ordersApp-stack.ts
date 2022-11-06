import type { StackProps } from 'aws-cdk-lib';
import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import {
  LambdaInsightsVersion,
  LayerVersion,
  Tracing,
} from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import type { Construct } from 'constructs';

interface OrdersAppStackProps extends StackProps {
  productsDynamoDb: Table;
}

export class OrdersAppStack extends Stack {
  readonly ordersHandler: NodejsFunction;

  constructor(scope: Construct, id: string, props: OrdersAppStackProps) {
    super(scope, id, props);

    const ordersDynamoDb = new Table(this, 'OrdersDynamoDb', {
      tableName: 'orders',
      removalPolicy: RemovalPolicy.DESTROY,
      partitionKey: {
        name: 'pk',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    });

    // Orders layers
    const ordersLayerArn = StringParameter.valueForStringParameter(
      this,
      'OrdersLayerVersionArn',
    );

    const ordersLayer = LayerVersion.fromLayerVersionArn(
      this,
      'OrdersLayerVersionArn',
      ordersLayerArn,
    );

    // Products Layers
    const productsLayerArn = StringParameter.valueForStringParameter(
      this,
      'ProductsLayerVersionArn',
    );

    const productsLayer = LayerVersion.fromLayerVersionArn(
      this,
      'ProductsLayerVersionArn',
      productsLayerArn,
    );

    this.ordersHandler = new NodejsFunction(this, 'ordersHandler', {
      functionName: 'ordersHandler',
      entry: 'lambda/products/ordersHandler.ts',
      handler: 'handler',
      memorySize: 128,
      timeout: Duration.seconds(2),
      layers: [productsLayer, ordersLayer],
      bundling: {
        minify: true,
        sourceMap: false,
      },
      environment: {
        DYNAMO_ORDERS_TABLE_NAME: ordersDynamoDb.tableName,
        DYNAMO_PRODUCTS_TABLE_NAME: props.productsDynamoDb.tableName,
      },
      tracing: Tracing.ACTIVE,
      insightsVersion: LambdaInsightsVersion.VERSION_1_0_119_0,
    });

    ordersDynamoDb.grantReadWriteData(this.ordersHandler);
    props.productsDynamoDb.grantReadData(this.ordersHandler);
  }
}
