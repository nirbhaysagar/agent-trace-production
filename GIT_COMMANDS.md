# Git Commands for Pushing Changes

## Check Current Status
```powershell
git status
```

## Add All Changes
```powershell
git add .
```

## Commit Changes
```powershell
git commit -m "Your commit message here"
```

## Push to GitHub
```powershell
git push origin main
```

## Complete Workflow (All in One)
```powershell
# Check what changed
git status

# Add all changes
git add .

# Commit with message
git commit -m "Update: Your description of changes"

# Push to GitHub
git push origin main
```

## If You Get "Updates Rejected" Error
```powershell
# Pull first, then push
git pull origin main --rebase
git push origin main
```

## Quick Push (After Initial Setup)
```powershell
git add .
git commit -m "Update: Latest changes"
git push origin main
```

