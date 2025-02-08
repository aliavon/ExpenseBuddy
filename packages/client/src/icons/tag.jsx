import * as React from 'react';
import {Icon} from 'baseui/icon';

import {SvgOverrides} from './overrides';

function Tag(props, ref) {
  const {title = 'Tag', size, color, ...restProps} = props;

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
      <path d="M19 5v5.8l-9 9-5.8-5.7 9-9H19V5Zm3-3H12L0 14l10 10 12-12V2Z" />
    </Icon>
  );
}

export default React.forwardRef(Tag);
