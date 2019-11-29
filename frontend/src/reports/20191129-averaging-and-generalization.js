import React from "react";
// import Latex from "react-latex";
import { FacetChart } from "../TimeseriesPage";

// const m = formula => <Latex>{`$${formula}$`}</Latex>;

export default {
    slug: "avg-generalization",
    title: "Miscelaneous experiments on averaging windows and generalization",
    date: new Date("2019-11-29"),
    author: "Thijs Vogels",
    render: () => (
        <div>
            <p>
                Time to revive the averaging project. I ran some long experiments on image classification. I used my
                favourite ResNet11 with BatchNorm and VGG11 without BatchNorm. The goals were (1) find out if the
                learning rate matters if you average enough. Can it be too high? We try to answer this, and note a few
                miscelaneous observations for future reference.
            </p>

            <p>It contains some hints regarding the usefulness of ResNet / BatchNorm for generalization.</p>

            <h2>Learning rates: too high or too small?</h2>

            <h3>ResNet (BatchNorm)</h3>
            <p>
                For a ResNet, it seems that the higher the learning rate is, the better.
                <br />
                <strong>TODO</strong> Verify the 0.4 line. This wasn't ready when writing this.
                <br />
                <strong>Smaller learning rates seem to generalize equally well, but train (much) slower!</strong>
            </p>
            <p>
                <center>
                    <strong>Test</strong>
                </center>
            </p>
            <FacetChart
                jobIds={[
                    "5ddc0e048fb44987814fce9b",
                    "5ddc0e048fb44987814fce9c",
                    "5de132f1a77c0e64b3b66692",
                    "5de13e6da77c0e6aad2836b0"
                ]}
                measurementQuery={["100epoch_avg_cross_entropy", "last_cross_entropy"]}
                tagQuery={["split=test"]}
                lineOpacity={0.5}
                ymin={"0"}
                ymax={"0.7"}
                pattern={""}
                hue={"optimizer_learning_rate"}
                row={"split"}
                col={"measurement"}
                hueLegendName="Learning rate"
                rowLabelPrefix={"Cross entropy / "}
                style={{ height: "30em", width: "80em", marginLeft: "-15em", marginTop: "1.5em" }}
            />

            <p>
                <center>
                    <strong>Train</strong>
                </center>
            </p>
            <FacetChart
                jobIds={[
                    "5ddc0e048fb44987814fce9b",
                    "5ddc0e048fb44987814fce9c",
                    "5de132f1a77c0e64b3b66692",
                    "5de13e6da77c0e6aad2836b0"
                ]}
                measurementQuery={["100epoch_avg_cross_entropy", "last_cross_entropy"]}
                tagQuery={["split=track_batch_00"]}
                lineOpacity={0.5}
                ymin={"0"}
                ymax={"0.7"}
                pattern={""}
                hue={"optimizer_learning_rate"}
                row={"split"}
                col={"measurement"}
                hueLegendName="Learning rate"
                rowLabelPrefix={"Cross entropy / "}
                style={{ height: "30em", width: "80em", marginLeft: "-15em", marginTop: "1.5em" }}
            />

            <h3>VGG (no batch norm)</h3>

            <p>For VGG, the same seems to be true. But small learning rates are not just slower, but worse.</p>

            <p>learning rate * weight decay is kept constant -- this lead the better results</p>

            <p>Note: lr=0.2 diverged.</p>

            <FacetChart
                jobIds={[
                    "5de12ca2a77c0e62508842d4",
                    "5ddfbc5ebf3007315e704807",
                    "5ddfbc5ebf3007315e704806",
                    "5de13dcca77c0e6997fd243a"
                ]}
                measurementQuery={["100epoch_avg_cross_entropy", "last_cross_entropy"]}
                lineOpacity={0.5}
                ymin={"0"}
                ymax={".7"}
                tagQuery={[]}
                pattern={""}
                hue={"optimizer_learning_rate"}
                row={"split"}
                col={"measurement"}
                hueLegendName="Learning rate"
                rowLabelPrefix={"Cross entropy / "}
                style={{ height: "60em", width: "80em", marginLeft: "-15em", marginTop: "1.5em" }}
            />

            <h2>ResNets keep improving generalization after reaching a stationary distribution.</h2>

            <p>
                <center>
                    <strong>Test</strong>
                </center>
            </p>
            <FacetChart
                jobIds={["5ddc0e048fb44987814fce9c", "5dde44588cbd53f93e50dfd0", "5de13e6da77c0e6aad2836b0"]}
                measurementQuery={["100epoch_avg_cross_entropy", "10epoch_avg_cross_entropy", "last_cross_entropy"]}
                tagQuery={["split=test"]}
                lineOpacity={0.5}
                xmax={"1000"}
                ymax={".7"}
                pattern={""}
                hue={"optimizer_learning_rate"}
                row={"split"}
                col={"measurement"}
                hueLegendName="Learning rate"
                rowLabelPrefix={"Cross entropy / "}
                style={{ height: "30em", width: "80em", marginLeft: "-15em", marginTop: "1.5em" }}
            />

            <p>
                <center>
                    <strong>Train</strong>
                </center>
            </p>
            <FacetChart
                jobIds={["5ddc0e048fb44987814fce9c", "5dde44588cbd53f93e50dfd0", "5de13e6da77c0e6aad2836b0"]}
                measurementQuery={["100epoch_avg_cross_entropy", "10epoch_avg_cross_entropy", "last_cross_entropy"]}
                tagQuery={["split=track_batch_00"]}
                lineOpacity={0.5}
                xmax={"1000"}
                ymax={".7"}
                pattern={""}
                hue={"optimizer_learning_rate"}
                row={"split"}
                col={"measurement"}
                hueLegendName="Learning rate"
                rowLabelPrefix={"Cross entropy / "}
                style={{ height: "30em", width: "80em", marginLeft: "-15em", marginTop: "1.5em" }}
            />

            <h2>Distance to the average – are we moving?</h2>

            <p>
                <strong>QUESTION</strong> Are the averages moving?
            </p>

            <p>We plot distance of the final iterate of the epoch to the average model.</p>

            <h3>ResNet</h3>
            <p>Yes, and very consistently. Same for different LR. Something seems fishy. BatchNorm?</p>
            <FacetChart
                jobIds={["5ddc0e048fb44987814fce9c", "5ddc0e048fb44987814fce9b"]}
                measurementQuery={["distance_from_10ep_avg", "distance_from_1ep_avg"]}
                tagQuery={[]}
                lineOpacity={0.5}
                xmax={"200"}
                ymax={""}
                pattern={""}
                hue={"optimizer_learning_rate"}
                row={"split"}
                col={"measurement"}
                hueLegendName="Learning rate"
                rowLabelPrefix={"Cross entropy / "}
                style={{ height: "30em", width: "80em", marginLeft: "-15em", marginTop: "1.5em" }}
            />

            <h3>VGG</h3>

            <p>For VGG, it decreases. This seems to make more sense ...</p>
            <FacetChart
                jobIds={["5ddfbc5ebf3007315e704807", "5ddfbc5ebf3007315e704806"]}
                measurementQuery={["distance_from_10ep_avg", "distance_from_1ep_avg", "distance_from_100ep_avg"]}
                tagQuery={[]}
                lineOpacity={0.5}
                xmax={"300"}
                ymax={"1000"}
                pattern={""}
                hue={"optimizer_learning_rate"}
                row={"split"}
                col={"measurement"}
                hueLegendName="Learning rate"
                rowLabelPrefix={"Cross entropy / "}
                style={{ height: "30em", width: "80em", marginLeft: "-15em", marginTop: "1.5em" }}
            />
            <p>
                <strong>QUESTION</strong> Can we use distance to the average as an indicator for averaging/lr?
                Stagnation here may indicate failure to improve.
            </p>

            <h2>VGG: high weight-decay disallows long averaging</h2>

            <FacetChart
                jobIds={[
                    "5ddfbc5ebf3007315e704806",
                    "5ddfb6d3bf30072ebbcd7985",
                    "5de13b13a77c0e6795b787c3",
                    "5de13b13a77c0e6795b787c4"
                ]}
                measurementQuery={["100epoch_avg_cross_entropy", "10epoch_avg_cross_entropy", "last_cross_entropy"]}
                tagQuery={["split=test"]}
                lineOpacity={0.8}
                xmin={"0"}
                xmax={"400"}
                ymin={".2"}
                ymax={".7"}
                pattern={""}
                hue={"optimizer_weight_decay"}
                row={"split"}
                col={"measurement"}
                hueLegendName="Weight decay"
                rowLabelPrefix={"Cross entropy / "}
                style={{ height: "30em", width: "80em", marginLeft: "-15em", marginTop: "1.5em" }}
            />

            <h2>Tune such that the average achieves zero training error?</h2>

            <p>While keeping the training error of the last iterate as high as possible.</p>
            <p>
                <center>
                    <strong>Test</strong>
                </center>
            </p>
            <FacetChart
                jobIds={[
                    "5ddfbc5ebf3007315e704806",
                    "5ddfb6d3bf30072ebbcd7985",
                    "5de13b13a77c0e6795b787c3",
                    "5de13b13a77c0e6795b787c4"
                ]}
                measurementQuery={["100epoch_avg_cross_entropy", "last_cross_entropy"]}
                tagQuery={["split=test"]}
                lineOpacity={0.8}
                xmin={"0"}
                xmax={""}
                ymin={"0"}
                ymax={"1"}
                pattern={""}
                hue={"optimizer_weight_decay"}
                row={"split"}
                col={"measurement"}
                hueLegendName="Weight decay"
                rowLabelPrefix={"Cross entropy / "}
                style={{ height: "30em", width: "80em", marginLeft: "-15em", marginTop: "1.5em" }}
            />
            <p>
                <center>
                    <strong>Train</strong>
                </center>
            </p>
            <FacetChart
                jobIds={[
                    "5ddfbc5ebf3007315e704806",
                    "5ddfb6d3bf30072ebbcd7985",
                    "5de13b13a77c0e6795b787c3",
                    "5de13b13a77c0e6795b787c4"
                ]}
                measurementQuery={["100epoch_avg_cross_entropy", "last_cross_entropy"]}
                tagQuery={["split=track_batch_00"]}
                lineOpacity={0.8}
                xmin={"0"}
                xmax={""}
                ymin={"0"}
                ymax={"1"}
                pattern={""}
                hue={"optimizer_weight_decay"}
                row={"split"}
                col={"measurement"}
                hueLegendName="Weight decay"
                rowLabelPrefix={"Cross entropy / "}
                style={{ height: "30em", width: "80em", marginLeft: "-15em", marginTop: "1.5em" }}
            />

            <h2>Averaging for BatchNorm layers</h2>
            <p>
                The norm of the weight matrix of a layer that is followed by BatchNorm does not influence the network's
                output, as long as the batch statistics are updated accordingly.
            </p>
            <p>We have seen before that these norms sometimes grow. This means the average is not really 'uniform'.</p>
            <p>
                <strong>TODO</strong> See if they grow, and if they do, try to do an average with normalized weights to
                make sure it is really 'uniform'.
            </p>
            <p>
                <strong>QUESTION</strong> Are there more of these effects that make averaging unintuitive?
            </p>

            <h2>
                Interplay between optimization and generalisation of stochastic gradient descent with covariance noise
            </h2>
            <p>
                <strong>TODO</strong> See how averaging changes Figure 3 of this paper.
            </p>
            <p>Note to self: Keep in mind:</p>
            <ul>
                <li>ResNet18</li>
                <li>Batch sizes 128/512/2k</li>
                <li>update steps on the x-axis of convergence curve</li>
                <li>Ghost batch norm by multiple forward/backward steps and division.</li>
            </ul>
            <p>Why don't we see the drop of the small batch?</p>
        </div>
    )
};
