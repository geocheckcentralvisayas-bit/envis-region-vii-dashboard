# Vendored legal normaliser

`buildData.mjs` is a bundle of `src/lib/buildData.ts` from the Legal Dashboards
repository. It is vendored so the ENVIS build does not need the other repo on
disk, and so the numbers in the ENVIS legal tab stay identical to the Legal
Dashboard's own normalisation.

Regenerate after the Legal Dashboard normaliser changes:

```powershell
node node_modules\esbuild\bin\esbuild "F:\EMED PROJECT\Legal Dashboards\src\lib\buildData.ts" `
  --bundle --platform=node --format=esm --target=node18 `
  --outfile=scripts\vendor\legal\buildData.mjs
```

Also refresh the pinned snapshot used by `scripts/build-legal.mjs`:

```powershell
Copy-Item "F:\EMED PROJECT\Legal Dashboards\src\data\snapshot.json" data\legal\snapshot.json
```
