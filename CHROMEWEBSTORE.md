# Chrome Web Store Listing: Joorney

> Last Updated: 2026-11-12

## Store Listing

**Extension Name**

Joorney

**Short Description** (125/132 characters; must match `description` in `manifest.json`)

Improve your Odoo Journey! Makes your Odoo experience more enjoyable and productive by adding some cool features and effects.

**Detailed Description** (plain text; paste as is)

```text
Joorney adds productivity shortcuts and visual effects to Odoo, for people who use Odoo every day: users, consultants and developers.

FEATURES
• Assign Me: one click assigns you to a task, Helpdesk ticket or other record.
• Follow/Unfollow: follow or unfollow a record from the chatter header.
• Pin Message: pin and unpin chatter messages in one click.
• Tooltip Metadata: hover over the debug icon to see the current record's metadata.
• Context Odoo Menus: open your favorite Odoo menus from the right-click menu.
• Server Action Code: new server actions open with the "Execute Code" type already set.
• Show My Badge: shows a user's badges on their user card.
• Theme Switch: switches Odoo between light and dark mode on a schedule, or at sunrise and sunset where you are.
• Unfocus Apps: hide apps you rarely use from the Odoo home menu with the star next to each app.
• Awesome CSS: apply your own CSS to Odoo sites.
• Awesome Loading: replace the Odoo loading indicator with an image of your choice.
• Stars Effect: an animation when you set a priority star.
• Ambient: seasonal and event effects on the Odoo home menu.
• For runbot users: open a runbot build for a given version, log in as admin in debug mode, or impersonate a user.

HOW TO USE
1. Install Joorney and open its options page.
2. Turn on the features you want. Every feature is off by default.
3. Add your Odoo sites to allow or block features per site.
4. Use the toolbar popup to switch features on the current Odoo page, or press Alt+Shift+F to turn Joorney off for the current site.

COMPATIBILITY
Odoo 17.0 and later, including Odoo 20.0. Odoo 16 is no longer supported.

PRIVACY
Joorney has no analytics or tracking and never sells your data. Your settings are stored in your Chrome profile. Odoo data is only exchanged with the Odoo site you are using, under your own session. Your location is used only if you turn on sunrise/sunset dark mode. Full policy: https://mrsweeter.github.io/joorney/privacy-en.html

PERMISSIONS
"Read and change all your data on all websites": Odoo can run on any domain, including self-hosted and local ones. Joorney checks whether a page is Odoo and does nothing on other sites.

SUPPORT
Website and feature guide: https://mrsweeter.github.io/joorney/
Bug reports and ideas: https://github.com/MrSweeter/joorney/issues

What's new in 2.7.0: Odoo 20 support, "Assign Me" on Helpdesk tickets, Odoo data shown by Joorney is now escaped, more reliable background, context menu and notifications, and bug fixes. Odoo 16 is no longer supported.
```

**Category**: Developer Tools

**Single Purpose**

Adds productivity features and visual effects to Odoo web pages.

**Primary Language**: English

## Graphics & Assets

| Asset              | Dimensions | Status          | Filename                                    |
| ------------------ | ---------- | --------------- | ------------------------------------------- |
| Store Icon         | 128×128    | ✅ Ready        | `images/icon_128.png`                       |
| Screenshot 1       | 1280×800   | ✅ Ready        | `store/assets/screenshot_0-1280-800.png`    |
| Screenshot 2       | 1280×800   | 🟡 Needs update | `store/assets/screenshot_1-1280-800.png`    |
| Screenshot 3       | 1280×800   | 🟡 Needs update | `store/assets/screenshot_2-1280-800.png`    |
| Screenshot 4       | 1280×800   | 🟡 Needs update | `store/assets/screenshot_3-1280-800.png`    |
| Small Promo Tile   | 440×280    | ✅ Ready        | `store/assets/promotionals-440-280.png`     |
| Marquee Promo Tile | 1400×560   | ✅ Ready        | `store/assets/marquee-1400-560.png`         |

### Screenshot Notes

-   **1 (brand)**: the logo and feature icons. Still accurate.
-   **2 (Host Access Control)**: an old options page. It shows "Awesome Loading Large" and "Save Knowledge", which are disabled since 2.7.0, and none of the newer features (Pin Message, Context Odoo Menus, Follow/Unfollow, Ambient).
-   **3 (Instant Feature Toggle)**: the popup still shows "Awesome Loading Large".
-   **4 (Across Odoo Versions)**: the table covers 15.0 to 17.1, but 2.7.0 supports 17.0 to 20.0. This one is the most misleading.
-   Retake 2 to 4 on Odoo 19/20 with the 2.7.0 build. These can be updated in the dashboard after publishing; this doesn't block the 2.7.0 submission.

