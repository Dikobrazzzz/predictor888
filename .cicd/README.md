# .cicd/

| Путь | Назначение |
|------|------------|
| `deploy/common.yaml` | Несекретный env (eks-dev) |
| `deploy/dev.yaml` | Overlay для dev |
| `prod/` | Шаблоны prod VM (`deploy-prod`) |

CI sync → `helm-charts/flux/eks-dev/marketing/gamification-api-env/env.yaml`.

См. [README.md](../README.md).
