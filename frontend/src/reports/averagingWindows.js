import { FormGroup, InputGroup, NumericInput } from '@blueprintjs/core';
import { AxisBottom, AxisLeft } from '@vx/axis';
import { RectClipPath } from '@vx/clip-path';
import { Grid } from '@vx/grid';
import { Group } from '@vx/group';
import { Text } from '@vx/text';
import { range } from 'd3-array';
import { scaleLinear } from 'd3-scale';
import gql from 'graphql-tag';
import React, { useState } from 'react';
import { Query } from 'react-apollo';
import Latex from 'react-latex';
import { Motion, spring } from 'react-motion';
import { HideUnderscores } from '../utils';

const QUERY = gql`
  query Job($jobId: ID!) {
    job(id: $jobId) {
      id
      job
      config {
          key
          value
      }
      jsonFile(filename: "windows.json")
    }
  }
`;

const OTHER_QUERY = gql`
  query Job($jobId: ID!) {
    job(id: $jobId) {
      id
      job
      config {
          key
          value
      }
      timeseries(measurement: "accuracy", tags: "split=test") {
          measurement
          tags
          currentValue
      }
    }
  }
`;

const measurementName = {
    'ema_accuracy': 'exp. mov. avg',
    't_avg2_accuracy': 't avg',
    'last_accuracy': 'last point',
    'runavg_accuracy': 'epoch avg'
}

const fontFamily = '-apple-system, "BlinkMacSystemFont", "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Open Sans", "Helvetica Neue", "Icons16", sans-serif';

const formatWindow = (start, size) => start.toString().padStart(3, '0') + '-' + (start + size).toString().padStart(3, '0');