## Permissions Justification

| Permission         | Type             | Justification |
| ------------------ | ---------------- | ------------- |
| `tabs`             | permissions      | Reads the active tab's address to know which Odoo site and features apply (toolbar popup, context menu, keyboard shortcut). Opens and updates tabs for the "joorney" address-bar keyword and the runbot shortcuts. Reloads the Odoo tab after the user changes a theme or feature setting. |
| `webNavigation`    | permissions      | Odoo is a single-page app. Joorney listens to in-app navigation (history and hash changes) to re-apply the user's features on the new view. It also notices when a runbot build page opens, so it can log in as admin in debug mode when the user asked for it. |
| `cookies`          | permissions      | Used only by Theme Switch: it reads and writes Odoo's `color_scheme` and `configured_color_scheme` cookies on the current Odoo site to switch between light and dark mode. No other cookie is read. |
| `storage`          | permissions      | Saves the user's feature settings, per-site rules and context-menu shortcuts (synced storage), plus a short-lived local cache of Odoo responses, the sunrise/sunset times and dismissed announcements. |
| `contextMenus`     | permissions      | Adds right-click shortcuts on Odoo pages: open user-chosen Odoo menus, open runbot, clear Joorney's cache, open the options. |
| `webRequest`       | permissions      | Only watches the user's own Odoo site for chatter message requests (star, edit, load a thread) finishing, so Pin Message can refresh pinned messages. Only the status code is read. Nothing is blocked, redirected or changed. |
| `http://*/*`, `https://*/*` | host_permissions | Odoo runs on any domain (odoo.com, self-hosted, localhost, runbot), so the list of sites can't be fixed in advance. The content script checks whether the page is a logged-in Odoo page and does nothing on other sites. Users can limit Joorney to chosen sites with the per-site allow/block lists. |

Also declared (no justification field in the dashboard): `omnibox` (the "joorney" keyword) and `commands` (Alt+Shift+F turns Joorney off or on for the current site).

## Privacy & Data Use

The audit was done on 2026-11-12 on `release-2.7.0`. It found no analytics, no telemetry, no remote code and no `eval`.

### Data Collection

**Does the extension collect user data?** Yes. Only location is sent to a third party, and only when the user turns it on.

| Data Type                    | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
| ---------------------------- | ---------- | ----------------------- | ------- | -------------------------- |
| Personally identifiable info | No         | No                      | Not stored. Odoo user names and emails only appear in the user's own Odoo responses. | No |
| Health info                  | No         | No                      |  | No |
| Financial info               | No         | No                      |  | No |
| Authentication info          | No         | No                      | Odoo calls rely on the browser sending the user's own session cookie. Joorney never reads or stores credentials. | No |
| Personal communications      | No         | No                      | Pin Message works on chatter messages on the user's Odoo site, and nothing is kept outside it. | No |
| Location                     | **Yes**    | **Yes**                 | Theme Switch sunrise/sunset dark mode, only after the user clicks "get location" or types in coordinates. | **Yes**: latitude and longitude go to SunriseSunset.io, at most once a day |
| Web history                  | **Yes**    | Google Sync only        | The Odoo site addresses the user adds for per-site rules are kept in synced storage. | No |
| User activity                | No         | No                      |  | No |
| Website content              | **Yes**    | No                      | A local cache of Odoo responses (actions, task, menu and badge data), kept per site and user and deleted after 12h without use. | No |

> ⚠️ Check these three ticks against the answers already given for 2.6.0. "Website content" is local only; tick it if you read the CWS definition as covering locally held data, otherwise leave it unticked and keep the explanation in PRIVACY.md.

### Data Use Certification

-   [x] Data is NOT sold to third parties
-   [x] Data is NOT used for purposes unrelated to the extension's core functionality
-   [x] Data is NOT used for creditworthiness or lending purposes

### External hosts contacted

| Host | Data sent | When |
| ---- | --------- | ---- |
| api.sunrisesunset.io | latitude and longitude | Theme Switch in location mode |
| raw.githubusercontent.com | none | `store/odoo.json`, `store/announce.json` |
| www.odoo.com | none (public event search) | every background start, cached 30 days |
| cdnjs.cloudflare.com, fonts.googleapis.com | none | popup and options CSS and fonts |
| i.imgur.com, media.tenor.com, github.githubassets.com, static.wikia.nocookie.net | none | default images (Awesome Loading, Unfocus Apps) |

## Privacy Policy

**Privacy Policy URL**: https://mrsweeter.github.io/joorney/privacy-en.html

