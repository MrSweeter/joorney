// https://github.com/callumlocke/json-formatter

const baseSpan = document.createElement('span');

export const createBlankSpan = () => baseSpan.cloneNode(false);

const getSpanWithClass = (className) => {
    const span = createBlankSpan();
    span.className = className;
    return span;
};

const getSpanWithBoth = (innerText, className) => {
    const span = createBlankSpan();
    span.className = className;
    span.innerText = innerText;
    return span;
};

export const templates = {
    t_entry: getSpanWithClass('jsonEntry'),
    t_exp: getSpanWithClass('expander'),
    t_key: getSpanWithClass('key'),
    t_string: getSpanWithClass('stringValue'),
    t_number: getSpanWithClass('numberValue'),

    t_null: getSpanWithBoth('null', 'nullValue'),
    t_true: getSpanWithBoth('true', 'boolValue'),
    t_false: getSpanWithBoth('false', 'boolValue'),

    t_oBrace: getSpanWithBoth('{', 'brace_bracket'),
    t_cBrace: getSpanWithBoth('}', 'brace_bracket'),
    t_oBracket: getSpanWithBoth('[', 'brace_bracket'),
    t_cBracket: getSpanWithBoth(']', 'brace_bracket'),

    t_sizeComment: getSpanWithClass('comment'),

    t_ellipsis: getSpanWithClass('collectionEllipsis'),
    t_blockInner: getSpanWithClass('innerJSON'),

    t_colonAndSpace: document.createTextNode(':\u00A0'),
    t_commaText: document.createTextNode(','),
    t_dblqText: document.createTextNode('"'),
};
