import { Icon, Intent, Tooltip } from "@blueprintjs/core";
import React from 'react';

const JobStatusIndicator = ({ status, exception }) => {
    let icon;
    let output;
    switch (status) {
        case 'FINISHED':
            icon = <Icon icon="tick-circle" intent={Intent.SUCCESS} />;
            output = icon;
            break;
        case 'SCHEDULED':
            icon = <Icon icon="time" intent={Intent.NONE} />;
            output = <Tooltip content='Scheduled'>{icon}</Tooltip>
            break;
        case 'CREATED':
            icon = <Icon icon="time" intent={Intent.NONE} />;
            output = <Tooltip content='Created'>{icon}</Tooltip>
            break;
        case 'RUNNING':
            icon = <Icon icon="walk" intent={Intent.NONE} />;
            output = <Tooltip content='Running'>{icon}</Tooltip>
            break;
        case 'CANCELED':
            icon = <Icon icon="cross" intent={Intent.NONE} />;
            output = <Tooltip content='Canceled'>{icon}</Tooltip>
            break;
        case 'FAILED':
            icon = <Icon icon="error" intent={Intent.DANGER} style={{cursor: 'pointer'}} onClick={() => alert(exception)} />;
            output = <Tooltip content='Failed'>{icon}</Tooltip>
            break
        case 'UNRESPONSIVE':
            icon = <Icon icon="error" intent={Intent.DANGER} />;
            output = <Tooltip content="Unresponsive">{icon}</Tooltip>;
            break;
        default:
            icon = "";
            output = "";
    }
    return output;
};

export default JobStatusIndicator;
