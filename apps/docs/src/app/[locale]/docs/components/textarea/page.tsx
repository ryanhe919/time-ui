import ZhContent from './zh.mdx';
import EnContent from './en.mdx';

export default async function TextareaDocPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return locale === 'en' ? <EnContent /> : <ZhContent />;
}
