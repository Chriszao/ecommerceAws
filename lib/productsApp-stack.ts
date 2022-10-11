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

export class ProductsAppStack extends Stack {
  readonly fetchProductsHandler: NodejsFunction;

  readonly adminProductsHandler: NodejsFunction;

  readonly productsDynamoDb: Table;

  constructor(scope: Construct, id: string, props?: StackProps) {
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

    this.productsDynamoDb.grantWriteData(this.adminProductsHandler);
  }
}
