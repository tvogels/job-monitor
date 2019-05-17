import { ButtonGroup, FormGroup, NumericInput } from '@blueprintjs/core';
import React from 'react';
import { NavLink } from "react-router-dom";

const FilterBar = ({ filter, setFilter, limit, setLimit, statusFilter, setStatusFilter, style }) => (
    <div style={{ display: 'flex', flexDirection: 'row', ...style }}>
        <FormGroup
            style={{ marginRight: '.6em' }}
            label="Filter"
            labelFor="filter-input"
        >
            <input id="filter-input" className="bp3-input" placeholder="Filter" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </FormGroup>
        <FormGroup
            style={{ marginRight: '.6em' }}
            label="Limit"
            labelFor="limit-input">
            <NumericInput id="limit-input" value={limit} placeholder="Limit" onValueChange={(val) => setLimit(isNaN(val) ? 0 : val)} />
        </FormGroup>
        <FormGroup
            label="Status"
            labelFor="status-input"
        >
            <div className="bp3-select">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">Any</option>
                    <option value="CREATED">Created</option>
                    <option value="RUNNING">Running</option>
                    <option value="QUEUE">Queue</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="FINISHED">Finished</option>
                    <option value="FAILED">Failed</option>
                    <option value="UNRESPONSIVE">Unresponsive</option>
                    <option value="CANCELED">Canceled</option>
                </select>
            </div>
        </FormGroup>
        <FormGroup
            style={{ marginLeft: '1em' }}
            label="&nbsp;">
            <ButtonGroup>
                <NavLink className="bp3-button bp3-icon-list" to="/config" activeClassName="bp3-active">Config</NavLink>
                <NavLink className="bp3-button bp3-icon-database" to="/logs" activeClassName="bp3-active">Logs</NavLink>
                <NavLink className="bp3-button bp3-icon-chart" to="/timeseries" activeClassName="bp3-active">Timeseries</NavLink>
                <NavLink className="bp3-button bp3-icon-document" to="/reports" activeClassName="bp3-active">Reports</NavLink>
                <NavLink className="bp3-button bp3-icon-media" to="/images" activeClassName="bp3-active">Images</NavLink>
            </ButtonGroup>
        </FormGroup>
    </div>
);

export default FilterBar;
