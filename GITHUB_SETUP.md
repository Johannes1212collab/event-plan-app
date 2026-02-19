# GitHub Setup & Push Guide

Since **Git** is not currently installed or recognized in your terminal, follow these steps to set it up and push your code.

## 1. Install Git
1.  Download the installer from [git-scm.com](https://git-scm.com/downloads).
2.  Run the installer and click "Next" through the prompts (default settings are fine).
3.  **Important**: After installation, **close and reopen your terminal/VS Code** to refresh the path.

## 2. Configure Git (First Time Only)
Run these commands in your terminal, replacing the placeholders with your info:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## 3. Initialize & Commit Code
Navigate to your project folder in the terminal (if not already there) and run:

```bash
# Initialize a new Git repository
git init

# Add all project files to staging
git add .

# Commit the files
git commit -m "Initial commit"

# Rename the default branch to 'main'
git branch -M main
```

## 4. Create a Repository on GitHub
1.  Go to [github.com/new](https://github.com/new).
2.  Enter a repository name (e.g., `event-plan-app`).
3.  Click **Create repository**.
4.  Copy the URL under "**…or push an existing repository from the command line**". It looks like:
    `https://github.com/YOUR_USERNAME/event-plan-app.git`

## 5. Connect & Push
Back in your terminal, run these commands (paste the URL you copied):

```bash
# Add the remote link (replace with your actual URL)
git remote add origin https://github.com/YOUR_USERNAME/event-plan-app.git

# Push your code to GitHub
git push -u origin main
```

✅ **Done!** Your code is now on GitHub and ready for Vercel.
