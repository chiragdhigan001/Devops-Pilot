import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const callAI = async (prompt) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('AI service error:', error.message);
    return fallbackResponse(prompt);
  }
};

export const generateDockerfile = async (techStack, ports = 3000) => {
  const prompt = `Generate a production-ready Dockerfile for a ${techStack} application exposing port ${ports}. Include multi-stage build if applicable. Return only the Dockerfile content.`;
  return callAI(prompt);
};

export const generateWorkflow = async (techStack, deployTarget = 'docker') => {
  const prompt = `Generate a GitHub Actions workflow YAML for a ${techStack} project that builds and deploys using ${deployTarget}. Include CI steps: install, test, build, deploy. Return only the YAML content.`;
  return callAI(prompt);
};

export const analyzeLogs = async (logs) => {
  const prompt = `Analyze the following deployment/application logs and provide:
1. Error detection - list any errors found
2. Root cause analysis - what likely caused each error
3. Suggested fixes - specific steps to resolve each issue

Logs:
${logs}

Return the analysis as structured markdown.`;
  return callAI(prompt);
};

const fallbackResponse = (prompt) => {
  if (prompt.includes('Dockerfile')) {
    return `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["node", "dist/server.js"]`;
  }
  if (prompt.includes('GitHub Actions')) {
    return `name: CI/CD Pipeline
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npm run build
      - name: Deploy
        run: echo "Deploying application..."`;
  }
  return `## Log Analysis

### Errors Detected
- Connection refused on database endpoint

### Root Cause
- Database credentials or connection string may be incorrect
- Database service may not be running

### Suggested Fixes
1. Verify MONGODB_URI in environment variables
2. Check database service status
3. Ensure network allows connection to database endpoint
4. Restart the application after configuration changes`;
};
