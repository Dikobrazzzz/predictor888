# Gamification (predictor888)

Веб-приложение: прогнозы на события, лидерборд, интеграция с lookup API и Cloudflare Worker. React (Vite) + Go API.

**GitLab:** `marketing/gamification`

## Стек

| Слой | Технологии |
|------|------------|
| Frontend | Vite, React, nginx (`web/Dockerfile`) |
| Backend | Go, `pgx`, HTTP API :8082 |
| БД | PostgreSQL 16 (`api/migrations/`), CNPG в eks-dev |

## Структура

```
api/
web/
cloudflare-worker/
.cicd/deploy/
.cicd/prod/
backup/backup.sh          # справочно (VM compose); в eks-dev бэкап через CNPG
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
| Vault | `eks-dev/marketing/gamification` |
| Образы | `…/gamification:main-<ts>-<sha>`, `…/web:main-<ts>-<sha>` |

Nginx UI: `helm-charts/flux/eks-dev/marketing/gamification-ui/nginx.conf`.

### CI (`main`, push)

Единственная ветка — `main` (легаси `dev`/`new_dev` удалены). Push в `main`:

`docker-build-api` + `docker-build-web` (шаблон `infrastructure/ci-cd` `multi-images-build`, buildx → теги `main-<ts>-<sha>`) → `sync-flux-env-to-helm-charts` → `indicate-k8s-dev`.

Flux ImagePolicy ловит `main-<ts>-<sha>` для api и `/web`; `deploy-prod` (manual) берёт `EXPECTED_BACKEND_IMAGE` + `EXPECTED_UI_IMAGE`.

Доступ к namespace `marketing` (view + logs + `exec`/`port-forward`) — через IAM-группу
`dev-exec-ro-traf`, см. `flux-infra/infrastructure/eks-dev/rbac/README.md`.

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
