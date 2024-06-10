// https://github.com/callumlocke/json-formatter

import { createBlankSpan, templates } from './templates.js';
import { TYPE_ARRAY, TYPE_BOOL, TYPE_NULL, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING, getValueType } from './types.js';

export function buildDom(value, keyName = false, collapse = false) {
    const type = getValueType(value);

    const entry = templates.t_entry.cloneNode(false);
    if (collapse) entry.classList.add('json-collapsed');

    let collectionSize = 0;
    if (type === TYPE_OBJECT) {
        collectionSize = Object.keys(value).length;
        //entry.classList.add('objProp');
    } else if (type === TYPE_ARRAY) {
        collectionSize = value.length;
        //entry.classList.add('arrElem');
    }

    const nonZeroSize = collectionSize > 0;
    if (nonZeroSize) entry.appendChild(templates.t_exp.cloneNode(false));

    // NB: "" is a legal keyname in JSON
    if (keyName !== false) {
        const keySpan = templates.t_key.cloneNode(false);
        keySpan.textContent = JSON.stringify(keyName).slice(1, -1); // remove quotes

        entry.appendChild(templates.t_dblqText.cloneNode(false));
        entry.appendChild(keySpan);
        entry.appendChild(templates.t_dblqText.cloneNode(false));

        entry.appendChild(templates.t_colonAndSpace.cloneNode(false));
    }

    let blockInner = undefined;
    let childEntry = undefined;

    switch (type) {
        case TYPE_STRING: {
            const innerStringEl = createBlankSpan();

            const escapedString = JSON.stringify(value).slice(1, -1); // remove outer quotes

            if (value.substring(0, 8) === 'https://' || value.substring(0, 7) === 'http://') {
                const innerStringA = document.createElement('a');
                innerStringA.href = value;
                innerStringA.innerText = escapedString;
                innerStringEl.appendChild(innerStringA);
            } else {
                innerStringEl.innerText = escapedString;
            }
            const valueElement = templates.t_string.cloneNode(false);
            valueElement.appendChild(templates.t_dblqText.cloneNode(false));
            valueElement.appendChild(innerStringEl);
            valueElement.appendChild(templates.t_dblqText.cloneNode(false));
            entry.appendChild(valueElement);
            break;
        }

        case TYPE_NUMBER: {
            const valueElement = templates.t_number.cloneNode(false);
            valueElement.innerText = String(value);
            entry.appendChild(valueElement);
            break;
        }

        case TYPE_OBJECT: {
            entry.appendChild(templates.t_oBrace.cloneNode(true));

            if (nonZeroSize) {
                entry.appendChild(templates.t_ellipsis.cloneNode(false));
                blockInner = templates.t_blockInner.cloneNode(false);

                let lastComma;
                for (const k in value) {
                    childEntry = buildDom(value[k], k, collapse);

                    const comma = templates.t_commaText.cloneNode();

                    childEntry.appendChild(comma);

                    blockInner.appendChild(childEntry);

                    lastComma = comma;
                }

                if (childEntry && lastComma) {
                    childEntry.removeChild(lastComma);
                }

                entry.appendChild(blockInner);
            }

            entry.appendChild(templates.t_cBrace.cloneNode(true));

            entry.dataset.size = ` // ${collectionSize} ${collectionSize === 1 ? 'item' : 'items'}`;

            break;
        }

        case TYPE_ARRAY: {
            entry.appendChild(templates.t_oBracket.cloneNode(true));

            if (nonZeroSize) {
                entry.appendChild(templates.t_ellipsis.cloneNode(false));

                blockInner = templates.t_blockInner.cloneNode(false);

                for (let i = 0, length = value.length, lastIndex = length - 1; i < length; i++) {
                    childEntry = buildDom(value[i], false, collapse);

                    if (i < lastIndex) {
                        const comma = templates.t_commaText.cloneNode();
                        childEntry.appendChild(comma);
                    }

                    blockInner.appendChild(childEntry);
                }
                entry.appendChild(blockInner);
            }
            entry.appendChild(templates.t_cBracket.cloneNode(true));

            entry.dataset.size = ` // ${collectionSize} ${collectionSize === 1 ? 'item' : 'items'}`;

            break;
        }

        case TYPE_BOOL: {
            if (value) entry.appendChild(templates.t_true.cloneNode(true));
            else entry.appendChild(templates.t_false.cloneNode(true));
            break;
        }

        case TYPE_NULL: {
            entry.appendChild(templates.t_null.cloneNode(true));
            break;
        }
    }

    return entry;
}
