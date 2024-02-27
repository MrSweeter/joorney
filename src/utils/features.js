export function featureIDToPascalCase(id) {
    return id.charAt(0).toUpperCase() + id.slice(1);
}

export function featureIDToDisplayName(id) {
    return featureIDToPascalCase(id)
        .replace(/([A-Z])/g, ' $1')
        .trim();
}
