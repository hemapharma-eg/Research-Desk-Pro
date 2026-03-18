import { useProject } from '../../context/ProjectContext';

export function Dashboard() {
  const { currentProject, setCurrentProject, error, setError } = useProject();

  const handleCreateOrOpenProject = async () => {
    try {
      setError(null);
      // 1. Open native folder selection dialog
      const folderPath = await window.api.openDirectoryDialog();
      
      if (!folderPath) {
        return; // User canceled
      }

      // 2. Initialize the SQLite DB in that folder
      const result = await window.api.createOrOpenProject(folderPath);
      
      if (result.success) {
        setCurrentProject(result.path!);
      } else {
        setError(result.error || 'Unknown initialization error');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleCloseProject = async () => {
    try {
      await window.api.closeProject();
      setCurrentProject(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div style={{ padding: 'var(--space-4)', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-4)' }}>
        Project Manager
      </h2>

      {error && (
        <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-bg-hover)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {!currentProject ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-6)', border: '1px dashed var(--color-border-strong)', borderRadius: 'var(--radius-lg)', alignItems: 'center', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>You don't have any project open.</p>
          <button 
            onClick={handleCreateOrOpenProject}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: 'var(--color-accent-primary)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              fontWeight: 'var(--font-weight-medium)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            Create or Open Project
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-6)', backgroundColor: 'var(--color-bg-sidebar)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-light)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-medium)' }}>Active Project</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-2)' }}>{currentProject}</p>
          </div>
          
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <button 
              onClick={handleCloseProject}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                backgroundColor: 'transparent',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-strong)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Close Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
