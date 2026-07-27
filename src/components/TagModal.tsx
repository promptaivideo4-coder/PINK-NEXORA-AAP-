import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { Tag } from '../types';

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: Tag[];
  onSave: (tags: Tag[]) => void;
}

export default function TagModal({ isOpen, onClose, tags, onSave }: TagModalProps) {
  const [localTags, setLocalTags] = useState<Tag[]>(tags);

  const addTag = () => {
    setLocalTags([...localTags, { id: Date.now().toString(), name: 'New Tag', color: '#CBD5E1' }]);
  };

  const updateTag = (id: string, field: keyof Tag, value: string) => {
    setLocalTags(localTags.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const deleteTag = (id: string) => {
    setLocalTags(localTags.filter(t => t.id !== id));
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
            className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl"
          >
            <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center">
              <h2 className="text-lg font-bold text-on-surface">Manage Tags</h2>
              <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto flex flex-col gap-3">
              {localTags.map(tag => (
                <div key={tag.id} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 flex items-center gap-2">
                  <input
                    type="color"
                    value={tag.color}
                    onChange={(e) => updateTag(tag.id, 'color', e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer"
                  />
                  <input
                    value={tag.name}
                    onChange={(e) => updateTag(tag.id, 'name', e.target.value)}
                    className="flex-grow font-semibold text-sm bg-transparent border-none focus:outline-none"
                    placeholder="Tag Name"
                  />
                  <button onClick={() => deleteTag(tag.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button onClick={addTag} className="w-full py-2 rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant text-sm font-semibold flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Tag
              </button>
            </div>
            <div className="p-4 border-t border-outline-variant/30 flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 text-on-surface-variant font-semibold">Cancel</button>
              <button onClick={() => { onSave(localTags); onClose(); }} className="px-4 py-2 bg-primary text-white rounded-xl font-semibold flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
