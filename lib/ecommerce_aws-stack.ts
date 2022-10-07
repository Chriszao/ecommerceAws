import type { StackProps } from 'aws-cdk-lib';
import { Stack } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

export class EcommerceAwsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
  }
}
