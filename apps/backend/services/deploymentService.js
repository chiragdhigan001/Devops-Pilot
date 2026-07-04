import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import net from 'net';
import { spawn } from 'child_process';
import { buildPublicUrl } from './projectDomainService.js';

const isWin = process.platform === 'win32';

// Only use Windows-specific hardcoded paths if we are actually on Windows
const GIT_PATHS = isWin ? [
  'C:\\Program Files\\Git\\cmd',
  'C:\\Program Files\\Git\\mingw64\\bin',
  'C:\\Program Files\\Git\\usr\\bin',
] : [];

const DOCKER_PATHS = isWin ? [
  'C:\\Program Files\\Docker\\Docker\\resources\\bin',
  process.env.ProgramFiles + '\\Docker\\Docker\\resources\\bin',
  process.env.LOCALAPPDATA + '\\Docker\\Docker\\resources\\bin',
] : [];

const HEALTHCHECK_PATHS = ['/api/health', '/health', '/'];
const HEALTHCHECK_ATTEMPTS = 15;
const HEALTHCHECK_DELAY_MS = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getDeploymentsRoot = () => {
  if (process.env.DEPLOYMENTS_ROOT) {
    console.log(`[DEBUG] Using custom DEPLOYMENTS_ROOT: ${process.env.DEPLOYMENTS_ROOT}`);
    return path.resolve(process.env.DEPLOYMENTS_ROOT);
  }
  const defaultDir = path.join(os.tmpdir(), 'devopspilot-ai-deployments');
  console.log(`[DEBUG] Using default OS temp directory for deployments: ${defaultDir}`);
  return defaultDir;
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
  console.log(`[DEBUG] Normalizing GitHub repo string: ${githubRepo}`);
  if (!githubRepo) return null;

  if (/^https?:\/\//i.test(githubRepo) || /^git@/i.test(githubRepo)) {
    return githubRepo;
  }
  return `https://github.com/${githubRepo.replace(/^\/+|\/+$/g, '')}.git`;
};

const buildAuthenticatedRepoUrl = (repositoryUrl, githubToken) => {
  if (!githubToken || !repositoryUrl?.startsWith('https://github.com/')) {
    console.log(`[DEBUG] No GitHub token provided or non-HTTPS URL, using default URL.`);
    return repositoryUrl;
  }
  console.log(`[DEBUG] Injecting GitHub token into repository URL.`);
  return repositoryUrl.replace('https://', `https://x-access-token:${githubToken}@`);
};

const safeRemove = async (targetPath) => {
  if (!targetPath) return;

  const resolvedTarget = path.resolve(targetPath);
  const resolvedRoot = path.resolve(getDeploymentsRoot());

  console.log(`[DEBUG] Attempting safe remove of: ${resolvedTarget}`);
  if (!resolvedTarget.startsWith(resolvedRoot)) {
    throw new Error(`Refusing to delete path outside deployments root: ${resolvedTarget}`);
  }

  try {
    await fs.rm(resolvedTarget, { recursive: true, force: true });
    console.log(`[DEBUG] Successfully removed: ${resolvedTarget}`);
  } catch (err) {
    console.log(`[DEBUG] Failed to remove ${resolvedTarget}: ${err.message}`);
  }
};

