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
    { measurementQuery: "tokens_per_sec", title: "Tokens/s" }
  ];

  const evaluationMetrics = [
    { measurementQuery: "CR_acc", title: "CR" },
    {measurementQuery: "MR_devacc", title: "MR"},
    {measurementQuery: "STS14_all_pearson_mean", title: "STS14"},
    { measurementQuery: "STS15_all_pearson_mean", title: "STS15" }
  ];

  const margin = { left: 0, right: 0, top: 40, bottom: 60, row: 30, col: 30 };
  const hueDomain = Array.from(new Set(jobIds)).sort();
  const hueScale = scaleOrdinal(schemeCategory10).domain(hueDomain)

  const hueLegend = (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        backgroundColor: "rgb(62, 78, 91)",
        marginLeft: margin.left,
        marginRight: margin.right,
        padding: ".3em .8em"
      }}
    >
      <div style={{ marginRight: "1em" }}>
        jobId
      </div>
      <LegendOrdinal
        scale={hueScale}
        domain={hueDomain}
        direction="row"
        style={{ display: "flex", flexWrap: "wrap" }}
        labelMargin="0 20px 0 0"
      />
    </div>
  );

  return (
    <div>
      <h1>Sentence representations</h1>
      {hueLegend}
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
