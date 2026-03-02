import React from 'react';
import ReactDOM from 'react-dom/client';
import { FormWizard } from './components';
import './styles.css';

const App: React.FC = () => {
  return (
    <div className="w9-widget">
      <FormWizard />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('w9-form-widget')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
