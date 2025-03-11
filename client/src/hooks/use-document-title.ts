import { useEffect } from 'react';

/**
 * Updates the document title with the provided title.
 * Appends " | Nomad Quality Management System" to all titles.
 * 
 * @param title The title to set
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    // Save the original title
    const originalTitle = document.title;
    
    // Set the new title with the Nomad QMS suffix
    document.title = `${title} | Nomad Quality Management System`;
    
    // Restore the original title when the component unmounts
    return () => {
      document.title = originalTitle;
    };
  }, [title]);
}