// ============================================================
// VRIDDHI - TemplateSelector Component
// ============================================================
// Select and generate papers from predefined templates
// Uses Box + flexWrap layout (no MUI Grid)
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from '@mui/material';
import {
  Description as TemplateIcon,
  School as SchoolIcon,
  Timer as TimerIcon,
  Assessment as AssessmentIcon,
  ArrowForward as NextIcon,
  ArrowBack as BackIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useQuestionBank } from '../../../modules/admin/hooks/useQuestionBank';
import { useAuth } from '../../auth/context/AuthContext';
import {
  type PaperTemplate,
  type PaperGenerationResult,
  type DifficultyCount,
} from '../../admin/types/universalQuestionBank';

// ============================================================
// TEMPLATE CARD
// ============================================================

interface TemplateCardProps {
  template: PaperTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  const totalQuestions = Object.values(template.topicDistribution).reduce(
    (sum: number, dist: DifficultyCount) => sum + dist.easy + dist.medium + dist.hard,
    0
  );

  return (
    <Card
      variant="outlined"
      sx={{
        cursor: 'pointer',
        borderColor: isSelected ? 'primary.main' : 'divider',
        borderWidth: isSelected ? 2 : 1,
        bgcolor: isSelected ? 'primary.light' : 'background.paper',
        '&:hover': { borderColor: 'primary.main' },
      }}
      onClick={onSelect}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <TemplateIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {template.name}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {template.description}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip icon={<AssessmentIcon />} label={`${totalQuestions} Q`} size="small" />
          <Chip icon={<TimerIcon />} label={`${template.duration} min`} size="small" />
          <Chip label={`${template.totalMarks} marks`} size="small" />
        </Box>

        <Divider sx={{ my: 1 }} />

        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
          Topic Distribution:
        </Typography>
        <Box sx={{ mt: 1 }}>
          {Object.entries(template.topicDistribution).map(([topicId, dist]) => {
            const d = dist as DifficultyCount;
            const total = d.easy + d.medium + d.hard;
            return (
              <Box key={topicId} sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{topicId}</Typography>
                  <Typography variant="caption" color="text.secondary">{total} questions</Typography>
                </Box>
                <Box sx={{ display: 'flex', height: 20, borderRadius: 1, overflow: 'hidden' }}>
                  {d.easy > 0 && (
                    <Box sx={{ flex: d.easy / total, bgcolor: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {d.easy > 0 && <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 600 }}>{d.easy}E</Typography>}
                    </Box>
                  )}
                  {d.medium > 0 && (
                    <Box sx={{ flex: d.medium / total, bgcolor: '#fff3e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {d.medium > 0 && <Typography variant="caption" sx={{ color: '#ef6c00', fontWeight: 600 }}>{d.medium}M</Typography>}
                    </Box>
                  )}
                  {d.hard > 0 && (
                    <Box sx={{ flex: d.hard / total, bgcolor: '#ffebee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {d.hard > 0 && <Typography variant="caption" sx={{ color: '#c62828', fontWeight: 600 }}>{d.hard}H</Typography>}
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

// ============================================================
// GENERATION RESULT DIALOG
// ============================================================

interface ResultDialogProps {
  open: boolean;
  onClose: () => void;
  result: PaperGenerationResult | null;
}

function ResultDialog({ open, onClose, result }: ResultDialogProps) {
  if (!result) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckIcon color="success" />
          Paper Generated Successfully!
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Alert severity={result.warnings.length > 0 ? 'warning' : 'success'}>
            {result.warnings.length > 0
              ? `Generated with ${result.warnings.length} warning(s)`
              : 'Paper generated successfully!'}
          </Alert>

          <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {result.paper.title}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              <Chip label={`${result.paper.totalQuestions} questions`} />
              <Chip label={`${result.paper.totalMarks} marks`} />
              <Chip label={`${result.paper.duration} minutes`} />
            </Box>
          </Paper>

          {result.warnings.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="warning.main" gutterBottom>
                Warnings:
              </Typography>
              {result.warnings.map((w: string, i: number) => (
                <Typography key={i} variant="body2" color="text.secondary">
                  &bull; {w}
                </Typography>
              ))}
            </Box>
          )}

          {result.excludedTopics.length > 0 && (
            <Alert severity="info">
              <Typography variant="subtitle2">Excluded Topics:</Typography>
              {result.excludedTopics.map((t: string, i: number) => (
                <Typography key={i} variant="body2">
                  &bull; {t}
                </Typography>
              ))}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={onClose}>
          View Paper
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function TemplateSelector() {
  const { user } = useAuth();
  const {
    templates,
    loadingUniversal,
    errorsUniversal,
    loadTemplates,
    generateFromTemplate,
  } = useQuestionBank();

  const [activeStep, setActiveStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<PaperTemplate | null>(null);
  const [paperTitle, setPaperTitle] = useState('');
  const [paperDescription, setPaperDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'college_only' | 'shared_with'>('college_only');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<PaperGenerationResult | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const steps = ['Select Template', 'Configure Paper', 'Generate'];

  const handleGenerate = async () => {
    if (!selectedTemplate || !user) return;

    setIsGenerating(true);
    setGenerateError(null);

    try {
      const result = await generateFromTemplate(
        selectedTemplate.id,
        paperTitle,
        paperDescription,
        {
          userId: user.id,
          userName: user.name || 'Unknown',
          collegeId: user.collegeId || null,
          collegeName: (user as any)?.collegeName || 'Unknown',
          role: (user?.role as any) || 'faculty',
        },
        visibility
      );

      if (result) {
        setGenerationResult(result);
        setResultOpen(true);
      } else {
        setGenerateError('Failed to generate paper. Please try again.');
      }
    } catch (error) {
      setGenerateError((error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && !selectedTemplate) {
      setGenerateError('Please select a template');
      return;
    }
    if (activeStep === 1 && !paperTitle.trim()) {
      setGenerateError('Paper title is required');
      return;
    }
    setGenerateError(null);
    if (activeStep === steps.length - 1) {
      handleGenerate();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setGenerateError(null);
    setActiveStep((prev) => prev - 1);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
        Generate Paper from Template
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose a template and auto-generate a balanced question paper
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {generateError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {generateError}
        </Alert>
      )}

      {/* Step 1: Select Template */}
      {activeStep === 0 && (
        <Box>
          {loadingUniversal.templates ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : errorsUniversal.templates ? (
            <Alert severity="error">{errorsUniversal.templates}</Alert>
          ) : templates.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No templates available
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {templates.map((template) => (
                <Box key={template.id} sx={{ flex: '1 1 350px', minWidth: 300 }}>
                  <TemplateCard
                    template={template}
                    isSelected={selectedTemplate?.id === template.id}
                    onSelect={() => setSelectedTemplate(template)}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Step 2: Configure */}
      {activeStep === 1 && selectedTemplate && (
        <Stack spacing={3}>
          <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Selected Template
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {selectedTemplate.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedTemplate.description}
            </Typography>
          </Paper>

          <TextField
            fullWidth
            label="Paper Title *"
            value={paperTitle}
            onChange={(e) => setPaperTitle(e.target.value)}
            placeholder="e.g., Mathematics Mid-Term 2026"
          />

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Description"
            value={paperDescription}
            onChange={(e) => setPaperDescription(e.target.value)}
            placeholder="Brief description..."
          />

          <FormControl fullWidth>
            <InputLabel>Visibility</InputLabel>
            <Select
              value={visibility}
              label="Visibility"
              onChange={(e) => setVisibility(e.target.value as any)}
            >
              <MenuItem value="public">Public (All Colleges)</MenuItem>
              <MenuItem value="college_only">College Only</MenuItem>
              <MenuItem value="shared_with">Shared With Specific Colleges</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      )}

      {/* Step 3: Generate */}
      {activeStep === 2 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" gutterBottom>
            Ready to Generate
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Paper will be generated with {selectedTemplate ? Object.values(selectedTemplate.topicDistribution).reduce(
              (sum: number, dist: DifficultyCount) => sum + dist.easy + dist.medium + dist.hard, 0
            ) : 0} questions from the universal pool
          </Typography>
          {isGenerating && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
              <CircularProgress />
              <Typography>Generating paper...</Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          disabled={activeStep === 0 || isGenerating}
          onClick={handleBack}
          startIcon={<BackIcon />}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={isGenerating}
          endIcon={activeStep === steps.length - 1 ? undefined : <NextIcon />}
          startIcon={activeStep === steps.length - 1 && isGenerating ? <CircularProgress size={20} /> : undefined}
        >
          {activeStep === steps.length - 1
            ? isGenerating ? 'Generating...' : 'Generate Paper'
            : 'Next'}
        </Button>
      </Box>

      {/* Result Dialog */}
      <ResultDialog
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        result={generationResult}
      />
    </Box>
  );
}

export default TemplateSelector;