/**
 * Build identity, injected at compile time by `vite.config.ts`.
 *
 * The version comes from `package.json`; the build number and commit are
 * supplied by GitHub Actions on every push, so each deployment is traceable
 * from the app, the Actions run and the generated GitHub release.
 */
export const APP_VERSION = __APP_VERSION__;
export const BUILD_NUMBER = __APP_BUILD__;
export const COMMIT_SHA = __APP_COMMIT__;
export const BUILT_AT = __APP_BUILT_AT__;

export const VERSION_LABEL = BUILD_NUMBER ? `v${APP_VERSION} · build ${BUILD_NUMBER}` : `v${APP_VERSION} · dev`;

export const REPO_URL = 'https://github.com/geocheckcentralvisayas-bit/envis-dashboard-region-vii';
export const RELEASES_URL = `${REPO_URL}/releases`;
export const ACTIONS_URL = `${REPO_URL}/actions`;
export const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`;
export const EMB_R7_URL = 'https://r7.emb.gov.ph/';
