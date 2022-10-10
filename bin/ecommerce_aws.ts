#!/usr/bin/env node
import 'source-map-support/register';
import type { Environment } from 'aws-cdk-lib';
import { App } from 'aws-cdk-lib';

import { ECommerceApiStack } from '../lib/ecommerceApi-stack';
import { ProductsAppStack } from '../lib/productsApp-stack';
import { ProductsAppLayersStack } from '../lib/productsAppLayer-stack';

const app = new App();

const env: Environment = {
  account: '724998245582',
  region: 'us-east-1',
};

const tags = {
  cost: 'ECommerce',
  team: 'Christofer Assis',
};

const commonProps = {
  env,
  tags,
};

const productsAppLayersStack = new ProductsAppLayersStack(
  app,
  'ProductsAppLayers',
  commonProps,
);

const productsAppStack = new ProductsAppStack(app, 'ProductsApp', commonProps);

productsAppStack.addDependency(productsAppLayersStack);

const eCommerceApiStack = new ECommerceApiStack(app, 'ECommerceApi', {
  ...commonProps,
  fetchProductsHandler: productsAppStack.fetchProductsHandler,
  adminProductsHandler: productsAppStack.adminProductsHandler,
});

eCommerceApiStack.addDependency(productsAppStack);
