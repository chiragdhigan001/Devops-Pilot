import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import net from 'net';
import { spawn } from 'child_process';
import { buildPublicUrl } from './projectDomainService.js';

const isWin = process.platform === 'win32';
const GIT_PATHS = [
  'C:\\Program Files\\Git\\cmd',
  'C:\\Program Files\\Git\\mingw64\\bin',
  'C:\\Program Files\\Git\\usr\\bin',
];
const DOCKER_PATHS = [
  'C:\\Program Files\\Docker\\Docker\\resources\\bin',
  process.env.ProgramFiles + '\\Docker\\Docker\\resources\\bin',
  process.env.LOCALAPPDATA + '\\Docker\\Docker\\resources\\bin',
];

const HEALTHCHECK_PATHS = ['/api/health', '/health', '/'];
const HEALTHCHECK_ATTEMPTS = 15;
const HEALTHCHECK_DELAY_MS = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getDeploymentsRoot = () => {
  if (process.env.DEPLOYMENTS_ROOT) {
    return path.resolve(process.env.DEPLOYMENTS_ROOT);
  }

  return path.join(os.tmpdir(), 'devopspilot-ai-deployments');
};

const sanitizeName = (value, fallback = 'deployment') => {
  const sanitized = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  return sanitized || fallback;
};

const normalizeGithubRepo = (githubRepo) => {
  if (!githubRepo) return null;

  if (/^https?:\/\//i.test(githubRepo) || /^git@/i.test(githubRepo)) {
    return githubRepo;
  }

  return `https://github.com/${githubRepo.replace(/^\/+|\/+$/g, '')}.git`;
};

const buildAuthenticatedRepoUrl = (repositoryUrl, githubToken) => {
  if (!githubToken || !repositoryUrl?.startsWith('https://github.com/')) {
    return repositoryUrl;
  }

  return repositoryUrl.replace('https://', `https://x-access-token:${githubToken}@`);
};

const safeRemove = async (targetPath) => {
  if (!targetPath) return;

  const resolvedTarget = path.resolve(targetPath);
  const resolvedRoot = path.resolve(getDeploymentsRoot());

  if (!resolvedTarget.startsWith(resolvedRoot)) {
    throw new Error(`Refusing to delete path outside deployments root: ${resolvedTarget}`);
  }

  await fs.rm(resolvedTarget, { recursive: true, force: true });
};

const runCommand = ({ command, args, cwd, env, onStdout, onStderr }) => new Promise((resolve, reject) => {
  const childEnv = { ...process.env, ...env };
  if (isWin) {
    const existingPath = childEnv.PATH || childEnv.Path || '';
    const allExtra = [...GIT_PATHS, ...DOCKER_PATHS].filter(Boolean);
    const extraPaths = allExtra.join(';');
    childEnv.PATH = extraPaths ? `${extraPaths};${existingPath}` : existingPath;
  }
  const child = spawn(command, args, {
    cwd,
    env: childEnv,
    shell: false,
  });

  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    stdout += text;
    onStdout?.(text);
  });

  child.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    stderr += text;
    onStderr?.(text);
  });

  child.on('error', reject);
  child.on('close', (code) => {
    if (code === 0) {
      resolve({ stdout, stderr });
      return;
    }

    reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}\n${stderr || stdout}`.trim()));
  });
});

const detectContainerPort = async (workspacePath) => {
  const dockerfilePath = path.join(workspacePath, 'Dockerfile');
  const dockerfile = await fs.readFile(dockerfilePath, 'utf8');
  const exposeMatches = [...dockerfile.matchAll(/^\s*EXPOSE\s+(\d+)/gim)];
  const lastExpose = exposeMatches.at(-1);
  return lastExpose ? Number(lastExpose[1]) : Number(process.env.DEFAULT_CONTAINER_PORT || 3000);
};

const findAvailablePort = (startPort) => new Promise((resolve, reject) => {
  const tryPort = (port) => {
    const server = net.createServer();
    server.unref();
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        tryPort(port + 1);
        return;
      }

      reject(error);
    });
    server.listen(port, '127.0.0.1', () => {
      const { port: openPort } = server.address();
      server.close(() => resolve(openPort));
    });
  };

  tryPort(startPort);
});

const resolveHealthcheckUrl = (hostPort, checkPath) => {
  const deployHost = process.env.DEPLOY_URL_HOST || '127.0.0.1';
  return `http://${deployHost}:${hostPort}${checkPath}`;
};

const performHealthCheck = async (hostPort) => {
  for (let attempt = 1; attempt <= HEALTHCHECK_ATTEMPTS; attempt += 1) {
    for (const checkPath of HEALTHCHECK_PATHS) {
      try {
        const response = await fetch(resolveHealthcheckUrl(hostPort, checkPath), {
          method: 'GET',
          redirect: 'follow',
        });

        if (response.ok || response.status < 500) {
          return {
            healthy: true,
            url: resolveHealthcheckUrl(hostPort, checkPath),
            statusCode: response.status,
          };
        }
      } catch {
        // Keep retrying while the container starts.
      }
    }

    await sleep(HEALTHCHECK_DELAY_MS);
  }

  return {
    healthy: false,
    url: resolveHealthcheckUrl(hostPort, '/'),
    statusCode: null,
  };
};

