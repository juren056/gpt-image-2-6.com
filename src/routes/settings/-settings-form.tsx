import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';

import { authClient, useSession } from '@/core/auth/client';
import { apiPatch } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
import { TextField } from '@/components/form-field';
import { ImageUploader, ImageUploaderValue } from '@/components/image-uploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const profileSchema = z.object({
  name: z.string().min(1),
});

export function SettingsForm({
  name: initialName,
  email,
  image: initialImage,
}: {
  name: string;
  email: string;
  image: string;
}) {
  const [image, setImage] = useState(initialImage);
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (values: { name: string; image: string }) =>
      apiPatch('/api/user/profile', values),
    onSuccess: () => {
      toast.success(m['settings.profile.saved']());
      queryClient.invalidateQueries({ queryKey: ['user-info'] });
      queryClient.invalidateQueries({
        queryKey: ['account-profile', session?.user.id],
      });
      void authClient.getSession({ query: { disableCookieCache: true } });
    },
    onError: (err: Error) => {
      toast.error(err?.message || m['settings.profile.save_failed']());
    },
  });

  const form = useForm({
    defaultValues: { name: initialName },
    validators: { onSubmit: profileSchema },
    onSubmit: async ({ value }) => {
      await saveMutation
        .mutateAsync({ name: value.name, image })
        .catch(() => {});
    },
  });

  function handleAvatarChange(items: ImageUploaderValue[]) {
    const uploaded = items.find(
      (item) => item.status === 'uploaded' && item.url
    );
    setImage(uploaded?.url || '');
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="banana-account-profile-form"
    >
      <div className="space-y-2">
        <Label>{m['settings.profile.avatar']()}</Label>
        <ImageUploader
          defaultPreviews={image ? [image] : []}
          onChange={handleAvatarChange}
          maxSizeMB={2}
          emptyHint={m['settings.profile.avatar_hint']()}
        />
      </div>
      <div className="space-y-2">
        <form.Field name="name">
          {(field) => (
            <TextField
              field={field}
              label={m['settings.profile.name']()}
              required
            />
          )}
        </form.Field>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{m['settings.profile.email']()}</Label>
        <Input id="email" value={email} disabled className="opacity-60" />
      </div>
      <div>
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button
              type="submit"
              disabled={isSubmitting || saveMutation.isPending}
            >
              {isSubmitting || saveMutation.isPending
                ? m['settings.profile.saving']()
                : m['settings.profile.save']()}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
