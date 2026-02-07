'use client';

import { useCallback } from 'react';
import Image from 'next/image';
import { avatars, bgAvatarColors } from '@/data/avatarData';

interface AvatarPickerProps {
  nickname: string;
  selectedAvatarId: number | null;
  selectedBgColor: string | null;
  onAvatarChange: (id: number | null) => void;
  onBgColorChange: (color: string | null) => void;
}

export default function AvatarPicker({
  nickname,
  selectedAvatarId,
  selectedBgColor,
  onAvatarChange,
  onBgColorChange,
}: AvatarPickerProps) {
  const initial = nickname.trim() ? nickname.trim().charAt(0).toUpperCase() : null;

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Avatar Selection */}
      <div>
        <label className="mb-2 block text-sm font-medium">Avatar</label>
        <div className="avatar-scroll-slider" onWheel={handleWheel}>
          {/* No avatar option - show initial or user icon */}
          <button
            type="button"
            onClick={() => onAvatarChange(null)}
            className={`avatar-option ${selectedAvatarId === null ? 'avatar-option-selected' : ''}`}
            style={{ backgroundColor: selectedBgColor || '#4B5563' }}
          >
            {initial ? (
              <span className="text-sm font-bold text-white">{initial}</span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5 text-white/60"
              >
                <path
                  fillRule="evenodd"
                  d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          {/* Avatar images */}
          {avatars.map((avatar) => (
            <button
              key={avatar.id}
              type="button"
              onClick={() => onAvatarChange(avatar.id)}
              className={`avatar-option ${selectedAvatarId === avatar.id ? 'avatar-option-selected' : ''}`}
              style={{ backgroundColor: selectedBgColor || '#4B5563' }}
              title={avatar.name}
            >
              <Image
                src={avatar.imgUrl}
                alt={avatar.name}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Background Color Selection */}
      <div>
        <label className="mb-2 block text-sm font-medium">Background</label>
        <div className="color-scroll-slider" onWheel={handleWheel}>
          {/* Auto option */}
          <button
            type="button"
            onClick={() => onBgColorChange(null)}
            className={`color-swatch ${selectedBgColor === null ? 'color-swatch-selected' : ''}`}
            style={{
              background: 'conic-gradient(#FF383C, #FFCC00, #34C759, #00C0E8, #9555F5, #FF383C)',
            }}
            title="Auto"
          />

          {/* Color swatches */}
          {bgAvatarColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onBgColorChange(color)}
              className={`color-swatch ${selectedBgColor === color ? 'color-swatch-selected' : ''}`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