That page redirects to [`PRIVACY.md`](./PRIVACY.md), served from https://github.com/MrSweeter/joorney/blob/master/PRIVACY.md. Both are live only once the release is merged into `master`. Check the URL before you send for review.

## Distribution

**Visibility**: Public
**Regions**: All regions

## Developer Info

**Publisher Name**: Vanden Bergh Gaëtan (MrSweeter)

**Contact Email**: the email on the CWS developer account (shown on the listing, so it must be one you read)

**Support URL**: https://github.com/MrSweeter/joorney/issues

**Homepage URL**: https://mrsweeter.github.io/joorney/?style=odoo

## Version History

| Version             | Date       | Changes | Status |
| ------------------- | ---------- | ------- | ------ |
| 2.7.0.26316 (2.7.0.17) | 2026-11-12 | Odoo 20 support; Odoo 16 dropped (Awesome Loading Large and Save Knowledge disabled); Assign Me on Helpdesk; Odoo data escaped; background, context menu and notification fixes | Draft |
| 2.6.0 (2.6.0.16)    | 2026-07-12 | New feature: Follow/Unfollow; memory optimization; bug fixes | Published |
| 2.5.0 (2.5.0.16)    | n/a        | Odoo 19+ | Never published |
| 2.4.1 (2.4.1.16)    | 2025-06-26 | Bug fixes, Odoo 18.4 | Published |
| 2.4.0 (2.4.0.16)    | 2025-06-19 | Stars Effect on every priority widget; Odoo 18.2 and 18.3 | Published |
| 2.3.4 (2.3.4.16)    | 2025-02-14 | Bug fixes | Published |
| 2.3.3 (2.3.3.16)    | 2025-01-28 | Odoo development (master) support | Published |
| 2.3.2 (2.3.2.16)    | n/a        | Odoo saas-18.1 | Published |
| 2.3.1 (2.3.1.16)    | n/a        | UX/UI improvements | Published |
| 2.3.0 (2.3.0.16)    | n/a        | Odoo 18 | Published |
| 2.3.0 (2.3.0.15)    | n/a        | New feature: Ambient | Published |
| 2.2.0               | n/a        | New feature: Pin Message | Published |
| 2.1.3               | n/a        | Theme Switch improvements | Published |
| 2.1.2               | n/a        | Window Actions endpoint | Published |
| 2.1.1               | n/a        | Tooltip Metadata improvements | Published |
| 2.1.0               | n/a        | Public release | Published |

See [RELEASE_NOTES.md](./RELEASE_NOTES.md) for details.

## Review Notes

### Pre-publish checklist for 2.7.0

-   [x] Manifest V3. `version` 2.7.0.26316 is higher than the published 2.6.0, and `version_name` is 2.7.0.17 (no `-dev`)
-   [x] Permissions and host permissions unchanged since 2.6.0, so no new justification is needed
-   [x] The zip contains only `bundle/`: no source maps, `node_modules`, `.git`, or Markdown files
-   [x] No remote code: no `eval` or `new Function`, and dynamic imports load only bundled files
-   [x] Code is minified, not obfuscated
-   [x] Privacy policy updated to match the code (see PRIVACY.md)
-   [ ] Privacy URL live after the merge into master
-   [ ] Screenshots 2 to 4 out of date (see Graphics); can be done after publishing
-   [ ] `npx biome check .`: 6 formatting-only errors (`store/odoo.json`, `gh-page/configuration.js`, `options/pages/toast/index.js`, `impersonateLoginRunbot/content.js`, `followUnfollow/configuration.js` and `content.js`); none in what ships to users
-   [ ] Load the zip unpacked once and smoke-test on Odoo 17 and 20

### Follow-ups for the next release

-   Fetch the www.odoo.com event dates (`background/index.js:105` → `src/api/odoo.js:281`) only when Ambient is on.
-   Register the `webRequest` listener (`background/src/request.js`) only when Pin Message is on.
-   Test whether `tabs` is still needed: host access covers http(s) tab URLs, and the only gap is `src/generic/popup.js:62` (extension page URLs).
-   Bundle the popup and options CSS and fonts instead of loading them from cdnjs and Google Fonts.
-   Announcements fetched from GitHub are inserted as HTML in the options page (`options/index.js:113,119`). Insert them as text.

### Known Issues / Limitations

-   Joorney needs host access to every site because Odoo runs on arbitrary domains. If a reviewer flags it, point to the per-site allow/block lists and the check that only acts on Odoo pages.
-   The name "Odoo" appears in the listing to describe what Joorney works with. Joorney is not an official Odoo product.

### Rejection History

None recorded.
