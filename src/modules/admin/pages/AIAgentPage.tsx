// src/pages/admin/AIAgentPage.tsx
import React from 'react'
import { Box, Typography, Paper, Alert } from '@mui/material'

export default function AIAgentPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🤖 AI Agent
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Alert severity="info">
          AI Agent Panel is under development. This page will provide
          intelligent insights across attendance, performance, fees, and faculty data.
        </Alert>
      </Paper>
    </Box>
  )
}