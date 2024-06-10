export default function run(configuration) {
    if (!configuration) return {};
    const result = configuration;

    const isWhitelist = !result.originsFilterIsBlacklist;

    result.assignMeTaskWhitelistMode = isWhitelist;
    result.saveKnowledgeWhitelistMode = isWhitelist;
    result.awesomeLoadingLargeWhitelistMode = isWhitelist;
    result.awesomeLoadingSmallWhitelistMode = isWhitelist;
    result.awesomeStyleWhitelistMode = isWhitelist;
    result.starringTaskEffectWhitelistMode = isWhitelist;
    result.unfocusAppWhitelistMode = isWhitelist;
    result.themeSwitchWhitelistMode = isWhitelist;

    result.originsFilterIsBlacklist = undefined;

    result.configurationVersion = 1;
    return result;
}
