# backup/

| Путь | Назначение |
|------|------------|
| `ansible/` | Staging deploy (`deploy_dev`) |
| `backup.sh` | Скрипт pg_dump (на VM — sidecar; в k8s — CronJob в flux-infra) |

См. [README.md](../README.md).
