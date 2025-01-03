
import React from 'react';
import {useStyletron} from 'baseui';
import {Skeleton as BaseSkeleton} from 'baseui/skeleton';
import {startCase} from 'lodash';

import {VIEW} from './constants';

const getScale = (sizing, size) => (size && sizing[size]) || size;

export const Skeleton = ({
  view = VIEW.column,
  gap = 'scale200',
  radius = 'scale0',
  itemHeight,
  itemWidth,
  items,
  width,
  height,
}) => {
  const [, {sizing}] = useStyletron();

  const rowStyleOverride = React.useCallback(
    ({$theme: {sizing}}) => {
      let override = {};
      override.borderRadius = getScale(sizing, radius);
      override.marginBottom = '0px';
      override.flexGrow = 1;
      override.flexShrink = 0;

      if (itemHeight) {
        override.height = getScale(sizing, itemHeight);
      }
      if (itemWidth && view !== VIEW.grid) {
        override.width = getScale(sizing, itemWidth);
      }

      return override;
    },
    [
      itemHeight,
      itemWidth,
      radius,
      view,
    ]
  );

  const rootStyleOverride = React.useCallback(
    ({$theme: {sizing}}) => {
      let override = {};

      if (view === VIEW.grid) {
        override.display = VIEW.grid;
        override.gridRowGap = getScale(sizing, gap);
        override.gridColumnGap = getScale(sizing, gap);
        override.gridTemplateColumns = `repeat(auto-fill, minmax(${
          getScale(sizing, itemWidth) || '1fr'
        }, 1fr))`;
      } else {
        const toGap = view === VIEW.column ? VIEW.row : VIEW.column;
        override.flexDirection = view;
        override[`grid${startCase(toGap)}Gap`] = getScale(sizing, gap);
      }

      if (!items) {
        override.borderRadius = getScale(sizing, radius);
      }

      return override;
    },
    [
      view,
      items,
      gap,
      itemWidth,
      radius,
    ]
  );

  return (
    <BaseSkeleton
      animation
      overrides={{
        Root: {style: rootStyleOverride},
        Row: {style: rowStyleOverride},
      }}
      rows={items}
      width={getScale(sizing, width)}
      height={getScale(sizing, height)}
    />
  );
};
