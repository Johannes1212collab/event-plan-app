# Vercel Deployment Guide

Your application is now code-ready for Vercel. Follow these steps to deploy it live.

## 1. Push to GitHub
If you haven't already, push your code to a GitHub repository:
```bash
git init
git add .
git commit -m "Ready for Vercel"
git branch -M main
# Add your remote origin (create a repo on GitHub first)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 2. Import to Vercel
1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your GitHub repository.

## 3. Configure Resources (on Vercel)
Before hitting "Deploy", or immediately after (if it fails initially), you need to add the database and storage.

### Database (Postgres)
1.  Navigate to your Project in Vercel.
2.  Click **"Storage"** tab -> **"Create Database"**.
3.  Select **"Postgres"**.
4.  Accept the terms and create.
5.  **Important**: Click **"Connect Project"** to automatically add the `POSTGRES_URL` and other variables to your environment.

### Storage (Blob)
1.  In the **"Storage"** tab, click **"Create Database"** (or storage) again.
2.  Select **"Blob"**.
3.  Create the store.
4.  **Important**: Click **"Connect Project"** to add `BLOB_READ_WRITE_TOKEN`.

## 4. Environment Variables
Ensure these variables are present in your Vercel Project Settings -> Environment Variables:
- `AUTH_SECRET`: Generate a random string (e.g., `openssl rand -base64 32`) or use a secure password.
- `POSTGRES_...`: Added automatically by Vercel Postgres.
- `BLOB_READ_WRITE_TOKEN`: Added automatically by Vercel Blob.

## 5. Redeploy
1.  Go to the **"Deployments"** tab.
2.  If the automatic deployment failed (because resources weren't linked yet), click **"Redeploy"**.
3.  Wait for the build to finish.

## 6. Access Your App
Once deployed, Vercel will give you a domain (e.g., `event-plan.vercel.app`).
- **Register** a new account (since it's a fresh database).
- **Create** an event and test the **upload** functionality to confirm Blob storage works.
