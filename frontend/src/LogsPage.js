import React from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import { HideUnderscores } from './utils';
import { TextArea } from '@blueprintjs/core';
import AutoScroll from './AutoScroll';

const JOB_LOGS = gql`
  query Job($id: ID!) {
    job(id: $id) {
      id
      logs
    }
  }
`;

const LogsPage = ({ jobs }) => {
    if (jobs.length === 0) {
        return (
            <div style={{ flexGrow: 1, display: 'flex', paddingTop: '1em', flexDirection: 'column' }}>
                Select at least one job on the left to view logs.
            </div>
        );
    }
    return (
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            {jobs
                .map((job) => <JobLogs key={job.id} id={job.id} experiment={job.experiment} job={job.job} />)}
        </div>
    );
};
export default LogsPage;

const ScrollTextArea = AutoScroll({ property: 'value' })(TextArea);

class JobLogs extends React.PureComponent {
    render() {
        const { id, experiment, job } = this.props;
        return (
            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <h4><HideUnderscores string={experiment} />&nbsp;&nbsp;<span style={{ opacity: .5 }}>/</span>&nbsp;&nbsp;<HideUnderscores string={job} /></h4>
                <Query
                    query={JOB_LOGS}
                    variables={{ id }}
                    pollInterval={10000}
                >
                    {({ error, data }) => {
                        if (error) return <p>Error :( {error}</p>;
                        return (
                            <ScrollTextArea value={data.job ? data.job.logs.trim() : 'Loading ...'} readOnly={true} fill={true} style={{ fontFamily: 'monospace', flexGrow: 1 }} />
                        );
                    }}
                </Query>
            </div>
        );
    }
}