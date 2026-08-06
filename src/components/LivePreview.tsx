import React from 'react';
import { WebsiteConfig } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { renderSiteHTML } from '../lib/siteTemplates';

interface LivePreviewProps {
  config: WebsiteConfig;
}

/**
 * LivePreview renders the EXACT same standalone HTML that gets published.
 * So jo template select kiya hai, wahi yahan live preview me dikhta hai —
 * aur jab GO LIVE dabao, bilkul wahi website live ho jaati hai.
 */
export default function LivePreview({ config }: LivePreviewProps) {
  const { activeTheme } = useTheme();
  const html = renderSiteHTML(config, activeTheme.id);

  return (
    <div className="w-full h-full flex flex-col bg-surface-container-lowest overflow-hidden">
      {/* Mini browser chrome */}
      <div className="h-8 bg-surface-container-high border-b border-outline-variant flex items-center px-3 gap-2 shrink-0">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
        </div>
        <div className="mx-auto bg-surface-container-lowest px-3 py-0.5 rounded-md text-[10px] font-mono text-on-surface-variant truncate max-w-[220px]">
          🔒 {config.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'mysalon'}.nexora.live
        </div>
      </div>
      <iframe
        title="Live Website Preview"
        sandbox="allow-scripts"
        srcDoc={html}
        className="w-full flex-1 border-0 bg-white"
      />
    </div>
  );
}