const runCommand = ({ command, args, cwd, env, onStdout, onStderr }) => new Promise((resolve, reject) => {
  console.log(`[DEBUG] [runCommand] Executing: ${command} ${args.join(' ')}`);
  if (cwd) console.log(`[DEBUG] [runCommand] CWD: ${cwd}`);

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
    shell: isWin, // Enabling shell on Windows helps resolve `.cmd` executables
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

  child.on('error', (err) => {
    console.error(`[DEBUG] [runCommand] Spawn Error for ${command}:`, err);
    reject(err);
  });

  child.on('close', (code) => {
    console.log(`[DEBUG] [runCommand] Completed ${command} with exit code ${code}`);
    if (code === 0) {
      resolve({ stdout, stderr });
      return;
    }
    reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}\n${stderr || stdout}`.trim()));
  });
});

const detectContainerPort = async (workspacePath) => {
  console.log(`[DEBUG] Detecting container port from Dockerfile in ${workspacePath}`);
  const dockerfilePath = path.join(workspacePath, 'Dockerfile');
  const dockerfile = await fs.readFile(dockerfilePath, 'utf8');
  const exposeMatches = [...dockerfile.matchAll(/^\s*EXPOSE\s+(\d+)/gim)];
  const lastExpose = exposeMatches.at(-1);
  const port = lastExpose ? Number(lastExpose[1]) : Number(process.env.DEFAULT_CONTAINER_PORT || 3000);
  console.log(`[DEBUG] Detected port: ${port}`);
  return port;
};

const findAvailablePort = (startPort) => new Promise((resolve, reject) => {
  console.log(`[DEBUG] Finding available port starting from ${startPort}`);
  const tryPort = (port) => {
    const server = net.createServer();
    server.unref();
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`[DEBUG] Port ${port} is in use, trying ${port + 1}`);
        tryPort(port + 1);
        return;
      }
      reject(error);
    });
    server.listen(port, '127.0.0.1', () => {
      const { port: openPort } = server.address();
      server.close(() => {
        console.log(`[DEBUG] Found open port: ${openPort}`);
        resolve(openPort);
      });
    });
  };
  tryPort(startPort);
});

const resolveHealthcheckUrl = (hostPort, checkPath) => {
  const deployHost = process.env.DEPLOY_URL_HOST || '127.0.0.1';
  return `http://${deployHost}:${hostPort}${checkPath}`;
};

const performHealthCheck = async (hostPort) => {
  console.log(`[DEBUG] Starting health checks on port ${hostPort}`);
  for (let attempt = 1; attempt <= HEALTHCHECK_ATTEMPTS; attempt += 1) {
    console.log(`[DEBUG] Health check attempt ${attempt}/${HEALTHCHECK_ATTEMPTS}`);
    for (const checkPath of HEALTHCHECK_PATHS) {
      const url = resolveHealthcheckUrl(hostPort, checkPath);
      try {
        const response = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
        });

        if (response.ok || response.status < 500) {
          console.log(`[DEBUG] Health check passed at ${url} with status ${response.status}`);
          return {
            healthy: true,
            url,
            statusCode: response.status,
          };
        }
      } catch (err) {
        console.log(`[DEBUG] Health check failed for ${url}: ${err.message}`);
        // Keep retrying while the container starts.
      }
    }
    await sleep(HEALTHCHECK_DELAY_MS);
  }

  console.log(`[DEBUG] Health checks exhausted. Container may not be running correctly.`);
  return {
    healthy: false,
    url: resolveHealthcheckUrl(hostPort, '/'),
    statusCode: null,
  };
};

