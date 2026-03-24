'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';

const PRESET_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9', '#14b8a6', '#f97316', '#84cc16'];

type CampaignFormProps = {
  mode: 'create' | 'edit';
  initialValues?: {
    name?: string;
    brandColor?: string;
    thankYouMessage?: string;
    logoUrl?: string | null;
  };
  loading?: boolean;
  saving?: boolean;
  error?: string;
  onSubmit: (data: { name: string; brandColor: string; thankYouMessage: string; logoFile?: File | null; removeLogo?: boolean }) => Promise<void>;
};

export default function CampaignForm({ mode, initialValues, loading, saving, error, onSubmit }: CampaignFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [brandColor, setBrandColor] = useState(initialValues?.brandColor ?? '#10b981');
  const [thankYouMessage, setThankYouMessage] = useState(initialValues?.thankYouMessage ?? '');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState(initialValues?.logoUrl ?? null);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function removeLogo() {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoUrl(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await onSubmit({
      name,
      brandColor,
      thankYouMessage,
      logoFile,
      removeLogo: !logoPreview && !logoFile,
    });
  }

  const preview = logoPreview ?? logoUrl;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-4 h-4 rounded-full bg-zinc-300 animate-pulse" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100">
      {/* Name */}
      <div className="p-5">
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Campaign name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Post-purchase feedback"
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
        />
      </div>

      {/* Logo (edit only) */}
      {mode === 'edit' && (
        <div className="p-5">
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Logo</label>

          {preview ? (
            <div className="flex items-center gap-3">
              <Image src={preview} alt="Logo" width={48} height={48} className="rounded-xl object-contain border border-zinc-200 bg-zinc-50" />
              <div>
                <p className="text-sm text-zinc-700 font-medium">Logo uploaded</p>
                <button type="button" onClick={removeLogo} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 mt-0.5 transition-colors">
                  <X size={11} /> Remove
                </button>
              </div>
            </div>
          ) : (
            <label className="flex items-center gap-3 border-2 border-dashed border-zinc-200 rounded-xl p-4 cursor-pointer hover:border-zinc-300 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                <Upload size={16} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-600 font-medium">Upload logo</p>
                <p className="text-xs text-zinc-400 mt-0.5">PNG, JPG, SVG up to 2MB</p>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </label>
          )}
        </div>
      )}

      {/* Brand color */}
      <div className="p-5">
        <label className="block text-sm font-medium text-zinc-700 mb-3">Brand color</label>

        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setBrandColor(color)}
              className="w-7 h-7 rounded-full transition-transform hover:scale-110 shrink-0"
              style={{
                backgroundColor: color,
                outline: brandColor === color ? `2px solid ${color}` : 'none',
                outlineOffset: '2px',
              }}
            />
          ))}

          {/* ✅ FIXED custom color (rounded + overlay like original) */}
          <label className="relative w-7 h-7 rounded-full overflow-hidden cursor-pointer hover:scale-110 transition-transform border border-zinc-200" title="Custom color">
            <div
              className="w-full h-full"
              style={{
                backgroundColor: PRESET_COLORS.includes(brandColor) ? '#e4e4e7' : brandColor,
              }}
            />
            <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
          </label>
        </div>

        {/* Live preview */}
        <div className="mt-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: brandColor + '20' }}>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: brandColor }} />
          </div>

          <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: brandColor + '30' }}>
            <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: brandColor }} />
          </div>

          <button type="button" className="text-xs px-3 py-1.5 rounded-lg text-white font-medium" style={{ backgroundColor: brandColor }}>
            Button
          </button>
        </div>
      </div>

      {/* Thank you */}
      <div className="p-5">
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Thank you message</label>
        <textarea
          value={thankYouMessage}
          onChange={(e) => setThankYouMessage(e.target.value)}
          rows={3}
          placeholder="Thank you! Your testimonial means the world to us."
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all resize-none"
        />
        <p className="text-xs text-zinc-400 mt-1">Shown to your customer after they submit</p>
      </div>

      {/* Actions */}
      <div className="p-5 flex items-center justify-between">
        {error && <p className="text-xs text-red-500">{error}</p>}
        {!error && <span />}

        <button type="submit" disabled={saving} className="bg-zinc-900 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-zinc-700 disabled:opacity-40 transition-colors">
          {saving ? (mode === 'create' ? 'Creating...' : 'Saving...') : mode === 'create' ? 'Create campaign' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
