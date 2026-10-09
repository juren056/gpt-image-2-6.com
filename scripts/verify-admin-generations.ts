import {
  classifyGenerationFailure,
  listAdminGenerations,
  type AdminGeneration,
} from '../src/modules/admin-generations/service';

if (
  classifyGenerationFailure(
    'failed',
    'The result was withheld because the safety review could not be completed.',
    'OUTPUT_MODERATION_UNAVAILABLE'
  ) !== 'Safety review service unavailable'
) {
  throw new Error(
    'Moderation outages must not be labeled as policy violations'
  );
}
if (
  classifyGenerationFailure(
    'failed',
    'The result was withheld by the content safety system.',
    'OUTPUT_SAFETY_QUARANTINED'
  ) !== 'Content safety policy violation'
) {
  throw new Error(
    'Real output policy blocks must remain classified as violations'
  );
}

const result = await listAdminGenerations({ page: 1, pageSize: 1 });
const failedResult = await listAdminGenerations({
  page: 1,
  pageSize: 60,
  status: 'failed',
});

if (!Array.isArray(result.items) || !Array.isArray(result.models)) {
  throw new Error('Admin generation query returned an invalid collection');
}
for (const item of failedResult.items) {
  if (item.status !== 'failed') {
    throw new Error('Failed generation query returned a non-failed task');
  }
  if (item.errorMessage !== null && !item.errorMessage.trim()) {
    throw new Error('Failed generation returned a blank failure reason');
  }
  if (!item.errorCategory?.trim()) {
    throw new Error('Failed generation returned no failure category');
  }
}
if (!Number.isFinite(result.total) || result.total < 0) {
  throw new Error('Admin generation query returned an invalid total');
}
for (const value of Object.values(result.summary)) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Admin generation query returned invalid summary data');
  }
}
if (result.items[0]) {
  const item = result.items[0];
  if (!item.id || !item.userEmail || !item.model || !item.status) {
    throw new Error('Admin generation item is missing required fields');
  }
  const serialized = JSON.stringify(item.options);
  if (
    /"(secret|token|password|api[_-]?key|authorization|signature)"\s*:\s*"(?!\[redacted\])/i.test(
      serialized
    )
  ) {
    throw new Error('Admin generation options exposed a sensitive field');
  }
}

console.log(
  `Admin generations query verified: total=${result.total}, failed=${failedResult.total}, models=${result.models.length}, categories=${Array.from(new Set(failedResult.items.map((item: AdminGeneration) => item.errorCategory))).join('|')}`
);
