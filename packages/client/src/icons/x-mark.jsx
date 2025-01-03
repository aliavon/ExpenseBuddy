import * as React from 'react';
import {Icon} from 'baseui/icon';

import {SvgOverrides} from './overrides';

function XMark(props, ref) {
  const {title = 'XMark', size = 24, color, ...restProps} = props;

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
        d="M6 18L18 6M6 6l12 12"
      />
    </Icon>
  );
}

export default React.forwardRef(XMark);

