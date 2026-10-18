# Deployment notes — Vercel / Railway

This file documents quick fixes for CI environment issues observed during the build (warnings about `cache-dir` and deprecated packages), and the steps to resolve them in Vercel / Railway.

## Fix: Unknown env config "cache-dir"

Symptom in CI logs:

  npm warn Unknown env config "cache-dir". This will stop working in the next major version of npm.

Cause:
- A CI environment variable `NPM_CONFIG_CACHE_DIR` (or `cache-dir`) has been set in the build environment. When npm reads environment variables that map to npm config keys that don't exist (like `cache-dir`), it emits this warning.

Resolution (choose one, recommended #2):

1) Remove the variable from Vercel / Railway project settings
   - Vercel:
     - Project → Settings → Environment Variables
     - Find and remove `NPM_CONFIG_CACHE_DIR` (or any `cache-dir` var)
   - Railway:
     - Service → Variables → remove any `NPM_CONFIG_CACHE_DIR` or `cache-dir`

2) (Recommended) Unset the var in the build environment so npm stops warning
   - On Vercel: remove the env entry as shown above.
   - On Railway: remove the env entry.

3) Workaround (if you cannot remove the env var):
   - This repo cannot suppress the warning before npm reads its env — the build platform is the only way to remove the warning. If removal is impossible, the warning itself is harmless; it will not fail the build unless other fatal errors occur.

## Next steps after fix
1. Re-run CI / redeploy. Typical commands run by platform:
   - install deps: `npm install`
   - build: `npm run build`
2. If there are still build failures after the env var fix, collect the CI build log and open an issue/PR for the failing error (I can help fix code-level problems).

## Other recommendations to keep the repo healthy
- Enable Dependabot or Renovate to keep dependencies up-to-date and reduce security warnings.
- Run `npm audit` regularly and address high severity items.

## If you want me to act
- I cannot edit Vercel or Railway project settings from this repository — you'll need to remove the env var in the project UI or grant me explicit CI admin access.
- I can:
  - Open a PR adding this DEPLOYMENT.md to the repo (done now).
  - Add Dependabot config (I can add this file in a follow-up commit).
  - Continue fixing repo-level issues (I already updated package.json for Next.js and type package names).

If you want, reply `remove-var` after you remove the env var from the CI settings and I will re-run the build checks here and proceed with any remaining fixes; or reply `i-grant-access` and provide the CI admin details (not recommended; prefer removing the var yourself).
