import React from 'react';
import { useLanguage } from '../contexts/LanguageProvider';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import { IconButton, Menu, MenuItem, Tooltip, Typography, Box } from '@mui/material';
import { Translate as TranslateIcon } from '@mui/icons-material';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.value === language) || SUPPORTED_LANGUAGES[0];

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (langValue: string) => {
    setLanguage(langValue);
    handleClose();
  };

  return (
    <>
      <Tooltip title={`Language: ${currentLang.label} (${currentLang.nativeLabel})`}>
        <IconButton onClick={handleClick} size="small" sx={{ p: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TranslateIcon fontSize="small" />
            <Typography variant="caption" sx={{ fontWeight: 600, ml: 0.5 }}>
              {currentLang.flag} {currentLang.code.toUpperCase()}
            </Typography>
          </Box>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: { minWidth: 220, borderRadius: 2, mt: 1 }
          }
        }}
      >
        {SUPPORTED_LANGUAGES.map(lang => (
          <MenuItem
            key={lang.value}
            onClick={() => handleSelect(lang.value)}
            selected={language === lang.value}
            sx={{ display: 'flex', gap: 1.5, py: 1 }}
          >
            <span style={{ fontSize: '18px' }}>{lang.flag}</span>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{lang.label}</Typography>
              <Typography variant="caption" color="text.secondary">{lang.nativeLabel}</Typography>
            </Box>
            {language === lang.value && (
              <Typography variant="caption" sx={{ ml: 'auto', color: 'primary.main', fontWeight: 700 }}>✓</Typography>
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
