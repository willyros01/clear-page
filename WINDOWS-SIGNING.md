# Windows direct-download signing

Status: paused at the owner’s request on 11 November 2026. The owner declined the US$9.99/month signing fee. No Azure signing account or certificate profile was created. Do not activate paid Windows signing without a new explicit request. The public Windows installer remains unsigned; the owner found Edge’s Keep option and confirmed the downloaded editor works correctly.

The user chose freely downloadable installers on Cuberoot and explicitly declined Microsoft Store distribution. Browser changes may change the download prompt; Windows can still check downloaded apps when opened. Signing does not promise immediate SmartScreen reputation.

## Required owner setup

1. Sign in to an Azure account with an eligible paid subscription. Microsoft's Basic Artifact Signing service starts around US$9.99/month; confirm the displayed local price before creating the billable resource.
2. Complete Public Trust identity validation and create a Public Trust certificate profile. Canadian individuals are eligible. The owner must complete Microsoft's identity checks; no identity documents belong in GitHub.
3. Create a GitHub OIDC application/federated identity restricted to `repo:willyros01/clear-page:ref:refs/heads/desktop`. Grant only the Artifact Signing Certificate Profile Signer role on the chosen profile.
4. Configure repository variables: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `ATE_ARTIFACT_ENDPOINT`, `ATE_ARTIFACT_ACCOUNT`, `ATE_ARTIFACT_PROFILE`, and `ATE_EXPECTED_PUBLISHER` (the exact certificate Subject after validation). These are resource identifiers, not private keys. No client password or exported signing certificate is used.

## Prepared build

`.github/workflows/windows-signed-build.yml` performs syntax validation on push. Actual cloud signing is manual only and stops if configuration is missing. It installs Microsoft's signature-verified client, signs through Tauri's custom signing hook, verifies publisher and timestamp, installs the setup, checks installed executable signatures and launches the application. It uploads a review artifact and does not publish or change the public download.

Account activation, real signing, installation validation and publication are pending. The existing Cuberoot publisher accepts only the old unsigned manifest, so signed publication must be updated and verified after the first actual signed artifact succeeds. Do not relabel an unsigned installer as signed.

References:
- https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart
- https://learn.microsoft.com/en-us/azure/artifact-signing/how-to-signing-integrations
- https://github.com/Azure/artifact-signing-action
- https://tauri.app/distribute/sign/windows/
