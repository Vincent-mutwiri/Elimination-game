# Deployment Guide

## Server Deployment (Vercel)

1.  Deploy the server first:
    ```bash
    cd server
    vercel --prod
    ```

2.  Note the deployed server URL (e.g., `https://your-server-name.vercel.app`)

3.  Update your MongoDB connection string in Vercel environment variables:
    * Go to your Vercel dashboard
    * Select your server project
    * Go to Settings > Environment Variables
    * Add: `MONGODB_URI` with your MongoDB connection string
    * Add: `CORS_ORIGIN` with your client URL (e.g., `https://your-client-name.vercel.app`)

## Client Deployment (Vercel)

1.  Update the client environment:
    ```bash
    cd client
    # Edit .env.production and set VITE_SERVER_URL to your deployed server URL
    ```

2.  Deploy the client:
    ```bash
    vercel --prod
    ```

## Local Development

1.  Start the server:
    ```bash
    cd server
    npm run dev
    ```

2.  Start the client:
    ```bash
    cd client
    npm run dev
    ```

## Troubleshooting

-   **404 errors on refresh**: Make sure `vercel.json` is in the client directory
-   **CORS errors**: Update `CORS_ORIGIN` in server environment variables to allow your client's domain. You can use a comma-separated list for multiple origins.
-   **Connection errors**: Verify `VITE_SERVER_URL` points to the correct server. Check browser console for WebSocket connection errors.
-   **Database errors**: Check MongoDB connection string and ensure your server's IP is whitelisted in MongoDB Atlas network access settings.
