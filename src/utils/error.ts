export const NotYetImplemented = new Error('Not yet implemented, abstract method');

export class RunbotException extends Error {}

export class OdooAPIException extends Error {
    type: string;
    fromCache: boolean;
    error: object;

    constructor(error: object, fromCache: boolean) {
        super(JSON.stringify(error));
        this.type = 'OdooAPIException';
        this.fromCache = fromCache;
        this.error = error;
    }
}
