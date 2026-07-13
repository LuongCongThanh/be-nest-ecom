# CI/CD deploys to VPS only, in-place via SSH — no registry, no auto-rollback

**Status**: accepted (2026-07-13)

`docs/tasks/setup/05-scale-infra/06-cicd.md` (TASK-308) describes an aspirational pipeline: lint → test → security scan → build & package → **staging** deploy → e2e validation → **production** release, with Slack/email notifications. The actual infrastructure today is a single VPS (`docker-compose.prod.yml`) plus a separate home-server overlay (`docker-compose.home.yml`, ngrok tunnel, no public IP). We implemented a smaller pipeline instead:

- **VPS only.** The home-server target has no public IP — a GitHub-hosted runner can't SSH into it directly, and standing up a self-hosted runner there just to close that gap isn't justified yet. Home-server deploys stay manual per `docs/DEPLOYMENT-HOME.md`.
- **Build in place on the VPS**, not build-on-runner + push to a registry. The CD job SSHes in, `git pull`s, and runs `docker compose -f docker-compose.prod.yml up -d --build app` — the same steps already documented for manual redeploy in `docs/DEPLOYMENT.md`. This skips GHCR/Docker Hub entirely; the trade-off is the VPS's own CPU/RAM pays the build cost instead of the runner's.
- **No staging environment, no security scan, no Slack/email notification.** Single-VPS demo project — GitHub's own PR/Actions UI is enough signal for now.
- **Auto-migration, no auto-rollback.** After the `app` container reports healthy, the pipeline runs `prisma migrate deploy` automatically. If the healthcheck never turns healthy, the job fails loudly (exits non-zero, dumps container logs) but does **not** revert the VPS to the previous commit/image — that stays a manual SSH intervention.

**Why**: matching TASK-308's full staging/registry/security-scan shape now would build infrastructure (a second environment, an image registry, scan tooling) the project doesn't have a use for yet. The smaller pipeline still removes the manual SSH step for the common case (`git pull` + rebuild + migrate) while keeping the failure mode simple: red build, human investigates.

**Consequences**:

- Deploying a bad commit still takes down `app` until someone SSHes in and fixes/reverts it — there is no blue/green or automatic previous-image fallback.
- Moving to registry-based (immutable) deploys later requires: pushing images to GHCR from the CI job, changing `docker-compose.prod.yml`'s `app` service from `build:` to `image:`, and changing the CD script from `git pull && build` to `docker pull && up -d` — a real migration, not a config toggle.
- Automating home-server deploys later requires a self-hosted GitHub Actions runner running on that machine (it can poll out to GitHub without any inbound port), which is a separate follow-up, not something this pipeline does today.
