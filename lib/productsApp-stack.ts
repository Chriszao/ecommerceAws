import type { StackProps } from 'aws-cdk-lib';
import { RemovalPolicy, Duration, Stack } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import {
  LambdaInsightsVersion,
  LayerVersion,
  Tracing,
} from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import type { Construct } from 'constructs';

interface ProductsAppStackProps extends StackProps {
  dynamoDbEvents: Table;
}

export class ProductsAppStack extends Stack {
  readonly fetchProductsHandler: NodejsFunction;

  readonly adminProductsHandler: NodejsFunction;

  readonly productsDynamoDb: Table;

  constructor(scope: Construct, id: string, props: ProductsAppStackProps) {
    super(scope, id, props);

    this.productsDynamoDb = new Table(this, 'ProductsDynamoDb', {
      tableName: 'products',
      removalPolicy: RemovalPolicy.DESTROY,
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    });

    // Products Layer
    const productsLayerArn = StringParameter.valueForStringParameter(
      this,
      'ProductsLayerVersionArn',
    );

    const productsLayer = LayerVersion.fromLayerVersionArn(
      this,
      'ProductsLayerVersionArn',
      productsLayerArn,
    );

    // Product Events Layer
    const productEventLayerArn = StringParameter.valueForStringParameter(
      this,
      'ProductEventsLayerVersionArn',
    );

    const productEventsLayer = LayerVersion.fromLayerVersionArn(
      this,
      'ProductEventsLayerVersionArn',
      productEventLayerArn,
    );

    const productEventsHandler = new NodejsFunction(this, 'productEvents', {
      functionName: 'productEvents',
      entry: 'lambda/products/productEvents.ts',
      handler: 'handler',
      memorySize: 128,
      timeout: Duration.seconds(2),
      bundling: {
        minify: true,
        sourceMap: false,
      },
      environment: {
        DYNAMO_EVENTS_TABLE_NAME: props.dynamoDbEvents.tableName,
      },
      tracing: Tracing.ACTIVE,
      insightsVersion: LambdaInsightsVersion.VERSION_1_0_119_0,
      layers: [productEventsLayer],
    });

    props.dynamoDbEvents.grantWriteData(productEventsHandler);

    this.fetchProductsHandler = new NodejsFunction(this, 'fetchProducts', {
      functionName: 'fetchProducts',
      entry: 'lambda/products/fetchProducts.ts',
      handler: 'handler',
      memorySize: 128,
      timeout: Duration.seconds(6),
      layers: [productsLayer],
      bundling: {
        minify: true,
        sourceMap: false,
      },
      environment: {
        DYNAMO_TABLE_NAME: this.productsDynamoDb.tableName,
      },
      tracing: Tracing.ACTIVE,
      insightsVersion: LambdaInsightsVersion.VERSION_1_0_119_0,
    });

    this.productsDynamoDb.grantReadData(this.fetchProductsHandler);

    this.adminProductsHandler = new NodejsFunction(this, 'adminProducts', {
      functionName: 'adminProducts',
      entry: 'lambda/products/adminProducts.ts',
      handler: 'handler',
      memorySize: 128,
      timeout: Duration.seconds(6),
      layers: [productsLayer, productEventsLayer],
      bundling: {
        minify: true,
        sourceMap: false,
      },
      environment: {
        DYNAMO_TABLE_NAME: this.productsDynamoDb.tableName,
        PRODUCT_EVENTS_FUNCTION_NAME: productEventsHandler.functionName,
      },
      tracing: Tracing.ACTIVE,
      insightsVersion: LambdaInsightsVersion.VERSION_1_0_119_0,
    });

    this.productsDynamoDb.grantWriteData(this.adminProductsHandler);
    productEventsHandler.grantInvoke(this.adminProductsHandler);
  }
}
