export const NotYetImplemented = new Error('Not yet implemented, abstract method');
export function RunbotException(msg) {
    return new Error(msg);
}
