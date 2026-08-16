import React from 'react';
import { useRoutes } from 'react-router-dom';
import { appRoutes } from './index';

export default function MainRoutes() {
  return useRoutes(appRoutes);
}