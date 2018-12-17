import React from 'react';
import { InlineMath } from 'react-katex';
import Latex from 'react-latex';
import { FacetChart } from '../TimeseriesPage';

export default {
    'slug': 'gradient-prediction-1',
    'title': 'Initial gradient prediction experiments',
    'date': Date('2018-12-11'),
    'author': 'Thijs Vogels',
    'render': () => (
        <div>
            <h2>Gradient predictor</h2>
            <ul>
                <li>Coordinate-wise evaluation</li>
                <li>Input: past k gradient values for a coordinate</li>
                <li>Output: scalar prediction for the true gradient of the same coordinate</li>
                <li>Architecture: a small fully-connected NN</li>
                <li>Can predict either a scalar or <InlineMath math="k" /> weights <InlineMath math="\in [0, 1]" />, normalized with softmax</li>
            </ul>
            <h2>Training of gradient predictor</h2>
            <ul>
                <li>At iteration <Latex>$i$</Latex>:</li>
                <li>Sample two data batches <InlineMath math="b_1^i" />, <InlineMath math="b_2^i" /> of default size (128 images)</li>
                <li>Keep the last <InlineMath math="k" /> mini-batch gradients <Latex>{"$b_1^i, b_1^{i-1},\\ldots,b_1^{i-k+1}$"}</Latex>.</li>
                <li>Sample a batch (size 1024) of coordinates to constitute a batch for the gradient predictor.</li>
                <li><Latex>Use Adam (default params) to update the gradient predictor with this batch. The reference is the noisy estimate of the true gradient $b_2^i$. We use $L_2$ loss, so that the noise in the references cancels out in expectation.</Latex></li>
            </ul>
            <h2>Reuse of the second gradient sample</h2>
            <ul>
                <li>
                    <Latex>{"We can keep the last $k$ values of $\\frac{1}{2}(b_1+b_2)$ instead of just $b_1$. It's just that when we do an update step on the gradient predictor, the last gradient can only contain $b_1^i$."}</Latex>
                </li>
                <li>This makes the training and test distributions slightly different, so maybe this is a premature optimization.</li>
            </ul>

            <h2>Results</h2>

            <p>Note: we measure an <i>epoch</i> by the total number of gradients computed. We therefore have half the number of update steps in gradpred than in the baselines. Effectively, they use a larger batch size.</p>

            <h4>Norm</h4>

            <ul>
                <li>Norms of predicted gradients are considerably smaller than noisy onces.</li>
                <li>To make things more comparable, I renormalized the predicted gradients.</li>
            </ul>

            <p><center><strong>Gradient norm (L2)</strong></center></p>
            <FacetChart
                jobIds={["5c0a4deb49042a4f110e98cc","5c0a4deb49042a4f110e98d4"]}
                measurementQuery={["gradient_norm"]}
                tagQuery={[]}
                lineOpacity={0.3}
                ymax={"4"}
                pattern={""}
                hue={"gradient"}
                col={"optimizer_learning_rate"}
                colLabelPrefix="No momentum, learning rate = "
                style={{height: '300px'}}
            />


            <h4>Target quality &amp; convergence</h4>

            <ul>
                <li>The current SGD with gradient predictor beats SGD without momentum on Cifar10/VGG11. Not yet with momentum (there is a generalization gap.)</li>
            </ul>

            <p><center><strong>Test accuracy with weight prediction and renormalization</strong></center></p>
            <FacetChart
                jobIds={["5c0a7c1849042a5f1927ea8e","5c0a7c1949042a5f1927ea8f","5c0a7c1949042a5f1927ea90","5c0a7c1949042a5f1927ea91","5c0a7c1949042a5f1927ea92","5c0a7c1949042a5f1927ea93","5c0a7a2c49042a5cd9e4991c","5c0a7a2c49042a5cd9e4991b","5c0a7a2c49042a5cd9e4991a","5c0a7a2c49042a5cd9e49919","5c0a7a2c49042a5cd9e49918","5c0a7a2c49042a5cd9e49917","5c0a93aa49042a70f787c9c8","5c0fdf42632471f247eb43ec"]}
                measurementQuery={["accuracy"]}
                tagQuery={["split=test"]}
                lineOpacity={1.0}
                ymin={"0.6"}
                pattern={""}
                colLabelPrefix="Learning rate = "
                rowLabelPrefix="Momentum = "
                hue={"gradpred_is_active"}
                row={"optimizer_momentum"}
                col={"optimizer_learning_rate"}
                style={{height: '400px'}}
            />

            <h4>Accuracy in predicting the gradient</h4>

            <ul>
                <li>We compare the <Latex>$L_2$-norm</Latex> of the difference between the predicted gradient and <Latex>$b_2^i$</Latex> against two baselines: <Latex>{"$L_2(b_1^i, b_2^i)$ and $L_2(\\text{mean of last k gradients}, b_2^i)$"}</Latex></li>
                <li>We are always better than baseline 1, and (when using weight prediction, better than or equal to baseline 2.</li>
                <li>Important note: we do not expect these errors to go to zero, as <Latex>$b_2^i$</Latex> is just an estimate of the true gradient, and has residual noise.</li>
            </ul>

            <p><center><strong>Norm between predicted gradient and <Latex>$b_2^i$</Latex>, and two baselines</strong></center></p>
            <FacetChart
                jobIds={["5c0a4deb49042a4f110e98cc","5c0a4deb49042a4f110e98d0","5c0a4deb49042a4f110e98d4"]}
                measurementQuery={["gradpred_l2","gradpred_l2_last_baseline","gradpred_l2_mean_baseline"]}
                tagQuery={[]}
                lineOpacity={1.0}
                ymax={".001"}
                hue={"measurement"}
                row={"optimizer_momentum"}
                col={"optimizer_learning_rate"}
                colLabelPrefix="Learning rate = "
                rowLabelPrefix="Momentum = "
                style={{height: '300px'}}
            />
            <FacetChart
                jobIds={["5c0a4deb49042a4f110e98ca","5c0a4deb49042a4f110e98ce","5c0a4deb49042a4f110e98d2"]}
                measurementQuery={["gradpred_l2","gradpred_l2_last_baseline","gradpred_l2_mean_baseline"]}
                tagQuery={[]}
                lineOpacity={1.0}
                ymax={".0001"}
                hue={"measurement"}
                row={"optimizer_momentum"}
                col={"optimizer_learning_rate"}
                colLabelPrefix="Learning rate = "
                rowLabelPrefix="Momentum = "
                style={{height: '300px'}}
            />

            <h2>Ideas</h2>
            <ul>
                <li>Global features for the coordinate-wise gradient predictor</li>
                <li>Can we converge exactly to the full gradient if the weights don't change?</li>
                <li>Look at SAGA/SVRG and see if can use our trick somewhere in there.</li>
                <li>Larger LR instead of gradient renormalization: more stable update magnitude.</li>
            </ul>
        </div>
    )
};