import { Spinner as BlueprintSpinner } from '@blueprintjs/core';
import React from 'react';
import styled from 'styled-components';

export function copyToClipboard(str) {
    const el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    const selected =
        document.getSelection().rangeCount > 0
            ? document.getSelection().getRangeAt(0)
            : false;
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    if (selected) {
        document.getSelection().removeAllRanges();
        document.getSelection().addRange(selected);
    }
};

export const HideUnderscores = ({ string }) => {
    const parts = string.split(/[_-]/g);
    const result = [];
    for (let part of parts) {
        result.push(part);
        result.push(<span key={part} style={{ opacity: 0.1 }}>_</span>);
    }
    result.pop()
    return result;
};

const SpinnerContainer = styled.div`
    display: flex;
    justify-content: center;
    flex-grow: 1;
`;

export const Spinner = () => (
    <SpinnerContainer><BlueprintSpinner size={BlueprintSpinner.SIZE_SMALL} /></SpinnerContainer>
);


function escapeRegExpChars(text) {
    return text.replace(/([.*+?^=!:${}()|\\])/g, "\\$1");
}

export function highlightText(text, query) {
    let lastIndex = 0;
    const words = query
        .split(/\s+/)
        .filter(word => word.length > 0)
        .map(escapeRegExpChars);
    if (words.length === 0) {
        return [text];
    }
    const regexp = new RegExp(words.join("|"), "gi");
    const tokens = [];
    while (true) {
        const match = regexp.exec(text);
        if (!match) {
            break;
        }
        const length = match[0].length;
        const before = text.slice(lastIndex, regexp.lastIndex - length);
        if (before.length > 0) {
            tokens.push(before);
        }
        lastIndex = regexp.lastIndex;
        tokens.push(<strong key={lastIndex}>{match[0]}</strong>);
    }
    const rest = text.slice(lastIndex);
    if (rest.length > 0) {
        tokens.push(rest);
    }
    return tokens;
}