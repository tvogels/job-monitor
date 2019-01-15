import { Button, ControlGroup, FormGroup, InputGroup, MenuItem, NumericInput } from '@blueprintjs/core';
import { MultiSelect, Select } from '@blueprintjs/select';
import { AxisBottom, AxisLeft } from '@vx/axis';
import { RectClipPath } from '@vx/clip-path';
import { curveBasis } from '@vx/curve';
import { Grid } from '@vx/grid';
import { Group } from '@vx/group';
import { LegendOrdinal } from '@vx/legend';
import { Point } from '@vx/point';
import { ParentSize } from '@vx/responsive';
import { Line, LinePath } from '@vx/shape';
import { Text } from '@vx/text';
import { extent } from 'd3-array';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';
import { nest } from 'd3-collection';
import gql from 'graphql-tag';
import React, { useState } from 'react';
import { Query } from 'react-apollo';
import { copyToClipboard, highlightText } from './utils';

const INDEX_QUERY = gql`
  query Job($ids: [ID]) {
    jobs(ids: $ids) {
      id
      experiment
      job
      config {
        key
        value
      }
      timeseries {
        measurement
        tags
      }
    }
  }
`;

const DATA_QUERY = gql`
  query Job($ids: [ID], $measurement: String!, $tags: String) {
    jobs(ids: $ids) {
      id
      experiment
      job
      config {
        key
        value
      }
      timeseries(measurement: $measurement, tags: $tags) {
        measurement
        tags
        values
      }
    }
  }
`;

const flattenCurveData = ({ jobs = [] }) => {
  const curves = [];
  for (let job of jobs) {
    for (let timeseries of job.timeseries) {
      const entry = {
        entryId: job.id + timeseries.measurement + JSON.stringify(timeseries.tags),
        job: job,
        values: timeseries.values || [],
        measurement: timeseries.measurement,
        tags: timeseries.tags,
        properties: {
          jobId: job.id,
          job: job.job,
          experiment: job.experiment,
          measurement: timeseries.measurement,
        }
      };
      for (let { key, value } of job.config) {
        entry.properties[key] = value;
      }
      for (let [key, value] of Object.entries(timeseries.tags)) {
        entry.properties[key] = value;
      }
      curves.push(entry);
    }
  }
  return curves;
};

const selectItemRenderer = (item, { handleClick, modifiers, query }) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }
  let text = item;
  if (text === '') {
    text = '<none>';
  }
  return (
    <MenuItem
      active={modifiers.active}
      disabled={modifiers.disabled}
      key={item}
      onClick={handleClick}
      text={highlightText(text.replace(/[-_]/g, ' '), query)}
    />
  );
};

function useSetState(defaultValue = []) {
  const [state, setState] = useState(defaultValue);
  const add = (item) => {
    setState([...state, item]);
  };
  const remove = (item) => {
    setState(state.filter(x => x !== item));
  };
  const toggle = (item) => {
    if (state.includes(item)) {
      remove(item);
    } else {
      add(item);
    }
  };
  return [state, add, remove, toggle, setState];
};

const getTagDomain = (curves) => {
  const tags = new Set();
  for (let curve of curves) {
    for (let [key, value] of Object.entries(curve.tags)) {
      tags.add(`${key}=${value}`);
    }
  }
  return Array.from(tags).sort();
};

const getInterestingProperties = (curves) => {
  const valuesPerProperty = new Map();
  for (let curve of curves) {
    for (let [property, value] of Object.entries(curve.properties)) {
      if (!valuesPerProperty.has(property)) {
        valuesPerProperty.set(property, new Set());
      }
      valuesPerProperty.get(property).add(value);
    }
  }
  const properties = [];
  for (let [property, values] of valuesPerProperty.entries()) {
    if (values.size > 1) {
      properties.push(property);
    }
  }
  properties.sort();
  return properties;
};

