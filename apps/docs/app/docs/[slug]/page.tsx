import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DOC_LINKS } from '@/lib/docs/nav';
import { DocPage } from '@/lib/docs/registry';

export const dynamicParams = false;

export function generateStaticParams() {
  return DOC_LINKS.filter((link) => link.slug).map((link) => ({ slug: link.slug }));
}

export async function generateMetadata(props: PageProps<'/docs/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const link = DOC_LINKS.find((item) => item.slug === slug);
  return link ? { title: link.title, description: link.description } : {};
}

export default async function DocSlugPage(props: PageProps<'/docs/[slug]'>) {
  const { slug } = await props.params;
  if (!DOC_LINKS.some((link) => link.slug === slug)) notFound();
  return <DocPage slug={slug} />;
}
