const apiKey = process.env.FAL_KEY;
if (!apiKey) throw new Error('Set FAL_KEY before running this example.');

const model = 'alibaba/qwen-image-3/text-to-image';
const submission = await fetch(`https://queue.fal.run/${model}`, {
  method: 'POST',
  headers: {
    Authorization: `Key ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'Editorial poster with the exact headline “BUILD WITH CLARITY”.',
    image_size: 'portrait_4_3',
    enable_prompt_expansion: true,
    enable_safety_checker: true,
    num_images: 1,
    output_format: 'png',
  }),
});

if (!submission.ok) {
  throw new Error(
    `Submission failed (${submission.status}): ${await submission.text()}`
  );
}

const task = await submission.json();
console.log('Request queued:', task.request_id);
console.log('Poll status:', task.status_url);
console.log('Read result:', task.response_url);
