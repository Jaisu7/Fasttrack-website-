'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { Grid2X2, Box } from 'lucide-react';
const ExperienceContext = createContext({ technical: false, toggle: () => {} });
export function ExperienceProvider({ children }) {
  const [technical, setTechnical] = useState(false);
  const [restored, setRestored] = useState(false);
  useEffect(() => { try { setTechnical(localStorage.getItem('fastrack-technical-view') === 'true'); } catch {} setRestored(true); }, []);
  useEffect(() => {
    if (!restored) return;
    document.documentElement.dataset.experience = technical ? 'technical' : 'studio';
    try { localStorage.setItem('fastrack-technical-view', String(technical)); } catch {}
    window.dispatchEvent(new Event('fastrack:view-change'));
  }, [technical, restored]);
  return <ExperienceContext.Provider value={{ technical, toggle: () => setTechnical(value => !value) }}>{children}</ExperienceContext.Provider>;
}
export function TechnicalToggle({ className = '' }) {
  const { technical, toggle } = useContext(ExperienceContext);
  const Icon = technical ? Box : Grid2X2;
  return <button type="button" className={`technical-toggle ${className}`} onClick={toggle} aria-pressed={technical} aria-label="Technical view"><Icon size={16} strokeWidth={1.5}/><span>{technical ? 'Studio view' : 'Technical view'}</span></button>;
}
export function LocalTime() {
  const [time, setTime] = useState('--:--');
  useEffect(() => { const update = () => setTime(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit' }).format(new Date())); update(); const timer = setInterval(update, 60000); return () => clearInterval(timer); }, []);
  return <span className="local-time" aria-label={`Local time in Sharjah ${time}`}>Sharjah <time>{time}</time></span>;
}
export function RollingText({ children }) { return <span className="rolling-text"><span>{children}</span><span aria-hidden="true">{children}</span></span>; }
