import type { StackProps } from 'aws-cdk-lib';
import { Stack } from 'aws-cdk-lib';
import {
  AccessLogFormat,
  LambdaIntegration,
  LogGroupLogDestination,
  RequestValidator,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import type { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import type { Construct } from 'constructs';

interface ECommerceApiStackProps extends StackProps {
  fetchProductsHandler: NodejsFunction;
  adminProductsHandler: NodejsFunction;
  ordersHandler: NodejsFunction;
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

    this.createProductsService(props, api);
    this.createOrdersService(props, api);
  }

  private createProductsService(props: ECommerceApiStackProps, api: RestApi) {
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

  private createOrdersService(props: ECommerceApiStackProps, api: RestApi) {
    const ordersIntegration = new LambdaIntegration(props.ordersHandler);

    const ordersResource = api.root.addResource('orders');

    ordersResource.addMethod('POST', ordersIntegration);

    ordersResource.addMethod('GET', ordersIntegration);

    const orderDeletionValidator = new RequestValidator(
      this,
      'OrderDeletionValidator',
      {
        restApi: api,
        requestValidatorName: 'OrderDeletionValidator',
        validateRequestParameters: true,
      },
    );

    ordersResource.addMethod('DELETE', ordersIntegration, {
      requestParameters: {
        'method.request.querystring.email': true,
        'method.request.querystring.orderId': true,
      },
      requestValidator: orderDeletionValidator,
    });
  }
}
