#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
declare -a FILES=()

add_file() {
  local file="$1"
  [[ -n "$file" ]] || return
  for existing in "${FILES[@]-}"; do
    if [[ "$existing" == "$file" ]]; then
      return
    fi
  done
  FILES+=("$file")
}

for base in ".env" ".env.local" ".env.development" ".env.development.local"; do
  [[ -f "$ROOT/$base" ]] && add_file "$base"
done

shopt -s nullglob
for globbed in "$ROOT"/.env*; do
  file="${globbed#$ROOT/}"
  [[ -f "$globbed" ]] && add_file "$file"
done
shopt -u nullglob

updated=false

python_update() {
  python3 - "$@" <<'PY'
import pathlib
import re
import sys

updated = False
for rel_path in sys.argv[1:]:
    path = pathlib.Path(rel_path)
    if not path.exists():
        continue
    text = path.read_text()
    if 'NEXT_PUBLIC_DEV_AUTH_BYPASS' not in text:
        continue
    new_text, count = re.subn(
        r'^NEXT_PUBLIC_DEV_AUTH_BYPASS\s*=.*$',
        'NEXT_PUBLIC_DEV_AUTH_BYPASS=false',
        text,
        flags=re.MULTILINE,
    )
    if count > 0:
        path.write_text(new_text)
        print(f"[disable-dev-bypass] Updated {path}")
        updated = True

if not updated:
    print("[disable-dev-bypass] Nothing to update")
PY
}

cd "$ROOT"
python_update "${FILES[@]-}"

if grep -R "NEXT_PUBLIC_DEV_AUTH_BYPASS=true" .env* >/dev/null 2>&1; then
  echo "[disable-dev-bypass] Warning: some env files still enable the bypass." >&2
  exit 1
fi

echo "[disable-dev-bypass] Dev auth bypass disabled. Restart dev server to apply."
