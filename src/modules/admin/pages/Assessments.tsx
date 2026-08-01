// pages/Assessments.tsx
// Stub page - redirects to new assessment portal
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Assessments() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/student/assessment');
  }, [navigate]);

  return null;
}