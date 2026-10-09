import { getAllConfigs } from '../src/modules/config/service';
import { runFalLiveAcceptance } from '../src/modules/images/fal-live-acceptance';

const configs = await getAllConfigs();
if (!configs.fal_api_key) {
  throw new Error(
    'Fal API key is unavailable. Load the production database and configuration encryption key first.'
  );
}

const results = await runFalLiveAcceptance(configs.fal_api_key);
for (const result of results) console.log(JSON.stringify(result));
console.log(`All ${results.length} bounded Fal live checks passed.`);
