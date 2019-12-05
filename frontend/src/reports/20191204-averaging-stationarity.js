import React from "react";
// import Latex from "react-latex";
import { FacetChart } from "../TimeseriesPage";

// const m = formula => <Latex>{`$${formula}$`}</Latex>;

export default {
    slug: "avg-stationarity",
    title: "Does the SGD trajectory become stationary?",
    date: new Date("2019-12-04"),
    author: "Thijs Vogels",
    render: () => (
        <div>
            <p>
                Nicolas was wondering if we can find a point after which we can average 'forever after' and only improve
                performance. This question seems related to the question 'does the SGD trajectory' become stationary?
                The answer to the first question seems to be 'no'. I wonder how it relates to the second.
            </p>
            <FacetChart
                jobIds={["5de63caf3cef35154c1eab87", "5de624fb3cef3510e63831bd", "5de5422870ba8dc8965fa521"]}
                measurementQuery={[
                    "avg_after_100_cross_entropy",
                    "avg_after_200_cross_entropy",
                    "avg_after_300_cross_entropy",
                    "avg_after_400_cross_entropy",
                    "avg_after_500_cross_entropy"
                ]}
                tagQuery={["split=test"]}
                lineOpacity={0.8}
                ymax={".5"}
                xmin={"0"}
                xmax={"1000"}
                pattern={""}
                hue={"measurement"}
                row={"split"}
                col={"job"}
                hueLegendName="Measurement"
                rowLabelPrefix={"Cross entropy / "}
                style={{ height: "30em", width: "80em", marginLeft: "-15em", marginTop: "1.5em" }}
            />
        </div>
    )
};
