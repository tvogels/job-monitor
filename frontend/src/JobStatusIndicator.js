import React from 'react';
import { Icon, Intent, Tooltip } from "@blueprintjs/core";

const JobStatusIndicator = ({ status, exception }) => {
    let icon;
    switch (status) {
        case 'FINISHED':
            icon = <Icon icon="tick-circle" intent={Intent.SUCCESS} />;
            break;
        case 'SCHEDULED':
            icon = <Icon icon="time" intent={Intent.NONE} />;
            break;
        case 'CREATED':
            icon = <Icon icon="time" intent={Intent.NONE} />;
            break;
        case 'RUNNING':
            icon = <Icon icon="walk" intent={Intent.NONE} />;
            break;
        case 'CANCELED':
            icon = <Icon icon="cross" intent={Intent.NONE} />;
            break;
        case 'FAILED':
        case 'UNRESPONSIVE':
            icon = <Icon icon="error" intent={Intent.DANGER} />;
            break;
        default:
            icon = "";
    }
    let output = <span>{icon} {status.toLowerCase()}</span>;
    if (status === 'FAILED') {
        output = <Tooltip content={exception}>{output}</Tooltip>
    }
    return output;
};

export default JobStatusIndicator;