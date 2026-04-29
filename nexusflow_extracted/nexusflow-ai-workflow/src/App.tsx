import { ReactFlowProvider } from '@xyflow/react';
import WorkflowCanvas from './components/WorkflowCanvas';

export default function App() {
  return (
    <div className="w-screen h-screen overflow-hidden font-sans text-slate-900">
      <ReactFlowProvider>
        <WorkflowCanvas />
      </ReactFlowProvider>
    </div>
  );
}
