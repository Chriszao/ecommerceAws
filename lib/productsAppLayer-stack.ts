import type { StackProps } from 'aws-cdk-lib';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import type { Construct } from 'constructs';

export class ProductsAppLayersStack extends Stack {
  readonly productsLayer: LayerVersion;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.productsLayer = new LayerVersion(this, 'ProductsLayer', {
      code: Code.fromAsset('lambda/products/layers/productsLayer'),
      compatibleRuntimes: [Runtime.NODEJS_14_X],
      layerVersionName: 'ProductsLayer',
      removalPolicy: RemovalPolicy.RETAIN,
    });

    new StringParameter(this, 'ProductsLayerVersionArn', {
      parameterName: 'ProductsLayerVersionArn',
      stringValue: this.productsLayer.layerVersionArn,
    });
  }
}
