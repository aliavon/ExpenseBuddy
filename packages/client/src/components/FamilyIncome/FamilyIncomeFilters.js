import React, {useState, useMemo} from 'react';
import {Grid, TextField, FormControl, InputLabel, Select, MenuItem, Button} from '@mui/material';
import {mockFamilyIncomeData} from './mockData';

const FamilyIncomeFilters = ({onFilterChange}) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [contributor, setContributor] = useState('');
  const [incomeType, setIncomeType] = useState('');
  const [periodicity, setPeriodicity] = useState('');

  // Извлекаем уникальных contributors из mockData
  const contributors = useMemo(() => {
    const contributorMap = new Map();
    mockFamilyIncomeData.getFamilyIncomeRecords.items.forEach(item => {
      if (!contributorMap.has(item.contributor.id)) {
        contributorMap.set(item.contributor.id, item.contributor);
      }
    });
    return Array.from(contributorMap.values());
  }, []);

  // Извлекаем уникальные типы доходов из mockData
  const incomeTypes = useMemo(() => {
    const typeMap = new Map();
    mockFamilyIncomeData.getFamilyIncomeRecords.items.forEach(item => {
      if (!typeMap.has(item.type.id)) {
        typeMap.set(item.type.id, item.type);
      }
    });
    return Array.from(typeMap.values());
  }, []);

  // Извлекаем уникальные периодичности из mockData
  const periodicities = useMemo(() => {
    const uniquePeriodicities = [
      ...new Set(
        mockFamilyIncomeData.getFamilyIncomeRecords.items.map(item => item.periodicity)
      ),
    ];
    return uniquePeriodicities.map(p => ({
      value: p,
      label: p === 'once' ? 'Разовый' : p === 'monthly' ? 'Ежемесячно' : p,
    }));
  }, []);

  const handleApply = () => {
    onFilterChange({
      startDate: dateFrom || null,
      endDate: dateTo || null,
      contributorId: contributor || null,
      typeId: incomeType || null,
      periodicity: periodicity || null,
    });
  };

  return (
    <Grid
      container
      spacing={2}
      alignItems="center"
    >
      <Grid
        item
        xs={12}
        sm={3}
      >
        <TextField
          fullWidth
          label="Date From"
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          InputLabelProps={{shrink: true}}
        />
      </Grid>
      <Grid
        item
        xs={12}
        sm={3}
      >
        <TextField
          fullWidth
          label="Date To"
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          InputLabelProps={{shrink: true}}
        />
      </Grid>
      <Grid
        item
        xs={12}
        sm={2}
      >
        <FormControl fullWidth>
          <InputLabel>Contributor</InputLabel>
          <Select
            value={contributor}
            label="Contributor"
            onChange={e => setContributor(e.target.value)}
          >
            <MenuItem value=""><em>All</em></MenuItem>
            {contributors.map(contrib => (
              <MenuItem
                key={contrib.id}
                value={contrib.id}
              >
                {contrib.fullName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid
        item
        xs={12}
        sm={2}
      >
        <FormControl fullWidth>
          <InputLabel>Income Type</InputLabel>
          <Select
            value={incomeType}
            label="Income Type"
            onChange={e => setIncomeType(e.target.value)}
          >
            <MenuItem value=""><em>All</em></MenuItem>
            {incomeTypes.map(type => (
              <MenuItem
                key={type.id}
                value={type.id}
              >
                {type.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid
        item
        xs={12}
        sm={2}
      >
        <FormControl fullWidth>
          <InputLabel>Periodicity</InputLabel>
          <Select
            value={periodicity}
            label="Periodicity"
            onChange={e => setPeriodicity(e.target.value)}
          >
            <MenuItem value=""><em>All</em></MenuItem>
            {periodicities.map(period => (
              <MenuItem
                key={period.value}
                value={period.value}
              >
                {period.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid
        item
        xs={12}
        sm={2}
      >
        <Button
          variant="contained"
          onClick={handleApply}
        >
          Apply Filters
        </Button>
      </Grid>
    </Grid>
  );
};

export default FamilyIncomeFilters;
