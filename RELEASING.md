# Releasing Guide

A release is prepared on a branch, merged, tagged, and only then uploaded to the Chrome Web Store.
The zip on the store must always come from the tagged commit on `master`.

## Versions

-   `version` is `X.Y.Z.<build>`. The build number is the build date (`YYDDD`, year and day of year),
    set by `npm run prod`: rebuilding on another day gives another version.
-   `version_name` is `X.Y.Z.<minimal Odoo version>`, e.g. `2.7.0.17`. It is the version users see.
-   `X.Y.Z` follows semantic versioning: patch for fixes, minor for features or new Odoo versions,
    major for breaking changes.
-   The Chrome Web Store only accepts a version higher than the published one, and a published
    version can never be reused: a change after upload means a new build.

## Prepare a release

1. **Create a branch** from an up-to-date `master`
    - `release-X.Y.Z`
2. **Update the version**
    - [manifest.json](./manifest.json): `version` and `version_name` (keep the `%BUILD%`,
      `%MINIMAL_ODOO_VERSION%` and `%ENV_SUFFIX%` placeholders)
    - Supported Odoo versions, if they changed: [store/odoo.json](./store/odoo.json)
3. **Fill the notes**
    - [RELEASE_NOTES.md](./RELEASE_NOTES.md): every user-facing change
    - [store/announce.json](./store/announce.json): a new entry keyed by `version_name`, with a new `hash`
    - [CHROMEWEBSTORE.md](./CHROMEWEBSTORE.md): "Last Updated", "What's new", the feature list,
      and a Version History row with status _Draft_
    - If `manifest.json` permissions changed: the Permissions Justification in CHROMEWEBSTORE.md
    - If the data the extension uses or sends changed: [PRIVACY.md](./PRIVACY.md) and the
      privacy section of CHROMEWEBSTORE.md
4. **Lint** with the project's Biome version (not a global one)
    - `npm ci`
    - `npm run lint`
5. **Build for production**
    - `npm run prod`
    - The new zip is in `store/artefacts/`. Zips of other versions must stay unchanged (`git status`).
6. **Check the zip**
    - its `manifest.json` has the expected `version` and `version_name`, without `-dev`
    - it contains only the built extension: no source maps, Markdown, `node_modules` or `.git`
7. **Smoke test the zip**
    - Unzip it, load it unpacked (`chrome://extensions`, developer mode)
    - On the oldest and newest supported Odoo: popup, options page, the changed features,
      and no errors in the service worker console
8. **Update the store screenshots** if the UI changed
    - Start an Odoo of the newest supported version, then
      `npm run screenshots -- --url <odoo url>` (first time: `npx playwright-core install chromium`)
    - Check the images in `store/assets/`; update their status in CHROMEWEBSTORE.md
9. **Commit & push**
    - One commit `[REL] X.Y.Z` with the release files and the new zip
10. **Open a PR**
    - [https://github.com/MrSweeter/joorney/pulls](https://github.com/MrSweeter/joorney/pulls)

## Publish

**Prerequisite**: _Prepare a release_ (above). Never upload a build that isn't merged.

1. **Merge the PR**
    - Approvals
    - Squash and merge
2. **Tag the merged commit**
    - `git checkout master && git pull`
    - `git tag X.Y.Z`
    - `git push origin X.Y.Z` (only this tag, not local helper tags)
3. **Check the links of the listing**
    - The privacy policy URL loads and matches [PRIVACY.md](./PRIVACY.md)
    - The homepage and support URLs load
4. **Chrome Web Store**
    - Upload the zip of the tagged commit (`store/artefacts/joorney_X-Y-Z-<build>.zip`)
    - Store listing: paste the description from CHROMEWEBSTORE.md; replace the screenshots if
      they changed
    - Privacy practices: check that they match CHROMEWEBSTORE.md
    - Send for review. To choose the publication moment, turn off automatic publishing and
      publish by hand once approved.
5. **After publication**
    - In CHROMEWEBSTORE.md, set the Version History status to _Published_ (commit on `master`)

## If the review rejects the release

1. Note the reason in the Rejection History of CHROMEWEBSTORE.md.
2. Fix it on `master` through a new PR. Listing-only issues (text, screenshots, privacy
   practices) can be fixed in the dashboard without a new build.
3. Code changes need a new build: a new build number, or a patch version `X.Y.Z+1`,
   tagged and uploaded like any release.

## Fix a published release

The store doesn't roll back. Fix forward: release a patch version `X.Y.Z+1` from `master`.
