import {useCallback, useState} from 'react';
import {useLazyQuery} from '@apollo/client';
import {toaster} from 'baseui/toast';

import {GET_ITEMS_BY_NAMES_QUERY} from '../../gql';

export const usePopulateCategories = () => {
  const [loading, setLoading] = useState(false);
  const [getItems] = useLazyQuery(GET_ITEMS_BY_NAMES_QUERY);

  const populateCategories = useCallback(({purchases, setPurchases}) => {
    setLoading(true);

    const uniqueNamesMap = {};
    purchases.forEach(p => {
      if (!uniqueNamesMap[p.name] && !p.category) {
        uniqueNamesMap[p.name] = null;
      }
    });
    getItems({
      variables: {names: Object.keys(uniqueNamesMap)},
      onError: e => {
        console.error('Error saving purchases:', e);
        setLoading(false);
      },
      onCompleted: data => {
        const items = (data?.items || []).filter(p => p.category);
        items.forEach(p => {
          if (p.category) {
            uniqueNamesMap[p.name]= p.category;
          }
        });

        setPurchases(purchases => [...purchases].map(p => {
          const newP = {...p};
          if (!newP.category && uniqueNamesMap[newP.name]) {
            newP.category = uniqueNamesMap[newP.name];
          }
          return newP;
        }));
        toaster.positive(`${items.length? `${items.length} ` : ''}Categories populated!`, {autoHideDuration: 3000});
        setLoading(false);
      },
    });

  }, [getItems]);

  return [populateCategories, {loading}];
};
