# Render Deployment Guide

This guide will help you deploy your Value Investing Screener project on Render.

## Prerequisites

1. **GitHub Repository**: Your code must be in a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Project Structure**: Ensure your project has the correct structure (already configured)

## Project Structure Overview

Your project is configured with:
- **Backend API**: FastAPI application in `/api` directory with Docker
- **Frontend**: Next.js application in the root directory
- **Configuration**: `render.yaml` for automated deployment

## Deployment Steps

### Step 1: Prepare Your Repository

1. **Commit all changes** to your GitHub repository:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Ensure your repository is public** or you have a Render Pro account for private repos.

### Step 2: Connect to Render

1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** and select **"Blueprint"**
3. Connect your GitHub account if not already connected
4. Select your repository: `mon_projet_screener`
5. Render will automatically detect the `render.yaml` file

### Step 3: Configure Services

Render will create two services based on your `render.yaml`:

#### Backend API Service (`screener-api`)
- **Type**: Web Service
- **Environment**: Docker
- **Plan**: Free
- **Port**: 8080 (automatically configured)
- **Health Check**: `/` endpoint

#### Frontend Service (`screener-frontend`)
- **Type**: Web Service
- **Environment**: Node.js
- **Plan**: Free
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm start`
- **Node Version**: 20.11.1

### Step 4: Environment Variables

The following environment variables are automatically configured:

#### Backend API
- `PORT`: 8080
- `PYTHON_VERSION`: 3.11

#### Frontend
- `NODE_ENV`: production
- `NEXT_PUBLIC_API_URL`: Automatically set to backend service URL
- `NODE_VERSION`: 20.11.1

### Step 5: Deploy

1. Click **"Apply"** to start the deployment
2. Render will:
   - Build the Docker image for the API
   - Install dependencies and build the frontend
   - Deploy both services
   - Provide URLs for each service

### Step 6: Verify Deployment

1. **Check API Health**:
   - Visit your API URL (e.g., `https://screener-api-xxx.onrender.com`)
   - You should see: `{"status": "ok", "message": "Welcome to the Value Screener API!"}`

2. **Check Frontend**:
   - Visit your frontend URL (e.g., `https://screener-frontend-xxx.onrender.com`)
   - The application should load and be able to communicate with the API

## Important Notes

### Free Tier Limitations
- **Sleep Mode**: Services sleep after 15 minutes of inactivity
- **Cold Starts**: First request after sleep may take 30+ seconds
- **Build Time**: Limited to 500 build minutes per month

### Service Communication
- The frontend automatically connects to the backend via `NEXT_PUBLIC_API_URL`
- CORS is configured to allow requests from Render domains

### Monitoring
- Check service logs in the Render dashboard
- Monitor build and deployment status
- Set up notifications for deployment failures

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check the build logs in Render dashboard
   - Ensure all dependencies are in `package.json` and `requirements.txt`

2. **API Connection Issues**:
   - Verify `NEXT_PUBLIC_API_URL` is set correctly
   - Check CORS configuration in the API

3. **Slow Performance**:
   - Expected on free tier due to sleep mode
   - Consider upgrading to paid plan for production use

### Debug Commands

If you need to debug locally:

```bash
# Test API locally
cd api
python -m uvicorn main:app --host 0.0.0.0 --port 8080

# Test frontend locally
npm run dev
```

## Updating Your Deployment

1. **Push changes** to your GitHub repository
2. Render will **automatically redeploy** (if auto-deploy is enabled)
3. Monitor the deployment in the Render dashboard

## Security Considerations

- Environment variables are securely managed by Render
- API keys should be added through Render's environment variable interface
- HTTPS is automatically provided for all services

## Next Steps

After successful deployment:
1. Test all functionality thoroughly
2. Consider setting up custom domains
3. Monitor performance and usage
4. Plan for scaling if needed

## Support

- **Render Documentation**: [docs.render.com](https://docs.render.com)
- **Render Community**: [community.render.com](https://community.render.com)
- **GitHub Issues**: Create issues in your repository for project-specific problems