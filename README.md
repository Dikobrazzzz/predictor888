# Gamification (predictor888)

Веб-приложение: прогнозы на события, лидерборд, интеграция с lookup API и Cloudflare Worker. React (Vite) + Go API.

**GitLab:** `marketing/gamification`

## Стек

| Слой | Технологии |
|------|------------|
| Frontend | Vite, React, nginx (`web/Dockerfile`) |
| Backend | Go, `pgx`, HTTP API :8082 |
| БД | PostgreSQL 16 (`api/migrations/`) |
| Backup (k8s) | CronJob в `flux-infra` |

## Структура

```
api/
web/
cloudflare-worker/
.cicd/deploy/
.cicd/prod/
backup/backup.sh          # справочно; cron в flux-infra
docker-compose.yml
```

## Локально

```bash
cp .env.example .env
docker compose up --build
```

## Деплой

| Окружение | Ветка | URL |
|-----------|-------|-----|
| **eks-dev** | `main` | https://gamification.dev.luckytits.org |
| **VM prod** | `main` | `/opt/gamification-prod` |

---

## eks-dev

| Ресурс | Имя |
|--------|-----|
| API | `gamification-api-app` |
| UI | `gamification-ui-app` |
| Postgres | `postgresql-gamification` |
| Backup | CronJob → PVC `gamification-backups` |
| Vault | `eks-dev/marketing/gamification` |
| Образы | `…/gamification:main`, `…/web:main` |

Nginx UI: `helm-charts/flux/eks-dev/marketing/gamification-ui/nginx.conf`.

### CI (`main`, push)

`build_production` + `build_web_production` → `sync-flux-env` → `indicate-k8s-dev`.

Миграции: `api/migrations/` на `postgresql-gamification`.

---

## VM production

Vault `pve-prod/marketing/gamification`, [`.cicd/prod/`](.cicd/prod/), backup в compose.

---

## Переменные

| Переменная | Где |
|------------|-----|
| `DATABASE_URL`, `SESSION_SECRET`, `LOOKUP_API_KEY` | Vault |
| `PORT`, `GOMAXPROCS`, `CF_WORKER_URL`, `LOOKUP_API_URL` | `.cicd/deploy/common.yaml` |

## Связанные репозитории

- `infrastructure/helm-charts`, `infrastructure/flux-infra`
