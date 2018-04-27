import * as merge from 'webpack-merge';
import { Configuration } from 'webpack';
import common from './common';

const production: Configuration = {
    mode: 'production',
    devtool: 'source-map'
};

export default merge.smart(common, production);
