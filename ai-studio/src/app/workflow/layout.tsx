import { ReactFlowProvider } from "@xyflow/react";

export default function WorkflowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>;
}