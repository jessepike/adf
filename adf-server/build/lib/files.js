import fs from "node:fs";
import matter from "gray-matter";
export async function readFile(filePath) {
    return fs.promises.readFile(filePath, "utf-8");
}
export async function readFrontmatter(filePath) {
    const raw = await readFile(filePath);
    const { data, content } = matter(raw);
    return { data, content };
}
export async function fileExists(filePath) {
    try {
        await fs.promises.access(filePath, fs.constants.R_OK);
        return true;
    }
    catch {
        return false;
    }
}
