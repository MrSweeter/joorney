# Joorney Privacy Policy

Last updated: November 12, 2026

Joorney is a Chrome extension that adds features and visual effects to Odoo web pages. It has no analytics or tracking, and it does not sell, rent or share your data.

## Data the extension uses

-   **Pages you visit**: Joorney reads the address of the current tab and checks the page for an Odoo session (`odoo.__session_info__`). That is how it knows whether you are on Odoo, which Odoo version it is, and which features to turn on. This information is only used inside your browser. On pages that aren't Odoo, Joorney does nothing.
-   **Odoo data**: on Odoo pages, Joorney calls the Odoo site you are on, logged in as you, to do what you ask (open menus, read record information, assign a task to you, pin messages, show badges). These requests go only to that Odoo site.
-   **Cookies**: only the Theme Switch feature uses cookies. It reads and writes `color_scheme` and `configured_color_scheme` on the Odoo site.
-   **Location**: only for Theme Switch's automatic dark mode. Joorney gets your location only when you click the location button in its settings, or you can type the coordinates in yourself.

## Storage

-   **Synced storage** (your Chrome profile syncs it through Google):
    -   feature settings;
    -   the Odoo site addresses you add, and which features are on for each;
    -   the Odoo menu paths and app identifiers you choose;
    -   the Theme Switch coordinates;
    -   your custom CSS and image addresses.
-   **Local storage** (stays on your device):
    -   a cache of Odoo responses, kept separately for each site and user. An entry is deleted after 12 hours without use, or when you click "Clear cache" in the right-click menu;
    -   the sites you switched off with the keyboard shortcut;
    -   announcements you dismissed;
    -   today's sunrise and sunset times;
    -   your progress in the onboarding checklist.
-   **Settings export**: the file you export includes your Odoo site addresses and coordinates.

## External requests

| Service                                                                                                          | When                                     | Data sent                     |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------- |
| The Odoo site you are using                                                                                      | When you use a Joorney feature on it     | Requests made with your own Odoo session |
| [SunriseSunset.io](https://sunrisesunset.io)                                                                     | Theme Switch with location, at most once a day | Latitude and longitude |
| raw.githubusercontent.com                                                                                        | At startup and when you open the options | None (public version and announcement data) |
| www.odoo.com                                                                                                     | At startup, at most once every 30 days   | None (public Odoo Experience event dates) |
| cdnjs.cloudflare.com, fonts.googleapis.com                                                                       | When you open the popup or options       | None (styles and fonts)       |
| i.imgur.com, media.tenor.com, github.githubassets.com, static.wikia.nocookie.net, or any image address you enter | Default images in loading and focus effects | None (images) |

As with any website, these services see your IP address.

## Chrome permissions

-   `tabs`: read the current tab's address and open or reload tabs (runbot links, address-bar shortcuts, reload after a setting change).
-   `webNavigation`: notice page changes inside Odoo so features update, and open runbot builds with the admin login.
-   `cookies`: read and write the Odoo theme cookies (Theme Switch).
-   `storage`: keep your settings and the cache described above.
-   `contextMenus`: add right-click shortcuts to Odoo menus, runbot, "Clear cache" and the options.
-   `webRequest`: notice when Odoo message requests finish, so pinned messages refresh (Pin Message). No requests are blocked or changed.
-   Access to all `http` and `https` sites: Odoo can run on any domain, including self-hosted and local ones.

## Keeping and deleting data

Your data stays stored while Joorney is installed. To delete it, clear the cache from the right-click menu, clear the extension's storage in Chrome, or uninstall Joorney.

## Contact

Vanden Bergh Gaëtan (MrSweeter). Questions and requests: [GitHub issues](https://github.com/MrSweeter/joorney/issues).

This policy is updated whenever Joorney changes what data it uses, and the date above changes with it.
