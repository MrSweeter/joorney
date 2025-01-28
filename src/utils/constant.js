export let SUPPORTED_VERSION = ['16.0']; // Minimal supported version for extension versioning
export let SUPPORTED_DEV_VERSION = [];

export function setSupportedVersion(versions) {
    SUPPORTED_VERSION = versions;
}
export function setSupportedDevelopmentVersion(versions) {
    SUPPORTED_DEV_VERSION = versions;
}
