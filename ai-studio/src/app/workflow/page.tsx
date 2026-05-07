'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ReactFlowProvider } from '@xyflow/react';
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas';
import './workflow.css';
import { Loader2 } from 'lucide-react';

export default function WorkflowPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    const project = searchParams.get('project');
    setProjectId(project);
    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#050608] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-sm text-zinc-500">加载项目中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen workflow-canvas">
      <ReactFlowProvider>
        <WorkflowCanvas initialProjectId={projectId} />
      </ReactFlowProvider>
    </div>
  );
}