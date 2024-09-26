# Releasing Guide

## Release a new version

1. **Create a branch**
    - `release-X.X.X`
2. **Update version placeholders**
    - [rollup.config.mjs](./rollup.config.mjs): function placeholder
      - for [manifest.json](./manifest.json): version & version_name
3. **Fill notes**
    - [RELEASE_NOTES.md](./RELEASE_NOTES.md)
    - [store/announce.json](./store/announce.json)
4. **Build for production**
    - `npm run prod`
5. **Commit & Push**
    - Ensure to add the new zip
6. **Open PR**
    - [https://github.com/MrSweeter/joorney/pulls](https://github.com/MrSweeter/joorney/pulls)
7. **Wait**: nothing to do next

## Publish

**Prerequisite**: _Release a new version_ (check above)

1. **PR Update**
    - Approvals
    - Squash and merge
2. **Tag the commit**
    - Update & checkout your master branch
    - `git tag X.X.X`
    - `git push origin --tags`
3. **Chrome Web Store**
    - Upload the new zip
    - Send for review
    - Publish
