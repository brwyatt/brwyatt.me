"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("aws-cdk-lib");
const assertions_1 = require("aws-cdk-lib/assertions");
const vitest_1 = require("vitest");
const portfolio_stack_1 = require("../lib/portfolio-stack");
(0, vitest_1.describe)('PortfolioStack', () => {
    const app = new cdk.App();
    const config = {
        stage: 'beta',
        domainName: 'beta.brwyatt.me',
        aliases: ['www.beta.brwyatt.me'],
        hostedZoneId: 'Z3MELYL57MW6HJ',
        account: '123456789012',
    };
    const stack = new portfolio_stack_1.PortfolioStack(app, 'TestPortfolioStack', config, {
        env: { account: '123456789012', region: 'us-east-1' },
    });
    const template = assertions_1.Template.fromStack(stack);
    (0, vitest_1.it)('provisions an encrypted S3 bucket with public access blocked', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
            BucketEncryption: {
                ServerSideEncryptionConfiguration: [
                    {
                        ApplyServerSideEncryptionByDefault: {
                            SSEAlgorithm: 'AES256',
                        },
                    },
                ],
            },
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: true,
                BlockPublicPolicy: true,
                IgnorePublicAcls: true,
                RestrictPublicBuckets: true,
            },
        });
    });
    (0, vitest_1.it)('provisions a CloudFront distribution with TLS 1.2 and redirect to https', () => {
        template.hasResourceProperties('AWS::CloudFront::Distribution', {
            DistributionConfig: assertions_1.Match.objectLike({
                DefaultRootObject: 'index.html',
                ViewerCertificate: assertions_1.Match.objectLike({
                    MinimumProtocolVersion: 'TLSv1.2_2021',
                    SslSupportMethod: 'sni-only',
                }),
                DefaultCacheBehavior: assertions_1.Match.objectLike({
                    ViewerProtocolPolicy: 'redirect-to-https',
                }),
            }),
        });
    });
    (0, vitest_1.it)('creates Route 53 A and AAAA alias records', () => {
        template.hasResourceProperties('AWS::Route53::RecordSet', {
            Type: 'A',
            Name: 'beta.brwyatt.me.',
        });
        template.hasResourceProperties('AWS::Route53::RecordSet', {
            Type: 'AAAA',
            Name: 'beta.brwyatt.me.',
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9ydGZvbGlvLXN0YWNrLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwb3J0Zm9saW8tc3RhY2sudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFtQztBQUNuQyx1REFBeUQ7QUFDekQsbUNBQThDO0FBQzlDLDREQUF3RDtBQUd4RCxJQUFBLGlCQUFRLEVBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFO0lBQzlCLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQzFCLE1BQU0sTUFBTSxHQUFvQjtRQUM5QixLQUFLLEVBQUUsTUFBTTtRQUNiLFVBQVUsRUFBRSxpQkFBaUI7UUFDN0IsT0FBTyxFQUFFLENBQUMscUJBQXFCLENBQUM7UUFDaEMsWUFBWSxFQUFFLGdCQUFnQjtRQUM5QixPQUFPLEVBQUUsY0FBYztLQUN4QixDQUFDO0lBRUYsTUFBTSxLQUFLLEdBQUcsSUFBSSxnQ0FBYyxDQUFDLEdBQUcsRUFBRSxvQkFBb0IsRUFBRSxNQUFNLEVBQUU7UUFDbEUsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFO0tBQ3RELENBQUMsQ0FBQztJQUNILE1BQU0sUUFBUSxHQUFHLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRTNDLElBQUEsV0FBRSxFQUFDLDhEQUE4RCxFQUFFLEdBQUcsRUFBRTtRQUN0RSxRQUFRLENBQUMscUJBQXFCLENBQUMsaUJBQWlCLEVBQUU7WUFDaEQsZ0JBQWdCLEVBQUU7Z0JBQ2hCLGlDQUFpQyxFQUFFO29CQUNqQzt3QkFDRSxrQ0FBa0MsRUFBRTs0QkFDbEMsWUFBWSxFQUFFLFFBQVE7eUJBQ3ZCO3FCQUNGO2lCQUNGO2FBQ0Y7WUFDRCw4QkFBOEIsRUFBRTtnQkFDOUIsZUFBZSxFQUFFLElBQUk7Z0JBQ3JCLGlCQUFpQixFQUFFLElBQUk7Z0JBQ3ZCLGdCQUFnQixFQUFFLElBQUk7Z0JBQ3RCLHFCQUFxQixFQUFFLElBQUk7YUFDNUI7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUEsV0FBRSxFQUFDLHlFQUF5RSxFQUFFLEdBQUcsRUFBRTtRQUNqRixRQUFRLENBQUMscUJBQXFCLENBQUMsK0JBQStCLEVBQUU7WUFDOUQsa0JBQWtCLEVBQUUsa0JBQUssQ0FBQyxVQUFVLENBQUM7Z0JBQ25DLGlCQUFpQixFQUFFLFlBQVk7Z0JBQy9CLGlCQUFpQixFQUFFLGtCQUFLLENBQUMsVUFBVSxDQUFDO29CQUNsQyxzQkFBc0IsRUFBRSxjQUFjO29CQUN0QyxnQkFBZ0IsRUFBRSxVQUFVO2lCQUM3QixDQUFDO2dCQUNGLG9CQUFvQixFQUFFLGtCQUFLLENBQUMsVUFBVSxDQUFDO29CQUNyQyxvQkFBb0IsRUFBRSxtQkFBbUI7aUJBQzFDLENBQUM7YUFDSCxDQUFDO1NBQ0gsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFBLFdBQUUsRUFBQywyQ0FBMkMsRUFBRSxHQUFHLEVBQUU7UUFDbkQsUUFBUSxDQUFDLHFCQUFxQixDQUFDLHlCQUF5QixFQUFFO1lBQ3hELElBQUksRUFBRSxHQUFHO1lBQ1QsSUFBSSxFQUFFLGtCQUFrQjtTQUN6QixDQUFDLENBQUM7UUFDSCxRQUFRLENBQUMscUJBQXFCLENBQUMseUJBQXlCLEVBQUU7WUFDeEQsSUFBSSxFQUFFLE1BQU07WUFDWixJQUFJLEVBQUUsa0JBQWtCO1NBQ3pCLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgVGVtcGxhdGUsIE1hdGNoIH0gZnJvbSAnYXdzLWNkay1saWIvYXNzZXJ0aW9ucyc7XG5pbXBvcnQgeyBkZXNjcmliZSwgaXQsIGV4cGVjdCB9IGZyb20gJ3ZpdGVzdCc7XG5pbXBvcnQgeyBQb3J0Zm9saW9TdGFjayB9IGZyb20gJy4uL2xpYi9wb3J0Zm9saW8tc3RhY2snO1xuaW1wb3J0IHsgUG9ydGZvbGlvQ29uZmlnIH0gZnJvbSAnLi4vbGliL3R5cGVzJztcblxuZGVzY3JpYmUoJ1BvcnRmb2xpb1N0YWNrJywgKCkgPT4ge1xuICBjb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuICBjb25zdCBjb25maWc6IFBvcnRmb2xpb0NvbmZpZyA9IHtcbiAgICBzdGFnZTogJ2JldGEnLFxuICAgIGRvbWFpbk5hbWU6ICdiZXRhLmJyd3lhdHQubWUnLFxuICAgIGFsaWFzZXM6IFsnd3d3LmJldGEuYnJ3eWF0dC5tZSddLFxuICAgIGhvc3RlZFpvbmVJZDogJ1ozTUVMWUw1N01XNkhKJyxcbiAgICBhY2NvdW50OiAnMTIzNDU2Nzg5MDEyJyxcbiAgfTtcblxuICBjb25zdCBzdGFjayA9IG5ldyBQb3J0Zm9saW9TdGFjayhhcHAsICdUZXN0UG9ydGZvbGlvU3RhY2snLCBjb25maWcsIHtcbiAgICBlbnY6IHsgYWNjb3VudDogJzEyMzQ1Njc4OTAxMicsIHJlZ2lvbjogJ3VzLWVhc3QtMScgfSxcbiAgfSk7XG4gIGNvbnN0IHRlbXBsYXRlID0gVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKTtcblxuICBpdCgncHJvdmlzaW9ucyBhbiBlbmNyeXB0ZWQgUzMgYnVja2V0IHdpdGggcHVibGljIGFjY2VzcyBibG9ja2VkJywgKCkgPT4ge1xuICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpTMzo6QnVja2V0Jywge1xuICAgICAgQnVja2V0RW5jcnlwdGlvbjoge1xuICAgICAgICBTZXJ2ZXJTaWRlRW5jcnlwdGlvbkNvbmZpZ3VyYXRpb246IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBBcHBseVNlcnZlclNpZGVFbmNyeXB0aW9uQnlEZWZhdWx0OiB7XG4gICAgICAgICAgICAgIFNTRUFsZ29yaXRobTogJ0FFUzI1NicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgUHVibGljQWNjZXNzQmxvY2tDb25maWd1cmF0aW9uOiB7XG4gICAgICAgIEJsb2NrUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgQmxvY2tQdWJsaWNQb2xpY3k6IHRydWUsXG4gICAgICAgIElnbm9yZVB1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgIFJlc3RyaWN0UHVibGljQnVja2V0czogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KCdwcm92aXNpb25zIGEgQ2xvdWRGcm9udCBkaXN0cmlidXRpb24gd2l0aCBUTFMgMS4yIGFuZCByZWRpcmVjdCB0byBodHRwcycsICgpID0+IHtcbiAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6Q2xvdWRGcm9udDo6RGlzdHJpYnV0aW9uJywge1xuICAgICAgRGlzdHJpYnV0aW9uQ29uZmlnOiBNYXRjaC5vYmplY3RMaWtlKHtcbiAgICAgICAgRGVmYXVsdFJvb3RPYmplY3Q6ICdpbmRleC5odG1sJyxcbiAgICAgICAgVmlld2VyQ2VydGlmaWNhdGU6IE1hdGNoLm9iamVjdExpa2Uoe1xuICAgICAgICAgIE1pbmltdW1Qcm90b2NvbFZlcnNpb246ICdUTFN2MS4yXzIwMjEnLFxuICAgICAgICAgIFNzbFN1cHBvcnRNZXRob2Q6ICdzbmktb25seScsXG4gICAgICAgIH0pLFxuICAgICAgICBEZWZhdWx0Q2FjaGVCZWhhdmlvcjogTWF0Y2gub2JqZWN0TGlrZSh7XG4gICAgICAgICAgVmlld2VyUHJvdG9jb2xQb2xpY3k6ICdyZWRpcmVjdC10by1odHRwcycsXG4gICAgICAgIH0pLFxuICAgICAgfSksXG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KCdjcmVhdGVzIFJvdXRlIDUzIEEgYW5kIEFBQUEgYWxpYXMgcmVjb3JkcycsICgpID0+IHtcbiAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6Um91dGU1Mzo6UmVjb3JkU2V0Jywge1xuICAgICAgVHlwZTogJ0EnLFxuICAgICAgTmFtZTogJ2JldGEuYnJ3eWF0dC5tZS4nLFxuICAgIH0pO1xuICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpSb3V0ZTUzOjpSZWNvcmRTZXQnLCB7XG4gICAgICBUeXBlOiAnQUFBQScsXG4gICAgICBOYW1lOiAnYmV0YS5icnd5YXR0Lm1lLicsXG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXX0=