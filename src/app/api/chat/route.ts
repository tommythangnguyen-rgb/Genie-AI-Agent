import type { FileNode } from "@/lib/file-system";
import { VirtualFileSystem } from "@/lib/file-system";
import { streamText, streamObject, stepCountIs } from "ai";
import { buildStrReplaceTool } from "@/lib/tools/str-replace";
import { buildFileManagerTool } from "@/lib/tools/file-manager";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLanguageModel } from "@/lib/provider";
import { generationPrompt } from "@/lib/prompts/generation";

export async function POST(req: Request) {
  const {
    messages,
    files,
    projectId,
  }: { messages: any[]; files: Record<string, FileNode>; projectId?: string } =
    await req.json();

  messages.unshift({
    role: "system",
    content: generationPrompt,
    providerOptions: {
      anthropic: { cacheControl: { type: "ephemeral" } },
    },
  });

  // Reconstruct the VirtualFileSystem from serialized data
  const fileSystem = new VirtualFileSystem();
  fileSystem.deserializeFromNodes(files);

  const model = getLanguageModel();
  const isMockProvider = !process.env.ANTHROPIC_API_KEY && !process.env.AWS_BEARER_TOKEN_BEDROCK;
  const result = streamText({
    model,
    messages,
    maxOutputTokens: 10_000,
    stopWhen: stepCountIs(isMockProvider ? 4 : 40),
    onError: (err: any) => {
      console.error(err);
    },
    tools: {
      str_replace_editor: buildStrReplaceTool(fileSystem),
      file_manager: buildFileManagerTool(fileSystem),
    },
    onFinish: async ({ response }) => {
      // Save to project if projectId is provided and user is authenticated
      if (projectId) {
        try {
          // Check if user is authenticated
          const session = await getSession();
          if (!session) {
            console.error("User not authenticated, cannot save project");
            return;
          }

          const normalizeContent = (content: any): string => {
            if (typeof content === "string") return content;
            if (Array.isArray(content)) {
              return content
                .filter((p: any) => p.type === "text")
                .map((p: any) => p.text || "")
                .join("");
            }
            return "";
          };

          const responseMessages = response.messages || [];
          const allMessages = [
            ...messages.filter((m) => m.role !== "system"),
            ...responseMessages.filter((m: any) => m.role === "user" || m.role === "assistant"),
          ].map((m: any) => ({ ...m, content: normalizeContent(m.content) }));

          await prisma.project.update({
            where: {
              id: projectId,
              userId: session.userId,
            },
            data: {
              messages: JSON.stringify(allMessages),
              data: JSON.stringify(fileSystem.serialize()),
            },
          });
        } catch (error) {
          console.error("Failed to save project data:", error);
        }
      }
    },
  });

  // Collect all generated content and return as JSON
  let generatedContent = '';
  try {
    for await (const chunk of result.textStream) {
      generatedContent += chunk;
    }
  } catch (error) {
    console.error('Error collecting generated content:', error);
    return Response.json({ error: 'Failed to generate content' }, { status: 500 });
  }

  // Return complete generated content as JSON, including updated file system
  return Response.json({
    message: {
      role: 'assistant',
      content: generatedContent,
    },
    files: fileSystem.serialize(),
    success: true,
  });
}

export const maxDuration = 120;
