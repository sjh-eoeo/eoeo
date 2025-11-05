import React from 'react';

export const ShieldCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.75c-2.43 0-4.714-.403-6.75-1.125a9.01 9.01 0 0 1-3.375-3.375C1.125 15.186.722 12.91.722 10.5c0-2.41.403-4.686 1.125-6.725a9.01 9.01 0 0 1 3.375-3.375C7.286 2.625 9.57 2.25 12 2.25c2.43 0 4.714.375 6.75 1.125a9.01 9.01 0 0 1 3.375 3.375c.722 2.039 1.125 4.315 1.125 6.725 0 2.41-.403 4.686-1.125 6.725a9.01 9.01 0 0 1-3.375 3.375C16.714 21.375 14.43 21.75 12 21.75Z" />
  </svg>
);