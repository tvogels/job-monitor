import React from 'react';
import { FacetChart } from '../TimeseriesPage';

export default {
    'slug': 'cyclic-sampling',
    'title': 'Cyclic training batch sampling vs reshuffling every epoch',
    'date': new Date('2019-01-15'),
    'author': 'Thijs Vogels',
    'render': () => (
        <div>
            <p>
                I tried turning off the customary reshuffling the training set every epoch in the hope that it would be beneficial for RNA.
                Although there seems to be no quality hit when turning off the shuffling, RNA still produced the same roughly uniform weights in both cases.
            </p>
            <p>
                The graph below shows to repetitions each of a run with shuffled training batches (baseline) cyclic sampling (cyclic_sampling).
            </p>
            <p><strong>Test accuracy</strong></p>
            <FacetChart
                jobIds={["5c3c8ea6f0dd0422a1d9cbd0","5c3c8ea6f0dd0422a1d9cbd1","5c3c880df0dd041e3921beb2","5c3c880df0dd041e3921beb3"]}
                measurementQuery={["accuracy"]}
                tagQuery={["split=test"]}
                lineOpacity={1}
                ymin={".87"}
                pattern={""}
                hue={"job"}
                col={"measurement"}
                style={{height: '300px'}}
            />
        </div>
    )
};