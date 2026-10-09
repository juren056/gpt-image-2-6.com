const nodeExample = `const response = await fetch(
  "https://queue.fal.run/alibaba/qwen-image-3/text-to-image",
  {
    method: "POST",
    headers: {
      Authorization: \`Key \${process.env.FAL_KEY}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: "A poster titled BUILD WITH CLARITY",
      image_size: "portrait_4_3",
      enable_prompt_expansion: true,
      num_images: 1
    })
  }
);
if (!response.ok) throw new Error(await response.text());
const task = await response.json();`;

const pythonExample = `response = requests.post(
    "https://queue.fal.run/alibaba/qwen-image-3/text-to-image",
    headers={"Authorization": f"Key {os.environ['FAL_KEY']}"},
    json={
        "prompt": "A poster titled BUILD WITH CLARITY",
        "image_size": "portrait_4_3",
        "enable_prompt_expansion": True,
        "num_images": 1,
    },
    timeout=30,
)
response.raise_for_status()
task = response.json()`;

export function ApiExamples() {
  return (
    <section className="border-border border-y px-4 py-14">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-serif text-3xl tracking-tight">
          Runnable server-side examples
        </h2>
        <p className="text-muted-foreground mt-4 leading-7">
          Keep FAL_KEY on the server. A queue submission returns a request id
          plus status and response URLs; poll the status URL and read the result
          only after completion. Provider pricing varies by resolution and can
          change, so confirm it on the provider page.
        </p>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div>
            <h3 className="font-semibold">JavaScript / Node.js</h3>
            <pre className="bg-muted mt-3 overflow-x-auto rounded-2xl p-5 text-xs leading-5">
              <code>{nodeExample}</code>
            </pre>
          </div>
          <div>
            <h3 className="font-semibold">Python</h3>
            <pre className="bg-muted mt-3 overflow-x-auto rounded-2xl p-5 text-xs leading-5">
              <code>{pythonExample}</code>
            </pre>
          </div>
        </div>
        <p className="text-muted-foreground mt-6 text-sm">
          Full examples live in <code>docs/examples/</code>. They contain no
          production key.
        </p>
      </div>
    </section>
  );
}
