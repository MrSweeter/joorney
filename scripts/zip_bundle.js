import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// import manifestJSON from '../bundle/manifest.json' with { type: 'json' }; // eslint failing
// Use fs.readFileSync to read the JSON file
const manifestPath = path.join(__dirname, '..', 'bundle', 'manifest.json');
const manifestJSON = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

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

function main() {
    const bundlePath = './bundle';
    const outputFolder = 'store/artefacts';

    const version = manifestJSON.version;

    const zipName = `joorney_${version.replaceAll('.', '-')}.zip`;
    zip(bundlePath, outputFolder, zipName);
}

main();
