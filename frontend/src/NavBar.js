import { Checkbox, Icon, ProgressBar, Tooltip } from '@blueprintjs/core';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import React from 'react';
import JobStatusIndicator from './JobStatusIndicator';
import { copyToClipboard, HideUnderscores } from './utils';

const ANNOTATION_MUTATION = gql`
mutation SetAnnotation($jobId: ID!, $key: String!, $value: Object) {
    setAnnotation(jobId: $jobId, key: $key, value: $value) {
        id
        annotations {
            key
            value
        }
    }
}
`;

const AnnotationStatus = ({ isActive, annotationKey, jobId, icon, inactiveIcon }) => (
    <Mutation mutation={ANNOTATION_MUTATION}>
    {setAnnotation => (
        isActive ?
            <Icon
                icon={icon}
                className="navbar-icon-active"
                onClick={() => {
                    setAnnotation({ variables: { jobId, key: annotationKey }});
                }}
            /> :
            <Icon
                icon={inactiveIcon}
                className="navbar-icon-inactive"
                onClick={() => {
                    setAnnotation({ variables: { jobId, key: annotationKey, value: true }});
                }}
            />
    )}
    </Mutation>
);

export class HueIndicator extends React.PureComponent {
    render() {
        const { hue } = this.props;
        return (
            <div style={{width: ".8em",
                height: ".8em",
                display: "inline-block",
                "background-color": hue,
                "position": "abslute",
                "left": "5px",
                "top": "5px",}}></div>
        )
    }
}


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
        const { id, status, isSelected, toggle, exception, job, progress, annotations, hue = null } = this.props;
        const isBuggy = annotations.find(({ key, value }) => key === 'bug' && value);
        const isStarred = annotations.find(({ key, value }) => key === 'star' && value);
        return (
            <div className="navbar-line">
                <Tooltip content={id}><Icon icon="clipboard" onClick={() => copyToClipboard(id)} style={{ cursor: 'pointer', marginRight: '.7em', opacity: .5 }} /></Tooltip>
                <Checkbox checked={isSelected} label={<HideUnderscores string={job} />} onChange={toggle} style={{ flexGrow: 1, paddingRight: '1em' }} />
                <div className="navbar-progress">
                    {hue ? <HueIndicator hue={hue} /> : null}
                    {status === 'RUNNING' ?
                        <ProgressBar className="inline-progress" value={progress} animate={status === 'RUNNING'} stripes={status === 'RUNNING'} /> :
                        <span className="navbar-icons">
                            <AnnotationStatus isActive={isStarred} jobId={id} annotationKey='star' icon='star' inactiveIcon='star-empty' />
                            { isBuggy ? <Icon icon="issue" /> : null}
                            <JobStatusIndicator status={status} exception={exception} />
                        </span>
                    }
                </div>
            </div>
        );
    }
}
