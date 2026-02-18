import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import {
  selectBackgroundConfig,
  selectIsBackgroundPickerOpen,
  setBackgroundConfig,
  closeBackgroundPicker,
} from '../store/uiSlice';
import { PRESET_COLORS, DEFAULT_COLOR } from '../constants/backgrounds';
import { fetchNaturePhotos, triggerDownload, UnsplashPhoto } from '../services/unsplashService';
import Modal from '../../../shared/components/ui/Modal';

const BackgroundPicker: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectIsBackgroundPickerOpen);
  const config = useAppSelector(selectBackgroundConfig);

  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPhotos = async () => {
    setLoading(true);
    const results = await fetchNaturePhotos(6);
    setPhotos(results);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && photos.length === 0) loadPhotos();
  }, [isOpen]);

  const handleSelectPhoto = (photo: UnsplashPhoto) => {
    triggerDownload(photo.downloadLocation);
    dispatch(setBackgroundConfig({
      type: 'image', value: '', cachedImageUrl: photo.regular,
      photographerName: photo.photographerName, photographerUrl: photo.photographerUrl,
    }));
  };

  const handleSelectRandom = () => {
    dispatch(setBackgroundConfig({ type: 'random', value: '', cachedImageUrl: null, photographerName: '', photographerUrl: '' }));
  };

  const handleSelectColor = (hex: string) => {
    dispatch(setBackgroundConfig({ type: 'color', value: hex, cachedImageUrl: null, photographerName: '', photographerUrl: '' }));
  };

  const isPhotoSelected = (url: string) =>
    config.type === 'image' && config.cachedImageUrl === url;

  return (
    <Modal isOpen={isOpen} onClose={() => dispatch(closeBackgroundPicker())} size="lg">
      <h2 className="text-lg font-semibold text-blue-50 mb-4">Background</h2>

      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-400">
          Photos by{' '}
          <a href="https://unsplash.com/?utm_source=notionesque&utm_medium=referral" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-300">
            Unsplash
          </a>
        </p>
        <button
          onClick={loadPhotos}
          disabled={loading}
          className="text-xs text-slate-400 hover:text-blue-400 transition-colors disabled:opacity-50"
        >
          Shuffle
        </button>
      </div>

      <div className="grid grid-cols-3 gap-x-2 gap-y-3 mb-2">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-video rounded-md bg-slate-700 animate-pulse" />
            ))
          : photos.map((photo) => (
              <div key={photo.id} className="flex flex-col">
                <button
                  onClick={() => handleSelectPhoto(photo)}
                  className={`aspect-video rounded-md overflow-hidden border-2 transition-colors ${
                    isPhotoSelected(photo.regular)
                      ? 'border-blue-500'
                      : 'border-transparent hover:border-slate-400'
                  }`}
                >
                  <img
                    src={photo.small}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
                <a
                  href={`${photo.photographerUrl}?utm_source=notionesque&utm_medium=referral`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] text-slate-500 hover:text-slate-300 truncate mt-0.5 px-0.5"
                >
                  {photo.photographerName}
                </a>
              </div>
            ))}
      </div>

      <button
        onClick={handleSelectRandom}
        className={`w-full text-left px-3 py-2 rounded-md text-sm mb-4 transition-colors ${
          config.type === 'random'
            ? 'bg-blue-600 text-blue-50'
            : 'text-slate-300 hover:bg-slate-700'
        }`}
      >
        Random on each visit
      </button>

      <p className="text-xs text-slate-400 mb-2">Solid Colors</p>
      <div className="flex gap-2 flex-wrap">
        {PRESET_COLORS.map((color) => (
          <div key={color.value} className="relative">
            <button
              onClick={() => handleSelectColor(color.value)}
              title={color.name}
              className={`w-10 h-10 rounded-md border-2 transition-colors ${
                config.type === 'color' && config.value === color.value
                  ? 'border-blue-500'
                  : 'border-slate-600 hover:border-slate-400'
              }`}
              style={{ backgroundColor: color.value }}
            />
            {color.value === DEFAULT_COLOR && (
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-slate-500">
                default
              </span>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default BackgroundPicker;
