import React from 'react';
import Latex from 'react-latex';
import cp from './20190218/cp.png'
import tucker from './20190218/tucker.png'
import alignment from './20190218/alignment.svg'
import rel_error from './20190218/rel_error.svg'

export default {
    'slug': 'tensor-decompositions',
    'title': 'Tensor Decompositions & Weight Decay / BatchNorm',
    'date': new Date('2019-02-18'),
    'author': 'Thijs Vogels',
    'render': () => (
        <div>
            <h2>Averaging with fixed learning rate: DenseNet</h2>
            <p>
                When writing the EDIC semester report, I reviewed the findings from last semester.
                The most interesting results seems to be that we can achieve state-of-the-art accuracy for image classification
                without decaying the learning rate as long as we average. Averaging also give us better insight into how fast the network is learning.
            </p>
            <p>
                I wanted to see if this finding is universal, or specific to ResNets, to tried it out on a DenseNet.
                It seems that we can achieve similar results there. For details see <code>5c48969cfb2f1112d2e9a16c</code> and <code>5c48969cfb2f1112d2e9a16b</code>.
                Experiment <code>5c497371f0dff31b3a432d1b</code> contains results for varying averaging windows.
            </p>

            <h2>Understanding weight decay in batch-normed layers</h2>
            <p>This is something Praneeth proposed to investigate.</p>
            <p>
                The paper <i>Three Mechanisms of Weight Decay Regularization</i> by Zhang et al. (2018), discusses that the reason for the effectiveness of L2 regularization in convolution layers that are followed by Batch Norm cannot be that their norm stays small. In fact, the model is invariant to changes to the L2 norm of these weights.
            </p>
            <p>
                They claim that weight decay works for those layers just by controlling the effective learning rate <Latex>{`$\\frac{\\eta}{|\\theta|^2_2}$`}</Latex>. They test this slightly unconvincingly: first, they train a model with weight decay and store the norms of the parameters at each epoch. Then, they train a model without weight decay and reset the norms of the parameters to match those of the first iteration at each epoch.
            </p>
            <p>
                We wanted to verify their results byfixing the effective learning rate exactly. We keep the norm of the convolutional weights that are followed by batch norm fixed to 1 by renormalizing them after every iteration.
            </p>
            <p>We confirm the findings of the authors: this works very well.<br></br>See experiment <code>5c531cfa7824479b724b3ee4</code> (no_weight_decay_normfix1)</p>


            <h2>Tensor Factorization</h2>

            <p>We have to applications in mind that require factorizing weight tensors: gradient compression and model compression/growing. I studied various ways to factorize tensors. An excellent overview paper is “Tensor Decompositions and Applications” by Kolda et al. The two most prominent methods are CP decomposition and Tucker decomposition. They are illustarted below:</p>

            <figure>
                <img alt="CP Decomposition" src={cp} style={{maxWidth: '100%'}} />
                <figcaption>CP decomposition: sum of rank 1 combinations</figcaption>
            </figure>

            <figure>
                <img alt="Tucker decomposition" src={tucker} style={{maxWidth: '100%'}} />
                <figcaption>Tucker decomposition: a core matrix multiplied (made larger) along each dimension by sequentially multiplying the slices in each dimension with matrices.</figcaption>
            </figure>

            <p>The problem with both of these methods is that a low rank approximation does not have such nice properties as in the matrix-case. For example: the best rank 4 approximation is not necessarily a subset of the best rank 5 approximation.</p>


            <h2>Gradient compression &amp; Error-feedback SGD</h2>
            <p>Praneeth proposed to investigate Rank 1-compressed gradient updates in the framework of error-feedback SGD.</p>

            <h3>Replication of results by Quentin and Praneeth</h3>
            <p>Works well with sign+norm when batch norm is on. When it is off, the algorithm <strong>doesn't converge</strong>. I verified this with a generous grid search over learning rates.</p>

            <h3>Fast Rank 1 approximation</h3>
            <p>We can get a reasonably good estimate very fast by sampling a vector <Latex>{`$\\vec{p}$`}</Latex> and computing <Latex>{`$\\vec{q}=\\mathbf{X} \\mathbf{X}^\\text{T} \\mathbf{X} \\vec{p}$`}</Latex> If this vector is normalized, <Latex>{`$\\vec{p} \\, \\vec{q}^\\text{T}$`}</Latex> is a good rank 1 approximation of the matrix. This method is called fast<sub>1</sub> in the comparisson of approximation quality of various compression methods below</p>

            <h3>Approximation quality of compression methods</h3>

            <figure style={{display: 'flex', marginLeft: 0, marginRight: 0}}>
            <div style={{flex: '1 1 50%', marginRight: '1em', position: 'relative'}}>
                <img alt="Alignment" src={alignment} style={{backgroundColor: 'white', marginRight: '1em', width: '100%'}}></img>
            </div>
            <div style={{flex: '1 1 50%', position: 'relative'}}>
                <img alt="Relative error" src={rel_error} style={{backgroundColor: 'white', width: '100%'}}></img>
            </div>
            </figure>

            <p>So the fast rank 1 approximation is considerably smaller than using the sign of vectors, and is closer in L2-distance and in alignment to the real gradient. Funnily enough, it is not as good in the optimization. It has more trouble reacing 100% training accuracy, and needs approximately 10x more iterations to reach the same test accuracy.</p>

            <p>The memory norm grows approximately linearly and obviously becomes pretty big. Should it be discounted a bit?</p>

            <p>Interesting question: what makes sign better than rank 1, if it is not the alignment or l2-distance to the real gradient?</p>


            <h2>Model compression &amp; progressive training</h2>
            <p>Started experimenting with simple linear least squares regression. A problem is that growing by duplicating the rank 1 components fails, because any update would stay rank 1. I believe a solution is to keep one factor the same, and divide the weight in the other factor. Which one would be best?</p>

        </div>
    )
};
