import React from 'react';
import {Navigation} from 'baseui/side-navigation';
import {useLocation, useNavigate} from 'react-router-dom';
import {Block} from 'baseui/block';

const navItems = [
  {
    title: 'Add Purchases',
    itemId: '/add',
  }, {
    title: 'View Purchases',
    itemId: '/view',
  },
];

const SideNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavChange = ({event, item}) => {
    event.preventDefault();
    navigate(item.itemId);
  };

  if (navItems.length === 1) {
    return null;
  }

  return (
    <Block
      height="100%"
      backgroundColor="primary50"
    >
      <Navigation
        items={navItems}
        activeItemId={location.pathname}
        onChange={handleNavChange}
      />
    </Block>
  );
};
export default SideNav;
