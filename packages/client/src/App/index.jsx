import React from 'react';
import {Block} from 'baseui/block';

import SideNav from '../components/navigation';

import Routes from './routes';

const App = () => (
  <Block
    display="flex"
    height="100vh"
  >
    <SideNav />

    <Routes />
  </Block>
);

export default App;
