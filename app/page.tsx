import { redirect } from 'next/navigation';
import { getActiveYear } from '@/lib/actions/years';

interface HomePageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const activeYear = await getActiveYear();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (typeof value === 'string') {
      params.set(key, value);
    } else if (Array.isArray(value)) {
      for (const v of value) {
        params.append(key, v);
      }
    }
  }

  const queryString = params.toString();

  if (!activeYear) {
    redirect(`/admin${queryString ? `?${queryString}` : ''}`);
  }

  redirect(`/${activeYear.year}${queryString ? `?${queryString}` : ''}`);
}