export const useFacetChartControllerState = () => {
  const [measurementQuery, , removeMeasurement, toggleMeasurement, setMeasurementQuery] = useSetState();
  const [tagQuery, , removeTag, toggleTag, setTagQuery] = useSetState();
  const [opacity, setOpacity] = useState(80);
  const [xmin, setXmin] = useState(null);
  const [xmax, setXmax] = useState(null);
  const [ymin, setYmin] = useState(null);
  const [ymax, setYmax] = useState(null);
  const [gridRows, setGridRows] = useState('');
  const [gridCols, setGridCols] = useState('');
  const [hue, setHue] = useState('job');
  const [pattern, setPattern] = useState('');
  const all = { measurementQuery, tagQuery, opacity, xmin, xmax, ymin, ymax, gridRows, gridCols, hue, pattern };
  const setters = { removeMeasurement, toggleMeasurement, removeTag, toggleTag, setOpacity, setXmin, setXmax, setYmin, setYmax, setGridRows, setGridCols, setHue, setPattern };
  const loadStateDict = ({ measurementQuery, tagQuery, opacity, xmin, xmax, ymin, ymax, gridRows, gridCols, hue, pattern }) => {
    setMeasurementQuery(measurementQuery);
    setTagQuery(tagQuery);
    setOpacity(opacity);
    setXmin(xmin);
    setXmax(xmax);
    setYmin(ymin);
    setYmax(ymax);
    setGridRows(gridRows);
    setGridCols(gridCols);
    setHue(hue)
    setPattern(pattern);
  };
  return {
    ...all,
    ...setters,
    all,
    loadStateDict
  }
};

