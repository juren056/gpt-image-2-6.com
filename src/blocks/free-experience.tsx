import { getCreativeUnitCredits } from '@/config/creative-studio';
import { PRIMARY_IMAGE_MODEL, welcomeReward } from '@/config/product-facts';
import { m } from '@/paraglide/messages.js';
import { usePublicConfig } from '@/hooks/use-public-config';

export function FreeExperience() {
  const config = usePublicConfig();
  const reward = welcomeReward(config.data);
  const cost =
    getCreativeUnitCredits(PRIMARY_IMAGE_MODEL, 'generate', '1K') || 0;
  return (
    <aside className="border-border bg-muted/30 my-6 rounded-lg border p-4 text-sm leading-6">
      <p>{m['free.experience.defaults']()}</p>
      {reward && cost > 0 && (
        <p className="mt-2">
          {m['free.experience.estimate']({
            amount: reward.amount,
            cost,
            count: Math.floor(reward.amount / cost),
            remaining: reward.amount % cost,
          })}
        </p>
      )}
      {reward && reward.days > 0 && (
        <p>{m['free.experience.expiry']({ days: reward.days })}</p>
      )}
      <p className="text-muted-foreground mt-2">
        {m['free.experience.conditions']()}
      </p>
    </aside>
  );
}
