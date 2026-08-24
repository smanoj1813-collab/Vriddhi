// ═══════════════════════════════════════════════════════════════════════
// ModuleBreakdown — Expandable module viewer
// Uses Box flexWrap pattern (no MUI Grid)
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import {
  Box, Typography, IconButton, Chip, Stack, TextField, Tooltip, Paper, Collapse,
} from '@mui/material';
import {
  ExpandMore as ExpandIcon, ChevronRight as CollapseIcon, Edit as EditIcon,
  Save as SaveIcon, Cancel as CancelIcon, AccessTime as HoursIcon,
  Grade as MarksIcon, MenuBook as TopicIcon,
} from '@mui/icons-material';
import type { ParsedModule } from '../types/curriculum';

interface ModuleBreakdownProps {
  modules: ParsedModule[];
  onModuleUpdate?: (moduleId: string, updates: Partial<ParsedModule>) => void;
  readOnly?: boolean;
}

interface EditingModule { moduleId: string; field: keyof ParsedModule; }

export default function ModuleBreakdown({ modules, onModuleUpdate, readOnly = false }: ModuleBreakdownProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [editingModule, setEditingModule] = useState<EditingModule | null>(null);
  const [editValue, setEditValue] = useState('');

  const toggleModule = useCallback((moduleId: string) => {
    setExpandedModules(prev => { const next = new Set(prev); if (next.has(moduleId)) next.delete(moduleId); else next.add(moduleId); return next; });
  }, []);

  const startEdit = useCallback((moduleId: string, field: keyof ParsedModule, value: string | number) => {
    setEditingModule({ moduleId, field }); setEditValue(String(value));
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingModule || !onModuleUpdate) return;
    const { moduleId, field } = editingModule;
    const updates: Partial<ParsedModule> = {};
    if (field === 'hours' || field === 'marks' || field === 'moduleNo') { updates[field] = parseInt(editValue, 10) || 0; }
    else { (updates as any)[field] = editValue; }
    onModuleUpdate(moduleId, updates);
    setEditingModule(null); setEditValue('');
  }, [editingModule, editValue, onModuleUpdate]);

  const cancelEdit = useCallback(() => { setEditingModule(null); setEditValue(''); }, []);

  const confidenceColor = (c: string) => { if (c === 'high') return 'success'; if (c === 'medium') return 'warning'; return 'error'; };

  if (modules.length === 0) {
    return <Box sx={{ p: 2, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">No modules found for this course.</Typography></Box>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 500 }}>Modules ({modules.length})</Typography>
      <Stack spacing={1}>
        {modules.map((module) => {
          const isExpanded = expandedModules.has(module.id);
          const isEditing = editingModule?.moduleId === module.id;
          const topics = module.topics || [];
          const hasTopics = topics.length > 0;
          const hasLO = module.learningOutcomes && module.learningOutcomes.length > 0;
          const moduleName = module.moduleName || '';
          const hours = module.hours || 0;
          const confidence = module.confidence || 'low';
          return (
            <Paper key={module.id} variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden', borderColor: module.isEdited ? 'info.main' : 'divider', ...(module.isEdited && { borderWidth: 2 }) }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, cursor: hasTopics || hasLO ? 'pointer' : 'default', '&:hover': hasTopics || hasLO ? { bgcolor: 'action.hover' } : {} }}
                onClick={() => { if (hasTopics || hasLO) toggleModule(module.id); }}>
                <Box sx={{ width: 32, flexShrink: 0 }}>
                  {(hasTopics || hasLO) && <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleModule(module.id); }}>{isExpanded ? <ExpandIcon /> : <CollapseIcon />}</IconButton>}
                </Box>
                <Chip label={`M${module.moduleNo}`} size="small" color="default" sx={{ minWidth: 40, fontWeight: 500 }} />
                <Box sx={{ flex: '1 1 200px' }}>
                  {isEditing && editingModule?.field === 'moduleName' ? (
                    <TextField size="small" value={editValue} onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); saveEdit(); } if (e.key === 'Escape') { e.stopPropagation(); cancelEdit(); } }}
                      autoFocus fullWidth onClick={(e) => e.stopPropagation()}
                      slotProps={{ input: { endAdornment: (
                        <Stack direction="row" spacing={0.5}>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); saveEdit(); }}><SaveIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); cancelEdit(); }}><CancelIcon fontSize="small" /></IconButton>
                        </Stack>
                      )}}} />
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{moduleName}</Typography>
                      {module.isEdited && <Chip label="edited" size="small" color="info" sx={{ height: 18, fontSize: 10 }} />}
                      {!readOnly && <IconButton size="small" sx={{ opacity: 0, transition: 'opacity 0.15s', '&:hover': { opacity: 1 }, '.MuiBox-root:hover &': { opacity: 1 } }}
                        onClick={(e) => { e.stopPropagation(); startEdit(module.id, 'moduleName', moduleName); }}><EditIcon fontSize="small" /></IconButton>}
                    </Box>
                  )}
                </Box>
                <Tooltip title="Teaching hours">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                    <HoursIcon fontSize="small" color="action" />
                    {isEditing && editingModule?.field === 'hours' ? (
                      <TextField size="small" type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); saveEdit(); } if (e.key === 'Escape') { e.stopPropagation(); cancelEdit(); } }}
                        autoFocus sx={{ width: 50 }} onClick={(e) => e.stopPropagation()} />
                    ) : (
                      <Typography variant="body2" onClick={(e) => { if (!readOnly) { e.stopPropagation(); startEdit(module.id, 'hours', hours); } }}
                        sx={!readOnly ? { cursor: 'pointer', '&:hover': { textDecoration: 'underline' } } : {}}>{hours}h</Typography>
                    )}
                  </Box>
                </Tooltip>
                <Tooltip title="Marks">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                    <MarksIcon fontSize="small" color="action" />
                    <Typography variant="body2">{module.marks || 0}</Typography>
                  </Box>
                </Tooltip>
                <Tooltip title={`${topics.length} topics`}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                    <TopicIcon fontSize="small" color="action" />
                    <Typography variant="body2">{topics.length}</Typography>
                  </Box>
                </Tooltip>
                <Chip label={confidence} size="small" color={confidenceColor(confidence) as any} sx={{ textTransform: 'capitalize', height: 22, fontSize: 11 }} />
              </Box>
              <Collapse in={isExpanded}>
                <Box sx={{ px: 2, pb: 2, pt: 0.5 }}>
                  {module.description && <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontStyle: 'italic' }}>{module.description}</Typography>}
                  {topics.length > 0 && (
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>Topics</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
                        {topics.map((topic, i) => <Chip key={i} label={topic} size="small" variant="outlined" sx={{ fontSize: 12, height: 24 }} />)}
                      </Box>
                    </Box>
                  )}
                  {module.learningOutcomes && module.learningOutcomes.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>Learning outcomes</Typography>
                      <ul style={{ margin: '4px 0 0 0', paddingLeft: 16 }}>
                        {module.learningOutcomes.map((lo, i) => <li key={i}><Typography variant="body2" color="text.secondary">{lo}</Typography></li>)}
                      </ul>
                    </Box>
                  )}
                  {!module.description && topics.length === 0 && (!module.learningOutcomes || module.learningOutcomes.length === 0) && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>No detailed content extracted for this module.</Typography>
                  )}
                </Box>
              </Collapse>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}
