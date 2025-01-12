import * as React from 'react';
import {Icon} from 'baseui/icon';

import {SvgOverrides} from './overrides';

function Pencil(props, ref) {
  const {title = 'Pencil', size, color, ...restProps} = props;

  return (
    <Icon
      viewBox="0 0 24 24"
      ref={ref}
      title={title}
      size={size}
      color={color}
      overrides={SvgOverrides}
      {...restProps}
    >
      <path
        d="m14.4 6.6 3 3L5 22H2v-3L14.4 6.6Z"
      />
      <path
        d="m19.071 1.99-2.475 2.474 2.97 2.97 2.475-2.475-2.97-2.97Z"
      />
    </Icon>
  );
}

export default React.forwardRef(Pencil);
