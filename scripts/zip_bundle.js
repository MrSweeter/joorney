import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function zip(folder, outputFolder, outputFilename) {
    const inputPath = path.join(__dirname, '..', folder);
    const outputPath = path.join(__dirname, '..', outputFolder, outputFilename);

    console.log(`Zipping content from: ${inputPath}`);
    console.log(`Output file will be: ${outputPath}`);

    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
        zlib: { level: 9 },
    });

    output.on('close', () => {
        console.log(`Archive created: ${archive.pointer()} total bytes`);
    });

    archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
            console.warn(err);
        } else {
            throw err;
        }
    });

    archive.on('error', (err) => {
        throw err;
    });

    archive.pipe(output);

    archive.directory(inputPath, false);

    archive.finalize();
}

function deleteExistingVersion(outputFolder, deleteFormat) {
    const files = fs.readdirSync(outputFolder);

    for (const file of files) {
        if (file.startsWith(deleteFormat)) {
            // Sync: an async unlink could remove the new archive (same name when rebuilt the same day)
            try {
                fs.unlinkSync(path.join(outputFolder, file));
                console.log(`Deleted file: ${file}`);
            } catch (err) {
                console.error(`Error deleting file ${file}:`, err);
            }
        }
    }
}

/**
 * Zip a build folder, named after its manifest version, replacing the archives of the same version.
 * @param {string} [bundleFolder] build folder, relative to the repository root
 * @param {string} [outputFolder] archive folder, relative to the repository root
 * @param {string} [zipPrefix] archive name before the version
 */
export function zipBundle(bundleFolder = 'bundle', outputFolder = 'store/artefacts', zipPrefix = 'joorney') {
    const manifestPath = path.join(__dirname, '..', bundleFolder, 'manifest.json');
    const manifestJSON = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const bundlePath = `./${bundleFolder}`;

    const version = manifestJSON.version;

    const versionNoBuild = version.split('.').slice(0, 3).join('-');
    const deleteFormat = `${zipPrefix}_${versionNoBuild}`;
    deleteExistingVersion(outputFolder, deleteFormat);

    const zipName = `${zipPrefix}_${version.replaceAll('.', '-')}.zip`;
    zip(bundlePath, outputFolder, zipName);
}

// Run as a script (npm run zip), not when imported
if (process.argv[1] === __filename) zipBundle();
