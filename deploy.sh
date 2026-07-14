#!/bin/bash
# Deploy mmsar.au to Hostinger via rsync over SSH.
# Requires: ~/.ssh/gha_hostinger (chmod 600)
#
# Protects server-managed paths (.well-known, cgi-bin, .private) from --delete.
set -euo pipefail
cd "$(dirname "$0")"

HOST="u566466219@46.202.196.151"
PORT=65002
KEY="${HOME}/.ssh/gha_hostinger"
REMOTE="/home/u566466219/domains/mmsar.au/public_html/"

if [[ ! -f "$KEY" ]]; then
  echo "Missing SSH key: $KEY"
  exit 1
fi

echo "Deploying MMSAR → ${REMOTE}"
# Avoid -p (perms) — local macOS files are often 700 and break Apache
rsync -rlDv --progress --delete \
  -e "ssh -i ${KEY} -p ${PORT} -o IdentitiesOnly=yes" \
  --exclude='.git' \
  --exclude='.github' \
  --exclude='.DS_Store' \
  --exclude='.gitignore' \
  --exclude='README.md' \
  --exclude='deploy.sh' \
  --exclude='mmsar.zip' \
  --exclude='mmsar/' \
  --exclude='.well-known' \
  --exclude='cgi-bin' \
  --exclude='.private' \
  --exclude='docs' \
  --exclude='images/_preview*' \
  --exclude='images/*.original.*' \
  --exclude='images/*original*' \
  --exclude='data/submissions.json' \
  ./ "${HOST}:${REMOTE}"

# Apache needs world-readable files and executable dirs;
# data/ must be writable by PHP for submissions.json
ssh -i "${KEY}" -p "${PORT}" -o IdentitiesOnly=yes "${HOST}" bash -s <<'REMOTE'
DOC=/home/u566466219/domains/mmsar.au/public_html
chmod 755 "$DOC"
find "$DOC" -type d ! -path '*/.private*' -exec chmod 755 {} \;
find "$DOC" -type f ! -path '*/.private*' -exec chmod 644 {} \;
mkdir -p "$DOC/data" "$DOC/api"
chmod 755 "$DOC/data" "$DOC/api"
# Keep existing submissions if present; seed empty file if missing
if [ ! -f "$DOC/data/submissions.json" ]; then
  echo '[]' > "$DOC/data/submissions.json"
fi
chmod 644 "$DOC/data/submissions.json"
# Ensure PHP can append (same account owns files on Hostinger)
chmod 755 "$DOC/data"
REMOTE

echo "Done: https://mmsar.au/"
echo "Also check: https://mmsar.org.au/ (if it points at the same host)"
