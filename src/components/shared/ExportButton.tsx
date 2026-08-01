import React from "react";
import { Button, ButtonProps } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

interface ExportButtonProps extends ButtonProps {
  data?: unknown[];
  filename?: string;
  format?: "csv" | "pdf" | "excel";
  onExport?: () => void;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  filename = "export",
  format = "csv",
  onExport,
  children = "Export",
  ...props
}) => {
  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }
    console.log(`Exporting ${data?.length ?? 0} rows as ${format}`);
  };

  return (
    <Button
      variant="outlined"
      startIcon={<FileDownloadIcon />}
      onClick={handleExport}
      {...props}
    >
      {children}
    </Button>
  );
};

export default ExportButton;
