// ═══════════════════════════════════════════════════════════════════════
// SYLLABUS UPLOADER — Type-safe version compatible with unified hook
// FIXED: Defensive optional chaining on warnings/errors arrays
// ═══════════════════════════════════════════════════════════════════════

import React, { useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Alert,
  AlertTitle,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Description as DocxIcon,
  PictureAsPdf as PdfIcon,
  TextSnippet as TxtIcon,
} from "@mui/icons-material";

import { useSyllabusParser } from "../hooks/useSyllabusParser";
import type { SyllabusFormat } from "../types/curriculum";

const FORMAT_ICONS: Record<SyllabusFormat, React.ReactNode> = {
  docx: <DocxIcon />,
  pdf: <PdfIcon />,
  txt: <TxtIcon />,
};

const FORMAT_COLORS: Record<SyllabusFormat, "default" | "primary" | "error"> = {
  docx: "primary",
  pdf: "error",
  txt: "default",
};

export const SyllabusUploader: React.FC = () => {
  const {
    phase,
    extract,
    rawText,
    errors,
    warnings,
    confidenceScore,
    parseFile,
    saveExtract,
    reset,
  } = useSyllabusParser();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await parseFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isBusy = phase === "uploading" || phase === "parsing" || phase === "saving";

  // DEFENSIVE: coerce to arrays even if hook returns undefined
  const safeWarnings = Array.isArray(warnings) ? warnings : [];
  const safeErrors = Array.isArray(errors) ? errors : [];

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Syllabus Uploader
      </Typography>

      {/* Upload Area */}
      <Paper
        variant="outlined"
        sx={{
          p: 4,
          textAlign: "center",
          border: "2px dashed",
          borderColor: "divider",
          cursor: isBusy ? "not-allowed" : "pointer",
          opacity: isBusy ? 0.6 : 1,
          transition: "all 0.2s",
          "&:hover": !isBusy ? { borderColor: "primary.main", backgroundColor: "action.hover" } : {},
        }}
        onClick={() => !isBusy && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.pdf,.txt"
          style={{ display: "none" }}
          onChange={handleFileSelect}
          disabled={isBusy}
        />
        <UploadIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          {isBusy ? "Processing..." : "Drop a syllabus file here, or click to browse"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Supports DOCX, PDF, and TXT files
        </Typography>
      </Paper>

      {/* Progress */}
      {isBusy && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress sx={{ mb: 1 }} />
          <Typography variant="body2" color="text.secondary" align="center">
            {phase === "uploading" && "Uploading to storage..."}
            {phase === "parsing" && "Parsing syllabus content..."}
            {phase === "saving" && "Saving to database..."}
          </Typography>
        </Box>
      )}

      {/* Results */}
      {extract && (
        <Paper sx={{ mt: 3, p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            {FORMAT_ICONS[extract.format]}
            <Typography variant="h6" sx={{ flex: 1 }}>
              {extract.fileName ?? "Untitled"}
            </Typography>
            <Chip
              label={(extract.format ?? "unknown").toUpperCase()}
              size="small"
              color={FORMAT_COLORS[extract.format] ?? "default"}
            />
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
            <Chip label={`${extract.totalCourses ?? 0} courses`} size="small" />
            <Chip label={`${extract.totalModules ?? 0} modules`} size="small" />
            <Chip label={`${extract.totalHours ?? 0} hours`} size="small" />
            <Chip label={`${extract.totalMarks ?? 0} marks`} size="small" />
            <Chip
              label={`${confidenceScore ?? 0}% confidence`}
              size="small"
              color={(confidenceScore ?? 0) >= 70 ? "success" : (confidenceScore ?? 0) >= 40 ? "warning" : "error"}
            />
          </Box>

          {safeWarnings.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>Warnings ({safeWarnings.length})</AlertTitle>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {safeWarnings.map((w: string, i: number) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </Alert>
          )}

          {rawText && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Raw Extract (first 500 chars)
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: "grey.50" }}>
                <Typography variant="body2" sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                  {rawText.substring(0, 500)}
                  {rawText.length > 500 && "..."}
                </Typography>
              </Paper>
            </Box>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button variant="outlined" onClick={reset}>
              Reset
            </Button>
            <Button variant="contained" onClick={saveExtract} disabled={phase !== "done"}>
              Save Extract
            </Button>
          </Box>
        </Paper>
      )}

      {/* Errors */}
      {safeErrors.length > 0 && phase === "error" && (
        <Alert severity="error" sx={{ mt: 3 }}>
          <AlertTitle>Errors ({safeErrors.length})</AlertTitle>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {safeErrors.map((err: string, i: number) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </Alert>
      )}
    </Box>
  );
};

export default SyllabusUploader;