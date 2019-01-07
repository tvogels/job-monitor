import React from 'react';
import { FacetChart } from '../TimeseriesPage';

export default {
    'slug': 'gradient-prediction-2',
    'title': 'Gradient prediction: reusing past predictions + larger learning rates',
    'date': new Date('2018-12-17'),
    'author': 'Thijs Vogels',
    'render': () => (
        <div>
            <h2>Summary</h2>
            <p>
                Last week, we discussed initial experiments with gradient prediction.
                Martin raised the question if we can make sure the predicted gradients can converge to the true gradient if we don't move.
                I tried two ways to make sure this can work:
            </p>
            <ul>
                <li>Incorporate gradient prediction like this into an algorithm of the form of SVRG/SAGA: haven't found a way yet.</li>
                <li>Feed past predictions as an input to the predictor. This way it has access to a pratically infinite time horizon and if things don't move, it can derive a full gradient.</li>
            </ul>
            Some findings are:
            <ul>
                <li>Gradient re-normalization is not needed. Just larger learning rates.</li>
                <li>The use of past predictions is not yet convincingly demonstrated, except that we can save memory and reduce the problem to optimizing a kind of <strong>momentum</strong>.</li>
                <li>We have still not reached optimal test accuracy for this model.</li>
            </ul>
            <h2>Test accuracy</h2>
            <FacetChart
                jobIds={["5c164c1b3a74965f46406829","5c164c1b3a74965f46406827","5c164c1b3a74965f46406825","5c164c1b3a74965f46406823","5c164c1b3a74965f46406820","5c164c1b3a74965f4640681e","5c164c1b3a74965f4640681c","5c164c1b3a74965f4640681a","5c14c012d7b85d576a388d6a","5c14c012d7b85d576a388d68","5c14c012d7b85d576a388d66","5c14c012d7b85d576a388d64","5c14c012d7b85d576a388d61","5c14c012d7b85d576a388d5f","5c14c012d7b85d576a388d5d","5c14c012d7b85d576a388d5b","5c13c54d87c31711a78ee76a","5c13c54d87c31711a78ee768","5c13c54d87c31711a78ee766","5c13c54d87c31711a78ee764","5c13c54d87c31711a78ee761","5c13c54d87c31711a78ee75f","5c13c54d87c31711a78ee75d","5c13c54d87c31711a78ee75b"]}
                measurementQuery={["accuracy"]}
                tagQuery={["split=test"]}
                lineOpacity={1.0}
                ymin={".8"}
                pattern={""}
                hue={"gradpred_num_gradients"}
                hueLegendName="# past grads."
                row={"gradpred_num_predicted_gradients"}
                col={"optimizer_learning_rate"}
                colLabelPrefix="Learning rate = "
                rowLabelPrefix="# pred. grads = "
                style={{height: '40em', width: '80em', marginLeft: '-15em'}}
            />

            <h2>Gradient norm</h2>
            <FacetChart
                jobIds={["5c164c1b3a74965f46406829","5c164c1b3a74965f46406827","5c164c1b3a74965f46406825","5c164c1b3a74965f46406823","5c164c1b3a74965f46406820","5c164c1b3a74965f4640681e","5c164c1b3a74965f4640681c","5c164c1b3a74965f4640681a","5c14c012d7b85d576a388d6a","5c14c012d7b85d576a388d68","5c14c012d7b85d576a388d66","5c14c012d7b85d576a388d64","5c14c012d7b85d576a388d61","5c14c012d7b85d576a388d5f","5c14c012d7b85d576a388d5d","5c14c012d7b85d576a388d5b","5c13c54d87c31711a78ee76a","5c13c54d87c31711a78ee768","5c13c54d87c31711a78ee766","5c13c54d87c31711a78ee764","5c13c54d87c31711a78ee761","5c13c54d87c31711a78ee75f","5c13c54d87c31711a78ee75d","5c13c54d87c31711a78ee75b"]}
                measurementQuery={["gradient_norm"]}
                tagQuery={["weight=module.features.16.bias"]}
                lineOpacity={1.0}
                ymin={""}
                ymax={".2"}
                pattern={""}
                hue={"gradient"}
                row={"gradpred_num_predicted_gradients"}
                col={"optimizer_learning_rate"}
                colLabelPrefix="Learning rate = "
                rowLabelPrefix="# pred. grads = "
                style={{height: '40em', width: '80em', marginLeft: '-15em'}}
            />

            <h2>Gradient prediction accuracy</h2>
            <FacetChart
                jobIds={["5c164c1b3a74965f46406829","5c164c1b3a74965f46406827","5c164c1b3a74965f46406825","5c164c1b3a74965f46406823","5c164c1b3a74965f46406820","5c164c1b3a74965f4640681e","5c164c1b3a74965f4640681c","5c164c1b3a74965f4640681a","5c14c012d7b85d576a388d6a","5c14c012d7b85d576a388d68","5c14c012d7b85d576a388d66","5c14c012d7b85d576a388d64","5c14c012d7b85d576a388d61","5c14c012d7b85d576a388d5f","5c14c012d7b85d576a388d5d","5c14c012d7b85d576a388d5b","5c13c54d87c31711a78ee76a","5c13c54d87c31711a78ee768","5c13c54d87c31711a78ee766","5c13c54d87c31711a78ee764","5c13c54d87c31711a78ee761","5c13c54d87c31711a78ee75f","5c13c54d87c31711a78ee75d","5c13c54d87c31711a78ee75b"]}
                measurementQuery={["gradpred_l2","gradpred_l2_last_baseline","gradpred_l2_mean_baseline"]}
                tagQuery={[]}
                lineOpacity={1.0}
                ymin={""}
                ymax={".0001"}
                pattern={""}
                hue={"measurement"}
                hueLegendName="Measurement"
                row={"gradpred_num_predicted_gradients"}
                col={"optimizer_learning_rate"}
                colLabelPrefix="Learning rate = "
                rowLabelPrefix="# pred. grads = "
                style={{height: '40em', width: '80em', marginLeft: '-15em'}}
            />

            <h2>Usefulness of gradient renormalization</h2>
            <p>Accuracy:</p>
            <FacetChart
                jobIds={["5c14c012d7b85d576a388d63","5c14c012d7b85d576a388d64","5c14c012d7b85d576a388d65","5c14c012d7b85d576a388d66","5c14c012d7b85d576a388d68","5c14c012d7b85d576a388d6a","5c13c54d87c31711a78ee75a","5c13c54d87c31711a78ee75b","5c13c54d87c31711a78ee75c","5c13c54d87c31711a78ee75d","5c13c54d87c31711a78ee75e","5c13c54d87c31711a78ee75f","5c13c54d87c31711a78ee760","5c13c54d87c31711a78ee761"]}
                measurementQuery={["accuracy"]}
                tagQuery={[]}
                lineOpacity={1.0}
                ymin={".8"}
                pattern={""}
                hue={"gradpred_adjust_norm"}
                hueLegendName="Renormalize gradients"
                row={"optimizer_learning_rate"}
                rowLabelPrefix="Learning rate = "
                col={"split"}
                style={{height: '40em', width: '80em', marginLeft: '-15em'}}
            />

            <p>Better <strong>cross-entropy</strong> without renormalization</p>
            <FacetChart
                jobIds={["5c14c012d7b85d576a388d63","5c14c012d7b85d576a388d64","5c14c012d7b85d576a388d65","5c14c012d7b85d576a388d66","5c14c012d7b85d576a388d68","5c14c012d7b85d576a388d6a","5c13c54d87c31711a78ee75a","5c13c54d87c31711a78ee75b","5c13c54d87c31711a78ee75c","5c13c54d87c31711a78ee75d","5c13c54d87c31711a78ee75e","5c13c54d87c31711a78ee75f","5c13c54d87c31711a78ee760","5c13c54d87c31711a78ee761"]}
                measurementQuery={["cross_entropy"]}
                tagQuery={[]}
                lineOpacity={1.0}
                ymin={""}
                ymax={"1"}
                pattern={""}
                hue={"gradpred_adjust_norm"}
                hueLegendName="Renormalize gradients"
                row={"optimizer_learning_rate"}
                rowLabelPrefix="Learning rate = "
                col={"split"}
                style={{height: '40em', width: '80em', marginLeft: '-15em'}}
            />

            <h2>Momentum coefficient</h2>
            <p>If we make the prediction based on only the current gradient and the past prediction, we are effectively determining a kind of momentum coefficient. This is how it evolves over time. I wonder why the weights go up and then slowly down after rate decay.</p>
            <FacetChart
                jobIds={["5c17911187c31771878f6af5","5c17911187c31771878f6af9","5c17911187c31771878f6afd"]}
                measurementQuery={["mean_pred_weight","std_pred_weight"]}
                tagQuery={[]}
                lineOpacity={0.2}
                pattern={""}
                hue={"measurement"}
                hueLegendName="Measurement"
                col={"optimizer_learning_rate"}
                colLabelPrefix="Learning rate = "
                style={{height: '30em', width: '80em', marginLeft: '-15em'}}
            />

            <h2>Directions</h2>
            <ul>
                <li>Single set of weights, rather than a prediction per coordinate. Linear least squares?</li>
                <li>Where could this help? Gradient norm does become small automatically, but learning rate decay is still necessary. We could try to combine this with t-averaging?</li>
                <li>Try a convex problem: ask Negar</li>
                <li>Try momentum on top of this</li>
                <li>Write down noisy second batch updates</li>
            </ul>
        </div>
    )
};
