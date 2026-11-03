#!/usr/bin/env bash
# 배포 승인 후 실행. 비밀번호를 파일이나 명령 인자로 저장하지 않습니다.
set -euo pipefail
read -r -s -p 'PostgreSQL password: ' todo_db_password
printf '\n' >&2
if [[ -z "$todo_db_password" ]]; then
  echo '비밀번호는 비어 있을 수 없습니다.' >&2
  exit 1
fi
printf '%s' "$todo_db_password" |
  kubectl --context kind-todo-cluster -n todo create secret generic todo-db-secret \
    --from-file=POSTGRES_PASSWORD=/dev/stdin --dry-run=client -o yaml |
  kubectl --context kind-todo-cluster -n todo apply -f -
unset todo_db_password
