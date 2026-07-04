export const generateDockerfile = async (techStack, ports = 3000) => {
  const stack = String(techStack).toLowerCase();

  // HTML / Static Sites
  if (stack.includes('html') || stack.includes('static')) {
    return `FROM nginx:alpine
WORKDIR /usr/share/nginx/html
# Remove default nginx static assets
RUN rm -rf ./*
# Copy static assets from builder stage
COPY . .
EXPOSE ${ports}
CMD ["nginx", "-g", "daemon off;"]`;
  }

  // Python
  if (stack.includes('python') || stack.includes('flask') || stack.includes('django')) {
    return `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE ${ports}
CMD ["python", "main.py"]`;
  }

  // Default to Node.js (React, Vue, Express, etc.)
  return `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --if-present

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app ./
RUN npm install --omit=dev
EXPOSE ${ports}
CMD ["npm", "start"]`;
};

export const generateWorkflow = async (techStack, deployTarget = 'docker') => {
  const stack = String(techStack).toLowerCase();

  // Python Workflow
  if (stack.includes('python')) {
    return `name: Python CI/CD Pipeline
on:
  push:
    branches: [ main ]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
      - name: Run tests
        run: pytest`;
  }

  // HTML Workflow
  if (stack.includes('html') || stack.includes('static')) {
    return `name: Static HTML Pipeline
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Server
        run: echo "Deploying static files via ${deployTarget}..."`;
  }

  // Default Node.js Workflow
  return `name: Node.js CI/CD Pipeline
on:
  push:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build --if-present
      - run: npm test --if-present
      - name: Deploy
        run: echo "Deploying Node.js application via ${deployTarget}..."`;
};

export const analyzeLogs = async (logs) => {
  // Since we aren't using AI, return a generic catch-all log analysis
  return `## Log Analysis Dashboard

### 🔍 Automated Diagnostics
Based on standard deployment patterns, here are common issues to check:

**1. Port Conflicts or Binding Issues**
- Ensure your application is actually listening on the port specified in your Dockerfile (e.g., 3000, 5000, 80).
- For Node.js, ensure you are binding to \`0.0.0.0\` and not just \`localhost\` or \`127.0.0.1\` inside the container.

**2. Missing Dependencies**
- Did you commit your \`package.json\` or \`requirements.txt\`?
- If using Node, check if \`npm install\` failed due to a missing lockfile or conflicting peer dependencies.

**3. Build Step Failures**
- If your logs show a crash during \`npm run build\`, check for syntax errors or missing environment variables required at build-time.`;
};