const ensureDockerfile = async (workspacePath) => {
  const dockerfilePath = path.join(workspacePath, 'Dockerfile');
  try {
    await fs.access(dockerfilePath);
  } catch {
    throw new Error(
      'No Dockerfile found in the repository root. DevOpsPilot AI can generate one for you:\n' +
      '  → Go to AI Tools → Generate Dockerfile\n' +
      '  → Add the generated Dockerfile to your repo and push\n' +
      '  → Then deploy again'
    );
  }
  return dockerfilePath;
};

const appendSanitizedLog = (value, text) => `${value}[${new Date().toISOString()}] ${text.replace(/\r/g, '')}\n`;

export const createDeploymentContext = async ({ project, deployment }) => {
  const deploymentsRoot = getDeploymentsRoot();
  await fs.mkdir(deploymentsRoot, { recursive: true });

  const deploymentSlug = `${sanitizeName(project.name, 'project')}-${deployment._id.toString().slice(-6)}`;
  const workspacePath = path.join(deploymentsRoot, deploymentSlug);
  const imageName = `devopspilot-${deploymentSlug}`;
  const containerName = `devopspilot-${deploymentSlug}`;

  return {
    deploymentSlug,
    workspacePath,
    imageName,
    containerName,
  };
};

export const cloneRepository = async ({ repositoryUrl, githubToken, workspacePath, onLog }) => {
  const authenticatedUrl = buildAuthenticatedRepoUrl(repositoryUrl, githubToken);
  onLog(`Cloning repository from ${repositoryUrl}`);
  await runCommand({
    command: 'git',
    args: ['clone', '--depth', '1', authenticatedUrl, workspacePath],
    onStdout: (text) => onLog(text.trim()),
    onStderr: (text) => onLog(text.trim()),
  });

  const { stdout } = await runCommand({
    command: 'git',
    args: ['rev-parse', 'HEAD'],
    cwd: workspacePath,
  });

  return stdout.trim();
};

export const buildAndRunDeployment = async ({
  project,
  deployment,
  githubToken,
  onLog,
}) => {
  const repositoryUrl = normalizeGithubRepo(project.githubRepo);
  if (!repositoryUrl) {
    throw new Error('A GitHub repository is required before deploying.');
  }

  const context = await createDeploymentContext({ project, deployment });
  await safeRemove(context.workspacePath);

  try {
    const commitSha = await cloneRepository({
      repositoryUrl,
      githubToken,
      workspacePath: context.workspacePath,
      onLog,
    });

    onLog('Repository cloned successfully');

    try {
      await runCommand({ command: 'docker', args: ['info'], onStdout: () => {}, onStderr: () => {} });
    } catch {
      throw new Error(
        'Docker is not available. Make sure Docker Desktop is running and try again.'
      );
    }

    await ensureDockerfile(context.workspacePath);
    onLog('Dockerfile detected');

    const containerPort = await detectContainerPort(context.workspacePath);
    const hostPort = await findAvailablePort(Number(process.env.DEPLOY_BASE_PORT || 4000));
    onLog(`Using container port ${containerPort} and host port ${hostPort}`);

    await runCommand({
      command: 'docker',
      args: ['build', '-t', context.imageName, '.'],
      cwd: context.workspacePath,
      onStdout: (text) => onLog(text.trim()),
      onStderr: (text) => onLog(text.trim()),
    });
    onLog(`Docker image built: ${context.imageName}`);

      await runCommand({
        command: 'docker',
        args: ['rm', '-f', context.containerName],
        onStdout: () => {},
        onStderr: () => {},
      }).catch(() => {});

    await runCommand({
      command: 'docker',
      args: ['run', '-d', '--name', context.containerName, '-p', `${hostPort}:${containerPort}`, context.imageName],
      onStdout: (text) => onLog(text.trim()),
      onStderr: (text) => onLog(text.trim()),
    });
    onLog(`Container started: ${context.containerName}`);

    const healthcheck = await performHealthCheck(hostPort);
    if (!healthcheck.healthy) {
      throw new Error(`Health check failed for ${resolveHealthcheckUrl(hostPort, '/')}`);
    }

    onLog(`Health check passed with status ${healthcheck.statusCode} at ${healthcheck.url}`);

    return {
      ...context,
      repositoryUrl,
      commitSha,
      containerPort,
      hostPort,
      localUrl: healthcheck.url,
      deployedUrl: buildPublicUrl(project.subdomain),
    };
  } catch (error) {
    if (context.containerName) {
      await runCommand({
        command: 'docker',
        args: ['logs', context.containerName],
        onStdout: (text) => onLog(text.trim()),
        onStderr: (text) => onLog(text.trim()),
      }).catch(() => {});
      await runCommand({
        command: 'docker',
        args: ['rm', '-f', context.containerName],
        onStdout: () => {},
        onStderr: () => {},
      }).catch(() => {});
    }

    throw error;
  } finally {
    await safeRemove(context.workspacePath).catch(() => {});
  }
};

export const appendDeploymentLog = (deployment, message) => {
  deployment.logs = appendSanitizedLog(deployment.logs, message);
};

export const removeContainer = async (containerName) => {
  if (!containerName) return;

  await runCommand({
    command: 'docker',
    args: ['rm', '-f', containerName],
    onStdout: () => {},
    onStderr: () => {},
  }).catch(() => {});
};
