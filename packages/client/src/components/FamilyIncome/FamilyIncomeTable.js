import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  Pagination,
} from '@mui/material';

const FamilyIncomeTable = ({ data, totalPages, currentPage, onSortChange, onPageChange }) => {
  const handleSort = field => {
    // For simplicity, assume toggling sort order is handled in the parent.
    onSortChange({ sortBy: field });
  };

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={true}
                  direction="asc"
                  onClick={() => handleSort('date')}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={true}
                  direction="asc"
                  onClick={() => handleSort('amount')}
                >
                  Amount
                </TableSortLabel>
              </TableCell>
              <TableCell>Note</TableCell>
              <TableCell>Periodicity</TableCell>
              <TableCell>Income Type</TableCell>
              <TableCell>Contributor</TableCell>
              <TableCell>Currency</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map(record => (
              <TableRow key={record.id}>
                <TableCell>{record.date}</TableCell>
                <TableCell>{record.amount}</TableCell>
                <TableCell>{record.note}</TableCell>
                <TableCell>{record.periodicity}</TableCell>
                <TableCell>{record.type ? record.type.name : '-'}</TableCell>
                <TableCell>{record.contributor ? record.contributor.fullName : '-'}</TableCell>
                <TableCell>{record.currency ? record.currency.code : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box
        mt={2}
        display="flex"
        justifyContent="center"
      >
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={(event, page) => onPageChange(page)}
          color="primary"
        />
      </Box>
    </Box>
  );
};

export default FamilyIncomeTable;
