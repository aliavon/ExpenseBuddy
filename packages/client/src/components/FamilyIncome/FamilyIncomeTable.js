import React, { useEffect, useState } from 'react';
import { Block } from 'baseui/block';
import { Button, SIZE } from 'baseui/button';
import {
  StatefulDataTable,
  StringColumn,
  NumericalColumn,
  DatetimeColumn,
  CategoricalColumn,
} from 'baseui/data-table';
import { Pencil, Trash } from '../../icons';

const FamilyIncomeTable = ({ data, onEdit, onDelete }) => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (data) {
      setRows(
        data.map(record => ({
          id: String(record.id),
          data: record,
        }))
      );
    }
  }, [data]);

  const columns = [
    DatetimeColumn({
      title: 'Date',
      mapDataToValue: data => {
        // Handle both ISO string and timestamp
        const dateValue = data.date;
        // If it's an ISO string, convert to timestamp
        if (typeof dateValue === 'string' && dateValue.includes('-')) {
          return new Date(dateValue).getTime();
        }
        // If it's a timestamp string, convert to number
        return +dateValue;
      },
      formatString: 'yyyy-MM-dd',
    }),
    NumericalColumn({
      title: 'Amount',
      mapDataToValue: data => data.amount,
      precision: 2,
    }),
    StringColumn({
      title: 'Currency',
      mapDataToValue: data => data.currency?.code || '-',
    }),
    CategoricalColumn({
      title: 'Type',
      mapDataToValue: data => data.type?.name || '-',
    }),
    StringColumn({
      title: 'Contributor',
      mapDataToValue: data => data.contributor?.fullName || '-',
    }),
    CategoricalColumn({
      title: 'Periodicity',
      mapDataToValue: data => data.periodicity,
    }),
    StringColumn({
      title: 'Note',
      mapDataToValue: data => data.note || '-',
    }),
  ];

  const rowActions = [
    {
      label: 'Edit',
      onClick: ({ row }) => onEdit(row.data),
      renderIcon: function RenderEditIcon({ size }) {
        return <Pencil size={size} />;
      },
    }, {
      label: 'Delete',
      onClick: ({ row }) => onDelete(row.data),
      renderIcon: function RenderDeleteIcon({ size }) {
        return <Trash size={size} />;
      },
    },
  ];

  return (
    <StatefulDataTable
      columns={columns} rows={rows}
      rowActions={rowActions} />
  );
};

export default FamilyIncomeTable;