const ensureDockerfile = async (workspacePath) => {
  const dockerfilePath = path.join(workspacePath, 'Dockerfile');
  console.log(`[DEBUG] Checking for Dockerfile at ${dockerfilePath}`);
  try {
    await fs.access(dockerfilePath);
    console.log(`[DEBUG] Dockerfile found`);
  } catch {
    console.error(`[DEBUG] No Dockerfile found!`);
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
  console.log(`[DEBUG] Creating deployment context for project: ${project.name}`);
  const deploymentsRoot = getDeploymentsRoot();
  await fs.mkdir(deploymentsRoot, { recursive: true });

  const deploymentSlug = `${sanitizeName(project.name, 'project')}-${deployment._id.toString().slice(-6)}`;
  const workspacePath = path.join(deploymentsRoot, deploymentSlug);
  const imageName = `devopspilot-${deploymentSlug}`;
  const containerName = `devopspilot-${deploymentSlug}`;

  console.log(`[DEBUG] Context created: Slug=${deploymentSlug}, Workspace=${workspacePath}`);
  return {
    deploymentSlug,
    workspacePath,
    imageName,
    containerName,
  };
};

export const cloneRepository = async ({ repositoryUrl, githubToken, workspacePath, onLog }) => {
  console.log(`[DEBUG] Starting cloneRepository...`);
  const authenticatedUrl = buildAuthenticatedRepoUrl(repositoryUrl, githubToken);
  onLog(`Cloning repository from ${repositoryUrl}`);
  
  await runCommand({
    command: 'git',
    args: ['clone', '--depth', '1', authenticatedUrl, workspacePath],
    onStdout: (text) => onLog(text.trim()),
    onStderr: (text) => onLog(text.trim()),
  });

  console.log(`[DEBUG] Fetching latest commit SHA...`);
  const { stdout } = await runCommand({
    command: 'git',
    args: ['rev-parse', 'HEAD'],
    cwd: workspacePath,
  });

  const sha = stdout.trim();
  console.log(`[DEBUG] Repository cloned successfully at SHA: ${sha}`);
  return sha;
};

export const buildAndRunDeployment = async ({
  project,
  deployment,
  githubToken,
  onLog,
}) => {
  console.log(`[DEBUG] --- STARTING BUILD AND RUN PROCESS ---`);
  
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

    console.log(`[DEBUG] Checking Docker availability...`);
    try {
      await runCommand({ command: 'docker', args: ['info'], onStdout: () => {}, onStderr: () => {} });
      console.log(`[DEBUG] Docker is responsive.`);
    } catch (err) {
      console.error(`[DEBUG] Docker check failed:`, err);
      throw new Error('Docker is not available. Make sure Docker Desktop is running and try again.');
    }

    await ensureDockerfile(context.workspacePath);
    onLog('Dockerfile detected');

    const containerPort = await detectContainerPort(context.workspacePath);
    const hostPort = await findAvailablePort(Number(process.env.DEPLOY_BASE_PORT || 4000));
    onLog(`Using container port ${containerPort} and host port ${hostPort}`);

    console.log(`[DEBUG] Starting Docker build...`);
    await runCommand({
      command: 'docker',
      args: ['build', '-t', context.imageName, '.'],
      cwd: context.workspacePath,
      onStdout: (text) => onLog(text.trim()),
      onStderr: (text) => onLog(text.trim()),
    });
    onLog(`Docker image built: ${context.imageName}`);

    console.log(`[DEBUG] Removing any existing containers with the same name...`);
    await runCommand({
      command: 'docker',
      args: ['rm', '-f', context.containerName],
      onStdout: () => {},
      onStderr: () => {},
    }).catch(() => {});

    console.log(`[DEBUG] Running Docker container...`);
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
    console.log(`[DEBUG] --- DEPLOYMENT SUCCESSFUL ---`);

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
    console.error(`[DEBUG] Deployment failed with error:`, error.message);
    
    if (context.containerName) {
      console.log(`[DEBUG] Fetching container logs for failure analysis...`);
      await runCommand({
        command: 'docker',
        args: ['logs', context.containerName],
        onStdout: (text) => onLog(text.trim()),
        onStderr: (text) => onLog(text.trim()),
      }).catch(() => {});
      
      console.log(`[DEBUG] Cleaning up failed container...`);
      await runCommand({
        command: 'docker',
        args: ['rm', '-f', context.containerName],
        onStdout: () => {},
        onStderr: () => {},
      }).catch(() => {});
    }

    throw error;
  } finally {
    console.log(`[DEBUG] Cleaning up workspace directory...`);
    await safeRemove(context.workspacePath).catch(() => {});
  }
};

export const appendDeploymentLog = (deployment, message) => {
  deployment.logs = appendSanitizedLog(deployment.logs, message);
};

export const removeContainer = async (containerName) => {
  if (!containerName) return;
  console.log(`[DEBUG] Explicitly removing container: ${containerName}`);
  await runCommand({
    command: 'docker',
    args: ['rm', '-f', containerName],
    onStdout: () => {},
    onStderr: () => {},
  }).catch(() => {});
};