import React from 'react';
import styled from 'styled-components';
import { Spinner as BlueprintSpinner } from '@blueprintjs/core';

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
