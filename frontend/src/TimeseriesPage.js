import React from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import styled from 'styled-components';

const CONFIG_QUERY = gql`
  query Job($ids: [ID]) {
    jobs(ids: $ids) {
      id
      experiment
      job
      config {
          key
          value
      }
    }
  }
`;

const TimeseriesPage = ({ jobIds }) => {
    return (
        <div>Timeseries</div>
    );
};

export default TimeseriesPage;