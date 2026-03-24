export type BlockType = 'text' | 'textarea' | 'rating' | 'nps' | 'select' | 'consent' | 'email' | 'url' | 'number' | 'date' | 'image' | 'section';

export interface FormBlock {
  id: string;
  type: BlockType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  // type-specific
  min?: number;
  max?: number;
}

export const DEFAULT_SCHEMA: FormBlock[] = [
  { id: 'default-name', type: 'text', label: 'Your name', placeholder: 'Jane Smith', required: true },
  { id: 'default-email', type: 'email', label: 'Email address', placeholder: 'jane@company.com', required: false },
  { id: 'default-title', type: 'text', label: 'Role / company', placeholder: 'CEO at Acme', required: false },
  { id: 'default-rating', type: 'rating', label: 'Overall rating', required: true },
  { id: 'default-testimonial', type: 'textarea', label: 'Your testimonial', placeholder: 'Share what you loved...', required: true },
  { id: 'default-consent', type: 'consent', label: 'Consent', placeholder: 'I agree to have my testimonial published publicly', required: true },
];

export const BLOCK_META: Record<BlockType, { label: string; description: string; group: 'input' | 'choice' | 'media' | 'layout' }> = {
  text: { label: 'Short text', description: 'Single line input', group: 'input' },
  textarea: { label: 'Long text', description: 'Multi-line text area', group: 'input' },
  email: { label: 'Email', description: 'Validated email address', group: 'input' },
  url: { label: 'Website URL', description: 'Link or social profile', group: 'input' },
  number: { label: 'Number', description: 'Numeric input with range', group: 'input' },
  date: { label: 'Date', description: 'Date picker', group: 'input' },
  rating: { label: 'Star rating', description: '1–5 or 1–10 star scale', group: 'choice' },
  nps: { label: 'NPS score', description: '0–10 likelihood scale', group: 'choice' },
  select: { label: 'Multiple choice', description: 'Single or multi select', group: 'choice' },
  consent: { label: 'Consent', description: 'Checkbox agreement', group: 'choice' },
  image: { label: 'Photo upload', description: 'Avatar or image attachment', group: 'media' },
  section: { label: 'Section break', description: 'Divider with heading', group: 'layout' },
};

export const BLOCK_GROUPS: { key: string; label: string; types: BlockType[] }[] = [
  { key: 'input', label: 'Input', types: ['text', 'textarea', 'email', 'url', 'number', 'date'] },
  { key: 'choice', label: 'Choice', types: ['rating', 'nps', 'select', 'consent'] },
  { key: 'media', label: 'Media', types: ['image'] },
  { key: 'layout', label: 'Layout', types: ['section'] },
];
