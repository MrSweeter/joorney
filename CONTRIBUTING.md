# Contributing Guide

Thank you for considering contributing to this project! Below is a guide on how you can help.

[Contributors](./CONTRIBUTORS.md)

## How to Report Issues/Bugs

-   **Encounter a bug or unexpected behavior?**
    -   Check if the issue already exists [here](https://github.com/MrSweeter/joorney/issues) or [create a new one](https://github.com/MrSweeter/joorney/issues/new/choose).
    -   If you submit a pull request (PR) that resolves an issue, there's no need to create a separate issue. You can explain the details directly in your PR description.

## Contributing to the Project

1. **Fork and Clone** the repository:
   `git clone git://github.com/XXXXX/joorney.git && cd joorney`
2. **Install Dependencies**:
   `npm install`
3. **Make Your Changes**: Implement the desired modifications.
4. **Build for Development/Testing**:
   `npm run dev`
5. **Update** the `CONTRIBUTORS.md` file to add your name.
6. **Commit and Submit a Pull Request**: Provide details on what has been changed and why.
    - Use clear, descriptive, and atomic commits.
    - Link to any relevant GitHub issues in your PR description. Here's a helpful [reference guide](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#referencing-issues-and-pull-requests) [closing keyword](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue).

## Building the Project

1. **Build for Development/Testing**:
   `npm run dev`
2. **Load the Extension**: Follow [this guide](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked) to load the unpacked extension.
3. **Reload if Needed**: Depending on the changes, you might need to reload the extension. See [here](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#reload) for instructions.

## Preparing for Release

1. **Update Files**:
    - Modify the `store/announce.json` file as necessary.
    - Update both the manifest `version` and `version_name`.
2. **Build** the extension.
3. **Create a Zip Archive**:
    - Check the build number by checking the generated manifest version.
    - Zip the contents of the `bundle` folder and name it `joorney_X.X.X.XXXXX.zip`.
4. **Push Changes**:
    - Commit with the format `[VERSION] X.X.X` (squash multiple version commits if applicable).
    - Push to the repository (never push directly to the `master` branch).
    - If you haven't already, open a pull request.
