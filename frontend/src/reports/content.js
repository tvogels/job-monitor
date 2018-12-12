import React from 'react';
import { FacetChart } from '../TimeseriesPage';
const reports = [];

const next = {
    'slug': 'next',
    'title': 'Next',
    'date': Date('2018-12-12'),
    'author': 'Thijs Vogels',
    'render': () => (
        <div>
            <h4>This is an example:</h4>
            <FacetChart
                jobIds={["5c102689a3eae914cd321520","5c0fdf42632471f247eb43ec","5c0fdf42632471f247eb43ed","5c0fdf42632471f247eb43eb","5c0fdf42632471f247eb43ea","5c0a7a2c49042a5cd9e4991c","5c0a7a2c49042a5cd9e4991b","5c0a7a2c49042a5cd9e4991a","5c0a7a2c49042a5cd9e49919","5c0a7a2c49042a5cd9e49918","5c0a7a2c49042a5cd9e49917","5c10268ba3eae914cd321524"]}
                measurementQuery={["accuracy"]}
                tagQuery={["split=test"]}
                lineOpacity={0.8}
                ymin={"0.6"}
                pattern={""}
                hue={"optimizer_decay_at_epochs"}
                row={"optimizer_momentum"}
                col={"optimizer_learning_rate"}
                colLabelPrefix={"Learning rate = "}
                rowLabelPrefix={"Momentum = "}
                hueLegendName="Decay at epochs"
                style={{height: '35em'}}
            />
        </div>
    )
};
reports.push(next);

export default reports;