const FacetChartController = ({ jobIds, state }) => {
  const { measurementQuery, tagQuery, opacity, xmin, xmax, ymin, ymax, gridRows, gridCols, hue, pattern } = state;
  const { removeMeasurement, toggleMeasurement, removeTag, toggleTag, setOpacity, setXmin, setXmax, setYmin, setYmax, setGridRows, setGridCols, setHue, setPattern } = state;
  const stateToClipboard = () => {
    copyToClipboard(JSON.stringify(state.all));
  };
  const handleKeyEvent = (event) => {
    if (event.key === 'v' && (event.ctrlKey || event.metaKey)) {
      navigator.clipboard
        .readText()
        .then(x => JSON.parse(x))
        .then(state.loadStateDict);
    }
  };
  return (
    <Query query={INDEX_QUERY} variables={{ ids: jobIds }}>
      {({ loading, error, data }) => {
        if (error) return <p>Error :( {JSON.stringify(error)}</p>;
        const curvesIndex = flattenCurveData(data);
        const measurementDomain = Array.from(new Set(curvesIndex.map(c => c.measurement))).sort();
        const tagDomain = getTagDomain(curvesIndex);
        const interestingProperties = ['', ...getInterestingProperties(curvesIndex)];
        return (
          <div style={{ display: 'flex', flexGrow: 1, flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex' }} tabIndex={0} onKeyDown={handleKeyEvent}>
              <FormGroup label="Measurement" style={{ marginRight: '1em' }}>
                <MultiSelect
                  tagRenderer={(x) => x}
                  tagInputProps={{ tagProps: { minimal: true }, onRemove: removeMeasurement }}
                  items={measurementDomain}
                  selectedItems={measurementQuery}
                  itemRenderer={selectItemRenderer}
                  itemPredicate={(query, item) => item.indexOf(query) >= 0}
                  onItemSelect={toggleMeasurement}
                  resetOnSelect={true}
                  resetOnQuery={true}
                  noResults={<MenuItem disabled={true} text="No timeseries found" />}
                  popoverProps={{ minimal: true }}
                />
              </FormGroup>
              <FormGroup label="Tags" style={{ marginRight: '1em' }}>
                <MultiSelect
                  tagRenderer={(x) => x}
                  tagInputProps={{ tagProps: { minimal: true }, onRemove: removeTag }}
                  items={tagDomain}
                  selectedItems={tagQuery}
                  itemRenderer={selectItemRenderer}
                  itemPredicate={(query, item) => item.indexOf(query) >= 0}
                  onItemSelect={toggleTag}
                  resetOnSelect={true}
                  resetOnQuery={true}
                  noResults={<MenuItem disabled={true} text="No timeseries found" />}
                  popoverProps={{ minimal: true }}
                />
              </FormGroup>
              <FormGroup label="Cols" style={{ marginRight: '1em' }}>
                <Select
                  items={interestingProperties}
                  itemRenderer={selectItemRenderer}
                  filterable={false}
                  resetOnSelect={true}
                  resetOnQuery={true}
                  onItemSelect={setGridCols}
                >
                  <Button text={gridCols} rightIcon="double-caret-vertical" />
                </Select>
              </FormGroup>
              <FormGroup label="Rows" style={{ marginRight: '1em' }}>
                <Select
                  items={interestingProperties}
                  itemRenderer={selectItemRenderer}
                  filterable={false}
                  resetOnSelect={true}
                  resetOnQuery={true}
                  onItemSelect={setGridRows}
                >
                  <Button text={gridRows} rightIcon="double-caret-vertical" />
                </Select>
              </FormGroup>
              <FormGroup label="Hue" style={{ marginRight: '1em' }}>
                <Select
                  items={interestingProperties}
                  itemRenderer={selectItemRenderer}
                  filterable={false}
                  resetOnSelect={true}
                  resetOnQuery={true}
                  onItemSelect={setHue}
                >
                  <Button text={hue} rightIcon="double-caret-vertical" />
                </Select>
              </FormGroup>
              <FormGroup label="Pattern" style={{ marginRight: '1em' }}>
                <Select
                  items={interestingProperties}
                  itemRenderer={selectItemRenderer}
                  filterable={false}
                  resetOnSelect={true}
                  resetOnQuery={true}
                  onItemSelect={setPattern}
                >
                  <Button text={pattern} rightIcon="double-caret-vertical" />
                </Select>
              </FormGroup>
              <FormGroup label="x-range" style={{ marginRight: '1em' }}>
                <ControlGroup>
                  <InputGroup
                    placeholder="min"
                    onChange={e => setXmin(e.target.value)}
                    style={{ width: '4em' }}
                    value={xmin ? xmin : ''}
                  />
                  <InputGroup
                    placeholder="max"
                    onChange={e => setXmax(e.target.value)}
                    style={{ width: '4em' }}
                    value={xmax ? xmax : ''}
                  />
                </ControlGroup>
              </FormGroup>
              <FormGroup label="y-range" style={{ marginRight: '1em' }}>
                <ControlGroup>
                  <InputGroup
                    placeholder="min"
                    onChange={e => setYmin(e.target.value)}
                    style={{ width: '4em' }}
                    value={ymin ? ymin : ''}
                  />
                  <InputGroup
                    placeholder="max"
                    onChange={e => setYmax(e.target.value)}
                    style={{ width: '4em' }}
                    value={ymax ? ymax : ''}
                  />
                </ControlGroup>
              </FormGroup>
              <FormGroup label="Opacity" style={{ marginRight: '1em' }}>
                <NumericInput
                  onValueChange={setOpacity}
                  min={0}
                  max={100}
                  stepSize={10}
                  style={{ width: '3em' }}
                  clampValueOnBlur={true}
                  value={opacity}
                />
              </FormGroup>
              <FormGroup label="State">
                <Button
                  icon="clipboard"
                  onClick={stateToClipboard}
                />
              </FormGroup>
            </div>
            <div style={{ display: 'flex', flexGrow: 1, flexDirection: 'column' }}>
              {measurementQuery.length > 0 ?
                <FacetChart
                  jobIds={jobIds}
                  measurementQuery={measurementQuery}
                  tagQuery={tagQuery}
                  lineOpacity={parseFloat(opacity) / 100}
                  xmin={xmin}
                  xmax={xmax}
                  ymin={ymin}
                  ymax={ymax}
                  pattern={pattern}
                  hue={hue}
                  row={gridRows === '' ? null : gridRows}
                  col={gridCols === '' ? null : gridCols}
                /> :
                null}
            </div>
          </div>
        );
      }}
    </Query>
  );
};

function relativeMousePosition(event) {
  const rect = event.target.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return { x, y };
}

export const FacetChart = (props) => {
  const { colLabelPrefix = '', rowLabelPrefix = '', hueLegendName, patternLegendName, jobIds, measurementQuery, tagQuery, row, col, pattern, hue, xValue = 'epoch', yValue = 'value', xmin, xmax, ymin, ymax, lineOpacity = 0.6, style } = props;
  const [crossHair, setCrossHair] = useState(null);

  const handleKeys = (event) => {
    if (event.key === 'c' && (event.ctrlKey || event.metaKey)) {
      const string = `
<FacetChart
${Object.entries(props).filter(([k, v]) => v != null).map(([k, v]) => `  ${k}={${JSON.stringify(v)}}`).join('\n')}
/>
      `.trim();
      copyToClipboard(string);
      console.log(string);
    }
  };

  const clipPathId = `clippath-${Math.floor(Math.random()*1000000)}`

  return (
    <Query query={DATA_QUERY} variables={{ ids: jobIds, measurement: measurementQuery.join('|'), tags: tagQuery.join(',') }}>
      {({ loading, error, data }) => {
        if (error) return <p>Error :( {JSON.stringify(error)}</p>;
        const curves = flattenCurveData(data);
        if (curves.length === 0) {
          return null;
        }

        const rowDomain = createDomain(curves.map(e => e.properties[row]));
        const colDomain = createDomain(curves.map(e => e.properties[col]));

        const ncols = colDomain.length;
        const nrows = rowDomain.length;

        const x = (d) => d[xValue];
        const y = (d) => d[yValue];
        const xExtent = extent(curves.map(e => e.values).flat(), x);
        const yExtent = extent(curves.map(e => e.values).flat(), y);
        const xDomain = [xmin || xExtent[0], xmax || xExtent[1]];
        const yDomain = [ymin || yExtent[0], ymax || yExtent[1]];
        const hueDomain = Array.from(new Set(curves.map(e => e.properties[hue]))).sort();
        const patternDomain = Array.from(new Set(curves.map(e => e.properties[pattern]))).sort();
        const hueScale = hue ? scaleOrdinal(schemeCategory10).domain(hueDomain) : null;
        const patternScale = pattern ? scaleOrdinal([null, [5, 5], [2, 2], [8, 4]]).domain(patternDomain) : null;

        const margin = { left: 60, right: 40, top: col != null ? 40 : 15, bottom: 60, row: 30, col: 30 };

        return (
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', ...style }} tabIndex={0} onKeyDown={handleKeys}>
            {hue ?
              <div style={{ display: 'flex', flexDirection: 'row', backgroundColor: 'rgb(62, 78, 91)', marginLeft: margin.left, marginRight: margin.right, padding: '.3em .8em' }}>
                <div style={{ marginRight: '1em' }}>{hueLegendName || hue.replace(/[-_]/g, ' ')}:</div>
                <LegendOrdinal
                  scale={hueScale}
                  domain={hueDomain}
                  direction="row"
                  style={{ display: 'flex', flexWrap: 'wrap' }}
                  labelMargin="0 20px 0 0"
                />
              </div>
              : null
            }
            {pattern ?
              <div style={{ display: 'flex', flexDirection: 'row', marginTop: '.5em', backgroundColor: 'rgb(62, 78, 91)', marginLeft: margin.left, marginRight: margin.right, padding: '.3em .8em' }}>
                <div style={{ marginRight: '1em' }}>{patternLegendName || pattern.replace(/[-_]/g, ' ')}:</div>
                {patternDomain.map(pattern => (
                  <div key={pattern} style={{ marginRight: '1.5em' }}>
                    <svg width={20} height={9}><line x1="0" y1="5" x2="15" y2="5" stroke="rgb(221, 226, 229)" strokeWidth={2} strokeDasharray={patternScale(pattern)} /></svg> {pattern}
                  </div>
                ))}
              </div>
              : null
            }
            <ParentSize style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              {parent => {
                const cellHeight = Math.max(0, Math.round((parent.height - margin.top - margin.bottom + margin.row) / nrows - margin.row));
                const cellWidth = Math.max(0, Math.round((parent.width - margin.left - margin.right + margin.col) / ncols - margin.col));
                let height = Math.max(parent.height, margin.top + margin.bottom);
                let width = Math.max(parent.width, margin.top + margin.bottom);

                const xScale = scaleLinear().domain(xDomain).rangeRound([0, cellWidth]);
                const yScale = scaleLinear().domain(yDomain).rangeRound([cellHeight, 0]).nice();

                const numTicksRows = Math.max(2, cellHeight / 50);
                const numTicksColumns = Math.max(2, cellWidth / 50);

                const handleClickOnChart = (event) => {
                  if (event.ctrlKey || event.metaKey || event.altKey) {
                    const { x, y } = relativeMousePosition(event);
                    const xs = xScale.invert(x);
                    const ys = yScale.invert(y);
                    setCrossHair({ x: xs, y: ys });
                  }
                };

                return (
                  <svg height={height} width={width}>
                    <RectClipPath id={clipPathId} x={0} y={0} width={cellWidth} height={cellHeight} />
                    {/* <rect x={0} y={0} width={width} height={height} fill="#fff" rx={2} /> */}
                    {colDomain.map((colValue, colIdx) => (
                      <AxisBottom
                        key={colIdx}
                        scale={xScale}
                        numTicks={numTicksColumns}
                        top={height - margin.bottom + 5}
                        left={margin.left + colIdx * (cellWidth + margin.col)}
                        label="Epochs"
                        hideZero
                      />
                    ))}
                    {rowDomain.map((rowValue, rowIdx) => (
                      <AxisLeft
                        key={rowIdx}
                        scale={yScale}
                        numTicks={numTicksRows}
                        top={margin.top + rowIdx * (margin.row + cellHeight)}
                        left={margin.left - 5}
                        // label={measurement.replace(/[_-]/g, ' ').replace('|', ' / ')}
                      />
                    ))}
                    {col != null ? colDomain.map((colValue, colIdx) => (
                      <Text fill="rgb(221, 226, 229)" key={colIdx} textAnchor="middle" y={margin.top - 15} x={margin.left + cellWidth / 2 + colIdx * (cellWidth + margin.col)}>{`${colLabelPrefix}${colValue}`.replace(/[-_]/g, ' ')}</Text>
                    )) : null}
                    {row != null ? rowDomain.map((rowValue, rowIdx) => (
                      <Text fill="rgb(221, 226, 229)" key={rowIdx} textAnchor="middle" angle={90} x={width - margin.right + 15} y={margin.top + cellHeight / 2 + rowIdx * (cellHeight + margin.row)}>{`${rowLabelPrefix}${rowValue}`.replace(/[-_]/g, ' ')}</Text>
                    )) : null}
                    {rowDomain.map((rowValue, rowIdx) => (
                      <Group key={rowIdx} top={margin.top + rowIdx * (margin.row + cellHeight)}>
                        {colDomain.map((colValue, colIdx) => (
                          <Group key={colIdx} left={margin.left + colIdx * (margin.col + cellWidth)}>
                            <rect fill="rgb(62, 78, 91)" width={cellWidth} height={cellHeight} />
                            <Grid
                              xScale={xScale}
                              yScale={yScale}
                              stroke="rgb(50, 63, 76"
                              numTicksRows={numTicksRows}
                              numTicksColumns={numTicksColumns}
                              width={cellWidth}
                              height={cellHeight}
                            />
                            {crossHair ? <Line clipPath="url(#cell-clip-path)" stroke="rgba(221, 226, 229, 0.5)" strokeDasharray={[3, 3]} from={new Point({ x: 0, y: yScale(crossHair.y) })} to={new Point({ x: cellWidth, y: yScale(crossHair.y) })} /> : null}
                            {crossHair ? <Line clipPath="url(#cell-clip-path)" stroke="rgba(221, 226, 229, 0.5)" strokeDasharray={[3, 3]} from={new Point({ x: xScale(crossHair.x), y: 0 })} to={new Point({ x: xScale(crossHair.x), y: cellHeight })} /> : null}
                            {curves.filter(e => e.properties[row] === rowValue && e.properties[col] === colValue).map(entry => (
                              <LinePath
                                key={entry.entryId}
                                data={aggregateBy(entry.values, d => x(d))}
                                clipPath={`url(#${clipPathId})`}
                                // defined={(d) => (y(d) >= yDomain[0] && y(d) <= yDomain[1] && x(d) >= xDomain[0] && x(d) <= xDomain[1])}
                                x={d => xScale(x(d))} y={d => yScale(y(d))}
                                stroke={hue ? hueScale(entry.properties[hue]) : 'rgb(221, 226, 229)'}
                                strokeDasharray={pattern ? patternScale(entry.properties[pattern]) : null}
                                opacity={lineOpacity}
                                strokeWidth={2}
                                curve={curveBasis}
                              />
                            ))}
                            <rect fill="rgba(0, 0, 0, 0)" width={cellWidth} height={cellHeight} onClick={handleClickOnChart} />
                          </Group>
                        ))}
                      </Group>
                    ))}
                  </svg>
                );
              }}
            </ParentSize>
          </div>
        );
      }}
    </Query>
  );
};

/**
 * Take the mean of a list of dictionaries
 */
function dictMean(dictionaries) {
  if (dictionaries.length === 0) {
    return [];
  }
  const mean = {...dictionaries[0]};
  let i = 1;
  for (let entry of dictionaries.slice(1)) {
    i += 1;
    for (let [key, value] of Object.entries(entry)) {
      mean[key] += (1/i) * (value - mean[key]);
    }
  }
  return mean;
}

/**
 * Aggreagate a list of data by a certain key
 * Used to make sure that there is only one y per x value in a list of data points for a scatter plot
 */
function aggregateBy(values, byFn, aggregationFn=dictMean) {
  return nest().key(byFn).rollup(aggregationFn).entries(values).map(({ value }) => value);
}

/**
 * Extract unique values from an array
 */
function createDomain(values) {
  let uniqueValues = Array.from(new Set(values)).sort();
  if (uniqueValues.length === 0) {
    return [];
  }
  const type = typeof values[0];
  const typeIsConsistent = uniqueValues.every(v => (typeof v) === type);
  if (typeIsConsistent && type === 'number') {
    uniqueValues = new Float64Array(uniqueValues);
    uniqueValues.sort();
    uniqueValues = Array.from(uniqueValues);
  }
  return uniqueValues;
}

const TimeseriesPage = ({ jobIds, facetChartState }) => (
  <div style={{ flexGrow: 1, flexShrink: 1, display: 'flex', overflow: 'hidden' }}>
    <FacetChartController jobIds={jobIds} state={facetChartState} />
  </div>
)

export default TimeseriesPage;

// export default ({ jobIds }) => (
//   <Query query={INDEX_QUERY} variables={{ ids: jobIds }}>
//     { ({ loading, error, data }) => {
//       if (loading) return <Spinner />;
//       if (error) return "Error :(";
//       return <TimeseriesPage jobs={data.jobs} />;
//     }}
//   </Query>
// );