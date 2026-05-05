'use client';

import { ReactFlowProvider } from '@xyflow/react';
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas';
import './workflow.css';

export default function WorkflowPage() {
  return (
    <div className="w-screen h-screen workflow-canvas">
      <ReactFlowProvider>
        <WorkflowCanvas />
      </ReactFlowProvider>
    </div>
  );
}