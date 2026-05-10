import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Silence MetaMask noise from browser extensions or environment
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && (args[0].includes('MetaMask') || args[0].includes('metamask'))) return;
  if (args[0] instanceof Error && args[0].message.includes('MetaMask')) return;
  originalConsoleError.apply(console, args);
};

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && (event.reason.message?.includes('MetaMask') || event.reason.message?.includes('metamask'))) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
