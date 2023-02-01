import { merge } from 'webpack-merge';
import { Configuration } from 'webpack';
import common from './common';

const development: Configuration = {
  mode: 'development',
  devtool: 'eval'
};

export default merge(common, development);
