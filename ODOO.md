# Odoo Supporting Guide

Based on [Odoo Supported Versions](https://www.odoo.com/documentation/master/administration/supported_versions.html), Joorney will follow the same list of supported versions.

⮕ 3 last major versions including intermediary versions

_For certain reasons, Joorney dependant or Odoo dependant, it's still possible that some version will be unsupported before Odoo deprecation._

## Add a new version

1. **Update the code**
    - Update [configuration.js/baseSettings/supportedVersions](./configuration.js)
    - Update [src/utils/version.js](./src/utils/version.js)
    - Update [store/odoo.json](./store/odoo.json)
2. **Test the extension**
    - Test the new version
    - Test all feature basics
3. **Adapt the code** _(if needed)_
    - Adapt the code ⮕ see [Update for a new version](#update-for-a-new-version)
    - Restrict feature to specific version ⮕ [see configuration.js/supported_version in each feature folder](./src/features/)
4. Use your common sense for check/test/use
5. Check [Contributing](./CONTRIBUTING.md)

## Update for a version

1. **Update the code**
    - Write your modification
    - Add a comment before your code, or at any place when Odoo version is used.
        - Format: `[ODOO] pre-operator? version post-operator?`
        - Operator: pre(`<`, `>`), post(`+`)
        - Version: X.X (no `saas-` prefix)
2. **Test the extension**
    - Test the relevant versions
    - Test the other versions
    - Test all feature impacted by your code
3. Use your common sense for check/test/use
4. Check [Contributing](./CONTRIBUTING.md)

## Remove a deprecated version

1. **Search** for comment `[ODOO]`
2. **Identify** the one related to the deprecated version
    - Including intermediary
3. **Update the code**
    - Remove code part used before the deprecation
    - Update [store/odoo.json](./store/odoo.json)
4. **Test the extension**
    - Test the relevant versions
    - Test the other versions
    - Test all feature impacted by your code
5. Use your common sense for check/test/use
6. Check [Contributing](./CONTRIBUTING.md)
