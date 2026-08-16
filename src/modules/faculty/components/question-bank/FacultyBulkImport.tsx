// src/modules/components/question-bank/FacultyBulkImport.tsx
// FIXED: onImport returns Promise<void>, not Promise<void> with async param

import React, { useState, useRef } from 'react';
import {
  Box, Button, Typography, Paper, Alert, List, ListItem,
  ListItemText, Chip, Divider,
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';

interface FacultyBulkImportProps {
  batches: string[];
  branches: string[];
  subjects: string[];
  onImport: (questions: Record<string, unknown>[]) => Promise<void>;
  onCancel: () => void;
}

interface ParsedRow {
  text: string;
  subject: string;
  type: string;
  difficulty: string;
  marks: string;
  unit: string;
  correctAnswer: string;
  batch: string;
  branch: string;
  tags: string;
}

const FacultyBulkImport: React.FC<FacultyBulkImportProps> = ({
  batches,
  branches,
  subjects,
  onImport,
  onCancel,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError(null);

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) {
          setError('CSV file is empty or has no data rows');
          return;
        }
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const rows: ParsedRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
          });
          rows.push({
            text: row.text || '',
            subject: row.subject || '',
            type: row.type || '',
            difficulty: row.difficulty || '',
            marks: row.marks || '',
            unit: row.unit || '',
            correctAnswer: row.correctanswer || row.correct_answer || '',
            batch: row.batch || '',
            branch: row.branch || '',
            tags: row.tags || '',
          });
        }
        setParsed(rows);
      } catch (err) {
        setError('Failed to parse file. Ensure it is a valid CSV.');
      }
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (parsed.length === 0) return;
    setImporting(true);
    try {
      const questions = parsed.map(row => ({
        text: row.text,
        subject: row.subject,
        type: row.type,
        difficulty: row.difficulty,
        marks: Number(row.marks) || 1,
        unit: row.unit,
        correctAnswer: row.correctAnswer,
        batch: row.batch || undefined,
        branch: row.branch || undefined,
        tags: row.tags ? row.tags.split(';').map(t => t.trim()).filter(Boolean) : [],
      })) as Record<string, unknown>[];
      await onImport(questions);
      setFile(null);
      setParsed([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Box>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <Paper
        variant="outlined"
        sx={{
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          borderStyle: 'dashed',
          borderWidth: 2,
        }}
        onClick={() => inputRef.current?.click()}
      >
        <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          {file ? file.name : 'Click to upload CSV'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Supports CSV format with headers: text, subject, type, difficulty, marks, unit, correctAnswer, batch, branch, tags
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {parsed.length > 0 && (
        <>
          <Alert severity="info" sx={{ mt: 2 }}>
            Parsed {parsed.length} questions. Review below before importing.
          </Alert>
          <Paper variant="outlined" sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
            <List dense>
              {parsed.slice(0, 10).map((row, i) => (
                <ListItem key={i} divider>
                  <ListItemText
                    primary={row.text || 'No text'}
                    secondary={
                      <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                        {row.subject && <Chip label={row.subject} size="small" />}
                        {row.type && <Chip label={row.type.toUpperCase()} size="small" variant="outlined" />}
                        {row.difficulty && <Chip label={row.difficulty} size="small" color="primary" />}
                      </span>
                    }
                  />
                </ListItem>
              ))}
              {parsed.length > 10 && (
                <ListItem>
                  <ListItemText primary={`... and ${parsed.length - 10} more`} />
                </ListItem>
              )}
            </List>
          </Paper>
        </>
      )}

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onCancel} variant="outlined">Cancel</Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={parsed.length === 0 || importing}
        >
          {importing ? 'Importing...' : `Import ${parsed.length} Questions`}
        </Button>
      </Box>
    </Box>
  );
};

export default FacultyBulkImport;