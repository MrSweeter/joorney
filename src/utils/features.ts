export function featureIDToPascalCase(id: string): string {
    return id.charAt(0).toUpperCase() + id.slice(1);
}

export function featureIDToDisplayName(id: string): string {
    return featureIDToPascalCase(id)
        .replace(/([A-Z])/g, ' $1')
        .trim();
}
