import type { StackProps } from 'aws-cdk-lib';
import { Duration, Stack } from 'aws-cdk-lib';
import {} from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import type { Construct } from 'constructs';

export class ProductsAppStack extends Stack {
  readonly productsFetchHandler: NodejsFunction;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.productsFetchHandler = new NodejsFunction(this, 'fetchProducts', {
      functionName: 'fetchProducts',
      entry: 'lambda/products/fetchProducts.ts',
      handler: 'handler',
      memorySize: 128,
      timeout: Duration.seconds(6),
      bundling: {
        minify: true,
        sourceMap: false,
      },
    });
  }
}
