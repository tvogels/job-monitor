import React from 'react';
import { FacetChart } from '../TimeseriesPage';
import Latex from 'react-latex';

export default {
    'slug': 'understanding-signsgd',
    'title': 'Understanding SignSGD',
    'date': new Date('2019-01-25'),
    'author': 'Thijs Vogels',
    'render': () => (
        <div>
            <p>
                We are testing the hypothesis whether the curiosities of Adam and SignSGD (better train, worse test) can be due to
                implicit <Latex>$L_\infty$</Latex> regularization. So we conduct a series of experiments with a regularizer <Latex>$\lambda \sum_w \left\lVert w \right\rVert^2_\infty$</Latex>, varying <Latex>$\lambda$</Latex>.
            </p>
            <p>Experiments are on Cifar10 with VGG. Learning rate decays by 2 every 30 epochs. Optimizer is SGD with momentum (0.9)</p>
            <p><strong style={{color: 'yellow'}}>Hint:</strong> use alt-click to put a crosshair in the graphs.</p>
            <p>&nbsp;</p>
            <p><center><strong>Test accuracy</strong></center></p>
            <FacetChart
                jobIds={["5c4abb81defc9e348f72763d","5c4abb81defc9e348f72763c","5c4abb81defc9e348f72763b","5c4abb81defc9e348f72763a","5c4abb81defc9e348f727639","5c4abb81defc9e348f727638","5c4abb81defc9e348f727637","5c4abb81defc9e348f727636","5c4abb81defc9e348f727635","5c4abb81defc9e348f727634","5c4abb81defc9e348f727633","5c4abb81defc9e348f727632","5c4a03370abd5d317334380e","5c4a03370abd5d317334380d","5c4a03370abd5d317334380c","5c4a03370abd5d317334380b","5c4a03370abd5d317334380a","5c4a03370abd5d3173343809","5c4a03370abd5d3173343808","5c4a03370abd5d3173343807","5c4a03370abd5d3173343806","5c4a03370abd5d3173343805"]}
                measurementQuery={["last_accuracy"]}
                tagQuery={["split=test"]}
                lineOpacity={0.8}
                ymin={".85"}
                pattern={""}
                hue={"optimizer_infinity_regularization"}
                row={"optimizer_weight_decay"}
                col={"optimizer_learning_rate"}
                hueLegendName="Inifinity norm regularization weight"
                rowLabelPrefix="L2 weight decay = "
                colLabelPrefix="Learning rate = "
                style={{height: '45em', width: '80em', marginLeft: '-15em'}}
            />

            <p>&nbsp;</p>
            <p><center><strong>Train accuracy</strong></center></p>
            <FacetChart
                jobIds={["5c4abb81defc9e348f72763d","5c4abb81defc9e348f72763c","5c4abb81defc9e348f72763b","5c4abb81defc9e348f72763a","5c4abb81defc9e348f727639","5c4abb81defc9e348f727638","5c4abb81defc9e348f727637","5c4abb81defc9e348f727636","5c4abb81defc9e348f727635","5c4abb81defc9e348f727634","5c4abb81defc9e348f727633","5c4abb81defc9e348f727632","5c4a03370abd5d317334380e","5c4a03370abd5d317334380d","5c4a03370abd5d317334380c","5c4a03370abd5d317334380b","5c4a03370abd5d317334380a","5c4a03370abd5d3173343809","5c4a03370abd5d3173343808","5c4a03370abd5d3173343807","5c4a03370abd5d3173343806","5c4a03370abd5d3173343805"]}
                measurementQuery={["accuracy"]}
                tagQuery={["split=train"]}
                lineOpacity={0.8}
                ymin={".85"}
                pattern={""}
                hue={"optimizer_infinity_regularization"}
                row={"optimizer_weight_decay"}
                col={"optimizer_learning_rate"}
                hueLegendName="Inifinity norm regularization weight"
                rowLabelPrefix="L2 weight decay = "
                colLabelPrefix="Learning rate = "
                style={{height: '45em', width: '80em', marginLeft: '-15em'}}
            />

            <p>&nbsp;</p>
            <p><center><strong>Test accuracy (average iterate from last epoch)</strong></center></p>
            <FacetChart
                jobIds={["5c4abb81defc9e348f72763d","5c4abb81defc9e348f72763c","5c4abb81defc9e348f72763b","5c4abb81defc9e348f72763a","5c4abb81defc9e348f727639","5c4abb81defc9e348f727638","5c4abb81defc9e348f727637","5c4abb81defc9e348f727636","5c4abb81defc9e348f727635","5c4abb81defc9e348f727634","5c4abb81defc9e348f727633","5c4abb81defc9e348f727632","5c4a03370abd5d317334380e","5c4a03370abd5d317334380d","5c4a03370abd5d317334380c","5c4a03370abd5d317334380b","5c4a03370abd5d317334380a","5c4a03370abd5d3173343809","5c4a03370abd5d3173343808","5c4a03370abd5d3173343807","5c4a03370abd5d3173343806","5c4a03370abd5d3173343805"]}
                measurementQuery={["runavg_accuracy", "last_accuracy"]}
                tagQuery={["split=test"]}
                lineOpacity={0.8}
                ymin={".85"}
                pattern={"measurement"}
                hue={"optimizer_infinity_regularization"}
                row={"optimizer_weight_decay"}
                col={"optimizer_learning_rate"}
                hueLegendName="Inifinity norm regularization weight"
                rowLabelPrefix="L2 weight decay = "
                colLabelPrefix="Learning rate = "
                style={{height: '45em', width: '80em', marginLeft: '-15em'}}
            />


            <p>&nbsp;</p>
            <p><center><strong>Train loss</strong></center></p>
            <FacetChart
                jobIds={["5c4abb81defc9e348f72763d","5c4abb81defc9e348f72763c","5c4abb81defc9e348f72763b","5c4abb81defc9e348f72763a","5c4abb81defc9e348f727639","5c4abb81defc9e348f727638","5c4abb81defc9e348f727637","5c4abb81defc9e348f727636","5c4abb81defc9e348f727635","5c4abb81defc9e348f727634","5c4abb81defc9e348f727633","5c4abb81defc9e348f727632","5c4a03370abd5d317334380e","5c4a03370abd5d317334380d","5c4a03370abd5d317334380c","5c4a03370abd5d317334380b","5c4a03370abd5d317334380a","5c4a03370abd5d3173343809","5c4a03370abd5d3173343808","5c4a03370abd5d3173343807","5c4a03370abd5d3173343806","5c4a03370abd5d3173343805"]}
                measurementQuery={["cross_entropy"]}
                tagQuery={["split=train"]}
                lineOpacity={0.8}
                ymax={".5"}
                pattern={""}
                hue={"optimizer_infinity_regularization"}
                row={"optimizer_weight_decay"}
                col={"optimizer_learning_rate"}
                hueLegendName="Inifinity norm regularization weight"
                rowLabelPrefix="L2 weight decay = "
                colLabelPrefix="Learning rate = "
                style={{height: '45em', width: '80em', marginLeft: '-15em'}}
            />

        </div>
    )
};