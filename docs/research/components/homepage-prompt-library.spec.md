# HomepagePromptLibrary Specification

## Overview

- Target: `src/blocks/prompt-library.tsx`
- Source: `minimaxh3video.net/#prompts` and its local source project
- Interaction model: click-driven filtering/copy/load-more plus text search

## Structure and behavior

- A centered editorial heading sits above a two-column library shell.
- Desktop uses a 15rem category rail and a three-column card grid; the rail becomes horizontally scrollable on smaller viewports.
- Eight categories plus “All” show live counts. Changing category or search resets the visible count to 12.
- Search matches localized title, prompt, and category. Empty results show a dedicated state.
- Cards use a 16:10 static preview, category chip, overlaid title, four-line prompt excerpt, and full-width copy button.
- Twelve cards render initially; “Explore more” adds twelve until all matching cards are visible.
- Copy uses the Clipboard API with a textarea fallback and transient copied state.
- Media remains static because Qwen Image 3 is an image generator; source video posters are retained as preview artwork without claiming video output.

## Responsive behavior

- 1440px: 15rem sidebar + three cards per row.
- 768px: horizontal category strip + two cards per row.
- 390px: horizontal category strip + one card per row; minimum tap targets are 40px.

## Theme adaptation

- Keep the source module’s warm editorial shell and content density.
- Replace MiniMax orange/video framing with the existing Qwen violet primary token and honest image-generator language.
- Preserve all 56 source prompt texts as inspiration while explicitly telling users to convert motion/audio cues into a single-frame composition.
