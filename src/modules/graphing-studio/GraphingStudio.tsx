import { useProject } from '../../context/ProjectContext';
import { GraphEditorCore } from './GraphEditorCore';

export function GraphingStudio() {
  const { currentProject } = useProject();

  if (!currentProject) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--space-8)' }}>
        <p>Please open a project to view the Graphing Studio.</p>
      </div>
    );
  }

  return (
    <GraphEditorCore showActions={false} />
  );
}
