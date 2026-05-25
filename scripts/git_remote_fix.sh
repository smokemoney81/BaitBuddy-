#!/usr/bin/env bash
set -euo pipefail

REMOTE_URL_HTTPS="https://github.com/smokemoney81/BaitBuddy-.git"
REMOTE_URL_SSH="git@github.com:smokemoney81/BaitBuddy-.git"

printf "[1/5] Prüfe Git-Repo...\n"
git rev-parse --is-inside-work-tree >/dev/null

printf "[2/5] Setze/aktualisiere origin (HTTPS)...\n"
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE_URL_HTTPS"
else
  git remote add origin "$REMOTE_URL_HTTPS"
fi

git remote -v

printf "[3/5] DNS/Netzwerktest zu github.com...\n"
if getent hosts github.com >/dev/null 2>&1; then
  echo "DNS ok"
else
  echo "DNS FEHLER: github.com nicht auflösbar"
fi

printf "[4/5] Test HTTPS remote...\n"
if git ls-remote --heads origin >/dev/null 2>&1; then
  echo "HTTPS ok"
else
  echo "HTTPS fehlgeschlagen (Proxy/Firewall/Auth möglich)."
fi

printf "[5/5] Fallback auf SSH testen...\n"
git remote set-url origin "$REMOTE_URL_SSH"
if git ls-remote --heads origin >/dev/null 2>&1; then
  echo "SSH ok. Du kannst pushen mit: git push -u origin work"
else
  echo "SSH fehlgeschlagen. Prüfe SSH-Key + Netzwerkzugriff."
fi
