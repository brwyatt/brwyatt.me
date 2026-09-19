"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("aws-cdk-lib");
const assertions_1 = require("aws-cdk-lib/assertions");
const vitest_1 = require("vitest");
const redirect_stack_1 = require("../lib/redirect-stack");
(0, vitest_1.describe)('RedirectStack', () => {
    const app = new cdk.App();
    const config = {
        targetDomain: 'https://brwyatt.me',
        awsAccount: '123456789012',
        domains: [
            { domainName: 'brwyatt.net', hostedZoneId: 'Z22I3V5KI0TD1U' },
            { domainName: 'brwyatt.com', hostedZoneId: 'ZDRNDVJ8GECH8' },
        ],
    };
    const stack = new redirect_stack_1.RedirectStack(app, 'TestRedirectStack', config, {
        env: { account: '123456789012', region: 'us-east-1' },
    });
    const template = assertions_1.Template.fromStack(stack);
    (0, vitest_1.it)('configures S3 website redirection to brwyatt.me', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
            WebsiteConfiguration: {
                RedirectAllRequestsTo: {
                    HostName: 'brwyatt.me',
                    Protocol: 'https',
                },
            },
        });
    });
    (0, vitest_1.it)('creates Route 53 alias records for each redirect domain', () => {
        template.hasResourceProperties('AWS::Route53::RecordSet', {
            Name: 'brwyatt.net.',
            Type: 'A',
        });
        template.hasResourceProperties('AWS::Route53::RecordSet', {
            Name: 'brwyatt.com.',
            Type: 'A',
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkaXJlY3Qtc3RhY2sudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJlZGlyZWN0LXN0YWNrLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBbUM7QUFDbkMsdURBQWtEO0FBQ2xELG1DQUE4QztBQUM5QywwREFBc0Q7QUFHdEQsSUFBQSxpQkFBUSxFQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7SUFDN0IsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDMUIsTUFBTSxNQUFNLEdBQW1CO1FBQzdCLFlBQVksRUFBRSxvQkFBb0I7UUFDbEMsVUFBVSxFQUFFLGNBQWM7UUFDMUIsT0FBTyxFQUFFO1lBQ1AsRUFBRSxVQUFVLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxnQkFBZ0IsRUFBRTtZQUM3RCxFQUFFLFVBQVUsRUFBRSxhQUFhLEVBQUUsWUFBWSxFQUFFLGVBQWUsRUFBRTtTQUM3RDtLQUNGLENBQUM7SUFFRixNQUFNLEtBQUssR0FBRyxJQUFJLDhCQUFhLENBQUMsR0FBRyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sRUFBRTtRQUNoRSxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUU7S0FDdEQsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxRQUFRLEdBQUcscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFM0MsSUFBQSxXQUFFLEVBQUMsaURBQWlELEVBQUUsR0FBRyxFQUFFO1FBQ3pELFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxpQkFBaUIsRUFBRTtZQUNoRCxvQkFBb0IsRUFBRTtnQkFDcEIscUJBQXFCLEVBQUU7b0JBQ3JCLFFBQVEsRUFBRSxZQUFZO29CQUN0QixRQUFRLEVBQUUsT0FBTztpQkFDbEI7YUFDRjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBQSxXQUFFLEVBQUMseURBQXlELEVBQUUsR0FBRyxFQUFFO1FBQ2pFLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyx5QkFBeUIsRUFBRTtZQUN4RCxJQUFJLEVBQUUsY0FBYztZQUNwQixJQUFJLEVBQUUsR0FBRztTQUNWLENBQUMsQ0FBQztRQUNILFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyx5QkFBeUIsRUFBRTtZQUN4RCxJQUFJLEVBQUUsY0FBYztZQUNwQixJQUFJLEVBQUUsR0FBRztTQUNWLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgVGVtcGxhdGUgfSBmcm9tICdhd3MtY2RrLWxpYi9hc3NlcnRpb25zJztcbmltcG9ydCB7IGRlc2NyaWJlLCBpdCwgZXhwZWN0IH0gZnJvbSAndml0ZXN0JztcbmltcG9ydCB7IFJlZGlyZWN0U3RhY2sgfSBmcm9tICcuLi9saWIvcmVkaXJlY3Qtc3RhY2snO1xuaW1wb3J0IHsgUmVkaXJlY3RDb25maWcgfSBmcm9tICcuLi9saWIvdHlwZXMnO1xuXG5kZXNjcmliZSgnUmVkaXJlY3RTdGFjaycsICgpID0+IHtcbiAgY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbiAgY29uc3QgY29uZmlnOiBSZWRpcmVjdENvbmZpZyA9IHtcbiAgICB0YXJnZXREb21haW46ICdodHRwczovL2Jyd3lhdHQubWUnLFxuICAgIGF3c0FjY291bnQ6ICcxMjM0NTY3ODkwMTInLFxuICAgIGRvbWFpbnM6IFtcbiAgICAgIHsgZG9tYWluTmFtZTogJ2Jyd3lhdHQubmV0JywgaG9zdGVkWm9uZUlkOiAnWjIySTNWNUtJMFREMVUnIH0sXG4gICAgICB7IGRvbWFpbk5hbWU6ICdicnd5YXR0LmNvbScsIGhvc3RlZFpvbmVJZDogJ1pEUk5EVko4R0VDSDgnIH0sXG4gICAgXSxcbiAgfTtcblxuICBjb25zdCBzdGFjayA9IG5ldyBSZWRpcmVjdFN0YWNrKGFwcCwgJ1Rlc3RSZWRpcmVjdFN0YWNrJywgY29uZmlnLCB7XG4gICAgZW52OiB7IGFjY291bnQ6ICcxMjM0NTY3ODkwMTInLCByZWdpb246ICd1cy1lYXN0LTEnIH0sXG4gIH0pO1xuICBjb25zdCB0ZW1wbGF0ZSA9IFRlbXBsYXRlLmZyb21TdGFjayhzdGFjayk7XG5cbiAgaXQoJ2NvbmZpZ3VyZXMgUzMgd2Vic2l0ZSByZWRpcmVjdGlvbiB0byBicnd5YXR0Lm1lJywgKCkgPT4ge1xuICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpTMzo6QnVja2V0Jywge1xuICAgICAgV2Vic2l0ZUNvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgUmVkaXJlY3RBbGxSZXF1ZXN0c1RvOiB7XG4gICAgICAgICAgSG9zdE5hbWU6ICdicnd5YXR0Lm1lJyxcbiAgICAgICAgICBQcm90b2NvbDogJ2h0dHBzJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0pO1xuXG4gIGl0KCdjcmVhdGVzIFJvdXRlIDUzIGFsaWFzIHJlY29yZHMgZm9yIGVhY2ggcmVkaXJlY3QgZG9tYWluJywgKCkgPT4ge1xuICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpSb3V0ZTUzOjpSZWNvcmRTZXQnLCB7XG4gICAgICBOYW1lOiAnYnJ3eWF0dC5uZXQuJyxcbiAgICAgIFR5cGU6ICdBJyxcbiAgICB9KTtcbiAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6Um91dGU1Mzo6UmVjb3JkU2V0Jywge1xuICAgICAgTmFtZTogJ2Jyd3lhdHQuY29tLicsXG4gICAgICBUeXBlOiAnQScsXG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXX0=