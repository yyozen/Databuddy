"use client";

import { RocketLaunchIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const examples = ["saas", "merch store"] as const;
const prompts = {
	saas: "Build me a trip planning tool",
	"merch store": "Build me a t-shirt store",
} as const;

export const LeapComponent = () => {
	const handleGenerate = () => {
		const input = document.querySelector(
			".leap-prompt-input"
		) as HTMLInputElement;
		const prompt = input?.value
			? `${input.value} use Databuddy for analytics`
			: "";
		const url = new URL("https://leap.new/");
		url.searchParams.set("build", prompt);
		url.searchParams.set("utm_source", "databuddy");
		window.location.href = url.toString();
	};

	const handleExample = (example: (typeof examples)[number]) => {
		const input = document.querySelector(
			".leap-prompt-input"
		) as HTMLInputElement;
		if (input) {
			input.value = prompts[example];
		}
	};

	return (
		<div className="my-4 border border-border bg-muted p-4 dark:bg-[#101010]">
			<div className="mb-2 flex items-center gap-2">
				<RocketLaunchIcon className="size-4 text-purple-500" weight="duotone" />
				<h3 className="font-semibold text-foreground text-sm">
					Try Databuddy with Leap
				</h3>
			</div>

			<p className="mb-3 text-muted-foreground text-xs">
				Let Leap generate a complete application that uses Databuddy for
				analytics.
			</p>

			<div className="flex w-full flex-col gap-2 sm:flex-row">
				<input
					className={cn(
						"leap-prompt-input flex-1 border border-border bg-background px-3 py-2 text-foreground text-sm",
						"placeholder:text-muted-foreground focus:border-primary focus:outline-none"
					)}
					placeholder="What do you want to build with Databuddy analytics?"
					type="text"
				/>
				<button
					className="border border-border bg-foreground px-4 py-2 font-medium text-background text-sm"
					data-track="leap-generate"
					onClick={handleGenerate}
					type="button"
				>
					Generate
				</button>
			</div>

			<div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
				<span className="text-muted-foreground">Examples:</span>
				{examples.map((example) => (
					<button
						className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
						key={example}
						onClick={() => handleExample(example)}
						type="button"
					>
						{example}
					</button>
				))}
			</div>
		</div>
	);
};

export default LeapComponent;
