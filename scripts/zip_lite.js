import { getLiteBuildName, LITE_BUILD_OUTPUT, parseFeatureIDs } from './rollup/lite_build.js';
import { zipBundle } from './zip_bundle.js';

/**
 * Zip a lite feature build (see rollup.lite.config.mjs) next to it, not in the store releases.
 *
 * Usage: FEATURE=assignMeTask npm run prod:lite (comma-separated ids for several features)
 * Output: bundle-lite/joorney-<features>_<version>.zip
 */

const featureIDs = parseFeatureIDs(process.env.FEATURE);
if (featureIDs.length === 0) throw new Error('No feature selected.\nUsage: FEATURE=<id>[,<id>...] npm run prod:lite');

const buildName = getLiteBuildName(featureIDs);
zipBundle(`${LITE_BUILD_OUTPUT}/${buildName}`, LITE_BUILD_OUTPUT, `joorney-${buildName}`);
