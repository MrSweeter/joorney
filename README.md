# Odoo - Quality of Life & Fun - Extension

---

## Installation Guides

### On Chrome:

-   Clone the repo anywhere (with a terminal)
    -   git clone https://github.com/MrSweeter/vigilant-potato.git odoo-qol
-   Open page chrome://extensions
-   Activate developer mode
-   Load unpacked extension
-   Select the extension folder
-   Click the extension button
-   That's it !

---

## Development Guidelines:

You want to add a new feature / improve an existing one ? Go for it !!  
Just don't forget the few points below:

-   **Extension contexts**: Each main folders (`background` / `content` / ... ) correspond to a context of the extension.
    You should include your feature inside an existing context, and not create a new main file/folder.
-   **One feature per file**: Do not mix features, if some bit of logic can be shared between features,
    try to extract it in `utils`, and import it in each file.
-   **Stay consistent**: If your feature must be present in multiple contexts (ex: background + options), then keep the same file name for each context.
-   **Keep it accessible**: This extension can be used by non-tech or people outside the Support,
    hence every technical / invasive features should be hidden/disabled by default.
