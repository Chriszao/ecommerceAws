import type { StackProps } from 'aws-cdk-lib';
import { RemovalPolicy, Duration, Stack } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
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

    this.fetchProductsHandler = new NodejsFunction(this, 'fetchProducts', {
      functionName: 'fetchProducts',
      entry: 'lambda/products/fetchProducts.ts',
      handler: 'handler',
      memorySize: 128,
      timeout: Duration.seconds(6),
      bundling: {
        minify: true,
        sourceMap: false,
      },
      environment: {
        PRODUCTS_DYNAMO_DB: this.productsDynamoDb.tableName,
      },
    });

    this.productsDynamoDb.grantReadData(this.fetchProductsHandler);

    this.adminProductsHandler = new NodejsFunction(this, 'adminProducts', {
      functionName: 'adminProducts',
      entry: 'lambda/products/adminProducts.ts',
      handler: 'handler',
      memorySize: 128,
      timeout: Duration.seconds(6),
      bundling: {
        minify: true,
        sourceMap: false,
      },
      environment: {
        PRODUCTS_DYNAMO_DB: this.productsDynamoDb.tableName,
      },
    });

    this.productsDynamoDb.grantWriteData(this.adminProductsHandler);
  }
}
