import { createFileRoute } from '@tanstack/react-router';

import { BananaAccountCreate } from '@/blocks/banana-account-create';

export const Route = createFileRoute('/settings/')({
  component: () => <BananaAccountCreate />,
});
