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
# Use --chmod so Apache can read files (local macOS perms are often 700)
rsync -av --progress --delete \
  --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r \
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
  ./ "${HOST}:${REMOTE}"

# Ensure docroot itself stays world-traversable
ssh -i "${KEY}" -p "${PORT}" -o IdentitiesOnly=yes "${HOST}" \
  "chmod 755 /home/u566466219/domains/mmsar.au/public_html"

echo "Done: https://mmsar.au/"
echo "Also check: https://mmsar.org.au/ (if it points at the same host)"
