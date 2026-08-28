# GITHUB TEAM WORKFLOW

This document outlines the strict Git execution commands for the Smriti team. Do not deviate from these workflows.

## 1. Initial Setup
```bash
# Clone the repository
git clone https://github.com/Rehan-2024/smriti-
cd smriti-

# Verify remote
git remote -v
```

## 2. Starting a Task
Before starting any new task, ensure you are synchronized with `main`.
```bash
# Fetch latest changes
git fetch origin

# Switch to main and pull
git checkout main
git pull origin main

# Create your feature branch (Format: feature/<TASK_ID>-<description>)
git checkout -b feature/T1-FE-001-scaffold-elderly

# Verify your current branch
git branch --show-current
```

## 3. Saving Work (Committing)
```bash
# Check status
git status

# View your changes
git diff
git diff --check

# Stage files
git add .

# Commit using Conventional Commits
git commit -m "feat(elderly): scaffold initial vite pwa"
```

## 4. Pushing and PR
```bash
# Push branch to remote
git push -u origin feature/T1-FE-001-scaffold-elderly
```
*Next:* Open a Pull Request on GitHub. Ensure CI (GitHub Actions) runs successfully.

## 5. Review and Merge
- Reviewer approves.
- Wait for CI to pass.
- Select **Squash and Merge**.
- Delete the remote branch.

## 6. Sync and Branch Cleanup (Post-Merge)
```bash
git checkout main
git pull origin main
git branch -d feature/T1-FE-001-scaffold-elderly
```

## 7. Conflict Recovery
If another team merged code that conflicts with your active branch:
```bash
# Fetch latest main
git fetch origin

# Merge main into your feature branch
git merge origin/main

# Resolve conflicts in your IDE, then:
git add .
git commit -m "chore: resolve merge conflicts with main"
```
