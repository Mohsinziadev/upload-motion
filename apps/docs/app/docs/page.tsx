import type { Metadata } from 'next';
import { DocPage } from '@/lib/docs/registry';

export const metadata: Metadata = {
  title: 'Installation & quick start',
  description: 'Install upload-motion, import the styles and render your first animated uploader.',
};

export default function DocsIndexPage() {
  return <DocPage slug="" />;
}
