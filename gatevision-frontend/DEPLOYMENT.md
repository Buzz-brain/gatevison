# GateVision Deployment Guide

## Production Build

### Frontend

```bash
cd gatevision-frontend

# Install dependencies
npm ci --production

# Build
npm run build
# Output: dist/ directory

# Preview
npm run preview
```

### Backend

```bash
cd gatevision-backend

# Install
pip install -r requirements.txt

# Run with production server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Docker

### Frontend

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Backend

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose

```yaml
version: "3.8"
services:
  frontend:
    build: ./gatevision-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
  backend:
    build: ./gatevision-backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/gatevision
    depends_on:
      - db
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: gatevision
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` | Backend API URL |

## NGINX Configuration

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Performance Optimization

- Route-level lazy loading with React.lazy()
- Chunk splitting for Recharts, Framer Motion, and feature bundles
- Static asset caching (favicon, icons)
- JWT auto-refresh prevents unnecessary re-authentication
