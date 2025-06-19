export default function run(configuration) {
    if (!configuration) return {};
    const result = configuration;

    result.starringPriorityEffectEnabled = result.starringTaskEffectEnabled;
    result.starringPriorityEffectWhitelistMode = result.starringTaskEffectWhitelistMode;
    result.starringTaskEffectEnabled = undefined;
    result.starringTaskEffectWhitelistMode = undefined;

    const origins = result.originsFilterOrigins || {};

    for (const origin in origins) {
        if (Object.keys(origins[origin]).includes('starringTaskEffect')) {
            origins[origin].starringPriorityEffect = origins[origin].starringTaskEffect;
            origins[origin].starringTaskEffect = undefined;
        }
    }

    result.configurationVersion = 2;
    return result;
}
