# Render Deployment Guide

## Prerequisites
- A Render account
- GitHub/GitLab account with repository access
- Node.js 20.x installed locally (for development)

## Environment Variables

Create these environment variables in your Render dashboard:

```
NODE_ENV=production
PORT=10000  # or your preferred port
```

## Deployment Steps

1. **Connect your repository** to Render
2. **Configure the build command**: `npm install && npm run build`
3. **Set the start command**: `node server.js`
4. **Set the root directory**: `/`
5. **Set the build directory**: `/dist`

## Troubleshooting

### Blank Page Issues
1. **Check the browser console** for any errors
2. **Verify environment variables** are set correctly
3. **Check the network tab** for failed resource loads
4. **Ensure the build directory** contains the built files

### Build Failures
1. Check the build logs in the Render dashboard
2. Ensure all dependencies are listed in `package.json`
3. Verify the Node.js version is compatible (20.x)

## Required Buildpacks

- Node.js

## Custom Domains

To use a custom domain:
1. Go to your Render dashboard
2. Navigate to your service
3. Click on "Settings"
4. Under "Custom Domains", add your domain
5. Follow the DNS configuration instructions

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| NODE_ENV | Yes | Set to 'production' |
| PORT | Yes | Port the server should listen on |
| REACT_APP_API_URL | No | Your API base URL |

## Support

For additional help, contact your development team or refer to the [Render documentation](https://render.com/docs).
