import { Icon } from "@blueprintjs/core";
import { scaleOrdinal } from "d3-scale";
import { schemeCategory10, schemeSpectral } from "d3-scale-chromatic";
import gql from 'graphql-tag';
import React from 'react';
import { Query } from 'react-apollo';
import styled from 'styled-components';
import { HideUnderscores, Spinner } from './utils';
import { HueIndicator } from './NavBar'

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

const ConfigPage = ({ jobIds }) => (
    <Query query={CONFIG_QUERY} variables={{ ids: jobIds }}>
    {({ loading, error, data }) => {
        if (loading) return <Spinner />;
        if (error) return "Error ...";
        return <ConfigTable jobs={data.jobs} />
    }}
    </Query>
);

const Table = styled.div`
    min-width: 100%;
    display: flex;
    flex-direction: column;
`;

const TableRow = styled.div`
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    flex-shrink: 0;
    &:nth-child(2n+1) {
        background-color: rgba(0, 0, 0, 0.1);
    }
`;

const TableHeader = styled.div`
    width: 15em;
    flex-grow: 0;
    flex-shrink: 0;
    overflow: hidden;
    padding: .4em 1em;
    padding-left: .6em;
    padding-right: 3em;
    font-weight: bold;
    white-space: nowrap;
`;

const TableCell = styled.div`
    flex-basis: 10em;
    flex-grow: 1;
    flex-shrink: 1;
    overflow: hidden;
    padding: .4em 1em;
    padding-left: .6em;
    padding-right: 3em;
    white-space: nowrap;
`;

const TableCellHeader = styled(TableCell)`
    font-weight: bold;
    color: rgba(255, 255, 255, 0.7);
`;
const TableRowHeader = styled(TableRow)`
    background-color: inherit !important;
`;

const printValue = (value) => {
    if (value === true) {
        return <Icon icon="tick" />;
    } else if (value === false) {
        return <Icon icon="cross" />;
    } else {
        return value;
    }
};

const ConfigTableRow = ({ field, children }) => {
    const allTheSame = children.length > 1 ? children.every(c => c === children[0]) : false;
    const opacity = allTheSame ? 0.3 : 1;
    const uniqueChildren = children.filter((c, i) => children.indexOf(c) === i);
    uniqueChildren.sort();
    let cmap;
    if (uniqueChildren.length > 1 && (typeof children[0] === 'number')) {
        cmap = scaleOrdinal(schemeSpectral[Math.min(Math.max(uniqueChildren.length, 3), 11)]).domain(uniqueChildren);
    } else {
        cmap = scaleOrdinal(schemeCategory10).domain(uniqueChildren);
    };
    return (
        <TableRow>
            <TableHeader style={{ opacity }}><HideUnderscores string={field} /></TableHeader>
            {children.map((c, i) => {
                let color = 'white';
                let fontWeight = 'normal';
                if (children.length > 1 && !allTheSame) {
                    // color = cmap(c);
                    fontWeight = 'bold';
                }
                return <TableCell style={{ opacity, color, fontWeight }} key={i}>{printValue(c)}</TableCell>
            })}
        </TableRow>
    );
};

class ConfigTable extends React.PureComponent {
    render() {
        const { jobs } = this.props;

        console.log(jobs);
        const compareIds = (first, second) =>
            ((first.id === second.id) ? 0 : (first.id < second.id) ? -1 : 1);
        jobs.sort(compareIds);

        const hueScale = scaleOrdinal(schemeCategory10).domain(Array.from(jobs).map(job => job.id))

        const fields = new Set();
        const values = new Map();
        for (let job of jobs) {
            for (let { key, value } of job.config) {
                fields.add(key);
                values.set(job.id + key, value);
            }
        }
        return (
            <Table>
                <TableRowHeader>
                    <TableHeader></TableHeader>
                    {jobs.map(job => <TableCellHeader key={job.id}><HideUnderscores string={job.experiment} />  <HueIndicator hue={hueScale(job.id)}/></TableCellHeader>)}
                </TableRowHeader>
                <TableRowHeader style={{marginBottom: '.5em'}}>
                    <TableHeader></TableHeader>
                    {jobs.map(job => <TableCellHeader key={job.id}><HideUnderscores string={job.job} /></TableCellHeader>)}
                </TableRowHeader>
                {Array.from(fields.values()).sort().map(field => (
                    <ConfigTableRow key={field} field={field}>
                    {jobs.map(({ id }) => values.get(id + field))}
                    </ConfigTableRow>
                ))}
            </Table>
        );
    }
}

export default ConfigPage;
