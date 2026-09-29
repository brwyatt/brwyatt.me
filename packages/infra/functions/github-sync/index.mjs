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

export const DEFAULT_SCORING_CONFIG = {
  halfLifeDays: 30, // Recency half-life in days
  maxPushedAgeDays: 90, // Hard cutoff: ignore repos not pushed in the last 90 days
  minScoreThreshold: 10, // Minimum frecency score required to qualify
  maxActiveRepos: 2, // Maximum number of non-pinned repos to include (0 to 2)
  weightCommits: 1.5, // Multiplier for commits in the last 90 days
  weightStars: 2.0, // Multiplier for stargazer count
  weightForks: 1.0, // Multiplier for fork count
};

export function getScoringConfig() {
  return {
    halfLifeDays: process.env.SCORING_HALF_LIFE_DAYS
      ? parseFloat(process.env.SCORING_HALF_LIFE_DAYS)
      : DEFAULT_SCORING_CONFIG.halfLifeDays,
    maxPushedAgeDays: process.env.SCORING_MAX_AGE_DAYS
      ? parseFloat(process.env.SCORING_MAX_AGE_DAYS)
      : DEFAULT_SCORING_CONFIG.maxPushedAgeDays,
    minScoreThreshold: process.env.SCORING_MIN_THRESHOLD
      ? parseFloat(process.env.SCORING_MIN_THRESHOLD)
      : DEFAULT_SCORING_CONFIG.minScoreThreshold,
    maxActiveRepos: process.env.SCORING_MAX_ACTIVE_REPOS
      ? parseInt(process.env.SCORING_MAX_ACTIVE_REPOS, 10)
      : DEFAULT_SCORING_CONFIG.maxActiveRepos,
    weightCommits: process.env.SCORING_WEIGHT_COMMITS
      ? parseFloat(process.env.SCORING_WEIGHT_COMMITS)
      : DEFAULT_SCORING_CONFIG.weightCommits,
    weightStars: process.env.SCORING_WEIGHT_STARS
      ? parseFloat(process.env.SCORING_WEIGHT_STARS)
      : DEFAULT_SCORING_CONFIG.weightStars,
    weightForks: process.env.SCORING_WEIGHT_FORKS
      ? parseFloat(process.env.SCORING_WEIGHT_FORKS)
      : DEFAULT_SCORING_CONFIG.weightForks,
  };
}

export function calculateFrecencyScore(repo, now = new Date(), config = DEFAULT_SCORING_CONFIG) {
  if (!repo.updatedAt) return 0;
  const pushedDate = new Date(repo.updatedAt);
  const diffMs = now.getTime() - pushedDate.getTime();
  const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > config.maxPushedAgeDays) {
    return 0;
  }

  // Exponential recency decay
  const recency = Math.pow(0.5, diffDays / config.halfLifeDays);

  const commits = repo.recentCommitCount || 0;
  const stars = repo.stargazersCount || 0;
  const forks = repo.forksCount || 0;

  const activityPopularity =
    commits * config.weightCommits +
    stars * config.weightStars +
    forks * config.weightForks;

  return recency * activityPopularity;
}

export const GITHUB_GRAPHQL_QUERY = `
query($login: String!, $since: GitTimestamp!) {
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
          defaultBranchRef {
            target {
              ... on Commit {
                history(since: $since) {
                  totalCount
                }
              }
            }
          }
        }
      }
    }
    repositories(first: 10, privacy: PUBLIC, isFork: false, orderBy: {field: PUSHED_AT, direction: DESC}) {
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
        defaultBranchRef {
          target {
            ... on Commit {
              history(since: $since) {
                totalCount
              }
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
  const recentCommitCount =
    raw.defaultBranchRef?.target?.history?.totalCount ?? 0;

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
    recentCommitCount,
  };
}

export async function fetchGitHubData(token, username, config = DEFAULT_SCORING_CONFIG) {
  const since = new Date(Date.now() - config.maxPushedAgeDays * 24 * 60 * 60 * 1000).toISOString();

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'User-Agent': 'brwyatt-me-github-sync',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: GITHUB_GRAPHQL_QUERY,
      variables: { login: username, since },
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
  const pinnedIds = new Set(pinned.map((p) => p.id));

  const now = new Date();
  const candidates = repoNodes
    .map(normalizeRepo)
    .filter((r) => r && !pinnedIds.has(r.id) && !r.isFork && !r.isArchived)
    .map((r) => ({
      ...r,
      frecencyScore: Math.round(calculateFrecencyScore(r, now, config) * 100) / 100,
    }))
    .filter((r) => r.frecencyScore >= config.minScoreThreshold)
    .sort((a, b) => b.frecencyScore - a.frecencyScore)
    .slice(0, config.maxActiveRepos);

  const pinnedProjects = pinned.map((p) => ({
    ...p,
    isPinned: true,
    isFeatured: true,
  }));

  const activeProjects = candidates.map((c) => ({
    ...c,
    isPinned: false,
    isFeatured: false,
  }));

  const projects = [...pinnedProjects, ...activeProjects];

  return {
    updatedAt: now.toISOString(),
    projects,
    pinned: pinnedProjects,
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

  const scoringConfig = getScoringConfig();
  const data = await fetchGitHubData(token, githubUser, scoringConfig);
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

  const activeCount = data.projects.length - data.pinned.length;
  console.log(
    `Successfully wrote ${data.projects.length} projects (${data.pinned.length} pinned, ${activeCount} active) to S3.`,
  );
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'GitHub sync completed successfully',
      projectCount: data.projects.length,
      pinnedCount: data.pinned.length,
      activeCount,
      updatedAt: data.updatedAt,
    }),
  };
}
