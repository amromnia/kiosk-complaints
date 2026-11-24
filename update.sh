#!/usr/bin/env bash
set -euo pipefail

REMOTE_URL="https://github.com/amromnia/kiosk-complaints.git"

echo "Starting project update..."

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: Run this script from the application's Git repository." >&2
  exit 1
fi

BRANCH="$(git branch --show-current)"
if [ -z "$BRANCH" ]; then
  echo "Error: Detached HEAD; cannot determine the branch to update." >&2
  exit 1
fi

for command in npm pm2; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Error: $command is required." >&2
    exit 1
  fi
done

# Always pull from our repository by URL, regardless of what "origin" points to.
echo "Fetching $BRANCH from $REMOTE_URL..."
git fetch --no-tags "$REMOTE_URL" "refs/heads/$BRANCH"
git merge --ff-only FETCH_HEAD

echo "Installing dependencies..."
npm ci --include=dev < /dev/null
echo "Building project..."
npm run build < /dev/null

echo "Restarting PM2..."
pm2 restart all < /dev/null
pm2 list

echo "Update completed successfully."
