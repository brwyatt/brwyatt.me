import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const ssm = new SSMClient();
const s3 = new S3Client();

export async function getGitHubToken(paramName) {
  const response = await ssm.send(
    new GetParameterCommand({
      Name: paramName,
      WithDecryption: true,
    }),
  );
  return response.Parameter?.Value;
}

export const GITHUB_GRAPHQL_QUERY = `
query($login: String!) {
  user(login: $login) {
    pinnedItems(first: 10, types: REPOSITORY) {
      nodes {
        ... on Repository {
          databaseId
          name
          nameWithOwner
          description
          url
          homepageUrl
          primaryLanguage {
            name
            color
          }
          stargazerCount
          forkCount
          isFork
          isArchived
          pushedAt
          repositoryTopics(first: 10) {
            nodes {
              topic {
                name
              }
            }
          }
        }
      }
    }
    repositories(first: 30, privacy: PUBLIC, isFork: false, orderBy: {field: PUSHED_AT, direction: DESC}) {
      nodes {
        databaseId
        name
        nameWithOwner
        description
        url
        homepageUrl
        primaryLanguage {
          name
          color
        }
        stargazerCount
        forkCount
        isFork
        isArchived
        pushedAt
        repositoryTopics(first: 10) {
          nodes {
            topic {
              name
            }
          }
        }
      }
    }
  }
}
`;

export function normalizeRepo(raw) {
  if (!raw) return null;
  return {
    id: raw.databaseId ?? raw.id,
    name: raw.name,
    fullName: raw.nameWithOwner,
    description: raw.description ?? null,
    htmlUrl: raw.url,
    homepage: raw.homepageUrl || null,
    language: raw.primaryLanguage?.name ?? null,
    languageColor: raw.primaryLanguage?.color ?? null,
    stargazersCount: raw.stargazerCount ?? 0,
    forksCount: raw.forkCount ?? 0,
    isFork: Boolean(raw.isFork),
    isArchived: Boolean(raw.isArchived),
    updatedAt: raw.pushedAt,
    topics: (raw.repositoryTopics?.nodes || []).map((t) => t.topic.name),
  };
}

export async function fetchGitHubData(token, username) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'User-Agent': 'brwyatt-me-github-sync',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: GITHUB_GRAPHQL_QUERY,
      variables: { login: username },
    }),
  });

  if (!res.ok) {
    throw new Error(`GitHub GraphQL HTTP error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(`GitHub GraphQL error: ${json.errors.map((e) => e.message).join('; ')}`);
  }

  const userData = json.data?.user;
  if (!userData) {
    throw new Error(`User not found: ${username}`);
  }

  const pinnedNodes = userData.pinnedItems?.nodes || [];
  const repoNodes = userData.repositories?.nodes || [];

  const pinned = pinnedNodes.map(normalizeRepo).filter(Boolean);
  const recent = repoNodes
    .filter((r) => !r.isArchived && !r.isFork)
    .map(normalizeRepo)
    .filter(Boolean);

  return {
    updatedAt: new Date().toISOString(),
    pinned,
    recent,
  };
}

export async function handler(event, context, clientOverrides = {}) {
  const ssmClient = clientOverrides.ssm || ssm;
  const s3Client = clientOverrides.s3 || s3;

  const bucketName = process.env.BUCKET_NAME;
  const ssmParamName = process.env.SSM_PARAM_NAME;
  const githubUser = process.env.GITHUB_USER || 'brwyatt';
  const objectKey = process.env.OBJECT_KEY || 'data/projects.json';

  if (!bucketName) throw new Error('BUCKET_NAME environment variable is required');
  if (!ssmParamName) throw new Error('SSM_PARAM_NAME environment variable is required');

  console.log(`Starting GitHub sync for user: ${githubUser} to s3://${bucketName}/${objectKey}`);

  const ssmResponse = await ssmClient.send(
    new GetParameterCommand({
      Name: ssmParamName,
      WithDecryption: true,
    }),
  );
  const token = ssmResponse.Parameter?.Value;
  if (!token) throw new Error(`Empty or missing SSM parameter: ${ssmParamName}`);

  const data = await fetchGitHubData(token, githubUser);
  const payload = JSON.stringify(data, null, 2);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: payload,
      ContentType: 'application/json',
      CacheControl: 'public, max-age=3600',
    }),
  );

  console.log(
    `Successfully wrote ${data.pinned.length} pinned and ${data.recent.length} recent projects to S3.`,
  );
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'GitHub sync completed successfully',
      pinnedCount: data.pinned.length,
      recentCount: data.recent.length,
      updatedAt: data.updatedAt,
    }),
  };
}
