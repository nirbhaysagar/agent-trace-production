# 🚀 AgentTrace Production Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Backend Requirements
- [ ] Python 3.9+ installed
- [ ] Virtual environment created
- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Database (Supabase) set up
- [ ] API endpoints tested

### ✅ Frontend Requirements
- [ ] Node.js 18+ installed
- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Build process tested
- [ ] Error boundaries implemented
- [ ] Security headers configured

## 🌐 Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Frontend (Vercel)
1. **Connect GitHub repository**
2. **Set environment variables:**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   ```
3. **Deploy automatically** on git push

#### Backend (Railway)
1. **Connect GitHub repository**
2. **Set environment variables:**
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_key
   JWT_SECRET_KEY=your_jwt_secret
   ```
3. **Deploy automatically** on git push

### Option 2: Docker Deployment

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### Backend Dockerfile
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Option 3: Traditional VPS

#### Server Setup
```bash
# Install dependencies
sudo apt update
sudo apt install nginx python3.9 python3.9-venv nodejs npm

# Clone repository
git clone https://github.com/yourusername/agent-trace.git
cd agent-trace

# Backend setup
cd backend
python3.9 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install
npm run build

# Configure nginx
sudo nano /etc/nginx/sites-available/agent-trace
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 Production Configuration

### Environment Variables

#### Frontend (.env.production)
```bash
NEXT_PUBLIC_API_URL=https://api.agenttrace.com
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_key
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

#### Backend (.env)
```bash
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_supabase_key
JWT_SECRET_KEY=your_secure_jwt_secret_key
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=False
```

### Database Setup
1. **Create Supabase project**
2. **Run database schema:**
   ```sql
   -- Copy contents of database/schema.sql
   -- Execute in Supabase SQL editor
   ```
3. **Configure Row Level Security**
4. **Set up authentication**

## 🚀 Deployment Commands

### Build for Production
```bash
# Frontend
cd frontend
npm run build:production
npm run type-check

# Backend
cd backend
pip install -r requirements.txt
```

### Start Production Servers
```bash
# Frontend
cd frontend
npm start

# Backend
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 📊 Monitoring & Analytics

### Add Monitoring
```bash
# Install monitoring tools
npm install @sentry/nextjs
pip install sentry-sdk[fastapi]
```

### Performance Monitoring
- **Frontend**: Vercel Analytics, Google Analytics
- **Backend**: Sentry, DataDog, or New Relic
- **Database**: Supabase Analytics

## 🔒 Security Checklist

- [ ] **HTTPS enabled** (SSL certificates)
- [ ] **Environment variables** secured
- [ ] **API rate limiting** implemented
- [ ] **CORS** properly configured
- [ ] **Input validation** on all endpoints
- [ ] **Authentication** implemented
- [ ] **Security headers** configured
- [ ] **Database access** restricted

## 🧪 Testing

### Pre-Deployment Tests
```bash
# Frontend tests
npm run lint
npm run type-check
npm run build

# Backend tests
python -m pytest tests/
uvicorn main:app --reload  # Test locally
```

### Post-Deployment Tests
1. **Health checks** on all endpoints
2. **Upload functionality** testing
3. **Trace visualization** testing
4. **Error handling** testing
5. **Performance** testing

## 📈 Scaling Considerations

### Frontend Scaling
- **CDN**: Use Vercel's global CDN
- **Caching**: Implement Redis for API responses
- **Image optimization**: Next.js automatic optimization

### Backend Scaling
- **Load balancing**: Multiple backend instances
- **Database scaling**: Supabase auto-scaling
- **Caching**: Redis for frequently accessed data
- **Queue system**: Celery for background tasks

## 🆘 Troubleshooting

### Common Issues
1. **CORS errors**: Check API URL configuration
2. **Build failures**: Check Node.js/Python versions
3. **Database connection**: Verify Supabase credentials
4. **Environment variables**: Ensure all are set correctly

### Debug Commands
```bash
# Check frontend build
npm run build --verbose

# Check backend logs
uvicorn main:app --log-level debug

# Test API endpoints
curl https://your-api.com/health
```

## 📞 Support

- **Documentation**: README.md and BUILDING.md
- **Issues**: GitHub Issues
- **Community**: Discord/Slack channel
- **Email**: support@agenttrace.com

---

**AgentTrace is now production-ready!** 🕵️‍♂️
