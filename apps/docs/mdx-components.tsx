import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import {
	Anchor,
	Blockquote,
	Heading1,
	Heading2,
	Heading3,
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
		h1: Heading1,
		h2: Heading2,
		h3: Heading3,
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
