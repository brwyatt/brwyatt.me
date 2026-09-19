import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
import { PortfolioConfig } from './types';
export declare class PortfolioStack extends cdk.Stack {
    readonly siteBucket: s3.Bucket;
    readonly distribution: cloudfront.Distribution;
    constructor(scope: Construct, id: string, config: PortfolioConfig, props?: cdk.StackProps);
}
