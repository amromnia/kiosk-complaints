#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
UPDATER="$ROOT/update.sh"
export REAL_GIT="$(command -v git)"
WORK="$(mktemp -d)"
trap 'rm -rf -- "$WORK"' EXIT

git init --bare "$WORK/remote.git" >/dev/null
git --git-dir="$WORK/remote.git" symbolic-ref HEAD refs/heads/master
git clone "$WORK/remote.git" "$WORK/source" >/dev/null 2>&1
git -C "$WORK/source" config user.email test@example.com
git -C "$WORK/source" config user.name Test
git -C "$WORK/source" checkout -b master >/dev/null 2>&1
echo old > "$WORK/source/version"
git -C "$WORK/source" add version
git -C "$WORK/source" commit -m initial >/dev/null
git -C "$WORK/source" push origin master >/dev/null 2>&1
git clone "$WORK/remote.git" "$WORK/app" >/dev/null 2>&1
# The app's "origin" is unreachable: the updater must not depend on it.
git -C "$WORK/app" remote set-url origin "$WORK/does-not-exist.git"
echo new > "$WORK/source/version"
git -C "$WORK/source" commit -am update >/dev/null
git -C "$WORK/source" push origin master >/dev/null 2>&1

mkdir -p "$WORK/bin"
export TEST_REMOTE="$WORK/remote.git"
export TEST_LOG="$WORK/log"
# Redirect the hardcoded GitHub URL to the local test remote.
cat > "$WORK/bin/git" <<'EOF'
#!/usr/bin/env bash
if [ "$1" = fetch ]; then
  case "$3" in
    https://github.com/amromnia/kiosk-complaints.git) exec "$REAL_GIT" fetch --no-tags "$TEST_REMOTE" "$4" ;;
    *) echo "Unexpected fetch source: $3" >&2; exit 1 ;;
  esac
fi
exec "$REAL_GIT" "$@"
EOF
cat > "$WORK/bin/npm" <<'EOF'
#!/usr/bin/env bash
echo "npm $*" >> "$TEST_LOG"
if [ "${FAIL_BUILD:-0}" = 1 ] && [ "$1" = run ]; then exit 1; fi
EOF
cat > "$WORK/bin/pm2" <<'EOF'
#!/usr/bin/env bash
echo "pm2 $*" >> "$TEST_LOG"
EOF
chmod +x "$WORK/bin/git" "$WORK/bin/npm" "$WORK/bin/pm2"
export PATH="$WORK/bin:$PATH"
cd "$WORK/app"

if ! bash "$UPDATER" > "$WORK/success.out" 2>&1; then
  cat "$WORK/success.out" >&2
  exit 1
fi
grep -q '^Update completed successfully\.$' "$WORK/success.out"
test "$(cat version)" = new
grep -q '^npm ci --include=dev$' "$TEST_LOG"
grep -q '^pm2 restart all$' "$TEST_LOG"

echo later > "$WORK/source/version"
git -C "$WORK/source" commit -am later >/dev/null
git -C "$WORK/source" push origin master >/dev/null 2>&1
: > "$TEST_LOG"
if FAIL_BUILD=1 bash "$UPDATER" > "$WORK/failure.out" 2>&1; then
  echo "Expected build failure" >&2; exit 1
fi
if grep -q 'Update completed successfully\|pm2 restart' "$WORK/failure.out" "$TEST_LOG"; then
  echo "Build failure reported success or restarted PM2" >&2; exit 1
fi

echo final > "$WORK/source/version"
git -C "$WORK/source" commit -am final >/dev/null
git -C "$WORK/source" push origin master >/dev/null 2>&1
echo local > version
: > "$TEST_LOG"
if bash "$UPDATER" > "$WORK/conflict.out" 2>&1; then
  echo "Expected conflicting local change to fail" >&2; exit 1
fi
test "$(cat version)" = local
if grep -q 'Update completed successfully\|npm \|pm2 restart' "$WORK/conflict.out" "$TEST_LOG"; then
  echo "Conflicting update continued or reported success" >&2; exit 1
fi
echo "Updater tests passed."
