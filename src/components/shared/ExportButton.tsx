import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';

export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json';

export interface ExportButtonProps {
  onExport: (format: string) => void | Promise<void>;
  exporting?: boolean;
  hasData?: boolean;
  label?: string;
  formats?: string[];
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  exporting = false,
  hasData = true,
  label = 'Export',
  formats = ['csv', 'excel'],
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (format: string) => {
    handleClose();
    onExport(format);
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={exporting ? <CircularProgress size={16} /> : <DownloadIcon />}
        onClick={handleClick}
        disabled={exporting || !hasData}
      >
        {exporting ? 'Exporting…' : label}
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {formats.map((fmt) => (
          <MenuItem key={fmt} onClick={() => handleSelect(fmt)}>
            {fmt.toUpperCase()}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ExportButton;