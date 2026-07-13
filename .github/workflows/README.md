# SafePassage CI/CD Pipeline

This folder holds the GitHub Actions pipeline that deploys SafePassage to AWS.

## How it works

```
Developer  ->  git push  ->  GitHub Actions (deploy.yml)
                                 |
                    1. build React/Vite frontend
                    2. bundle backend + frontend into app.tar.gz
                    3. upload bundle to S3  (deploy/app-latest.tar.gz)
                    4. start ASG instance refresh
                                 |
                     EC2 instances (behind the ALB) relaunch,
                     pull the new bundle, npm install, restart,
                     and serve the new version — with zero downtime
                     (rolling, 50% healthy at all times).
```

The infrastructure itself (VPC, ALB, Auto Scaling Group, S3, KMS, CloudWatch,
Secrets Manager) is managed separately by Terraform in the `Axiomra/terraform`
project. This pipeline only ships **application code**.

## One-time setup (required before the pipeline can deploy)

1. **Create a deploy IAM user** in AWS with a policy limited to:
   - `s3:PutObject` on `arn:aws:s3:::safepassage-dev-assets-b5026054/deploy/*`
   - `autoscaling:StartInstanceRefresh`, `autoscaling:DescribeAutoScalingGroups`
     on the `safepassage-dev-asg` group.

2. **Add the keys as GitHub repo secrets**
   (repo → Settings → Secrets and variables → Actions → *New repository secret*):
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

   > ⚠️ Never commit AWS keys to the repo — always use GitHub secrets.

## Triggering a deploy

- **Automatic:** push to `main`/`master`.
- **Manual:** repo → Actions → *Build & Deploy SafePassage* → *Run workflow*.

## Config reference (edit `deploy.yml` env if infra changes)

| Variable        | Value                            |
|-----------------|----------------------------------|
| `AWS_REGION`    | `us-east-1`                      |
| `S3_BUCKET`     | `safepassage-dev-assets-b5026054`|
| `S3_KEY`        | `deploy/app-latest.tar.gz`       |
| `ASG_NAME`      | `safepassage-dev-asg`            |

> The frontend calls the API via a same-origin relative path (`/api`), so no
> ALB URL needs to be configured — the build works behind any host.