const AverageViewer = ({ jobId }) => {
    const [windowSize, setWindowSize] = useState(1);
    const [ymin, setYmin] = useState(0.8);
    return (
        <Query query={QUERY} variables={{ jobId }}>
        {({ loading, error, data: { job } }) => {
            if (loading) return 'Loading ...';
            if (error) return JSON.stringify(error);
            const config = new Map(job.config.map(({ key, value }) => [key, value]));
            const epochs = JSON.parse(config.get('epochs'));
            const windows = job.jsonFile;
            const height = 500;
            const width = 740;
            const margin = { left: 40, right: 80, bottom: 50, top: 40 };
            const cellWidth = width - margin.left - margin.right;
            const cellHeight = height - margin.top - margin.bottom;
            const xDomain = [0, epochs[epochs.length - 1] + 1];
            const yDomain = [ymin, 1];

            const numTicksRows = Math.max(2, cellHeight / 50);
            const numTicksColumns = Math.max(2, cellWidth / 50);

            const xScale = scaleLinear().domain(xDomain).rangeRound([0, cellWidth]);
            const yScale = scaleLinear().domain(yDomain).rangeRound([cellHeight, 0]).nice();

            const clipPathId = `clippath-${Math.floor(Math.random()*1000000)}`

            let topAccuracy = 0.0;
            for (let result of Object.values(windows)) {
                if (result.accuracy > topAccuracy) {
                    topAccuracy = result.accuracy;
                }
            }

            return (
                <Query query={OTHER_QUERY} variables={{ jobId: config.get('weights_from_job') }}>
                {({ loading, error, data }) => {
                    if (loading) return "Loading ...";
                    if (error) return JSON.stringify(error);
                    const srcjob = data.job;
                    const srcconfig = new Map(srcjob.config.map(({ key, value }) => [key, value]));
                    const baselines = [];
                    for (let ts of srcjob.timeseries) {
                        const measurement = ts.measurement;
                        const value = ts.currentValue[0].value;
                        baselines.push({ measurement, value });
                    }
                    return (
                        <div>
                            <h4><HideUnderscores string={srcjob.job} /> ({srcconfig.get('task_architecture')}) {config.get('use_average_checkpoints') ? 'avg': ''}</h4>
                            <div style={{display: 'flex', flexDirection: 'row'}}>
                                <FormGroup label="Window size" style={{marginRight: '1em'}}><NumericInput value={windowSize} onValueChange={setWindowSize} min={1} max={epochs.length} /></FormGroup>
                                <FormGroup label="Y min"><InputGroup value={ymin} onChange={(e) => setYmin(e.target.value)} /></FormGroup>
                            </div>
                            <svg height={height} width={width}>
                                <RectClipPath id={clipPathId} x={0} y={0} width={cellWidth} height={cellHeight} />
                                <AxisBottom
                                    scale={xScale}
                                    numTicks={numTicksColumns}
                                    top={height - margin.bottom + 5}
                                    left={margin.left}
                                    label="Epoch"
                                    hideZero
                                    stroke="rgb(221, 226, 229)"
                                    tickStroke="rgb(221, 226, 229)"
                                    labelProps={{ textAnchor: 'middle', fontFamily: fontFamily, fontSize: 10, fill: 'rgb(221, 226, 229)' }}
                                    tickLabelProps={(val, i) => ({ dy: '0.25em', textAnchor: 'middle', fontFamily: fontFamily, fontSize: 10, fill: 'rgb(221, 226, 229)' })}
                                />
                                <AxisLeft
                                    scale={yScale}
                                    numTicks={numTicksRows}
                                    top={margin.top}
                                    left={margin.left - 5}
                                    // label={measurement.replace(/[_-]/g, ' ').replace('|', ' / ')}
                                    stroke="rgb(221, 226, 229)"
                                    tickStroke="rgb(221, 226, 229)"
                                    labelProps={{ textAnchor: 'middle', fontFamily: fontFamily, fontSize: 10, fill: 'rgb(221, 226, 229)' }}
                                    tickLabelProps={(val, i) => ({ dx: '-0.25em', dy: '0.25em', textAnchor: 'end', fontFamily: fontFamily, fontSize: 10, fill: 'rgb(221, 226, 229)' })}
                                />
                                <Group left={margin.left} top={margin.top}>
                                    <rect fill="rgb(62, 78, 91)" width={cellWidth} height={cellHeight} />
                                    <Grid
                                        xScale={xScale}
                                        yScale={yScale}
                                        stroke="rgb(50, 63, 76)"
                                        numTicksRows={numTicksRows}
                                        numTicksColumns={numTicksColumns}
                                        width={cellWidth}
                                        height={cellHeight}
                                    />
                                    {range(epochs.length - windowSize + 1).map(windowStart => (
                                        <Motion
                                            key={windowStart + windowSize}
                                            defaultStyle={{opacity: 0.0, y: cellHeight, x1: 0.0}}
                                            style={{
                                                opacity: 1,
                                                y: spring(yScale(windows[formatWindow(windowStart, windowSize)].accuracy)),
                                                x1: spring(epochs[Math.max(0, windowStart)]),
                                        }}>
                                        {({ opacity, y, x1 }) => (
                                            <Group>
                                                <line
                                                    clipPath={`url(#${clipPathId})`}
                                                    x1={windowSize === 1 ? xScale(x1) : 5 + xScale(x1)}
                                                    x2={xScale(epochs[windowStart + windowSize - 1])}
                                                    y1={y}
                                                    y2={y}
                                                    stroke="rgba(255, 255, 255, 0.3)"
                                                    opacity={opacity}
                                                    strokeWidth={1}
                                                />
                                                <circle
                                                    clipPath={`url(#${clipPathId})`}
                                                    cy={y}
                                                    cx={xScale(epochs[windowStart + windowSize - 1])}
                                                    r={2}
                                                    fill="#fff"
                                                    opacity={opacity}
                                                />
                                            </Group>
                                        )}
                                        </Motion>
                                    ))}
                                    <Motion defaultStyle={{ y: cellHeight }} style={{y: spring(yScale(topAccuracy))}}>
                                    {({ opacity, y, x1 }) => (
                                        <line
                                            clipPath={`url(#${clipPathId})`}
                                            x1={0}
                                            x2={cellWidth}
                                            y1={y}
                                            y2={y}
                                            stroke="rgba(255, 0, 0, 0.6)"
                                            strokeWidth={1}
                                    />
                                    )}
                                    </Motion>
                                    {baselines.map(({ measurement, value }) => (
                                        <Motion key={measurement} defaultStyle={{ y: cellHeight }} style={{y: spring(yScale(value))}}>
                                        {({ opacity, y, x1 }) => (
                                            <Group top={y} left={cellWidth}>
                                                <line
                                                    x2={5}
                                                    stroke="orange"
                                                    strokeWidth={2}
                                                />
                                                <Text x={8} verticalAnchor="middle" fontFamily={fontFamily} fontWeight={200} fontSize={8} stroke="orange">{measurementName[measurement]}</Text>
                                            </Group>
                                        )}
                                        </Motion>
                                    ))}
                                </Group>
                            </svg>
                        </div>
                    );
                }}
                </Query>
            )
        }}
        </Query>
    );
};


export default {
    'slug': 'averaging-windows',
    'title': 'Averaging windows',
    'date': Date('2018-12-19'),
    'author': 'Thijs Vogels',
    'render': () => (
        <div>
            <p>20 checkpoints are collected from SGD without decay on Cifar10 with ResNet and VGG architectures. These checkpoints are evenly spaced, 15 epochs apart. We consider the quality of models that are uniform average over a window of these checkpoints. The plots below let you interact with the size of the window. We can see that there is indeed such a thing as 'too much averaging'.</p>
            <p>In the right margin, we can see the final values (at the last epoch) of the T-average of all iterates, the average over the last epoch, and an expontentially weighted average with <Latex>$\alpha=0.998$</Latex>.</p>
            <AverageViewer jobId="5c1a26add066142bb9e25a46" />
            <AverageViewer jobId="5c1a2803d066142c9ea5a4f9" />
            <AverageViewer jobId="5c1a2a58d066142d57737f6a" />
        </div>
    )
};
