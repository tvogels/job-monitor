import React from 'react';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import { GRAPHQL } from './settings';

const IMAGES_QUERY = gql`
  query Job($ids: [ID]) {
    jobs(ids: $ids) {
      id
      job
      images {
        key
        path
      }
    }
  }
`;

export default ({ jobIds }) => {
    return (
      <div>
        <Query query={IMAGES_QUERY} variables={{ ids: jobIds }}>
        {({ loading, error, data }) => {
            if (error) return <p>Error :( {JSON.stringify(error)}</p>;
            if (loading) return '';
            return data.jobs.map(job => (
              <div key={job.id}>
                <h1>{job.job}</h1>
                {job.images.map(img => (
                  <div key={img.key}>
                    <p>{img.key}</p>
                    <img style={{maxWidth: '100%', maxHeight: '50vh'}} src={`${GRAPHQL}/file/${job.id}/${img.path}`} alt="key" />
                  </div>
                ))}
              </div>
            ))
        }}
        </Query>
      </div>
    );
};
