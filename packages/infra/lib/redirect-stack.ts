import * as fs from 'fs';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';
import { HostedZoneRef, RedirectConfig } from './types';

export interface RedirectStackProps extends cdk.StackProps {
  config: RedirectConfig;
  originBucketName: string;
}

export class RedirectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: RedirectStackProps) {
    super(scope, id, props);
    const { config, originBucketName } = props;

    // Import the bucket by name to decouple from origin stack instance and avoid CloudFormation export coupling
    const importedBucket = s3.Bucket.fromBucketName(this, 'ImportedOriginBucket', originBucketName);

    // 1. CloudFront Function: Selective 301 Redirect vs .well-known / keybase.txt Pass-Through
    const templatePath = path.join(__dirname, '../functions/redirect.js');
    const templateCode = fs.readFileSync(templatePath, 'utf8');
    const functionCode = templateCode.replace('__TARGET_DOMAIN__', config.targetDomain);

    const redirectFunction = new cloudfront.Function(this, 'SelectiveRedirectFunction', {
      code: cloudfront.FunctionCode.fromInline(functionCode),
      runtime: cloudfront.FunctionRuntime.JS_2_0,
    });

    // 3. CORS & Security Response Header Policy for .well-known / WKD
    const wellKnownResponseHeaders = new cloudfront.ResponseHeadersPolicy(
      this,
      'WellKnownHeaders',
      {
        corsBehavior: {
          accessControlAllowOrigins: ['*'],
          accessControlAllowMethods: ['GET', 'HEAD', 'OPTIONS'],
          accessControlAllowHeaders: ['*'],
          accessControlAllowCredentials: false,
          originOverride: true,
        },
        securityHeadersBehavior: {
          strictTransportSecurity: {
            accessControlMaxAge: cdk.Duration.days(365),
            includeSubdomains: true,
            preload: true,
            override: true,
          },
          contentTypeOptions: { override: true },
        },
      },
    );

    // 4. Dedicated Origin Access Control (uniquely named per stack)
    const oac = new cloudfront.S3OriginAccessControl(this, 'RedirectOAC', {
      originAccessControlName: `${id}-RedirectOAC`,
      signing: cloudfront.Signing.SIGV4_ALWAYS,
    });

    const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(importedBucket, {
      originAccessControl: oac,
    });

    // 5. Consolidate all redirect domains across zones
    const zoneCache = new Map<string, route53.IHostedZone>();
    const getOrCreateZone = (ref: HostedZoneRef) => {
      let zone = zoneCache.get(ref.hostedZoneId);
      if (!zone) {
        const cleanZoneId = ref.zoneName.replace(/\./g, '-');
        zone = route53.HostedZone.fromHostedZoneAttributes(this, `Zone-${cleanZoneId}`, {
          hostedZoneId: ref.hostedZoneId,
          zoneName: ref.zoneName,
        });
        zoneCache.set(ref.hostedZoneId, zone);
      }
      return zone;
    };

    const allDomainNames: string[] = [];
    const hostedZoneMap: Record<string, route53.IHostedZone> = {};
    const domainRecordTargets: { domainName: string; zone: route53.IHostedZone }[] = [];

    for (const domain of config.domains) {
      const zone = getOrCreateZone(domain.hostedZone);
      const names = [domain.domainName, ...(domain.additionalDomains ?? [])];
      for (const name of names) {
        allDomainNames.push(name);
        hostedZoneMap[name] = zone;
        domainRecordTargets.push({ domainName: name, zone });
      }
    }

    if (allDomainNames.length === 0) {
      return;
    }

    const primaryDomain = allDomainNames[0];
    const subjectAlternativeNames = allDomainNames.slice(1);

    // 6. Unified Multi-Zone Certificate
    const certificate = new acm.Certificate(this, 'RedirectCertificate', {
      domainName: primaryDomain,
      subjectAlternativeNames:
        subjectAlternativeNames.length > 0 ? subjectAlternativeNames : undefined,
      validation: acm.CertificateValidation.fromDnsMultiZone(hostedZoneMap),
    });

    // 7. Single Consolidated CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'RedirectDistribution', {
      defaultBehavior: {
        origin: s3Origin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: [
          {
            function: redirectFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
        responseHeadersPolicy: wellKnownResponseHeaders,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      domainNames: allDomainNames,
      certificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    // 8. Route 53 A & AAAA Alias Records for all redirect domains
    for (const { domainName, zone } of domainRecordTargets) {
      const cleanRecordId = domainName.replace(/\./g, '-');

      new route53.ARecord(this, `ARecord-${cleanRecordId}`, {
        zone,
        recordName: domainName,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      });

      new route53.AaaaRecord(this, `AaaaRecord-${cleanRecordId}`, {
        zone,
        recordName: domainName,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      });
    }
  }
}
