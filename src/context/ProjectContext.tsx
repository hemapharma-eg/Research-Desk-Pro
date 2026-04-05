import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface ProjectContextType {
  currentProject: string | null;
  projectLoadTime: number;
  setCurrentProject: (path: string | null) => void;
  isLoading: boolean;
  error: string | null;
  setError: (err: string | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [projectLoadTime, setProjectLoadTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if project is already open on mount
    const fetchCurrentProject = async () => {
      try {
        const result = await window.api.getCurrentProject();
        if (result.success && result.path) {
          setCurrentProject(result.path);
          setProjectLoadTime(Date.now()); // Distinguish instances of identical paths implicitly loading disjoint data
        }
      } catch (err: unknown) {
        console.error('Failed to get current project', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentProject();
  }, []);

  const handleSetCurrentProject = (path: string | null) => {
    setCurrentProject(path);
    setProjectLoadTime(Date.now()); // Invalidate memoized UI elements
  };

  return (
    <ProjectContext.Provider value={{ currentProject, projectLoadTime, setCurrentProject: handleSetCurrentProject, isLoading, error, setError }}>
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
