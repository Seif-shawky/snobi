import { createFileRoute } from '@tanstack/react-router';
import { Supporters } from '@/components/snobi';
export const Route = createFileRoute('/supporters')({
  head: () => ({ meta: [{ title: 'Snobi’s Biggest Enablers' }, { name: 'description', content: 'The community helping a broke dog. Only verified, opt-in support belongs here.' }, { property: 'og:title', content: 'Snobi’s Biggest Enablers' }, { property: 'og:description', content: 'Good people. Questionable decisions.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: () => <Supporters standalone />,
});