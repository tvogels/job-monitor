import React from 'react';
import { Checkbox, ProgressBar, Icon, Tooltip } from '@blueprintjs/core';
import JobStatusIndicator from './JobStatusIndicator';
import { copyToClipboard, HideUnderscores } from './utils'

export class NavBarGroup extends React.PureComponent {
    render() {
        const { experiment, children } = this.props;
        return (
            <div className="navbar-group">
                <h4><HideUnderscores string={experiment} /></h4>
                <div>{children}</div>
            </div>
        );
    }
}

export class NavBarLine extends React.PureComponent {
    render() {
        const { id, status, isSelected, toggle, exception, job, progress } = this.props;
        return (
            <div className="navbar-line" style={{ display: 'flex' }}>
                <Tooltip content={id}><Icon icon="clipboard" onClick={() => copyToClipboard(id)} style={{ cursor: 'pointer', marginRight: '.7em', opacity: .5 }} /></Tooltip>
                <Checkbox checked={isSelected} label={<HideUnderscores string={job} />} onChange={toggle} style={{ flexGrow: 1, paddingRight: '1em' }} />
                <div className="navbar-progress" style={{ width: '7em' }}>
                    {status === 'RUNNING' ?
                        <ProgressBar className="inline-progress" value={progress} animate={status === 'RUNNING'} stripes={status === 'RUNNING'} /> :
                        <JobStatusIndicator status={status} exception={exception} />
                    }
                </div>
            </div>
        );
    }
}
