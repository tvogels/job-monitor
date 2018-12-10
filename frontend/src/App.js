import React, { Component } from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import { groupBy } from 'underscore';
import { NavBarGroup, NavBarLine } from './NavBar';
import FilterBar from './FilterBar';
import LogsPage from './LogsPage';
import ConfigPage from './ConfigPage';
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom';
import styled from 'styled-components';
import { Spinner } from './utils';


const GET_JOBS = gql`
  query Job($nameFilter: String!, $limit: Int!, $status: Status) {
    jobs(job: $nameFilter, limit: $limit, status: $status) {
      id
      experiment
      job
      status
      exception
      progress
    }
  }
`;

const Main = styled.div`
  flex-grow: 1;
  display: flex;
  padding: 1em;
  paddingTop: 0;
  overflow: auto;
`;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      filter: '',
      limit: 25,
      statusFilter: '',
      selectedJobs: [],
    };
    this.selectJob = this.selectJob.bind(this);
    this.unselectJob = this.unselectJob.bind(this);
    this.toggleJob = this.toggleJob.bind(this);
    this.isSelected = this.isSelected.bind(this);
    this.setFilter = this.setFilter.bind(this);
    this.setLimit = this.setLimit.bind(this);
    this.setStatusFilter = this.setStatusFilter.bind(this);
    this.toggleHandlers = new Map();
  }
  toggleJob(jobId) {
    if (this.isSelected(jobId)) {
      this.unselectJob(jobId);
    } else {
      this.selectJob(jobId);
    }
  }
  selectJob(jobId) {
    this.setState({ selectedJobs: [...this.state.selectedJobs, jobId] })
  }
  unselectJob(jobId) {
    this.setState({ selectedJobs: this.state.selectedJobs.filter(job => job !== jobId) })
  }
  isSelected(jobId) {
    return this.state.selectedJobs.includes(jobId);
  }
  setFilter(filter) {
    this.setState({ filter })
  }
  setLimit(limit) {
    this.setState({ limit })
  }
  setStatusFilter(status) {
    this.setState({ status })
  }
  toggleHandler(jobId) {
    if (!this.toggleHandlers.has(jobId)) {
      this.toggleHandlers.set(jobId, this.toggleJob.bind(this, jobId));
    }
    return this.toggleHandlers.get(jobId);
  }
  render() {
    return (
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <FilterBar
            filter={this.state.filter}
            limit={this.state.limit}
            statusFilter={this.state.statusFilter}
            setFilter={this.setFilter}
            setLimit={this.setLimit}
            setStatusFilter={this.setStatusFilter}
            style={{ padding: '1em', paddingBottom: '0em', flexShrink: 0, flexGrow: 0, backgroundColor: 'rgba(0,0,0,0.2)' }}
          />
          <Query
            query={GET_JOBS}
            variables={{ nameFilter: '.*' + this.state.filter + '.*', limit: this.state.limit, status: this.state.statusFilter === '' ? undefined : this.state.statusFilter }}
            pollInterval={10000}
          >
            {({ loading, error, data }) => {
              if (loading) return <Main><Spinner /></Main>;
              if (error) return <Main><p>Error :( {error}</p></Main>;
              return (
                <div style={{ flexGrow: 1, flexShrink: 1, display: 'flex' }}>
                  <div className="navbar" style={{ padding: '1em', paddingTop: 0, paddingRight: '1.2em', overflow: 'auto', backgroundColor: 'rgba(0,0,0,0.1)', minWidth: '25em', flexShrink: 0 }}>
                    {jobsByExperiment(data.jobs).map(([experiment, jobs]) => (
                      <NavBarGroup experiment={experiment} key={experiment}>
                        {jobs.map(job => (
                          <NavBarLine key={job.id} {...job} isSelected={this.isSelected(job.id)} toggle={this.toggleHandler(job.id)} />
                        ))}
                      </NavBarGroup>
                    ))}
                  </div>
                  <Main>
                    <Route exact path="/" render={() => (
                      <Redirect to="/config" />
                    )} />
                    <Route exact path="/logs" component={(props) => <LogsPage {...props} jobs={data.jobs.filter(j => this.state.selectedJobs.includes(j.id))} />} />
                    <Route exact path="/config" component={(props) => <ConfigPage {...props} jobIds={this.state.selectedJobs} />} />
                  </Main>
                </div>
              );
            }}
          </Query>
        </div>
      </Router>
    );
  }
};

function jobsByExperiment(jobs) {
  return Object.entries(groupBy(jobs, job => job.experiment));
}

export default App;
