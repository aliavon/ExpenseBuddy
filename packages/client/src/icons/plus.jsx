import * as React from 'react';
import {Icon} from 'baseui/icon';

import {SvgOverrides} from './overrides';

function Plus(props, ref) {
  const {title = 'Plus', size = 24, color, ...restProps} = props;

  return (
    <Icon
      ref={ref}
      title={title}
      size={size}
      color={color}
      overrides={SvgOverrides}
      {...restProps}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v12m6-6H6"
      />
    </Icon>
  );
}

export default React.forwardRef(Plus);

