import gradientPrediction1 from './20181211-gradientPrediction1';
import gradientPrediction2 from './20181217-gradientPrediction2';
import averagingWindows from './20181219-averagingWindows';
import convex from './20190107-convex';
import cyclic from './20190115-cyclic-sampling';
import signsgd from './20190125-understanding-signsgd';
import tensordecompositions from './20190218-tensor-decompositions';

export const reports = [];
reports.push(gradientPrediction1);
reports.push(gradientPrediction2);
reports.push(averagingWindows);
reports.push(convex);
reports.push(cyclic);
reports.push(signsgd);
reports.push(tensordecompositions);

export default reports;
