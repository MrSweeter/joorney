// https://github.com/callumlocke/json-formatter

export const getValueType = (value) => {
    if (typeof value === 'string') return TYPE_STRING;
    if (typeof value === 'number') return TYPE_NUMBER;
    if (value === false || value === true) return TYPE_BOOL;
    if (value === null) return TYPE_NULL;
    if (Array.isArray(value)) return TYPE_ARRAY;

    return TYPE_OBJECT;
};

export const TYPE_STRING = 1;
export const TYPE_NUMBER = 2;
export const TYPE_OBJECT = 3;
export const TYPE_ARRAY = 4;
export const TYPE_BOOL = 5;
export const TYPE_NULL = 6;
