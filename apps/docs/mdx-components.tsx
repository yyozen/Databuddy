import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { InlineCode } from "@/components/docs/code-block";
import {
	Anchor,
	Blockquote,
	HorizontalRule,
	ListItem,
	OrderedList,
	UnorderedList,
} from "@/components/docs/elements";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/docs/table";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
	return {
		...defaultMdxComponents,
		a: Anchor,
		blockquote: Blockquote,
		code: InlineCode,
		hr: HorizontalRule,
		li: ListItem,
		ol: OrderedList,
		table: Table,
		tbody: TableBody,
		td: TableCell,
		th: TableHead,
		thead: TableHeader,
		tr: TableRow,
		ul: UnorderedList,
		...components,
	};
}
