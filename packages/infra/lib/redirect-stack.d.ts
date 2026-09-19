import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RedirectConfig } from './types';
export declare class RedirectStack extends cdk.Stack {
    constructor(scope: Construct, id: string, config: RedirectConfig, props?: cdk.StackProps);
}
