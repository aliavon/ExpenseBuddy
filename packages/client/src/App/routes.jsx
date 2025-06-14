import React from 'react';
import {Routes, Route} from 'react-router-dom';
import {Block} from 'baseui/block';

import AddPurchasesComponent from '../components/AddPurchasesComponent';
import ViewPurchasesComponent from '../components/ViewPurchasesComponent';
import FamilyIncome from '../components/FamilyIncome';

const RootRoutes = () => (
  <Block
    display="flex"
    padding="scale700"
    width="100%"
  >
    <Routes>
      <Route
        path="/add"
        element={<AddPurchasesComponent />}
      />
      <Route
        path="/view"
        element={<ViewPurchasesComponent />}
      />
      <Route
        path="/income"
        element={<FamilyIncome />}
      />
    </Routes>
  </Block>
);

export default RootRoutes;
