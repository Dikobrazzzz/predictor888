# Gamification (predictor888)

Веб-приложение: прогнозы на события, лидерборд, интеграция с lookup API и Cloudflare Worker. React (Vite) + Go API.

**GitLab:** `marketing/gamification`

## Стек

| Слой | Технологии |
|------|------------|
| Frontend | Vite, React, nginx (`web/Dockerfile`, `web/nginx.conf`) |
| Backend | Go, `pgx`, HTTP API :8082 |
| БД | PostgreSQL 16 (`api/migrations/`) |
| Backup (VM) | sidecar `pg_dump`; в k8s — CronJob |

## Структура

```
api/                    # Go backend, migrations/
web/                    # Vite frontend
cloudflare-worker/      # edge worker (опционально)
.cicd/deploy/
.cicd/prod/             # compose, nginx, backup script
backup/ansible/
backup/backup.sh        # дубликат для локальной справки (основной cron в flux-infra)
docker-compose.yml
```

## Локально

```bash
cp .env.example .env
docker compose up --build
# API :8082, web :80
```

## Деплой

| Окружение | Ветка | URL |
|-----------|-------|-----|
| **eks-dev** | `dev` | https://gamification.dev.luckytits.org |
| **VM staging** | `dev` | `gamification.luckytits.org` |
| **VM prod** | `main` | `/opt/gamification-prod` |

---

## Деплой в eks-dev

| Ресурс | Имя |
|--------|-----|
| API | `gamification-api-app` (:8082) |
| UI | `gamification-ui-app` (nginx → API, кэш `/api/live/`) |
| Postgres | `postgresql-gamification` |
| Backup | CronJob `gamification-postgres-backup` → PVC `gamification-backups` |
| Helm env | `flux/eks-dev/marketing/gamification-api-env/` |
| Vault | `eks-dev/marketing/gamification` |
| Образы | `marketing/gamification:dev`, `marketing/gamification/web:dev` |

Nginx для UI: `helm-charts/flux/eks-dev/marketing/gamification-ui/nginx.conf` (upstream `gamification-api-app:8082`).

### CI (`dev`, push)

`build_production` + `build_web_production` → `sync-flux-env-to-helm-charts` → `indicate-k8s-dev` (api + ui).

### Миграции

`api/migrations/` — вручную на `postgresql-gamification` после первого деплоя.

---

## Деплой на VM (legacy)

- **Staging:** [`backup/ansible/deploy.yml`](backup/ansible/deploy.yml)
- **Prod:** Vault `pve-prod/marketing/gamification`, [`.cicd/prod/extra-tasks.yml`](.cicd/prod/extra-tasks.yml), backup container из [`.cicd/prod/files/backup/`](.cicd/prod/files/backup/)

---

## Переменные

| Переменная | Где |
|------------|-----|
| `DATABASE_URL`, `SESSION_SECRET`, `LOOKUP_API_KEY` | Vault |
| `PORT`, `GOMAXPROCS`, `CF_WORKER_URL`, `LOOKUP_API_URL` | `.cicd/deploy/common.yaml` |

## Связанные репозитории

- `infrastructure/flux-infra` → `apps/eks-dev/marketing/gamification-*`
- `infrastructure/prod-deploy`
