import { createFileRoute } from '@tanstack/react-router';
import { StoryTeaser } from '@/components/snobi';
export const Route = createFileRoute('/story')({
  head: () => ({ meta: [{ title: 'The Sad Story of Snobi' }, { name: 'description', content: 'A broke dog, an ambitious idea, and absolutely no business plan. This is Phase 0.' }, { property: 'og:title', content: 'The Sad Story of Snobi' }, { property: 'og:description', content: 'The beginning of a very questionable financial journey.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: () => <StoryTeaser standalone />,
});