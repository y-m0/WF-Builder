import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout';
import MainWorkflowEditorPage from '@/pages/MainWorkflowEditorPage';
import WFBuilderPage from '@/features/workflow-builder/App';

function App() {
  return (
    <Layout> {/* Layout now wraps all routes */}
      <Routes>
        <Route path="/" element={<MainWorkflowEditorPage />} />
        <Route path="/workflows/builder" element={<WFBuilderPage />} />
      </Routes>
    </Layout>
  );
}
export default App;
