import React, { useState } from 'react';
import { Block } from 'baseui/block';
import { FormControl } from 'baseui/form-control';
import { Input } from 'baseui/input';
import { Select, TYPE } from 'baseui/select';
import { Datepicker } from 'baseui/datepicker';
import { Textarea } from 'baseui/textarea';
import { Button } from 'baseui/button';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toaster } from 'baseui/toast';
import { GET_INCOME_TYPES_QUERY, GET_CURRENCIES_QUERY } from '../../gql/income';
import { FAMILY_MEMBERS_QUERY } from '../../gql/family';

const CREATE_INCOME_TYPE_MUTATION = gql`
  mutation CreateIncomeTypes($incomeTypes: [IncomeTypeInput!]!) {
    createIncomeTypes(incomeTypes: $incomeTypes) {
      id
      name
      description
    }
  }
`;

const CREATE_CURRENCY_MUTATION = gql`
  mutation CreateCurrencies($currencies: [CurrencyInput!]!) {
    createCurrencies(currencies: $currencies) {
      id
      name
      code
      symbol
    }
  }
`;

const IncomeForm = ({ initialValues, onSubmit, loading }) => {
  const [values, setValues] = useState(
    initialValues || {
      date: new Date(),
      amount: '',
      currencyId: '',
      typeId: '',
      contributorId: '',
      periodicity: 'ONE_TIME',
      note: '',
    }
  );

  const [errors, setErrors] = useState({});

  // Fetch options
  const { data: typesData, refetch: refetchTypes } = useQuery(GET_INCOME_TYPES_QUERY);
  const { data: membersData } = useQuery(FAMILY_MEMBERS_QUERY);
  const { data: currenciesData, refetch: refetchCurrencies } = useQuery(GET_CURRENCIES_QUERY);

  const [createIncomeType] = useMutation(CREATE_INCOME_TYPE_MUTATION);
  const [createCurrency] = useMutation(CREATE_CURRENCY_MUTATION);

  const incomeTypes = typesData?.getIncomeTypes || [];
  const contributors = membersData?.familyMembers || [];
  const currencies = currenciesData?.getCurrencies || [];

  const periodicities = [
    { id: 'ONE_TIME', label: 'One-time' },
    { id: 'WEEKLY', label: 'Weekly' },
    { id: 'MONTHLY', label: 'Monthly' },
    { id: 'QUARTERLY', label: 'Quarterly' },
    { id: 'YEARLY', label: 'Yearly' },
  ];

  const validate = () => {
    const newErrors = {};
    if (!values.amount || parseFloat(values.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!values.date) {
      newErrors.date = 'Date is required';
    }
    if (!values.typeId) {
      newErrors.typeId = 'Income type is required';
    }
    if (!values.currencyId) {
      newErrors.currencyId = 'Currency is required';
    }
    if (!values.contributorId) {
      newErrors.contributorId = 'Contributor is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    try {
      let { currencyId } = values;
      let { typeId } = values;

      // Check if currency needs to be created (not a valid ObjectId)
      if (currencyId && !currencyId.match(/^[0-9a-fA-F]{24}$/)) {
        const result = await handleCreateCurrency(currencyId);
        if (!result) {
          return;
        } // Creation failed
        currencyId = result.id;
      }

      // Check if income type needs to be created (not a valid ObjectId)
      if (typeId && !typeId.match(/^[0-9a-fA-F]{24}$/)) {
        const result = await handleCreateIncomeType(typeId);
        if (!result) {
          return;
        } // Creation failed
        typeId = result.id;
      }

      const submitData = {
        ...values,
        currencyId,
        typeId,
        amount: parseFloat(values.amount),
        date: values.date instanceof Date ? values.date.toISOString() : new Date(values.date).toISOString(),
      };
      onSubmit(submitData);
    } catch (err) {
      toaster.negative(`Failed to submit: ${err.message}`, {});
    }
  };

  const handleCreateIncomeType = async newLabel => {
    try {
      const result = await createIncomeType({
        variables: {
          incomeTypes: [{ name: newLabel, description: '' }],
        },
      });
      const [newType] = result.data.createIncomeTypes;
      await refetchTypes();
      toaster.positive(`Income type "${newLabel}" created`, {});
      return newType;
    } catch (err) {
      toaster.negative(`Failed to create type: ${err.message}`, {});
      return null;
    }
  };

  const handleCreateCurrency = async newLabel => {
    try {
      // Parse input like "USD ($)" or just "USD"
      const matches = newLabel.match(/^([A-Z]{3})\s*\(([^)]+)\)$/);
      const code = matches ? matches[1] : newLabel.toUpperCase().substring(0, 3);
      const symbol = matches ? matches[2] : '$';

      const result = await createCurrency({
        variables: {
          currencies: [{ name: code, code, symbol }],
        },
      });
      const [newCurrency] = result.data.createCurrencies;
      await refetchCurrencies();
      toaster.positive(`Currency "${code}" created`, {});
      return newCurrency;
    } catch (err) {
      toaster.negative(`Failed to create currency: ${err.message}`, {});
      return null;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Block
        display="grid"
        gridTemplateColumns="1fr 1fr"
        gridGap="scale600"
        marginBottom="scale600"
      >
        <FormControl label="Date *" error={errors.date}>
          <Datepicker
            value={values.date}
            onChange={({ date }) => setValues({ ...values, date: date || new Date() })}
            formatString="yyyy-MM-dd"
            placeholder="YYYY-MM-DD"
          />
        </FormControl>

        <FormControl label="Amount *" error={errors.amount}>
          <Input
            type="number"
            value={values.amount}
            onChange={e => setValues({ ...values, amount: e.target.value })}
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </FormControl>

        <FormControl
          label="Currency *" error={errors.currencyId}
          caption="Type code like USD ($) or select existing">
          <Select
            type={TYPE.search}
            creatable
            options={currencies.map(c => ({ id: c.id, label: `${c.code} (${c.symbol})` }))}
            value={
              values.currencyId
                ? [
                  {
                    id: values.currencyId,
                    label: currencies.find(c => c.id === values.currencyId)?.code || values.currencyId,
                  },
                ]
                : []
            }
            onChange={({ value, type: eventType }) => {
              if (eventType === 'create') {
                // Store the label as currencyId - will be created on submit
                setValues({ ...values, currencyId: value[0].label });
              } else if (value.length > 0) {
                setValues({ ...values, currencyId: value[0].id });
              } else {
                setValues({ ...values, currencyId: '' });
              }
            }}
            placeholder="Select or create currency"
          />
        </FormControl>

        <FormControl
          label="Income Type *" error={errors.typeId}
          caption="Type to create new or select existing">
          <Select
            type={TYPE.search}
            creatable
            options={incomeTypes.map(t => ({ id: t.id, label: t.name }))}
            value={
              values.typeId
                ? [
                  {
                    id: values.typeId,
                    label: incomeTypes.find(t => t.id === values.typeId)?.name || values.typeId,
                  },
                ]
                : []
            }
            onChange={({ value, type: eventType }) => {
              if (eventType === 'create') {
                // Store the label as typeId - will be created on submit
                setValues({ ...values, typeId: value[0].label });
              } else if (value.length > 0) {
                setValues({ ...values, typeId: value[0].id });
              } else {
                setValues({ ...values, typeId: '' });
              }
            }}
            placeholder="Select or create type"
          />
        </FormControl>

        <FormControl label="Contributor *" error={errors.contributorId}>
          <Select
            options={contributors.map(c => ({
              id: c.id,
              label: `${c.firstName} ${c.lastName}`,
            }))}
            value={
              values.contributorId
                ? [
                  {
                    id: values.contributorId,
                    label:
                        contributors.find(c => c.id === values.contributorId)
                          ? `${contributors.find(c => c.id === values.contributorId)?.firstName} ${contributors.find(c => c.id === values.contributorId)?.lastName}`
                          : values.contributorId,
                  },
                ]
                : []
            }
            onChange={({ value }) => setValues({ ...values, contributorId: value[0]?.id || '' })}
            placeholder="Select contributor"
          />
        </FormControl>

        <FormControl label="Periodicity">
          <Select
            options={periodicities}
            value={[periodicities.find(p => p.id === values.periodicity) || periodicities[0]]}
            onChange={({ value }) => setValues({ ...values, periodicity: value[0]?.id || 'ONE_TIME' })}
          />
        </FormControl>
      </Block>

      <FormControl label="Note (optional)">
        <Textarea
          value={values.note}
          onChange={e => setValues({ ...values, note: e.target.value })}
          placeholder="Add a note..."
          rows={3}
        />
      </FormControl>

      <Block marginTop="scale600">
        <Button
          type="submit" isLoading={loading}
          overrides={{ BaseButton: { style: { width: '100%' } } }}>
          Save
        </Button>
      </Block>
    </form>
  );
};

export default IncomeForm;
