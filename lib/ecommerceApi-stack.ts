import type { StackProps } from 'aws-cdk-lib';
import { Stack } from 'aws-cdk-lib';
import {
  AccessLogFormat,
  LambdaIntegration,
  LogGroupLogDestination,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import type { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import type { Construct } from 'constructs';

interface ECommerceApiStackProps extends StackProps {
  fetchProductsHandler: NodejsFunction;
  adminProductsHandler: NodejsFunction;
}

export class ECommerceApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ECommerceApiStackProps) {
    super(scope, id, props);

    const logGroup = new LogGroup(this, 'ECommerceApiLogs');

    const api = new RestApi(this, 'ECommerceApi', {
      restApiName: 'ECommerceApi',
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(logGroup),
        accessLogFormat: AccessLogFormat.jsonWithStandardFields({
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          caller: true,
          user: true,
        }),
      },
    });

    const fetchProductsIntegration = new LambdaIntegration(
      props.fetchProductsHandler,
    );

    const adminProductsIntegration = new LambdaIntegration(
      props.adminProductsHandler,
    );

    const productsResource = api.root.addResource('products');
    const productIdResource = productsResource.addResource('{id}');

    productsResource.addMethod('GET', fetchProductsIntegration);

    productIdResource.addMethod('GET', fetchProductsIntegration);

    productsResource.addMethod('POST', adminProductsIntegration);

    productIdResource.addMethod('PUT', adminProductsIntegration);

    productIdResource.addMethod('DELETE', adminProductsIntegration);
  }
}
