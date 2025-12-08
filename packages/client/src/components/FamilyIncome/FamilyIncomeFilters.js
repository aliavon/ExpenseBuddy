import React, { useState } from 'react';
import { Block } from 'baseui/block';
import { FormControl } from 'baseui/form-control';
import { Datepicker } from 'baseui/datepicker';
import { Button } from 'baseui/button';

const FamilyIncomeFilters = ({ initialFilters, onFilterChange }) => {
  // Initialize from parent's filters
  const [dateRange, setDateRange] = useState(() => {
    if (initialFilters?.dateFrom && initialFilters?.dateTo) {
      return [new Date(initialFilters.dateFrom), new Date(initialFilters.dateTo)];
    }
    // Fallback (should not happen if parent provides defaults)
    const startDate = new Date();
    startDate.setDate(1);
    startDate.setMonth(0);
    startDate.setHours(0, 0, 0, 0);
    return [startDate, new Date()];
  });

  const handleApply = () => {
    onFilterChange({
      dateFrom: dateRange[0]?.toISOString() || null,
      dateTo: dateRange[1]?.toISOString() || null,
    });
  };

  return (
    <Block
      width="100%"
      display="flex"
      alignItems="flex-end"
      gridGap="scale600"
    >
      <Block width="100%">
        <FormControl label="Date Range">
          <Datepicker
            value={dateRange}
            onChange={({ date }) => setDateRange(date)}
            range
            formatString="yyyy-MM-dd"
            placeholder="Select date range"
          />
        </FormControl>
      </Block>

      <Button onClick={handleApply}>Apply Filters</Button>
    </Block>
  );
};

export default FamilyIncomeFilters;
