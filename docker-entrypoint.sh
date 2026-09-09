#!/bin/sh
set -e

# If a LOCALE is provided and the localized build exists, copy its files
# into the web root and fix the base href so the app doesn't redirect.
if [ -n "$LOCALE" ] && [ -d "/usr/share/nginx/html/${LOCALE}" ]; then
  cp -a /usr/share/nginx/html/${LOCALE}/. /usr/share/nginx/html/ || true

  if [ -f /usr/share/nginx/html/index.html ]; then
    sed -i "s|<base href=\"/${LOCALE}/\">|<base href=\"/\">|g" /usr/share/nginx/html/index.html || true
    sed -i "s|href=\"/${LOCALE}/\"|href=\"/\"|g" /usr/share/nginx/html/index.html || true
  fi

  LOCALE_PREFIX=""
else
  if [ -n "$LOCALE" ]; then
    LOCALE_PREFIX="${LOCALE}/"
  else
    LOCALE_PREFIX=""
  fi
fi

# Fallback: if index.html is still missing, auto-detect a locale folder (e.g., 'es')
# and flatten it into the root so nginx can serve '/'.
if [ ! -f /usr/share/nginx/html/index.html ]; then
  for d in /usr/share/nginx/html/*; do
    if [ -d "$d" ] && [ -f "$d/index.html" ]; then
      DETECTED_LOCALE=$(basename "$d")
      echo "[info] index.html missing; using detected locale: $DETECTED_LOCALE"
      cp -a "$d/." /usr/share/nginx/html/ || true
      if [ -f /usr/share/nginx/html/index.html ]; then
        sed -i "s|<base href=\"/${DETECTED_LOCALE}/\">|<base href=\"/\">|g" /usr/share/nginx/html/index.html || true
        sed -i "s|href=\"/${DETECTED_LOCALE}/\"|href=\"/\"|g" /usr/share/nginx/html/index.html || true
      fi
      LOCALE_PREFIX=""
      break
    fi
  done
fi

export LOCALE_PREFIX

# Generate nginx config from template (substitutes LOCALE_PREFIX)
envsubst '${LOCALE_PREFIX}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Ensure permissions so nginx can read files copied at runtime
chmod -R 755 /usr/share/nginx/html || true

if [ ! -f /usr/share/nginx/html/index.html ]; then
  echo "[warning] index.html not found in /usr/share/nginx/html"
fi

exec nginx -g 'daemon off;'