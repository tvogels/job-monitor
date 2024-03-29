import React from 'react';
import reports from './content';
import moment from 'moment';
import { Link, useRouteMatch } from "react-router-dom";

export const ReportIndex = () => {
    const match = useRouteMatch();
    return (
        <div style={{width: '50em', margin: '0 auto'}} className="bp3-running-text">
            <h1>Reports</h1>
            <ul>
                {reports.map(report => (
                    <li key={report.slug}>
                        <Link to={`/${match.params.project}/reports/${report.slug}`}>{moment(report.date).format('DD-MM-YYYY')} - {report.title}</Link>
                    </li>
                ))}
            </ul>
        </div>
    )
};

export const ReportPage = ({ match }) => {
    const report = reports.find(r => r.slug === match.params.slug);
    if (!report) {
        return <div>No report found for {match.params.slug}.</div>;
    }
    return (
        <div style={{flexGrow: 1, height: '100%'}}>
        <div style={{width: '50em', margin: '0 auto', marginBottom: '3em'}} className="bp3-running-text">
            <h1>{report.title}</h1>
            <p>{report.author} – {moment(report.date).format('LL')}</p>
            <hr />
            {report.render()}
        </div>
        </div>
    );
}