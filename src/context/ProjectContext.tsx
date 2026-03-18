import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface ProjectContextType {
  currentProject: string | null;
  setCurrentProject: (path: string | null) => void;
  isLoading: boolean;
  error: string | null;
  setError: (err: string | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if project is already open on mount
    const fetchCurrentProject = async () => {
      try {
        const result = await window.api.getCurrentProject();
        if (result.success && result.path) {
          setCurrentProject(result.path);
        }
      } catch (err: unknown) {
        console.error('Failed to get current project', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentProject();
  }, []);

  return (
    <ProjectContext.Provider value={{ currentProject, setCurrentProject, isLoading, error, setError }}>
      {children}
    </ProjectContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
