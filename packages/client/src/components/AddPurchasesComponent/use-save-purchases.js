import {useCallback, useState} from 'react';
import {useLazyQuery, useMutation} from '@apollo/client';

import {ADD_PURCHASES_QUERY, GET_ITEMS_BY_NAMES_QUERY, ADD_ITEMS_MUTATION} from '../../gql';

export const useSavePurchases = () => {
  const [loading, setLoading] = useState(false);
  const [addPurchases] = useMutation(ADD_PURCHASES_QUERY);
  const [addItems] = useMutation(ADD_ITEMS_MUTATION);
  const [getItems] = useLazyQuery(GET_ITEMS_BY_NAMES_QUERY);

  const savePurchases = useCallback(async ({purchases}) => {
    try {
      setLoading(true);
      console.log({purchases});

      const uniqueItemsMap = {};
      purchases.forEach(({name, category}) => {
        if (!uniqueItemsMap[name]) {
          uniqueItemsMap[name] = {
            name,
            category,
          };
        }
      });

      const names = Object.keys(uniqueItemsMap);
      const {data} = await getItems({variables: {names}});
      let items = [...(data?.items || [])];
      console.log({
        data,
        items,
      });
      const itemsToCreate = Object.values(uniqueItemsMap).filter(item1 =>
        !data?.items.some(item2 =>
          item2.name === item1.name && item2.category === item1.category
        )
      );
      console.log({itemsToCreate});
      if (itemsToCreate.length) {
        const res = await addItems({variables: {items: itemsToCreate}});
        items = [...items, res.data.addItems];
      }

      const itemsMap = items.reduce((map, obj) => ({
        ...map,
        [obj.name]: obj,
      }), {});

      console.log({itemsMap});
      const purchasesToCreate = purchases.map(({name, category: _, ...rest}) => ({
        ...rest,
        itemId: itemsMap[name].id,
      }));
      console.log({purchasesToCreate});

      await addPurchases({variables: {purchases: purchasesToCreate}});
      alert('Purchases saved successfully!');
    } catch (error) {
      console.error('Error saving purchases:', error);
    } finally {
      setLoading(false);
    }
  }, [getItems, addItems, addPurchases]);

  return [savePurchases, {loading}];
};
