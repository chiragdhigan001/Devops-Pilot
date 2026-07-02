# DevOpsPilot AI API Documentation

## Base URL
`http://localhost:5000/api`

## Authentication

### Register
`POST /auth/register`
```json
{ "name": "string", "email": "string", "password": "string" }
```

### Login
`POST /auth/login`
```json
{ "email": "string", "password": "string" }
```

### Get Current User
`GET /auth/me` (Protected)

## Projects

### List Projects
`GET /projects` (Protected)

### Get Project
`GET /projects/:id` (Protected)

### Create Project
`POST /projects` (Protected)
```json
{ "name": "string", "githubRepo": "string", "description": "string", "subdomain": "string-optional" }
```

Projects reserve a public URL such as `http://my-app.lvh.me:5000`.

### Delete Project
`DELETE /projects/:id` (Protected)

## Deployments

### List Deployments
`GET /deployments/:projectId` (Protected)

### Create Deployment
`POST /deployments/:projectId` (Protected)

Deployment records now include runtime metadata such as `deployedUrl`, `containerName`,
`imageName`, `hostPort`, `containerPort`, `healthStatus`, and `errorMessage`.

Successful deployments also expose a subdomain-backed public URL. In local development the
default format is `http://<project-subdomain>.lvh.me:5000`.

## AI

### Generate Dockerfile
`POST /ai/generate-dockerfile` (Protected, Rate Limited)
```json
{ "techStack": "string", "ports": 3000 }
```

### Generate Workflow
`POST /ai/generate-workflow` (Protected, Rate Limited)
```json
{ "techStack": "string", "deployTarget": "docker" }
```

### Analyze Logs
`POST /ai/analyze-logs` (Protected, Rate Limited)
```json
{ "logs": "string" }
```

## Monitoring

### Get Metrics
`GET /monitoring/metrics` (Protected)

### Get Deployment History
`GET /monitoring/history` (Protected)

## Health
`GET /api/health`
