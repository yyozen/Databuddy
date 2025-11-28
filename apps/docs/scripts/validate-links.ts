import type { InferPageType } from "fumadocs-core/source";
import {
    type FileObject,
    printErrors,
    scanURLs,
    validateFiles,
} from "next-validate-link";
import { source } from "../lib/source";

async function checkLinks() {
    console.log("🔍 Scanning URLs...");

    const scanned = await scanURLs({
        preset: "next",
        populate: {
            "docs/[[...slug]]": source.getPages().map((page) => ({
                value: {
                    slug: page.slugs,
                },
                hashes: getHeadings(page),
            })),
        },
    });

    console.log(`📄 Found ${scanned.urls.size} URLs`);
    console.log("🔗 Validating links in content files...");

    const files = await getFiles();
    console.log(`📁 Checking ${files.length} files`);

    const errors = await validateFiles(files, {
        scanned,
        markdown: {
            components: {
                Card: { attributes: ["href"] },
                Cards: { attributes: ["href"] },
                Link: { attributes: ["href"] },
            },
        },
        checkRelativePaths: "as-url",
    });

    printErrors(errors, true);

    if (errors.length > 0) {
        console.log(`\n❌ Found ${errors.length} link error(s)`);
        process.exit(1);
    }

    console.log("\n✅ All links are valid!");
}

function getHeadings({ data }: InferPageType<typeof source>): string[] {
    if (!data.toc) {
        return [];
    }
    return data.toc.map((item) => item.url.slice(1));
}

async function getFiles(): Promise<FileObject[]> {
    const pages = source.getPages();
    const files: FileObject[] = [];

    for (const page of pages) {
        try {
            const content = await page.data.getText("raw");
            files.push({
                path: page.file.path,
                content,
                url: page.url,
                data: page.data,
            });
        } catch (error) {
            console.warn(`⚠️  Could not read content for ${page.url}:`, error);
        }
    }

    return files;
}

checkLinks().catch(console.error);
