# Git Commands to Push to GitHub

## Step 1: Initialize Git Repository (if not already done)
```powershell
cd C:\Users\Gnasher\Desktop\agent-trace-production-main
git init
```

## Step 2: Add All Files
```powershell
git add .
```

## Step 3: Create Initial Commit
```powershell
git commit -m "Initial commit: AgentTrace production-ready application"
```

## Step 4: Create GitHub Repository
1. Go to https://github.com/new
2. Create a new repository (e.g., `agent-trace-production`)
3. **DO NOT** initialize with README, .gitignore, or license (we already have these)

## Step 5: Add Remote and Push
```powershell
# Replace YOUR_USERNAME and REPO_NAME with your actual GitHub username and repository name
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Alternative: If Repository Already Exists on GitHub
```powershell
# Check if remote already exists
git remote -v

# If remote exists, update it:
git remote set-url origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# If remote doesn't exist, add it:
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push
git push -u origin main
```

## Quick One-Liner (After Creating GitHub Repo)
```powershell
git init
git add .
git commit -m "Initial commit: AgentTrace production-ready application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git push -u origin main
```

## Troubleshooting

### If you get "fatal: remote origin already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
```

### If you get authentication errors
```powershell
# Use GitHub Personal Access Token instead of password
# Or use SSH:
git remote set-url origin git@github.com:YOUR_USERNAME/REPO_NAME.git
```

### If you need to update existing repository
```powershell
git add .
git commit -m "Update: Testing checklist and fixes"
git push origin main
```

