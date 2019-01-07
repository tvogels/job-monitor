import React from 'react';
import { FacetChart } from '../TimeseriesPage';

export default {
    'slug': 'convex-baseline',
    'title': 'Convex problem (logistic regression on Epsilon) baseline',
    'date': new Date('2019-01-07'),
    'author': 'Thijs Vogels',
    'render': () => (
        <div>
            <h2>Training accuracy</h2>
            <FacetChart
                jobIds={["5c331f37f748a4291c5cdb5e","5c331f37f748a4291c5cdb5d","5c1d38ca965a7af03516e8e0","5c1d38ca965a7af03516e8df","5c1d38ca965a7af03516e8de","5c1d38ca965a7af03516e8dd","5c1d3189965a7aefe6cb072c","5c1d3189965a7aefe6cb072b","5c1d2034f748a4ee9ac40323","5c1d2034f748a4ee9ac40322"]}
                measurementQuery={["accuracy"]}
                tagQuery={["split=train"]}
                lineOpacity={0.8}
                ymin={".87"}
                pattern={""}
                hue={"measurement"}
                row={"optimizer_momentum"}
                col={"optimizer_learning_rate"}
                colLabelPrefix="LR = "
                rowLabelPrefix="Momentum = "
                style={{height: '400px'}}
            />
            <h2>Test accuracy</h2>
            <FacetChart
                jobIds={["5c331f37f748a4291c5cdb5e","5c331f37f748a4291c5cdb5d","5c1d38ca965a7af03516e8e0","5c1d38ca965a7af03516e8df","5c1d38ca965a7af03516e8de","5c1d38ca965a7af03516e8dd","5c1d3189965a7aefe6cb072c","5c1d3189965a7aefe6cb072b","5c1d2034f748a4ee9ac40323","5c1d2034f748a4ee9ac40322"]}
                measurementQuery={["accuracy"]}
                tagQuery={["split=test"]}
                lineOpacity={0.8}
                ymin={".87"}
                pattern={""}
                hue={"measurement"}
                row={"optimizer_momentum"}
                col={"optimizer_learning_rate"}
                colLabelPrefix="LR = "
                rowLabelPrefix="Momentum = "
                style={{height: '400px'}}
            />
        </div>
    )
};