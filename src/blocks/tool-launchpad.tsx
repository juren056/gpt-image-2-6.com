import { m } from '@/paraglide/messages.js';
import { getLocalizedTools } from '@/blocks/tool-catalog';
import { ToolLaunchpad as ToolLaunchpadComponent } from '@/components/tool-launchpad';

export function ToolLaunchpad() {
  return (
    <ToolLaunchpadComponent
      tools={getLocalizedTools()}
      copy={{
        eyebrow: m['landing.tools_launchpad.eyebrow'](),
        title: m['landing.tools_launchpad.title'](),
        description: m['landing.tools_launchpad.description'](),
        all: m['landing.tools_launchpad.category_all'](),
        image: m['landing.tools_launchpad.category_image'](),
        video: m['landing.tools_launchpad.category_video'](),
        edit: m['landing.tools_launchpad.category_edit'](),
        featured: m['landing.tools_launchpad.featured'](),
        new: m['landing.tools_launchpad.new'](),
        preview: m['landing.tools_launchpad.preview'](),
        open: m['landing.tools_launchpad.open'](),
        viewAll: m['landing.tools_launchpad.view_all'](),
      }}
    />
  );
}
