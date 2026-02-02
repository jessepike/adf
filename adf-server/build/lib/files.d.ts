export declare function readFile(filePath: string): Promise<string>;
export declare function readFrontmatter(filePath: string): Promise<{
    data: Record<string, unknown>;
    content: string;
}>;
export declare function fileExists(filePath: string): Promise<boolean>;
