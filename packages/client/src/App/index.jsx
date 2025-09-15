import React from 'react';
import { Block } from 'baseui/block';

import SideNav from '../components/navigation';
import { useAuth } from '../contexts/AuthContext';

import Routes from './routes';

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Block
      display="flex"
      width="100%"
      height="100vh"
    >
      {/* Show navigation only for authenticated users */}
      {isAuthenticated && <SideNav />}
      <Routes />
    </Block>
  );
};

export default App;
