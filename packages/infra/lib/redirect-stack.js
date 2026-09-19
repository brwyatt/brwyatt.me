"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedirectStack = void 0;
const cdk = require("aws-cdk-lib");
const s3 = require("aws-cdk-lib/aws-s3");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const origins = require("aws-cdk-lib/aws-cloudfront-origins");
const route53 = require("aws-cdk-lib/aws-route53");
const targets = require("aws-cdk-lib/aws-route53-targets");
const acm = require("aws-cdk-lib/aws-certificatemanager");
class RedirectStack extends cdk.Stack {
    constructor(scope, id, config, props) {
        super(scope, id, props);
        // 1. S3 Bucket configured with Website Redirection
        const redirectBucket = new s3.Bucket(this, 'RedirectBucket', {
            bucketName: 'brwyatt-legacy-redirector',
            websiteRedirect: {
                hostName: config.targetDomain.replace(/^https?:\/\//, ''),
                protocol: s3.RedirectProtocol.HTTPS,
            },
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            enforceSSL: true,
        });
        for (const domain of config.domains) {
            const zone = route53.HostedZone.fromHostedZoneAttributes(this, `Zone-${domain.domainName}`, {
                hostedZoneId: domain.hostedZoneId,
                zoneName: domain.domainName,
            });
            const domainNames = [domain.domainName, `www.${domain.domainName}`];
            // Explicit ACM Certificate for this redirect domain
            const cert = new acm.Certificate(this, `Cert-${domain.domainName}`, {
                domainName: domain.domainName,
                subjectAlternativeNames: [`www.${domain.domainName}`],
                validation: acm.CertificateValidation.fromDns(zone),
            });
            // CloudFront distribution for the redirect domain
            const dist = new cloudfront.Distribution(this, `Dist-${domain.domainName}`, {
                defaultBehavior: {
                    origin: new origins.HttpOrigin(redirectBucket.bucketWebsiteDomainName, {
                        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
                    }),
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                },
                domainNames,
                certificate: cert,
                minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            });
            // Apex A & AAAA
            new route53.ARecord(this, `ARecord-${domain.domainName}`, {
                zone,
                recordName: domain.domainName,
                target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(dist)),
            });
            new route53.AaaaRecord(this, `AaaaRecord-${domain.domainName}`, {
                zone,
                recordName: domain.domainName,
                target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(dist)),
            });
            // WWW A & AAAA
            new route53.ARecord(this, `WwwARecord-${domain.domainName}`, {
                zone,
                recordName: `www.${domain.domainName}`,
                target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(dist)),
            });
            new route53.AaaaRecord(this, `WwwAaaaRecord-${domain.domainName}`, {
                zone,
                recordName: `www.${domain.domainName}`,
                target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(dist)),
            });
        }
    }
}
exports.RedirectStack = RedirectStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkaXJlY3Qtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWRpcmVjdC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMseUNBQXlDO0FBQ3pDLHlEQUF5RDtBQUN6RCw4REFBOEQ7QUFDOUQsbURBQW1EO0FBQ25ELDJEQUEyRDtBQUMzRCwwREFBMEQ7QUFJMUQsTUFBYSxhQUFjLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDMUMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxNQUFzQixFQUFFLEtBQXNCO1FBQ3RGLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLG1EQUFtRDtRQUNuRCxNQUFNLGNBQWMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1lBQzNELFVBQVUsRUFBRSwyQkFBMkI7WUFDdkMsZUFBZSxFQUFFO2dCQUNmLFFBQVEsRUFBRSxNQUFNLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDO2dCQUN6RCxRQUFRLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLEtBQUs7YUFDcEM7WUFDRCxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNO1lBQ3ZDLFVBQVUsRUFBRSxJQUFJO1NBQ2pCLENBQUMsQ0FBQztRQUVILEtBQUssTUFBTSxNQUFNLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsd0JBQXdCLENBQUMsSUFBSSxFQUFFLFFBQVEsTUFBTSxDQUFDLFVBQVUsRUFBRSxFQUFFO2dCQUMxRixZQUFZLEVBQUUsTUFBTSxDQUFDLFlBQVk7Z0JBQ2pDLFFBQVEsRUFBRSxNQUFNLENBQUMsVUFBVTthQUM1QixDQUFDLENBQUM7WUFFSCxNQUFNLFdBQVcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsT0FBTyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUVwRSxvREFBb0Q7WUFDcEQsTUFBTSxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxRQUFRLE1BQU0sQ0FBQyxVQUFVLEVBQUUsRUFBRTtnQkFDbEUsVUFBVSxFQUFFLE1BQU0sQ0FBQyxVQUFVO2dCQUM3Qix1QkFBdUIsRUFBRSxDQUFDLE9BQU8sTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNyRCxVQUFVLEVBQUUsR0FBRyxDQUFDLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7YUFDcEQsQ0FBQyxDQUFDO1lBRUgsa0RBQWtEO1lBQ2xELE1BQU0sSUFBSSxHQUFHLElBQUksVUFBVSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsUUFBUSxNQUFNLENBQUMsVUFBVSxFQUFFLEVBQUU7Z0JBQzFFLGVBQWUsRUFBRTtvQkFDZixNQUFNLEVBQUUsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyx1QkFBdUIsRUFBRTt3QkFDckUsY0FBYyxFQUFFLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTO3FCQUMxRCxDQUFDO29CQUNGLG9CQUFvQixFQUFFLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxpQkFBaUI7aUJBQ3hFO2dCQUNELFdBQVc7Z0JBQ1gsV0FBVyxFQUFFLElBQUk7Z0JBQ2pCLHNCQUFzQixFQUFFLFVBQVUsQ0FBQyxzQkFBc0IsQ0FBQyxhQUFhO2FBQ3hFLENBQUMsQ0FBQztZQUVILGdCQUFnQjtZQUNoQixJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFdBQVcsTUFBTSxDQUFDLFVBQVUsRUFBRSxFQUFFO2dCQUN4RCxJQUFJO2dCQUNKLFVBQVUsRUFBRSxNQUFNLENBQUMsVUFBVTtnQkFDN0IsTUFBTSxFQUFFLE9BQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLElBQUksT0FBTyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO2FBQzNFLENBQUMsQ0FBQztZQUVILElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsY0FBYyxNQUFNLENBQUMsVUFBVSxFQUFFLEVBQUU7Z0JBQzlELElBQUk7Z0JBQ0osVUFBVSxFQUFFLE1BQU0sQ0FBQyxVQUFVO2dCQUM3QixNQUFNLEVBQUUsT0FBTyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsSUFBSSxPQUFPLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDM0UsQ0FBQyxDQUFDO1lBRUgsZUFBZTtZQUNmLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsY0FBYyxNQUFNLENBQUMsVUFBVSxFQUFFLEVBQUU7Z0JBQzNELElBQUk7Z0JBQ0osVUFBVSxFQUFFLE9BQU8sTUFBTSxDQUFDLFVBQVUsRUFBRTtnQkFDdEMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLElBQUksT0FBTyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO2FBQzNFLENBQUMsQ0FBQztZQUVILElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLE1BQU0sQ0FBQyxVQUFVLEVBQUUsRUFBRTtnQkFDakUsSUFBSTtnQkFDSixVQUFVLEVBQUUsT0FBTyxNQUFNLENBQUMsVUFBVSxFQUFFO2dCQUN0QyxNQUFNLEVBQUUsT0FBTyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsSUFBSSxPQUFPLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDM0UsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztJQUNILENBQUM7Q0FDRjtBQXRFRCxzQ0FzRUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIGNsb3VkZnJvbnQgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQnO1xuaW1wb3J0ICogYXMgb3JpZ2lucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udC1vcmlnaW5zJztcbmltcG9ydCAqIGFzIHJvdXRlNTMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXJvdXRlNTMnO1xuaW1wb3J0ICogYXMgdGFyZ2V0cyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtcm91dGU1My10YXJnZXRzJztcbmltcG9ydCAqIGFzIGFjbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2VydGlmaWNhdGVtYW5hZ2VyJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgUmVkaXJlY3RDb25maWcgfSBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IGNsYXNzIFJlZGlyZWN0U3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBjb25maWc6IFJlZGlyZWN0Q29uZmlnLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyAxLiBTMyBCdWNrZXQgY29uZmlndXJlZCB3aXRoIFdlYnNpdGUgUmVkaXJlY3Rpb25cbiAgICBjb25zdCByZWRpcmVjdEJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ1JlZGlyZWN0QnVja2V0Jywge1xuICAgICAgYnVja2V0TmFtZTogJ2Jyd3lhdHQtbGVnYWN5LXJlZGlyZWN0b3InLFxuICAgICAgd2Vic2l0ZVJlZGlyZWN0OiB7XG4gICAgICAgIGhvc3ROYW1lOiBjb25maWcudGFyZ2V0RG9tYWluLnJlcGxhY2UoL15odHRwcz86XFwvXFwvLywgJycpLFxuICAgICAgICBwcm90b2NvbDogczMuUmVkaXJlY3RQcm90b2NvbC5IVFRQUyxcbiAgICAgIH0sXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sXG4gICAgICBlbmZvcmNlU1NMOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgZm9yIChjb25zdCBkb21haW4gb2YgY29uZmlnLmRvbWFpbnMpIHtcbiAgICAgIGNvbnN0IHpvbmUgPSByb3V0ZTUzLkhvc3RlZFpvbmUuZnJvbUhvc3RlZFpvbmVBdHRyaWJ1dGVzKHRoaXMsIGBab25lLSR7ZG9tYWluLmRvbWFpbk5hbWV9YCwge1xuICAgICAgICBob3N0ZWRab25lSWQ6IGRvbWFpbi5ob3N0ZWRab25lSWQsXG4gICAgICAgIHpvbmVOYW1lOiBkb21haW4uZG9tYWluTmFtZSxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBkb21haW5OYW1lcyA9IFtkb21haW4uZG9tYWluTmFtZSwgYHd3dy4ke2RvbWFpbi5kb21haW5OYW1lfWBdO1xuXG4gICAgICAvLyBFeHBsaWNpdCBBQ00gQ2VydGlmaWNhdGUgZm9yIHRoaXMgcmVkaXJlY3QgZG9tYWluXG4gICAgICBjb25zdCBjZXJ0ID0gbmV3IGFjbS5DZXJ0aWZpY2F0ZSh0aGlzLCBgQ2VydC0ke2RvbWFpbi5kb21haW5OYW1lfWAsIHtcbiAgICAgICAgZG9tYWluTmFtZTogZG9tYWluLmRvbWFpbk5hbWUsXG4gICAgICAgIHN1YmplY3RBbHRlcm5hdGl2ZU5hbWVzOiBbYHd3dy4ke2RvbWFpbi5kb21haW5OYW1lfWBdLFxuICAgICAgICB2YWxpZGF0aW9uOiBhY20uQ2VydGlmaWNhdGVWYWxpZGF0aW9uLmZyb21EbnMoem9uZSksXG4gICAgICB9KTtcblxuICAgICAgLy8gQ2xvdWRGcm9udCBkaXN0cmlidXRpb24gZm9yIHRoZSByZWRpcmVjdCBkb21haW5cbiAgICAgIGNvbnN0IGRpc3QgPSBuZXcgY2xvdWRmcm9udC5EaXN0cmlidXRpb24odGhpcywgYERpc3QtJHtkb21haW4uZG9tYWluTmFtZX1gLCB7XG4gICAgICAgIGRlZmF1bHRCZWhhdmlvcjoge1xuICAgICAgICAgIG9yaWdpbjogbmV3IG9yaWdpbnMuSHR0cE9yaWdpbihyZWRpcmVjdEJ1Y2tldC5idWNrZXRXZWJzaXRlRG9tYWluTmFtZSwge1xuICAgICAgICAgICAgcHJvdG9jb2xQb2xpY3k6IGNsb3VkZnJvbnQuT3JpZ2luUHJvdG9jb2xQb2xpY3kuSFRUUF9PTkxZLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIHZpZXdlclByb3RvY29sUG9saWN5OiBjbG91ZGZyb250LlZpZXdlclByb3RvY29sUG9saWN5LlJFRElSRUNUX1RPX0hUVFBTLFxuICAgICAgICB9LFxuICAgICAgICBkb21haW5OYW1lcyxcbiAgICAgICAgY2VydGlmaWNhdGU6IGNlcnQsXG4gICAgICAgIG1pbmltdW1Qcm90b2NvbFZlcnNpb246IGNsb3VkZnJvbnQuU2VjdXJpdHlQb2xpY3lQcm90b2NvbC5UTFNfVjFfMl8yMDIxLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIEFwZXggQSAmIEFBQUFcbiAgICAgIG5ldyByb3V0ZTUzLkFSZWNvcmQodGhpcywgYEFSZWNvcmQtJHtkb21haW4uZG9tYWluTmFtZX1gLCB7XG4gICAgICAgIHpvbmUsXG4gICAgICAgIHJlY29yZE5hbWU6IGRvbWFpbi5kb21haW5OYW1lLFxuICAgICAgICB0YXJnZXQ6IHJvdXRlNTMuUmVjb3JkVGFyZ2V0LmZyb21BbGlhcyhuZXcgdGFyZ2V0cy5DbG91ZEZyb250VGFyZ2V0KGRpc3QpKSxcbiAgICAgIH0pO1xuXG4gICAgICBuZXcgcm91dGU1My5BYWFhUmVjb3JkKHRoaXMsIGBBYWFhUmVjb3JkLSR7ZG9tYWluLmRvbWFpbk5hbWV9YCwge1xuICAgICAgICB6b25lLFxuICAgICAgICByZWNvcmROYW1lOiBkb21haW4uZG9tYWluTmFtZSxcbiAgICAgICAgdGFyZ2V0OiByb3V0ZTUzLlJlY29yZFRhcmdldC5mcm9tQWxpYXMobmV3IHRhcmdldHMuQ2xvdWRGcm9udFRhcmdldChkaXN0KSksXG4gICAgICB9KTtcblxuICAgICAgLy8gV1dXIEEgJiBBQUFBXG4gICAgICBuZXcgcm91dGU1My5BUmVjb3JkKHRoaXMsIGBXd3dBUmVjb3JkLSR7ZG9tYWluLmRvbWFpbk5hbWV9YCwge1xuICAgICAgICB6b25lLFxuICAgICAgICByZWNvcmROYW1lOiBgd3d3LiR7ZG9tYWluLmRvbWFpbk5hbWV9YCxcbiAgICAgICAgdGFyZ2V0OiByb3V0ZTUzLlJlY29yZFRhcmdldC5mcm9tQWxpYXMobmV3IHRhcmdldHMuQ2xvdWRGcm9udFRhcmdldChkaXN0KSksXG4gICAgICB9KTtcblxuICAgICAgbmV3IHJvdXRlNTMuQWFhYVJlY29yZCh0aGlzLCBgV3d3QWFhYVJlY29yZC0ke2RvbWFpbi5kb21haW5OYW1lfWAsIHtcbiAgICAgICAgem9uZSxcbiAgICAgICAgcmVjb3JkTmFtZTogYHd3dy4ke2RvbWFpbi5kb21haW5OYW1lfWAsXG4gICAgICAgIHRhcmdldDogcm91dGU1My5SZWNvcmRUYXJnZXQuZnJvbUFsaWFzKG5ldyB0YXJnZXRzLkNsb3VkRnJvbnRUYXJnZXQoZGlzdCkpLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG4iXX0=