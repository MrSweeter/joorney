# Odoo - Quality of Life & Fun - Extension

---

### Features list

-   Assign Me button for 'project.task' (form).
-   Save Knowledge article during edition without leaving the page.
-   Switch Odoo Theme automatically.
-   Stars Effect for 'project.task.priority' (form).
-   Awesome Loading (Large & Small).
-   Awesome Style
-   Unfocus App

---

## Installation Guides

### On Chrome:

-   Clone the repo anywhere
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

---

## Technical

**Features names**:

-   originsFilter (whitelist management) not a real feature

-   `awesomeLoadingLarge`
-   `awesomeLoadingSmall`
-   `assignMeTask`
-   `starringTaskEffect`
-   `saveKnowledge`
-   `themeSwitch`
-   `awesomeStyle`
-   `unfocusApp`

**Contextual Features**:

-   Background
    -   originsFilter (contextMenus)
    -   themeSwitch
-   Content
    -   assignMeTask
    -   starringTaskEffect
    -   awesomeLoadingLarge
    -   awesomeLoadingSmall
    -   awesomeStyle
    -   saveKnowledge
    -   unfocusApp
-   Options
    -   originsFilter
        -   assignMeTask
        -   starringTaskEffect
        -   awesomeLoadingLarge
        -   awesomeLoadingSmall
        -   awesomeStyle
        -   saveKnowledge
        -   themeSwitch
        -   unfocusApp
    -   awesomeLoadingLarge (dedicated UI)
    -   awesomeLoadingSmall(dedicated UI)
-   Popup
    -   originsFilter
    -   assignMeTask
    -   starringTaskEffect
    -   awesomeLoadingLarge
    -   awesomeLoadingSmall
    -   awesomeStyle
    -   saveKnowledge
    -   themeSwitch
    -   unfocusApp
