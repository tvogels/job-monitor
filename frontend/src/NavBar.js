import { Checkbox, Icon, ProgressBar, Tooltip } from '@blueprintjs/core';
import React from 'react';
import JobStatusIndicator from './JobStatusIndicator';
import { copyToClipboard, HideUnderscores } from './utils';

export class NavBarGroup extends React.PureComponent {
    render() {
        const { experiment, description=null, children } = this.props;
        return (
            <div className="navbar-group">
                <h4><HideUnderscores string={experiment} /></h4>
                {description ? <p className="navbar-description">{description}</p> : null}
                <div>{children}</div>
            </div>
        );
    }
}

export class NavBarLine extends React.PureComponent {
    render() {
        const { id, status, isSelected, toggle, exception, job, progress } = this.props;
        return (
            <div className="navbar-line">
                <Tooltip content={id}><Icon icon="clipboard" onClick={() => copyToClipboard(id)} style={{ cursor: 'pointer', marginRight: '.7em', opacity: .5 }} /></Tooltip>
                <Checkbox checked={isSelected} label={<HideUnderscores string={job} />} onChange={toggle} style={{ flexGrow: 1, paddingRight: '1em' }} />
                <div className="navbar-progress">
                    {status === 'RUNNING' ?
                        <ProgressBar className="inline-progress" value={progress} animate={status === 'RUNNING'} stripes={status === 'RUNNING'} /> :
                        <JobStatusIndicator status={status} exception={exception} />
                    }
                </div>
            </div>
        );
    }
}
