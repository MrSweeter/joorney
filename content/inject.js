// ALTERNATIVE to loadSessionInfo
//function guessOdooVersion(windowArg) {
//    const result = { isOdoo: windowArg?.odoo !== undefined };
//    // "info" is only available when logged in
//    if (!windowArg?.odoo?.info) return result;
//
//    const serverVersionInfo = windowArg.odoo.info.server_version_info;
//    if (!Array.isArray(serverVersionInfo)) return result;
//
//    const version = serverVersionInfo.slice(0, 2).join('.');
//    return { isOdoo: true, version: version };
//}
//
//function handleOdooGuess() {
//    const res = guessOdooVersion(window);
//
//    const guess = document.createElement('meta');
//    guess.name = 'joorney-guess';
//    guess.content = JSON.stringify(res);
//    (document.head || document.documentElement).appendChild(guess);
//}
//
//(() => {
//    handleOdooGuess();
//})();
