import React from 'react';
import {Block} from 'baseui/block';

const colorMapper = {
  USD: 'positive500',
  EUR: 'accent500',
  PLN: 'warning500',
  default: 'grey',
};

const Currency = ({value}) => (
  <Block color={colorMapper[value] || colorMapper.default}>{value}</Block>
);

export default Currency;
