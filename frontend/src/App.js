import gql from 'graphql-tag';
import React, { Component, useState } from 'react';
import { Query } from 'react-apollo';
import { BrowserRouter as Router, Redirect, Route } from 'react-router-dom';
import styled from 'styled-components';
import { groupBy } from 'underscore';
import ConfigPage from './ConfigPage';
import FilterBar from './FilterBar';
import LogsPage from './LogsPage';
import { NavBarGroup, NavBarLine } from './NavBar';
import TimeseriesPage, { useFacetChartControllerState } from './TimeseriesPage';
import ImagesPage from './ImagesPage';
import { ReportIndex, ReportPage } from './reports';

const GET_JOBS = gql`
  query Job($searchFilter: String!, $limit: Int!, $status: Status) {
    jobs(search: $searchFilter, limit: $limit, status: $status) {
      id
      experiment
      job
      status
      exception
      progress
      annotations {
        key
        value
      }
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

class AppWithSelectedJobs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedJobs: [],
    };
    this.selectJob = this.selectJob.bind(this);
    this.unselectJob = this.unselectJob.bind(this);
    this.toggleJob = this.toggleJob.bind(this);
    this.isSelected = this.isSelected.bind(this);
    this.toggleHandler = this.toggleHandler.bind(this);
    this.setSelectedJobs = this.setSelectedJobs.bind(this);
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
  toggleHandler(jobId) {
    if (!this.toggleHandlers.has(jobId)) {
      this.toggleHandlers.set(jobId, this.toggleJob.bind(this, jobId));
    }
    return this.toggleHandlers.get(jobId);
  }
  setSelectedJobs(selectedJobs) {
    this.setState({ selectedJobs });
  }
  render() {
    return <App selectedJobs={this.state.selectedJobs} toggleHandler={this.toggleHandler} setSelectedJobs={this.setSelectedJobs} />
  }
};

const NavBar = ({ handleNavbarKeys, jobs, selectedJobs, toggleHandler }) => (
  <div tabIndex={0} onKeyDown={handleNavbarKeys} className="navbar">
    {jobsByExperiment(jobs).map(([experiment, jobs]) => (
      <NavBarGroup experiment={jobs[0].experiment} key={experiment} description={jobDescription(jobs[0])}>
        {jobs.map(job => (
          <NavBarLine key={job.id} {...job} isSelected={selectedJobs.includes(job.id)} toggle={toggleHandler(job.id)} />
        ))}
      </NavBarGroup>
    ))}
  </div>
);

const App = ({ selectedJobs, setSelectedJobs, toggleHandler }) => {
  const [filter, setFilter] = useState('');
  const [limit, setLimit] = useState(100);
  const [statusFilter, setStatusFilter] = useState('');
  const facetChartState = useFacetChartControllerState();
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <FilterBar
          filter={filter} setFilter={setFilter}
          limit={limit} setLimit={setLimit}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          style={{ padding: '1em', paddingBottom: '0em', flexShrink: 0, flexGrow: 0, backgroundColor: 'rgba(0,0,0,0.2)' }}
        />
        <Query
          query={GET_JOBS}
          variables={{ searchFilter: filter, limit: limit, status: statusFilter === '' ? undefined : statusFilter }}
          pollInterval={10000}
        >
          {({ loading, error, data }) => {
            if (error) return <Main><p>Error :( {JSON.stringify(error)}</p></Main>;
            const handleNavbarKeys = (event) => {
              if (event.key === 'a' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                if (event.shiftKey) {
                  setSelectedJobs([]);
                } else {
                  setSelectedJobs(data.jobs.map(j => j.id));
                }
              }
            };
            return (
              <div style={{ flexGrow: 1, flexShrink: 1, display: 'flex', height: '10em' }}>
                <Route exact path="/" render={() => (
                  <Redirect to="/config" />
                )} />
                <Route exact path="/logs" render={(props) => (
                  <>
                    <NavBar handleNavbarKeys={handleNavbarKeys} jobs={data.jobs} selectedJobs={selectedJobs} toggleHandler={toggleHandler} />
                    <Main><LogsPage {...props} jobs={(data.jobs || []).filter(j => selectedJobs.includes(j.id))} /></Main>
                  </>
                )} />
                <Route exact path="/config" render={(props) => (
                  <>
                    <NavBar handleNavbarKeys={handleNavbarKeys} jobs={data.jobs} selectedJobs={selectedJobs} toggleHandler={toggleHandler} />
                    <Main><ConfigPage {...props} jobIds={selectedJobs} /></Main>
                  </>
                )} />
                <Route exact path="/timeseries" render={(props) => (
                  <>
                    <NavBar handleNavbarKeys={handleNavbarKeys} jobs={data.jobs} selectedJobs={selectedJobs} toggleHandler={toggleHandler} />
                    <Main><TimeseriesPage {...props} jobIds={selectedJobs} facetChartState={facetChartState} /></Main>
                  </>
                )} />
                <Route exact path="/images" render={(props) => (
                  <>
                    <NavBar handleNavbarKeys={handleNavbarKeys} jobs={data.jobs} selectedJobs={selectedJobs} toggleHandler={toggleHandler} />
                    <Main><ImagesPage {...props} jobIds={selectedJobs} /></Main>
                  </>
                )} />
                <Route exact path="/reports" component={ReportIndex} />
                <Route exact path="/reports/:slug" component={ReportPage} />
              </div>
            );
          }}
        </Query>
      </div>
    </Router>
  );
};

function jobDescription(job) {
  const entry = job.annotations.find(({ key, value }) => key === 'description');
  if (entry != null) {
    return entry.value;
  } else {
    return '';
  }
}

function jobsByExperiment(jobs) {
  return Object.entries(groupBy(jobs, job => job.experiment + jobDescription(job)));
}

export default AppWithSelectedJobs;
