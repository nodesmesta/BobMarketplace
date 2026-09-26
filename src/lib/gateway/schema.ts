import { z } from "zod";

export const packageTypeSchema = z.enum([
  "agent",
  "skill",
  "plugin",
  "tool",
  "mcp",
  "hook",
  "rule",
  "config",
  "preset",
  "mode",
  "utility",
]);

export const manifestFileMappingSchema = z.object({
  src: z.string().min(1, "Source file path is required"),
  dest: z.string().min(1, "Destination path is required"),
  type: packageTypeSchema.optional().default("skill"),
});

export const bobPackageManifestSchema = z.object({
  name: z
    .string()
    .min(2, "Package name must be at least 2 characters")
    .max(50, "Package name must not exceed 50 characters")
    .regex(/^[a-z0-9-_]+$/, "Package name must only contain lowercase alphanumeric characters, dashes, and underscores"),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/, "Version must follow standard Semantic Versioning (e.g. 1.0.0)"),
  display_name: z.string().min(2, "Display name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  author: z.string().min(1, "Author is required"),
  license: z.string().default("MIT"),
  type: packageTypeSchema.default("skill"),
  files: z
    .array(manifestFileMappingSchema)
    .min(1, "At least one file mapping must be specified"),
  permissions: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
});

export type BobPackageManifest = z.infer<typeof bobPackageManifestSchema>;
export type ManifestFileMapping = z.infer<typeof manifestFileMappingSchema>;
