import React from "react";
// import Latex from "react-latex";
import { FacetChart } from "../TimeseriesPage";

// const m = formula => <Latex>{`$${formula}$`}</Latex>;

export default {
    slug: "over-parameterized-linear",
    title: "Two linear patterns",
    date: new Date("2020-01-21"),
    author: "Thijs Vogels",
    render: () => (
        <div>
            <p>
                The aim here is to understand and simplify the results from{" "}
                <a href="https://arxiv.org/abs/1907.04595">Li et al. 2019</a>. We construct classification datasets with
                two 1000-dimensional patterns (p1 and p2). These are of the same complexity but have different
                label-flip probabilities. We can train on both patterns together, on the patterns individually, or on a
                mix. Per pattern, we can translate test accuracy to dataset size. What is the effective dataset size
                used to learn one pattern when training on the two patterns together? Is there a relation with the
                learning rate or averaging?
            </p>
            <h2>Large learning rates generalize better</h2>
            <p>
                Here, we 'ignore' the two patterns and train on (20% only pattern 1, 20% only pattern 2, 60% both). We
                test on the same type of data. We find that larger learning rates yield better test accuracy, but worse
                test cross entropy.
            </p>
            <p style={{ marginTop: "1em", textAlign: "center", fontWeight: "bold" }}>Test accuracy</p>
            <FacetChart
                jobIds={[
                    "5e20612c7d39251a8a401616",
                    "5e20612c7d39251a8a401615",
                    "5e20612c7d39251a8a401614",
                    "5e20612c7d39251a8a401613",
                    "5e20612c7d39251a8a401612",
                    "5e20612c7d39251a8a401611",
                    "5e20612c7d39251a8a401610",
                    "5e205e7f7d3925184ed0a4c7",
                    "5e205e7f7d3925184ed0a4c6",
                    "5e205e7f7d3925184ed0a4c5",
                    "5e205e7f7d3925184ed0a4c4",
                    "5e205e7f7d3925184ed0a4c3",
                    "5e205e7f7d3925184ed0a4c2",
                    "5e205e7f7d3925184ed0a4c1"
                ]}
                measurementQuery={["accuracy"]}
                tagQuery={["model=last", "split=test_full"]}
                lineOpacity={0.8}
                pattern={""}
                hue={"learning_rate"}
                row={"measurement"}
                col={"train_set_size"}
                hueLegendName="Learning rate"
                colLabelPrefix="Train set "
                style={{ height: "25em", width: "80em", marginLeft: "-15em", marginTop: "1.5em" }}
            />
            <p style={{ marginTop: "1em", textAlign: "center", fontWeight: "bold" }}>Training loss</p>
            <FacetChart
                jobIds={[
                    "5e20612c7d39251a8a401616",
                    "5e20612c7d39251a8a401615",
                    "5e20612c7d39251a8a401614",
                    "5e20612c7d39251a8a401613",
                    "5e20612c7d39251a8a401612",
                    "5e20612c7d39251a8a401611",
                    "5e20612c7d39251a8a401610",
                    "5e205e7f7d3925184ed0a4c7",
                    "5e205e7f7d3925184ed0a4c6",
                    "5e205e7f7d3925184ed0a4c5",
                    "5e205e7f7d3925184ed0a4c4",
                    "5e205e7f7d3925184ed0a4c3",
                    "5e205e7f7d3925184ed0a4c2",
                    "5e205e7f7d3925184ed0a4c1"
                ]}
                measurementQuery={["cross_entropy"]}
                tagQuery={["model=last", "split=train"]}
                lineOpacity={0.8}
                pattern={""}
                hue={"learning_rate"}
                ylog={true}
                ymin={1e-4}
                row={"measurement"}
                col={"train_set_size"}
                hueLegendName="Learning rate"
                colLabelPrefix="Train set "
                style={{ height: "25em", width: "80em", marginLeft: "-15em", marginTop: "1.5em" }}
            />
    )
};