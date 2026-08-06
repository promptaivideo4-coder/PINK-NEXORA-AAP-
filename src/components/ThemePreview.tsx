import React from 'react';
import { Theme } from '../types';
import { buildDefaultConfig, renderSiteHTML } from '../lib/siteTemplates';

interface ThemePreviewProps {
  theme: Theme;
}

/**
 * ThemePreview renders the REAL template website (standalone HTML) inside an
 * iframe — jo design aap yahan dekhte ho, wahi website milegi jab aap
 * template select karke Publish karte ho.
 */
export default function ThemePreview({ theme }: ThemePreviewProps) {
  const html = renderSiteHTML(buildDefaultConfig(theme), theme.id);

  return (
    <div
      className="w-full h-full overflow-hidden transition-all duration-300 flex flex-col mx-auto"
    >
      {/* Simulated Browser Header */}
      <div className="h-9 bg-black/10 border-b border-black/10 flex items-center px-3 gap-2 shrink-0">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
        </div>
        <div className="mx-auto bg-black/5 px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-500 truncate max-w-[180px]">
          🔒 {theme.id}.nexora.live
        </div>
      </div>

      {/* The actual template website */}
      <iframe
        title={`${theme.name} template preview`}
        sandbox="allow-scripts"
        srcDoc={html}
        className="w-full flex-1 border-0 bg-white"
      />
    </div>
  );
}
