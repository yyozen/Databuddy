import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { InlineCode } from "@/components/docs/code-block";
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
		code: InlineCode,
		table: Table,
		thead: TableHeader,
		tbody: TableBody,
		tr: TableRow,
		th: TableHead,
		td: TableCell,
		...components,
	};
}
