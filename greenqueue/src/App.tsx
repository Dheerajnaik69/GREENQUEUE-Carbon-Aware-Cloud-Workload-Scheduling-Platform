import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { OverviewPage } from './pages/Overview/OverviewPage';
import { JobSubmissionPage } from './pages/JobSubmission/JobSubmissionPage';
import { WorkloadQueuePage } from './pages/WorkloadQueue/WorkloadQueuePage';
import { CarbonIntelligencePage } from './pages/CarbonIntelligence/CarbonIntelligencePage';
import { SmartSchedulerPage } from './pages/SmartScheduler/SmartSchedulerPage';
import { ExecutionHistoryPage } from './pages/ExecutionHistory/ExecutionHistoryPage';
import { SustainabilityReportsPage } from './pages/SustainabilityReports/SustainabilityReportsPage';
import { DemoScenariosPage } from './pages/DemoScenarios/DemoScenariosPage';
import { PresentationModePage } from './pages/PresentationMode/PresentationModePage';
import { SettingsPage } from './pages/Settings/SettingsPage';

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="jobs/new" element={<JobSubmissionPage />} />
            <Route path="queue" element={<WorkloadQueuePage />} />
            <Route path="carbon" element={<CarbonIntelligencePage />} />
            <Route path="scheduler" element={<SmartSchedulerPage />} />
            <Route path="history" element={<ExecutionHistoryPage />} />
            <Route path="reports" element={<SustainabilityReportsPage />} />
            <Route path="scenarios" element={<DemoScenariosPage />} />
            <Route path="presentation" element={<PresentationModePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
