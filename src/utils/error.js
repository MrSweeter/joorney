export const NotYetImplemented = new Error('Not yet implemented, abstract method');
export function RunbotException(msg) {
    return new Error(msg);
}

export class OdooAPIException extends Error {
    constructor(error, fromCache) {
        super(JSON.stringify(error));
        this.type = 'OdooAPIException';
        this.fromCache = fromCache;
        this.error = error;
    }
}
