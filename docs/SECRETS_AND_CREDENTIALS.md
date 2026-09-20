# Secrets, Credentials, and IAM OIDC Setup Guide

## 1. Core Principles

- **Zero Plaintext Secrets:** No passwords, access keys, or API tokens are checked into this repository.
- **No Long-Lived IAM User Keys:** Deployment authentication is managed strictly through **AWS IAM OpenID Connect (OIDC)** identity providers federated with GitHub Actions.
- **Least Privilege:** Beta roles and Production roles are separated.

---

## 2. GitHub Actions Secrets Configuration

When creating the repository on GitHub, configure the following secrets under **Settings > Secrets and variables > Actions**:

| Secret Name         | Description                                   | Example / Format                                              |
| ------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| `AWS_ROLE_ARN_BETA` | IAM Role ARN assumed for deploying Beta       | `arn:aws:iam::177542564244:role/GitHubActions-BrwyattMe-Beta` |
| `AWS_ROLE_ARN_PROD` | IAM Role ARN assumed for deploying Production | `arn:aws:iam::177542564244:role/GitHubActions-BrwyattMe-Prod` |

---

## 3. Setting Up AWS IAM OIDC Provider for GitHub Actions

If GitHub's OIDC identity provider does not yet exist in your AWS account, run the following via AWS CLI or CDK:

```bash
# 1. Create OpenID Connect Provider for GitHub (if not already existing)
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 1c58a3a8518e8759bf075b76b750d4f8d264fcd9
```

### Trust Policy for `GitHubActions-BrwyattMe-Beta`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:brwyatt@440042/brwyatt.me@1377742708:environment:beta"
        }
      }
    }
  ]
}
```

### Trust Policy for `GitHubActions-BrwyattMe-Prod`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:brwyatt@440042/brwyatt.me@1377742708:environment:production"
        }
      }
    }
  ]
}
```

---

## 4. Local Testing Without AWS Credentials

The web application (`packages/web`) runs completely offline and requires zero AWS credentials or configuration.
Run:

```bash
cd packages/web
npm install
npm run dev
```

Mock projects will load automatically if offline or unauthenticated.
