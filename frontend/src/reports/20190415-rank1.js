import React from 'react';
import Latex from 'react-latex';
import { FacetChart } from '../TimeseriesPage';

const m = (formula) => <Latex>{`$${formula}$`}</Latex>;

export default {
    'slug': 'rank1',
    'title': 'Error Feedback SGD with Approximate Rank-1 Compression',
    'date': new Date('2019-04-15'),
    'author': 'Thijs Vogels',
    'render': () => (
        <div>
            <p>
                A couple of week went past with me trying to get Error Feedback SGD to work with heavily compressed Rank-1 updates. Results looked pretty good for the normal batch size, where we can effectively match the qualty of normal full-precision SGD in the regular 300 epochs for Cifar 10. We do notice degraded performance when increasing the batch size to allow actual distributed training.
            </p>
            <p>
                I am starting to loose track of the experiments conducted a few weeks ago, so this report is meant to list recent findings. Most of the code for this can be found on the branch <code>error-feedback-sgd-dist</code>.
            </p>

            <p>
                The compression is basically as follows:
                <ul>
                    <li>Interpret a weight tensor as a matrix {m('X')}.</li>
                    <li>Sample a random <Latex>{`$q$`}</Latex></li>
                    <li>Set {m(`p = X \\hat{q}`)}</li>
                    <li>Set {m(`q = X^\\top \\hat{p}`)}</li>
                    <li>The rank 1 approximation is {m(`\\tilde X = \\hat p q^\\top`)}</li>
                </ul>
                This can be done exactly distributed, as long as we average after each matrix multiplication with {m('X')}.
            </p>

            <h2>Speed</h2>
            <p>Speed and scalability is very good.</p>
            <p>For the zero-step approximate power iteration on matrices per tensor, the reduction in communication versus full-precision gradients <strong>244x</strong>.</p>

            <p><strong>Timing benchmark for 8 workers (Cifar 10, 256 batch per worker, using all-reduce with ‘gloo’)</strong></p>
            <table>
                <thead>
                    <tr>
                        <th></th>
                        <th>Exact</th>
                        <th>Rank 1</th>
                        <th>Speedup</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th>Batch time</th>
                        <td>0.30712s</td>
                        <td>0.12766s</td>
                        <td>2.4x</td>
                    </tr>
                    <tr>
                        <th>Reduction operation</th>
                        <td>0.19816s</td>
                        <td>0.01873s</td>
                        <td>10.6x</td>
                    </tr>
                </tbody>
            </table>

            <h2>Linear sketches</h2>
            <p>
                We tried to use linear sketches as Rank 1 approximations
                Those would have the benefit that averaging the sketches would give the same as sketching the average matrix. This was without success. Neither the <a href="https://arxiv.org/abs/1609.00048">two-vector sketch</a> or <a href="http://users.cms.caltech.edu/~jtropp/reports/TYUC18-More-Practical-TR.pdf">four-vector sketch</a> from Joel Tropp could compete with a simple 1-step power iteration. Neither in terms of convergence of the EF-SGD algorithm, nor in terms of cosine distance between compressed and original matrices.
            </p>

            <h2>Ping-pong compressor</h2>
            <p>
                We tried to adapt the algorithm described above to use previous {m('q')} instead of a random value. This seemed to help a little bit, but we couldn't prove this to be better than random query vectors, so we dropped it for now.
            </p>

            <h2>Fixed effective learning rate</h2>
            <p>
                Previously, when validating the claim that in batch-normed convolution layers, weight decay just fixes the effective LR those layers, we found that fixing the norm of those weight tensors works great. We applied this approach to Error Feedback SGD to see if this brings them on par with a properly tuned full-precision SGD. It seems that it does for batch size 256:
            </p>

            <p><strong>Test accuracy (running avg.)</strong></p>
            <FacetChart
                jobIds={["5c9221c195b4a72b62ef81f9", "5c914afe59adbc1813c38416", "5c73c4ae537fcf03c7182043", "5c73c4ae537fcf03c7182041", "5c73c4ae537fcf03c7182042", "5c914c1859adbc188413883b", "5c914c1859adbc188413883a", "5c914c1859adbc1884138839", "5c92a6c815eeff448f83f005", "5c92a6c815eeff448f83f004", "5c92a6c815eeff448f83f003", "5c92220695b4a72bf6408c21", "5c914c1859adbc188413883c"]}
                measurementQuery={["runavg_accuracy"]}
                tagQuery={["split=test"]}
                ymin={.9}
                ymax={.95}
                lineOpacity={.9}
                pattern={""}
                hue={"fix_conv_weight_norm"}
                col={"optimizer_compressor"}
                row={"measurement"}
                hueLegendName="Fixing effective learning rate"
                style={{ height: '25em', width: '80em', marginLeft: '-15em', marginTop: '1.5em' }}
            />

            <h2>Scaling up the batch size</h2>
            <p>
                We observe a notable gap in test performance when using large batch sizes. The gap is larger than with exact gradients. Multiple lines of the same color represent different seeds. <strong>scaling exact errorfb</strong> uses exact gradients. The other two are results with rank1 compression with different code bases with unknown difference :)
            </p>
            <FacetChart
                jobIds={["5ca6274526715963b13c9e9e", "5ca6274526715963b13c9e9d", "5ca6274526715963b13c9e9c", "5ca6274526715963b13c9e9b", "5ca5f0612671595583e306ef", "5ca5f0612671595583e306ee", "5ca5f0612671595583e306ed", "5ca59f6fc5d7b343086fce82", "5ca59f6fc5d7b343086fce81", "5ca59f6fc5d7b343086fce80", "5ca59f6fc5d7b343086fce7f", "5ca322af84c4c452f902d721", "5ca320ce84c4c450f38d4061", "5ca233fd03efa348e80be92a", "5ca2209003efa33e611aea33", "5ca619b22671595e5c8179ac", "5ca619b22671595e5c8179ad", "5ca619b22671595e5c8179ab", "5ca619b22671595e5c8179ae"]}
                measurementQuery={["runavg_accuracy"]}
                tagQuery={["split=test"]}
                lineOpacity={0.9}
                ymin={.9}
                ymax={0.95}
                pattern={""}
                hue={"optimizer_batch_size"}
                hueLegendName="Batch size"
                style={{ height: '25em', width: '80em', marginLeft: '-15em', marginTop: '1.5em' }}
                row={"measurement"}
                col={"experiment"}
            />

            <h4>Momentum before reduction</h4>
            <p>We tried to apply momentum before the reduction/update. The results seemed better in the first few epochs, but turned out significantly worse. See <code>scaling_rank1_errorfb/rank1_batch*mom_wd_before_reduce</code>.</p>

            <h4>Precomputed randomness</h4>
            <p>
                There seemed to have been a regression in the codebase. Part of the culprit was the precomputed random vector {m('q')} that we used for the rank 1 computation. By switching this to fresh random vectors, we maybe got a small improvement in test quality. Quite surprising, but also not super convincing.
            </p>
            <FacetChart
                jobIds={["5ca71bd1fc1cb40bbb7115e0", "5ca71cb9fc1cb40c9c870ff6", "5ca748c88546c81187b47c0b", "5ca748e98546c811af1b4475", "5ca770258546c81925383566", "5ca7703f8546c819671dc554"]}
                measurementQuery={["runavg_accuracy"]}
                tagQuery={["split=test"]}
                lineOpacity={0.9}
                ymin={.9}
                ymax={0.95}
                pattern={""}
                hue={"optimizer_batch_size"}
                hueLegendName="Batch size"
                style={{ height: '25em', width: '80em', marginLeft: '-15em', marginTop: '1.5em' }}
                row={"measurement"}
                col={"job"}
            />

            <h2>More power-iteration steps</h2>
            <p>Investigating the effect of different numbers of power-iteration steps in the rank 1 approximation algorithm. This is zero against 3 steps. Compare with <code>scaling exact errorfb</code> for the full-gradient baseline.</p>

            <FacetChart
                jobIds={["5cab0304fbe54519586a25ea", "5cab0304fbe54519586a25e9", "5cab0304fbe54519586a25e8", "5cab0304fbe54519586a25e7", "5cab02e2fbe5451927fb9e81", "5cab02e2fbe5451927fb9e80", "5cab02e2fbe5451927fb9e7f", "5cab02e2fbe5451927fb9e7e", "5cab227cfbe5451caffbe8e3", "5cab227cfbe5451caffbe8e1", "5cab227cfbe5451caffbe8e2", "5cab227cfbe5451caffbe8e4", "5ca5f0612671595583e306ef", "5ca5f0612671595583e306ee", "5ca5f0612671595583e306ed", "5ca5f0612671595583e306ec", "5ca59f6fc5d7b343086fce82", "5ca59f6fc5d7b343086fce81", "5ca59f6fc5d7b343086fce80", "5ca59f6fc5d7b343086fce7f"]}
                measurementQuery={["runavg_accuracy"]}
                tagQuery={["split=test"]}
                lineOpacity={0.9}
                ymin={.9}
                ymax={0.95}
                pattern={""}
                hue={"optimizer_batch_size"}
                hueLegendName="Batch size"
                style={{ height: '25em', width: '80em', marginLeft: '-15em', marginTop: '1.5em' }}
                row={"measurement"}
                col={"experiment"}
            />


            <h2>Nesterov momentum</h2>
            <p>
                Tao insisted I try Nesterov momentum instead of the heavy ball I have always used. Note the graphs use averaging over periods of 30 epoch.
            </p>
            <FacetChart
                jobIds={["5cb48727f88f508135319f70", "5cb48727f88f508135319f71", "5cb48727f88f508135319f72", "5cb48727f88f508135319f73", "5cb49b7a7a7375839fa61421", "5cb49b7a7a7375839fa61422", "5cb49b7a7a7375839fa61424", "5cb49b7a7a7375839fa61423"]}
                measurementQuery={["runavg_accuracy"]}
                tagQuery={["split=test"]}
                lineOpacity={0.9}
                ymin={.9}
                ymax={0.95}
                pattern={""}
                hue={"momentum_type"}
                row={"optimizer_batch_size"}
                col={"optimizer_reducer"}
                hueLegendName="Type of momentum: "
                rowLabelPrefix="Batch size = "
                style={{ height: '40em', width: '80em', marginLeft: '-15em', marginTop: '1.5em' }}
            />
            <p>
                Here's another plot that shows these results. <strong>Nesterov</strong> on the left, <strong>Heavy ball</strong> on the right. What the graphs don't show, is that they could improve even further if use averaging instead of a learning rate drop.
            </p>
            <FacetChart
                jobIds={["5cb4f744d792d59e432581e4", "5cb4f744d792d59e432581e7", "5cb4f744d792d59e432581ea", "5cb4f744d792d59e432581ed", "5cab227cfbe5451caffbe8e1", "5cab227cfbe5451caffbe8e2", "5cab227cfbe5451caffbe8e4", "5cab227cfbe5451caffbe8e3"]}
                measurementQuery={["last_accuracy"]}
                tagQuery={["split=test"]}
                lineOpacity={0.9}
                ymin={".9"}
                ymax={".95"}
                pattern={""}
                hue={"optimizer_batch_size"}
                hueLegendName={"Batch size"}
                row={"measurement"}
                col={"experiment"}
                rowLabelPrefix="Batch size = "
                style={{ height: '25em', width: '80em', marginLeft: '-15em', marginTop: '1.5em' }}
            />

            <h2>Long averaging instead of learning rate drop</h2>
            <p>The plots above show that decaying the learning rate is not a good idea in general. The drop is too early for error-feedback-gradient-based methods, so let's see what happens if we don't drop.</p>
            <p>The results indeed get better, but so does the baseline. Note that these results use regular heavy-ball momentum.</p>

            <FacetChart
                jobIds={["5cb44c517a737571bd4d0589", "5cb44c517a737571bd4d058a", "5cb44c517a737571bd4d058b"]}
                measurementQuery={["runavg_accuracy"]}
                tagQuery={["split=test"]}
                lineOpacity={0.9}
                ymin={".9"}
                ymax={".95"}
                pattern={""}
                hue={"job"}
                hueLegendName={"Job"}
                row={"measurement"}
                style={{ height: '22em', width: '80em', marginLeft: '-15em', marginTop: '1.5em' }}
            />

            <h2>Comparing against other compression schemes</h2>
            <p>We compare against</p>
            <ul>
                <li><code>Exact</code> — exact gradients</li>
                <li><code>SignAndNorm</code> — message size is 7.5x bigger + no all_reduce</li>
                <li><code>RandomSparse</code> — random selection from the memory is sent, message size equal to Rank1</li>
                <li><code>RandomSparseBlock</code> — same as above, but sending consequtive blocks for efficiency</li>
                <li><code>TopK</code> — Sending top K gradients entries in absolute value. Cannot use all-reduce.</li>
            </ul>
            <FacetChart
                jobIds={
                    [
                        "5cb5c5777a7375b4f96f9c76", "5cb5c5777a7375b4f96f9c77", "5cb5c5777a7375b4f96f9c78", "5cb5c5777a7375b4f96f9c79", "5cb5c5777a7375b4f96f9c7a", "5cb5c5777a7375b4f96f9c7b", "5cb5c5777a7375b4f96f9c7c", "5cb5c5777a7375b4f96f9c7d", "5cb5c5777a7375b4f96f9c7e", "5cb5c5777a7375b4f96f9c7f", "5cb5c5777a7375b4f96f9c80", "5cb5c5777a7375b4f96f9c81", "5cb57fe5c2472da03a5a67a3", "5cb57fe6c2472da03a5a67a9", "5cb57fe6c2472da03a5a67af", "5cb57fe6c2472da03a5a67b5", "5cb57fe6c2472da03a5a67b9", "5cb57fe6c2472da03a5a67b3", "5cb57fe6c2472da03a5a67ad", "5cb57fe6c2472da03a5a67a7",
                        "5cc2cd9ed7847c96ba475cde", "5cc2cd9ed7847c96ba475cdd", "5cc2cd9ed7847c96ba475cdc", "5cc2cd9ed7847c96ba475cdb"
                    ]}
                measurementQuery={["runavg_accuracy"]}
                tagQuery={["split=test"]}
                lineOpacity={0.9}
                ymax={".95"}
                ymin={".9"}
                pattern={""}
                hue={"optimizer_reducer"}
                colLabelPrefix={"Batch size "}
                hueLegendName={"Communication"}
                col={"optimizer_batch_size"}
                row={"measurement"}
                style={{ height: '22em', width: '80em', marginLeft: '-15em', marginTop: '1.5em' }}
            />

            <h2>Full-precision SVD</h2>

            <p>Using a truncated exact singular value decomposition, we can evaluate what we can achieve if we improve the quality of the power-iteration style rank 1 factorization. From rank 4, we catch up with Sign+Norm and full-precision gradient communication. In that case, it is still 2x more compressed than Sign+Norm (assuming actual 1-bit tensors).</p>

            <FacetChart
                jobIds={["5cc2d265d7847c9a5fbcf08a", "5cc2d265d7847c9a5fbcf08b", "5cc2d265d7847c9a5fbcf08c", "5cc1a512d7847c85bea8cd83", "5cb57fe6c2472da03a5a67b9", "5cb5c5777a7375b4f96f9c81"]}
                measurementQuery={["runavg_accuracy"]}
                tagQuery={["split=test"]}
                lineOpacity={0.8}
                ymin={".9"}
                row={"measurement"}
                pattern={""}
                colLabelPrefix={"Batch size "}
                hueLegendName="Gradients"
                hue={"reducer_name"}
                col={"optimizer_batch_size"}
                style={{ height: '30em', width: '80em', marginLeft: '-15em', marginTop: '1.5em' }}
            />

            <h2>Normfix</h2>
            <p>Inspecting the effective learning rate of conv layers with batch norm, I saw that there was more difference between the batch sizes for Rank 1 than for exact gradients. This observation motivated a new attempt to see if normfix can help for large batch sizes. The experiment <code>reducers_with_normfix</code> shows that it is consistently worse for <strong>batch size 2048</strong>.</p>

            <FacetChart
                jobIds={["5cc15e9d96fc5671910db420", "5cb57fe6c2472da03a5a67b9", "5cb57fe6c2472da03a5a67b7", "5cc15e9d96fc5671910db41f", "5cc15e9d96fc5671910db41e", "5cb57fe6c2472da03a5a67b5"]}
                measurementQuery={["runavg_accuracy"]}
                tagQuery={["split=test"]}
                lineOpacity={0.9}
                ymin={".8"}
                row={"measurement"}
                pattern={""}
                hueLegendName="Gradients"
                hue={"reducer_name"}
                col={"fix_conv_weight_norm"}
                colLabelPrefix={"Normfix = "}
                style={{ height: '22em', width: '80em', marginLeft: '-15em', marginTop: '1.5em' }}
            />


            <h2>Reusing query vectors in the large batch setting</h2>
            <p>Previously, in the case of batch size 256, we could not show the benefits of reusing the old query points in power-iteration-style apprixmate rank 1. We have now seen that in the larger-batch setting, extra power iteration steps improve the quality of convergence.</p>

            <p>We now find that reusing old query vectors gets us the same benefit as an extra step of power-iteration. This is great, because it saves a factor 2 in communication.</p>

            <FacetChart
                jobIds={["5cc69b24b98614cd8f54dafa", "5cc69b1ab98614cd78362481", "5cc69b1ab98614cd78362480", "5cc5f69fcb3e0bc916629375", "5cc5f69fcb3e0bc916629374", "5cc15e9d96fc5671910db420", "5cc1a512d7847c85bea8cd83", "5cc69b24b98614cd8f54dafb", "5cb57fe6c2472da03a5a67b7"]}
                measurementQuery={["runavg_accuracy"]}
                tagQuery={["split=test"]}
                lineOpacity={0.9}
                ymin={".9"}
                ymax={".95"}
                pattern={""}
                hueLegendName="Gradients"
                hue={"reducer_name"}
                col={"optimizer_batch_size"}
                row={"measurement"}
                colLabelPrefix={"Batch size "}
                style={{ height: '30em', width: '80em', marginLeft: '-15em', marginTop: '1.5em' }}
            />

            <h2>Optimized memory allocation for Rank 1</h2>
            <p>
                I changed the rank 1 computation to use pre-allocated contiguous memory. This makes the reduction operation very simple, as it avoids having to copy the vectors into a buffer for sending. It also makes it easy to reuse past query vectors. When <code>reuse == true</code>, the time for a single-worker rank 1 compression is now only 0.008s, compared to 0.015s with fresh new random vectors each iteration.
            </p>

            <h2>Code refactoring</h2>
            <p>
                I changed the code a bit. I removed the notion of 'different optimizers'. Because the optimizer is the center of attention for this project, all of its code is in the main <code>train.py</code>. Also, the 'tasks' are refactored considerably, making it much easier to add new tasks such as a transformer model.
            </p>
            <p>The experiment <code>rank1_new_code</code> is the first experiment with this new code, and there is no sign of performance regressions.</p>
        </div>
    )
};
