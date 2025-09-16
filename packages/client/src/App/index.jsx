import React from 'react';
import { Block } from 'baseui/block';

import SideNav from '../components/navigation';
import { useAuth } from '../contexts/AuthContext';

import Routes from './routes';

// Import error link testing utilities in development
if (process.env.NODE_ENV === 'development') {
  import('../utils/testErrorLink');
}

const App = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Block
      display="flex"
      width="100%"
      height="100vh"
    >
      {/* Show navigation only for authenticated users with family */}
      {isAuthenticated && user?.familyId && <SideNav />}
      <Routes />
    </Block>
  );
};

export default App;
