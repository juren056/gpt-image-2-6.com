import { m } from '@/paraglide/messages.js';
import { getLocalizedTools } from '@/blocks/tool-catalog';
import { ImageGeneratorWorkspace } from '@/components/image-generator-workspace';
import { ToolMarketplaceShell } from '@/components/tool-marketplace-shell';

export function ToolMarketplace() {
  return (
    <ToolMarketplaceShell
      compact
      tools={getLocalizedTools()}
      activeKind="image"
      copy={{
        title: m['marketplace.title'](),
        description: m['marketplace.description'](),
        browseTools: m['marketplace.browse_tools'](),
        currentTool: m['marketplace.current_tool'](),
        image: m['landing.tools_launchpad.category_image'](),
        video: m['landing.tools_launchpad.category_video'](),
        edit: m['landing.tools_launchpad.category_edit'](),
        popular: m['marketplace.popular'](),
        new: m['landing.tools_launchpad.new'](),
        preview: m['landing.tools_launchpad.preview'](),
        credits: m['marketplace.credits']({ credits: '{credits}' }),
        creditRange: m['marketplace.credit_range']({
          min: '{min}',
          max: '{max}',
        }),
        pricingPreview: m['marketplace.pricing_preview'](),
        allTools: m['landing.tools_launchpad.view_all'](),
      }}
    >
      <ImageGeneratorWorkspace
        copy={{
          label: m['landing.generator.label'](),
          title: m['landing.generator.title'](),
          description: m['landing.generator.description'](),
          status: m['landing.generator.status'](),
          statusDetail: m['landing.generator.status_detail'](),
          promptLabel: m['landing.generator.prompt_label'](),
          promptHint: m['landing.generator.prompt_hint'](),
          promptPlaceholder: m['landing.generator.prompt_placeholder'](),
          examplesLabel: m['landing.generator.examples_label'](),
          promptExamples: [
            m['landing.generator.example_1'](),
            m['landing.generator.example_2'](),
            m['landing.generator.example_3'](),
          ],
          showcaseSlides: [
            {
              title: m['landing.generator.showcase_1_title'](),
              description: m['landing.generator.showcase_1_description'](),
              alt: m['landing.generator.showcase_1_alt'](),
            },
            {
              title: m['landing.generator.showcase_2_title'](),
              description: m['landing.generator.showcase_2_description'](),
              alt: m['landing.generator.showcase_2_alt'](),
            },
            {
              title: m['landing.generator.showcase_3_title'](),
              description: m['landing.generator.showcase_3_description'](),
              alt: m['landing.generator.showcase_3_alt'](),
            },
            {
              title: m['landing.generator.showcase_4_title'](),
              description: m['landing.generator.showcase_4_description'](),
              alt: m['landing.generator.showcase_4_alt'](),
            },
          ],
          openGuide: m['landing.generator.open_guide'](),
          modelLabel: m['landing.generator.model_label'](),
          modelName: m['landing.generator.standard_model'](),
          creditUnit: m['landing.generator.credit_unit'](),
          aspectLabel: m['landing.generator.aspect_label'](),
          square: m['landing.generator.square'](),
          landscape: m['landing.generator.landscape'](),
          portrait: m['landing.generator.portrait'](),
          cost: m['landing.generator.cost']({ credits: '{credits}' }),
          generate: m['landing.generator.generate'](),
          generating: m['landing.generator.generating'](),
          signUpToGenerate: m['landing.generator.sign_up'](),
          anonymousTrialUsedAction: m['common.nav.get_started'](),
          resultTitle: m['landing.generator.result_title'](),
          resultEmpty: m['landing.generator.result_empty'](),
          resultReady: m['landing.generator.result_ready'](),
          sessionTitle: m['landing.generator.session_title'](),
          sessionCount: m['landing.generator.session_count']({
            count: '{count}',
            max: '{max}',
          }),
          compareStart: m['landing.generator.compare_start'](),
          compareCancel: m['landing.generator.compare_cancel'](),
          compareAction: m['landing.generator.compare_action']({
            count: '{count}',
          }),
          compareLimit: m['landing.generator.compare_limit'](),
          compareTitle: m['landing.generator.compare_title'](),
          compareDescription: m['landing.generator.compare_description'](),
          compareUse: m['landing.generator.compare_use'](),
          compareSelected: m['landing.generator.compare_selected']({
            count: '{count}',
          }),
          viewOriginal: m['settings.generate.compare_view_original'](),
          previewTitle: m['settings.generate.compare_original_title'](),
          openStudio: m['landing.generator.open_studio'](),
          privateLabel: m['landing.generator.private_label'](),
          error: m['landing.generator.error'](),
          success: m['landing.generator.success'](),
          saveHintTitle: m['landing.generator.save_hint_title'](),
          saveHintDesktop: m['landing.generator.save_hint_desktop'](),
          saveHintMobile: m['landing.generator.save_hint_mobile'](),
          balance: m['landing.generator.balance']({ credits: '{credits}' }),
          balanceLoading: m['landing.generator.balance_loading'](),
          balanceSignIn: m['landing.generator.balance_sign_in'](),
          balanceUnavailable: m['landing.generator.balance_unavailable'](),
          balanceGetCredits: m['landing.generator.balance_get_credits'](),
          switchTool: m['landing.generator.switch_tool'](),
          switchToolHint: m['landing.generator.switch_tool_hint'](),
          currentTool: m['landing.generator.current_tool'](),
          toolImage: m['landing.generator.tool_image'](),
          toolPoster: m['landing.generator.tool_poster'](),
          toolProductPhoto: m['landing.generator.tool_product_photo'](),
          toolYoutubeThumbnail: m['landing.generator.tool_youtube_thumbnail'](),
          toolWan3: m['landing.nav.video.wan3.title'](),
          toolSeedance25: m['landing.nav.video.seedance25.title'](),
          toolVideo: m['landing.generator.tool_video'](),
          toolMinimaxH3: m['landing.nav.video.minimax_h3.title'](),
          toolBackgroundRemover:
            m['landing.generator.tool_background_remover'](),
          toolMatchaFilter: m['landing.generator.tool_matcha_filter'](),
          allTools: m['landing.generator.all_tools'](),
          continueTitle: m['landing.generator.continue_title'](),
          continueDescription: m['landing.generator.continue_description'](),
          continueEdit: m['landing.generator.continue_edit'](),
          continueRemoveBackground:
            m['landing.generator.continue_remove_background'](),
          continueUpscale: m['landing.generator.continue_upscale'](),
          continueAddText: m['landing.generator.continue_add_text'](),
          continuePoster: m['landing.generator.continue_poster'](),
          continueProduct: m['landing.generator.continue_product'](),
          creditsUsedTitle: m['landing.generator.credits_used_title'](),
          creditsUsedDescription:
            m['landing.generator.credits_used_description'](),
          creditsBuy: m['landing.generator.credits_buy'](),
          creditsCheckIn: m['landing.generator.credits_checkin'](),
          creditsInvite: m['landing.generator.credits_invite'](),
          creditsExplore: m['landing.generator.credits_explore'](),
          creditsContinueAction:
            m['landing.generator.credits_continue_action'](),
        }}
      />
    </ToolMarketplaceShell>
  );
}
