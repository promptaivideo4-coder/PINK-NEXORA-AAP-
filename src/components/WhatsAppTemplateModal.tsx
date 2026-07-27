import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Edit2, Save } from 'lucide-react';
import { WhatsAppTemplate } from '../types';

interface WhatsAppTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: WhatsAppTemplate[];
  onSave: (templates: WhatsAppTemplate[]) => void;
}

export default function WhatsAppTemplateModal({ isOpen, onClose, templates, onSave }: WhatsAppTemplateModalProps) {
  const [localTemplates, setLocalTemplates] = useState<WhatsAppTemplate[]>(templates);

  const addTemplate = () => {
    setLocalTemplates([...localTemplates, { id: Date.now().toString(), name: 'New Template', content: 'Hello {client_name}, ' }]);
  };

  const updateTemplate = (id: string, field: keyof WhatsAppTemplate, value: string) => {
    setLocalTemplates(localTemplates.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const deleteTemplate = (id: string) => {
    setLocalTemplates(localTemplates.filter(t => t.id !== id));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl"
          >
            <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center">
              <h2 className="text-lg font-bold text-on-surface">Manage Templates</h2>
              <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto flex flex-col gap-4">
              {localTemplates.map(template => (
                <div key={template.id} className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col gap-2">
                  <input
                    value={template.name}
                    onChange={(e) => updateTemplate(template.id, 'name', e.target.value)}
                    className="font-bold text-sm bg-transparent border-none focus:outline-none"
                    placeholder="Template Name"
                  />
                  <textarea
                    value={template.content}
                    onChange={(e) => updateTemplate(template.id, 'content', e.target.value)}
                    className="text-xs text-on-surface-variant bg-white p-2 rounded-lg border border-outline-variant/20 focus:outline-none focus:border-primary"
                    rows={3}
                    placeholder="Message content ({client_name}, {service_name})"
                  />
                  <button onClick={() => deleteTemplate(template.id)} className="self-end text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button onClick={addTemplate} className="w-full py-3 rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant text-sm font-semibold flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Template
              </button>
            </div>
            <div className="p-4 border-t border-outline-variant/30 flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 text-on-surface-variant font-semibold">Cancel</button>
              <button onClick={() => { onSave(localTemplates); onClose(); }} className="px-4 py-2 bg-primary text-white rounded-xl font-semibold flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
