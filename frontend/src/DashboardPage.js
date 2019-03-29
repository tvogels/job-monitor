import React from "react";
import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';
import { LegendOrdinal } from '@vx/legend';

import { FacetChart } from "./TimeseriesPage";

function createDashboard(jobIds) {
  const createFacetChart = ({ measurementQuery, title }) => (
    <div>
      <h3 style={{ textAlign: "center" }}>{title}</h3>
      <FacetChart
        jobIds={jobIds}
        measurementQuery={[measurementQuery]}
        tagQuery={[]}
        lineOpacity={0.6}
        pattern={""}
        hue={"jobId"}
        style={{ height: "300px" }}
        xLabel="epochs"
        yLabel={title}
        hueShowLegend={false}
      />
    </div>
  );

  const trainingMetrics = [
    { measurementQuery: "loss", title: "Loss" },
    { measurementQuery: "tokens_per_sec", title: "Tokens/s" },
    { measurementQuery: "lr", title: "Learning rate" }
  ];

  const evaluationMetrics = [
    { measurementQuery: "CR_acc", title: "CR" },
    {measurementQuery: "MR_devacc", title: "MR"},
    {measurementQuery: "STS14_all_pearson_mean", title: "STS14"},
    { measurementQuery: "STS15_all_pearson_mean", title: "STS15" }
  ];

  return (
    <div>
      <h1>Sentence representations</h1>
      <h2>Training</h2>
      <div
        style={{
          display: "grid",
          "grid-template-columns": "repeat(3, 1fr)",
          width: "1200px"
        }}
      >
        {trainingMetrics.map(createFacetChart)}
      </div>
      <h2>Evaluation</h2>
      <div
        style={{ display: "grid", "grid-template-columns": "auto auto auto" }}
      >
        {evaluationMetrics.map(createFacetChart)}
      </div>
    </div>
  );
}

const DashboardPage = ({ jobIds }) =>
  jobIds.length > 0 ? (
    createDashboard(jobIds)
  ) : (
    <div>
      <h1>Sentence representations</h1>
      <p>Please select an experiment to display.</p>
    </div>
  );

export default DashboardPage;
