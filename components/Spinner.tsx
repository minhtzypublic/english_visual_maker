
import React from 'react';

const Spinner = ({ size = 'w-8 h-8' }: { size?: string }) => (
  <div className={`animate-spin rounded-full border-4 border-slate-200 border-t-blue-500 ${size}`} />
);

export default Spinner;
