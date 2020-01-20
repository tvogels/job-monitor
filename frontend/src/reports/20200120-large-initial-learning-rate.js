import React from "react";
// import Latex from "react-latex";
import { FacetChart } from "../TimeseriesPage";

// const m = formula => <Latex>{`$${formula}$`}</Latex>;

export default {
    slug: "large-initial-lr",
    title: "Reproducing Towards Explaining the Regularization Effect of Initial Large Learning Rate",
    date: new Date("2020-01-20"),
    author: "Thijs Vogels",
    render: () => (
        <div>
            <p>
                Here I'm reproducing the results of <a href="https://arxiv.org/abs/1907.04595">Li et al. 2019</a>. They
                introduce a synthetic dataset with Cifar images + specially constructed patches that encode the class in
                a very non-linear way. I hoped that with averaging the 'patch accuracy' would be going up even thought
                it does not for the last iterate. This turned out to be not the case.
            </p>
            <FacetChart
                jobIds={[
                    "5e257aea07361bc31d706ea8",
                    "5e257aea07361bc31d706ea9",
                    "5e257aea07361bc31d706eaa",
                    "5e257fcc07361bc62e704f6e",
                    "5e257fcc07361bc62e704f6f",
                    "5e257fcc07361bc62e704f6d"
                ]}
                measurementQuery={["accuracy"]}
                tagQuery={[]}
                lineOpacity={1}
                pattern={""}
                hue={"split"}
                row={"model"}
                col={"job"}
                hueLegendName="Split"
                rowLabelPrefix={"Accuracy : model = "}
                style={{ height: "50em", width: "80em", marginLeft: "-15em", marginTop: "1.5em" }}
            />
        </div>
    )
};
