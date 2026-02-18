import React from 'react';
import Modal from '../../../shared/components/ui/Modal';
import { DashboardPalette } from '../hooks/useDashboardPalette';

interface PalettePickerModalProps {
  isOpen: boolean;
  currentPalette: DashboardPalette;
  onSelect: (p: DashboardPalette) => void;
  onClose: () => void;
}

const palettes: { id: DashboardPalette; name: string; colors: string[] }[] = [
  { id: 1, name: 'Ocean', colors: ['#213555', '#3E5879', '#D8C4B6', '#F5EFE7'] },
  { id: 2, name: 'Dusk', colors: ['#8294C4', '#ACB1D6', '#DBDFEA', '#F4F5FF'] },
];

const PalettePickerModal: React.FC<PalettePickerModalProps> = ({
  isOpen,
  currentPalette,
  onSelect,
  onClose,
}) => {
  const handleSelect = (p: DashboardPalette) => {
    onSelect(p);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <h2 className="text-lg font-semibold text-blue-50 mb-4">Choose Theme</h2>
      <div className="grid grid-cols-3 gap-4">
        {palettes.map(({ id, name, colors }) => (
          <button
            key={id}
            onClick={() => handleSelect(id)}
            className={`rounded-lg overflow-hidden border-2 transition-all ${
              currentPalette === id
                ? 'border-blue-400 shadow-lg scale-105'
                : 'border-slate-600 hover:border-slate-400'
            }`}
          >
            {/* Color swatches */}
            <div className="flex h-16">
              {colors.map((color) => (
                <div key={color} className="flex-1" style={{ backgroundColor: color }} />
              ))}
            </div>
            {/* Label */}
            <div className="bg-slate-700 py-2 text-center text-sm text-slate-200">
              {name}
              {currentPalette === id && (
                <span className="ml-2 text-blue-400 text-xs">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
};

export default PalettePickerModal;
