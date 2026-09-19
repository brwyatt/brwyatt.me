"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfolioStack = void 0;
const cdk = require("aws-cdk-lib");
const s3 = require("aws-cdk-lib/aws-s3");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const origins = require("aws-cdk-lib/aws-cloudfront-origins");
const route53 = require("aws-cdk-lib/aws-route53");
const targets = require("aws-cdk-lib/aws-route53-targets");
const acm = require("aws-cdk-lib/aws-certificatemanager");
class PortfolioStack extends cdk.Stack {
    siteBucket;
    distribution;
    constructor(scope, id, config, props) {
        super(scope, id, props);
        // 1. Private S3 Origin Bucket (Encrypted, Block Public Access)
        this.siteBucket = new s3.Bucket(this, 'SiteBucket', {
            bucketName: `brwyatt-me-${config.stage}-site-assets`,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            enforceSSL: true,
            removalPolicy: config.stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: config.stage !== 'prod',
        });
        // 2. Route 53 Hosted Zone lookup
        const zone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
            hostedZoneId: config.hostedZoneId,
            zoneName: config.domainName.includes('.')
                ? config.domainName.split('.').slice(-2).join('.')
                : config.domainName,
        });
        // 3. Explicit ACM Certificate (CloudFront requires us-east-1)
        const domainNames = [config.domainName, ...(config.aliases || [])];
        const certificate = new acm.Certificate(this, 'SiteCertificate', {
            domainName: config.domainName,
            subjectAlternativeNames: config.aliases,
            validation: acm.CertificateValidation.fromDns(zone),
        });
        // 4. Security Headers Response Policy
        const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeadersPolicy', {
            responseHeadersPolicyName: `BrwyattMeSecurityHeaders-${config.stage}`,
            securityHeadersBehavior: {
                strictTransportSecurity: {
                    accessControlMaxAge: cdk.Duration.days(365),
                    includeSubdomains: true,
                    preload: true,
                    override: true,
                },
                contentTypeOptions: { override: true },
                frameOptions: {
                    frameOption: cloudfront.HeadersFrameOption.DENY,
                    override: true,
                },
                referrerPolicy: {
                    referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
                    override: true,
                },
            },
        });
        // 5. CloudFront Distribution with Origin Access Control (OAC)
        this.distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
            defaultBehavior: {
                origin: origins.S3BucketOrigin.withOriginAccessControl(this.siteBucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
                responseHeadersPolicy,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
            },
            domainNames,
            certificate,
            defaultRootObject: 'index.html',
            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.seconds(10),
                },
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.seconds(10),
                },
            ],
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
        });
        // 6. Route 53 A and AAAA Alias Records
        new route53.ARecord(this, 'SiteAliasRecord', {
            zone,
            recordName: config.domainName,
            target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
        });
        new route53.AaaaRecord(this, 'SiteAaaaRecord', {
            zone,
            recordName: config.domainName,
            target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
        });
        // Alias records for optional domain aliases (e.g. www)
        if (config.aliases) {
            for (const alias of config.aliases) {
                new route53.ARecord(this, `Alias-${alias}`, {
                    zone,
                    recordName: alias,
                    target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
                });
                new route53.AaaaRecord(this, `AaaaAlias-${alias}`, {
                    zone,
                    recordName: alias,
                    target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
                });
            }
        }
        // Outputs
        new cdk.CfnOutput(this, 'DistributionDomainName', {
            value: this.distribution.distributionDomainName,
        });
        new cdk.CfnOutput(this, 'SiteBucketName', {
            value: this.siteBucket.bucketName,
        });
    }
}
exports.PortfolioStack = PortfolioStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9ydGZvbGlvLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicG9ydGZvbGlvLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQyx5Q0FBeUM7QUFDekMseURBQXlEO0FBQ3pELDhEQUE4RDtBQUM5RCxtREFBbUQ7QUFDbkQsMkRBQTJEO0FBQzNELDBEQUEwRDtBQUkxRCxNQUFhLGNBQWUsU0FBUSxHQUFHLENBQUMsS0FBSztJQUMzQixVQUFVLENBQVk7SUFDdEIsWUFBWSxDQUEwQjtJQUV0RCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLE1BQXVCLEVBQUUsS0FBc0I7UUFDdkYsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsK0RBQStEO1FBQy9ELElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDbEQsVUFBVSxFQUFFLGNBQWMsTUFBTSxDQUFDLEtBQUssY0FBYztZQUNwRCxVQUFVLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFVBQVU7WUFDMUMsaUJBQWlCLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLFNBQVM7WUFDakQsVUFBVSxFQUFFLElBQUk7WUFDaEIsYUFBYSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1lBQzdGLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxLQUFLLEtBQUssTUFBTTtTQUMzQyxDQUFDLENBQUM7UUFFSCxpQ0FBaUM7UUFDakMsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQzNFLFlBQVksRUFBRSxNQUFNLENBQUMs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LENBQUMsU0FBUyxDQUFDLElBQUksT0FBTyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztpQkFDeEYsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztRQUNILENBQUM7UUFFRCxVQUFVO1FBQ1YsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSx3QkFBd0IsRUFBRTtZQUNoRCxLQUFLLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxzQkFBc0I7U0FDaEQsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUN4QyxLQUFLLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVO1NBQ2xDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQS9IRCx3Q0ErSEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIGNsb3VkZnJvbnQgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQnO1xuaW1wb3J0ICogYXMgb3JpZ2lucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udC1vcmlnaW5zJztcbmltcG9ydCAqIGFzIHJvdXRlNTMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXJvdXRlNTMnO1xuaW1wb3J0ICogYXMgdGFyZ2V0cyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtcm91dGU1My10YXJnZXRzJztcbmltcG9ydCAqIGFzIGFjbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2VydGlmaWNhdGVtYW5hZ2VyJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgUG9ydGZvbGlvQ29uZmlnIH0gZnJvbSAnLi90eXBlcyc7XG5cbmV4cG9ydCBjbGFzcyBQb3J0Zm9saW9TdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIHB1YmxpYyByZWFkb25seSBzaXRlQnVja2V0OiBzMy5CdWNrZXQ7XG4gIHB1YmxpYyByZWFkb25seSBkaXN0cmlidXRpb246IGNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIGNvbmZpZzogUG9ydGZvbGlvQ29uZmlnLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyAxLiBQcml2YXRlIFMzIE9yaWdpbiBCdWNrZXQgKEVuY3J5cHRlZCwgQmxvY2sgUHVibGljIEFjY2VzcylcbiAgICB0aGlzLnNpdGVCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdTaXRlQnVja2V0Jywge1xuICAgICAgYnVja2V0TmFtZTogYGJyd3lhdHQtbWUtJHtjb25maWcuc3RhZ2V9LXNpdGUtYXNzZXRzYCxcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXG4gICAgICBlbmZvcmNlU1NMOiB0cnVlLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY29uZmlnLnN0YWdlID09PSAncHJvZCcgPyBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4gOiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IGNvbmZpZy5zdGFnZSAhPT0gJ3Byb2QnLFxuICAgIH0pO1xuXG4gICAgLy8gMi4gUm91dGUgNTMgSG9zdGVkIFpvbmUgbG9va3VwXG4gICAgY29uc3Qgem9uZSA9IHJvdXRlNTMuSG9zdGVkWm9uZS5mcm9tSG9zdGVkWm9uZUF0dHJpYnV0ZXModGhpcywgJ0hvc3RlZFpvbmUnLCB7XG4gICAgICBob3N0ZWRab25lSWQ6IGNvbmZpZy5ob3N0ZWRab25lSWQsXG4gICAgICB6b25lTmFtZTogY29uZmlnLmRvbWFpbk5hbWUuaW5jbHVkZXMoJy4nKVxuICAgICAgICA/IGNvbmZpZy5kb21haW5OYW1lLnNwbGl0KCcuJykuc2xpY2UoLTIpLmpvaW4oJy4nKVxuICAgICAgICA6IGNvbmZpZy5kb21haW5OYW1lLFxuICAgIH0pO1xuXG4gICAgLy8gMy4gRXhwbGljaXQgQUNNIENlcnRpZmljYXRlIChDbG91ZEZyb250IHJlcXVpcmVzIHVzLWVhc3QtMSlcbiAgICBjb25zdCBkb21haW5OYW1lcyA9IFtjb25maWcuZG9tYWluTmFtZSwgLi4uKGNvbmZpZy5hbGlhc2VzIHx8IFtdKV07XG4gICAgY29uc3QgY2VydGlmaWNhdGUgPSBuZXcgYWNtLkNlcnRpZmljYXRlKHRoaXMsICdTaXRlQ2VydGlmaWNhdGUnLCB7XG4gICAgICBkb21haW5OYW1lOiBjb25maWcuZG9tYWluTmFtZSxcbiAgICAgIHN1YmplY3RBbHRlcm5hdGl2ZU5hbWVzOiBjb25maWcuYWxpYXNlcyxcbiAgICAgIHZhbGlkYXRpb246IGFjbS5DZXJ0aWZpY2F0ZVZhbGlkYXRpb24uZnJvbURucyh6b25lKSxcbiAgICB9KTtcblxuICAgIC8vIDQuIFNlY3VyaXR5IEhlYWRlcnMgUmVzcG9uc2UgUG9saWN5XG4gICAgY29uc3QgcmVzcG9uc2VIZWFkZXJzUG9saWN5ID0gbmV3IGNsb3VkZnJvbnQuUmVzcG9uc2VIZWFkZXJzUG9saWN5KFxuICAgICAgdGhpcyxcbiAgICAgICdTZWN1cml0eUhlYWRlcnNQb2xpY3knLFxuICAgICAge1xuICAgICAgICByZXNwb25zZUhlYWRlcnNQb2xpY3lOYW1lOiBgQnJ3eWF0dE1lU2VjdXJpdHlIZWFkZXJzLSR7Y29uZmlnLnN0YWdlfWAsXG4gICAgICAgIHNlY3VyaXR5SGVhZGVyc0JlaGF2aW9yOiB7XG4gICAgICAgICAgc3RyaWN0VHJhbnNwb3J0U2VjdXJpdHk6IHtcbiAgICAgICAgICAgIGFjY2Vzc0NvbnRyb2xNYXhBZ2U6IGNkay5EdXJhdGlvbi5kYXlzKDM2NSksXG4gICAgICAgICAgICBpbmNsdWRlU3ViZG9tYWluczogdHJ1ZSxcbiAgICAgICAgICAgIHByZWxvYWQ6IHRydWUsXG4gICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvbnRlbnRUeXBlT3B0aW9uczogeyBvdmVycmlkZTogdHJ1ZSB9LFxuICAgICAgICAgIGZyYW1lT3B0aW9uczoge1xuICAgICAgICAgICAgZnJhbWVPcHRpb246IGNsb3VkZnJvbnQuSGVhZGVyc0ZyYW1lT3B0aW9uLkRFTlksXG4gICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlZmVycmVyUG9saWN5OiB7XG4gICAgICAgICAgICByZWZlcnJlclBvbGljeTogY2xvdWRmcm9udC5IZWFkZXJzUmVmZXJyZXJQb2xpY3kuU1RSSUNUX09SSUdJTl9XSEVOX0NST1NTX09SSUdJTixcbiAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICk7XG5cbiAgICAvLyA1LiBDbG91ZEZyb250IERpc3RyaWJ1dGlvbiB3aXRoIE9yaWdpbiBBY2Nlc3MgQ29udHJvbCAoT0FDKVxuICAgIHRoaXMuZGlzdHJpYnV0aW9uID0gbmV3IGNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uKHRoaXMsICdTaXRlRGlzdHJpYnV0aW9uJywge1xuICAgICAgZGVmYXVsdEJlaGF2aW9yOiB7XG4gICAgICAgIG9yaWdpbjogb3JpZ2lucy5TM0J1Y2tldE9yaWdpbi53aXRoT3JpZ2luQWNjZXNzQ29udHJvbCh0aGlzLnNpdGVCdWNrZXQpLFxuICAgICAgICB2aWV3ZXJQcm90b2NvbFBvbGljeTogY2xvdWRmcm9udC5WaWV3ZXJQcm90b2NvbFBvbGljeS5SRURJUkVDVF9UT19IVFRQUyxcbiAgICAgICAgYWxsb3dlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQWxsb3dlZE1ldGhvZHMuQUxMT1dfR0VUX0hFQUQsXG4gICAgICAgIGNhY2hlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQ2FjaGVkTWV0aG9kcy5DQUNIRV9HRVRfSEVBRCxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzUG9saWN5LFxuICAgICAgICBjYWNoZVBvbGljeTogY2xvdWRmcm9udC5DYWNoZVBvbGljeS5DQUNISU5HX09QVElNSVpFRCxcbiAgICAgIH0sXG4gICAgICBkb21haW5OYW1lcyxcbiAgICAgIGNlcnRpZmljYXRlLFxuICAgICAgZGVmYXVsdFJvb3RPYmplY3Q6ICdpbmRleC5odG1sJyxcbiAgICAgIGVycm9yUmVzcG9uc2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBodHRwU3RhdHVzOiA0MDMsXG4gICAgICAgICAgcmVzcG9uc2VIdHRwU3RhdHVzOiAyMDAsXG4gICAgICAgICAgcmVzcG9uc2VQYWdlUGF0aDogJy9pbmRleC5odG1sJyxcbiAgICAgICAgICB0dGw6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGh0dHBTdGF0dXM6IDQwNCxcbiAgICAgICAgICByZXNwb25zZUh0dHBTdGF0dXM6IDIwMCxcbiAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiAnL2luZGV4Lmh0bWwnLFxuICAgICAgICAgIHR0bDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIG1pbmltdW1Qcm90b2NvbFZlcnNpb246IGNsb3VkZnJvbnQuU2VjdXJpdHlQb2xpY3lQcm90b2NvbC5UTFNfVjFfMl8yMDIxLFxuICAgIH0pO1xuXG4gICAgLy8gNi4gUm91dGUgNTMgQSBhbmQgQUFBQSBBbGlhcyBSZWNvcmRzXG4gICAgbmV3IHJvdXRlNTMuQVJlY29yZCh0aGlzLCAnU2l0ZUFsaWFzUmVjb3JkJywge1xuICAgICAgem9uZSxcbiAgICAgIHJlY29yZE5hbWU6IGNvbmZpZy5kb21haW5OYW1lLFxuICAgICAgdGFyZ2V0OiByb3V0ZTUzLlJlY29yZFRhcmdldC5mcm9tQWxpYXMobmV3IHRhcmdldHMuQ2xvdWRGcm9udFRhcmdldCh0aGlzLmRpc3RyaWJ1dGlvbikpLFxuICAgIH0pO1xuXG4gICAgbmV3IHJvdXRlNTMuQWFhYVJlY29yZCh0aGlzLCAnU2l0ZUFhYWFSZWNvcmQnLCB7XG4gICAgICB6b25lLFxuICAgICAgcmVjb3JkTmFtZTogY29uZmlnLmRvbWFpbk5hbWUsXG4gICAgICB0YXJnZXQ6IHJvdXRlNTMuUmVjb3JkVGFyZ2V0LmZyb21BbGlhcyhuZXcgdGFyZ2V0cy5DbG91ZEZyb250VGFyZ2V0KHRoaXMuZGlzdHJpYnV0aW9uKSksXG4gICAgfSk7XG5cbiAgICAvLyBBbGlhcyByZWNvcmRzIGZvciBvcHRpb25hbCBkb21haW4gYWxpYXNlcyAoZS5nLiB3d3cpXG4gICAgaWYgKGNvbmZpZy5hbGlhc2VzKSB7XG4gICAgICBmb3IgKGNvbnN0IGFsaWFzIG9mIGNvbmZpZy5hbGlhc2VzKSB7XG4gICAgICAgIG5ldyByb3V0ZTUzLkFSZWNvcmQodGhpcywgYEFsaWFzLSR7YWxpYXN9YCwge1xuICAgICAgICAgIHpvbmUsXG4gICAgICAgICAgcmVjb3JkTmFtZTogYWxpYXMsXG4gICAgICAgICAgdGFyZ2V0OiByb3V0ZTUzLlJlY29yZFRhcmdldC5mcm9tQWxpYXMobmV3IHRhcmdldHMuQ2xvdWRGcm9udFRhcmdldCh0aGlzLmRpc3RyaWJ1dGlvbikpLFxuICAgICAgICB9KTtcblxuICAgICAgICBuZXcgcm91dGU1My5BYWFhUmVjb3JkKHRoaXMsIGBBYWFhQWxpYXMtJHthbGlhc31gLCB7XG4gICAgICAgICAgem9uZSxcbiAgICAgICAgICByZWNvcmROYW1lOiBhbGlhcyxcbiAgICAgICAgICB0YXJnZXQ6IHJvdXRlNTMuUmVjb3JkVGFyZ2V0LmZyb21BbGlhcyhuZXcgdGFyZ2V0cy5DbG91ZEZyb250VGFyZ2V0KHRoaXMuZGlzdHJpYnV0aW9uKSksXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRGlzdHJpYnV0aW9uRG9tYWluTmFtZScsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmRpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25Eb21haW5OYW1lLFxuICAgIH0pO1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdTaXRlQnVja2V0TmFtZScsIHtcbiAgICAgIHZhbHVlOiB0aGlzLnNpdGVCdWNrZXQuYnVja2V0TmFtZSxcbiAgICB9KTtcbiAgfVxufVxuIl19