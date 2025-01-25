import React from 'react';
import {Skeleton} from 'baseui/skeleton';
import {Button} from 'baseui/button';

const commonProps = {
  height: '32px',
  width: 'auto',
  animation: true,
  overrides: {Root: {style: {borderRadius: '4px'}}},
};

const Preloader = ({rows = 1}) => (
  <>
    {Array(rows).fill(null)
      .map((_, i) => (
        <React.Fragment key={i}>
          {' '}
          <Button
            isLoading
            disabled
            size="compact"
          >
            copy
          </Button>
          <Skeleton {...commonProps} />
          <Skeleton {...commonProps} />
          <Skeleton {...commonProps} />
          <Skeleton {...commonProps} />
          <Skeleton {...commonProps} />
          <Skeleton {...commonProps} />
          <Skeleton {...commonProps} />
          <Skeleton {...commonProps} />
          <Button
            isLoading
            disabled
            size="mini"
            shape="circle"
          >
            X
          </Button>
        </React.Fragment>
      ))}

  </>
);

export default Preloader;
