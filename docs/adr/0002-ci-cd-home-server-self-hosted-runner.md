# CI/CD deploys to the home-server via a self-hosted runner — no SSH, no registry, no auto-rollback

**Status**: accepted (2026-07-13)

`docs/tasks/setup/05-scale-infra/06-cicd.md` (TASK-308) describes an aspirational pipeline: lint → test → security scan → build & package → **staging** deploy → e2e validation → **production** release, with Slack/email notifications. The actual infrastructure today is a single home-server (`docker-compose.prod.yml` + `docker-compose.home.yml`, ngrok tunnel, self-hosted MinIO, no VPS, no public IP anywhere). An earlier version of this ADR assumed a VPS reachable by SSH from a GitHub-hosted runner; there is no VPS, so that design was replaced with this one.

- **Self-hosted GitHub Actions runner on the home-server machine itself**, not SSH from a GitHub-hosted runner. The home PC has no public IP and no inbound port open (that's the entire reason it sits behind ngrok) — a cloud-hosted runner cannot reach it. A self-hosted runner instead polls outbound to GitHub for jobs, the same direction ngrok already tunnels in. It's installed as a Windows service so it survives reboots without a logged-in session.
- **A dedicated deploy clone**, `D:\my-doc\project\deploy-be-nest-ecom`, separate from any working copy used for day-to-day development on the same machine. The deploy job does `git fetch && git reset --hard origin/main` every run; pointing that at a developer's normal working directory would silently blow away uncommitted work on whatever branch happened to be checked out there.
- **Build in place on the home-server**, not build-on-runner + push to a registry — the self-hosted runner *is* the deploy target, so there's no separate machine to push an image to. The CD job runs `docker compose -f docker-compose.prod.yml -f docker-compose.home.yml up -d --build app`, the same command already documented for manual redeploy in `docs/DEPLOYMENT-HOME.md`.
- **No staging environment, no security scan, no Slack/email notification.** Single-machine demo project — GitHub's own PR/Actions UI is enough signal for now.
- **Auto-migration, no auto-rollback.** After the `app` container reports healthy, the pipeline runs `prisma migrate deploy` automatically. If the healthcheck never turns healthy, the job fails loudly (exits non-zero, dumps container logs) but does **not** revert to the previous commit/image — that stays a manual intervention on the machine.

**Why**: matching TASK-308's full staging/registry/security-scan shape now would build infrastructure the project doesn't have a use for yet, and there's no VPS to make the original SSH-based design possible in the first place. The self-hosted-runner approach is the only one that can reach this machine at all without opening an inbound port (which would defeat the point of using ngrok).

**Consequences**:

- The runner must stay online for deploys to happen — if the home PC is off or the service stops, a merge to `main` will show the `deploy` job queued/failed until the runner is back.
- Deploying a bad commit still takes down `app` until someone fixes/reverts it on the machine directly — there is no blue/green or automatic previous-image fallback.
- Two clones of the repo now exist side-by-side on the same machine (dev working copy vs. `deploy-be-nest-ecom`) — `.env.production` and the rendered `nginx/conf.d/app.conf` live only in the deploy clone and are not tracked by git, so they need to be recreated there manually if that clone is ever deleted and re-cloned.
- Getting a VPS later means reverting to something closer to the original SSH-based design (see git history of this ADR) rather than reusing the self-hosted runner — the two approaches don't compose, they're alternatives.
