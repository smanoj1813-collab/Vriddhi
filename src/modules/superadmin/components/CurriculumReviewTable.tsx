import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { CheckCircle, Cancel, Edit } from "@mui/icons-material";

export interface CurriculumReviewItem {
  id: string;
  courseName: string;
  moduleName: string;
  hours: number;
  marks: number;
  confidence: number; // 0-1
  extractedText: string;
  status: "pending" | "approved" | "rejected";
}

export interface CurriculumReviewTableProps {
  items: CurriculumReviewItem[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onEdit?: (item: CurriculumReviewItem) => void;
  readOnly?: boolean;
}

export function CurriculumReviewTable({
  items,
  onApprove,
  onReject,
  onEdit,
  readOnly = false,
}: CurriculumReviewTableProps) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Course</TableCell>
            <TableCell>Module</TableCell>
            <TableCell align="right">Hours</TableCell>
            <TableCell align="right">Marks</TableCell>
            <TableCell>Confidence</TableCell>
            <TableCell>Status</TableCell>
            {!readOnly && <TableCell align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.courseName}</TableCell>
              <TableCell>{item.moduleName}</TableCell>
              <TableCell align="right">{item.hours}</TableCell>
              <TableCell align="right">{item.marks}</TableCell>
              <TableCell>
                <Chip
                  label={`${Math.round(item.confidence * 100)}%`}
                  color={item.confidence > 0.8 ? "success" : item.confidence > 0.5 ? "warning" : "error"}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={item.status}
                  color={
                    item.status === "approved"
                      ? "success"
                      : item.status === "rejected"
                      ? "error"
                      : "default"
                  }
                  size="small"
                />
              </TableCell>
              {!readOnly && (
                <TableCell align="right">
                  {item.status === "pending" && (
                    <>
                      <Tooltip title="Approve">
                        <IconButton size="small" color="success" onClick={() => onApprove?.(item.id)}>
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton size="small" color="error" onClick={() => onReject?.(item.id)}>
                          <Cancel fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => onEdit?.(item)}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default CurriculumReviewTable;