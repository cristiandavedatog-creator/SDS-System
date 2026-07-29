import React from 'react';
import { TableRow, TableCell, Skeleton } from '@mui/material';

// Placeholder rows shown under a table's real (already-rendered) header
// while data loads, instead of a spinner floating alone. Seeing the actual
// column titles immediately plus a preview of the row shapes coming makes
// the wait feel shorter and more intentional than a generic spinner.
const TableSkeleton = ({ columns = 5, rows = 8 }) => (
  <>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <TableRow key={rowIndex}>
        {Array.from({ length: columns }).map((__, colIndex) => (
          <TableCell key={colIndex}>
            <Skeleton variant="text" sx={{ fontSize: '0.875rem' }} width={colIndex === 0 ? '80%' : '60%'} />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </>
);

export default TableSkeleton;
