import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title === 'InterviewDaily' ? title : `${title} · InterviewDaily`;
  }, [title]);
}
