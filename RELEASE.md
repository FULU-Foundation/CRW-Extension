# Releasing

This repo publishes releases from the `release` branch using GitHub Actions.

When you push to `release`, the workflow in `/Users/jdumay/code/CRW-Extension/.github/workflows/cd.yml` will:

- build the Chrome and Firefox extensions
- create zip files for both
- create a GitHub Release
- publish to Chrome Web Store and Firefox AMO (if the required secrets are set)

## Before the first release

Make sure the store listings already exist:

- Chrome Web Store listing
- Firefox Add-ons (AMO) listing

Then add the GitHub Actions secrets in the repo settings.

### Chrome secrets

- `CHROME_EXTENSION_ID`
- `CHROME_CLIENT_ID`
- `CHROME_CLIENT_SECRET`
- `CHROME_REFRESH_TOKEN`

### Firefox (AMO) secrets

- `AMO_API_KEY`
- `AMO_API_SECRET`

Recommended:

- `AMO_EXTENSION_ID` (Gecko add-on ID for the AMO listing)

If a platform's secrets are missing, that publish step is skipped, but the GitHub Release is still created.

## How to cut a release

1. Make sure the changes you want are merged and the branch is ready.
2. Push to `release`.

```shell
git push origin release
```

3. Open the GitHub Actions run (`Build and release extension`) and watch it complete.
4. Verify:
   - lint / typecheck / tests passed
   - GitHub Release was created
   - `chrome-extension.zip` and `firefox-extension.zip` are attached
   - Chrome publish step succeeded (if configured)
   - Firefox publish step succeeded (if configured)

## Version numbers and tags

You do not need to manually bump the extension version for releases.

The workflow stamps the version in CI as:

- `1.0.<run-number>`

It also creates the GitHub Release tag as:

- `v1.0.<run-number>`

Example:

- workflow run `58` produces version `1.0.58` and tag `v1.0.58`

Tag creation is handled by the GitHub Release step (no manual tagging step needed).

## Notes

- The workflow uses the built-in `secrets.GITHUB_TOKEN` to create the GitHub Release/tag. You do not need to create a custom `GITHUB_TOKEN` secret.
- `AMO_EXTENSION_ID` is strongly recommended so Firefox releases keep updating the same AMO listing.
- Re-running the same workflow run will usually fail tag creation because it tries to reuse the same `v1.0.<run-number>` tag.

## Troubleshooting

### Chrome publish step was skipped

One or more `CHROME_*` secrets are missing.

### Firefox publish step was skipped

`AMO_API_KEY` and/or `AMO_API_SECRET` are missing.

### Firefox publish failed due to add-on identity mismatch

Set `AMO_EXTENSION_ID` to the Gecko ID for the AMO listing.

### Tag already exists

Push a new commit to `release` to trigger a new workflow run (and a new run number).
