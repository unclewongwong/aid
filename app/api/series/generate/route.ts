import { NextRequest, NextResponse } from "next/server";
import { chatOnceResult } from "@/lib/pipeline/llm";
import { streamingJsonResponse } from "@/lib/streamingJsonResponse";
import { seriesPrompt, legacySeriesPrompt } from "@/lib/series/prompts";
import { generateDialogueTimingRepair } from '@/lib/series/dialogueTimingGeneration';
import { generateSeriesStage } from '@/lib/series/generation';
import { createHash } from 'node:crypto';
import { createSeriesGenerationCache, migrateSeriesOutlineCache } from '@/lib/series/generationCache';
import type { SeriesProject } from "@/lib/series/types";

export const maxDuration = 300;
export async function POST(request: NextRequest) {
  try {
    const { stage, project, episodeId, settings } = await request.json();
    if (
      !["outline", "episodes", "script", "dialogue-timing"].includes(stage) ||
      !project?.brief ||
      !settings
    )
      return NextResponse.json(
        { error: "缺少连续剧生成参数" },
        { status: 400 },
      );
    if (
      !Number.isInteger(project.episodeCount) ||
      project.episodeCount < 1 ||
      project.episodeCount > 100
    )
      return NextResponse.json({ error: "集数需为1–100" }, { status: 400 });
    const series = project as SeriesProject;
    const timing = stage === 'dialogue-timing';
    const prompt = timing ? `authored-dialogue-timing-v1:${episodeId}` : seriesPrompt(stage, series, episodeId);
    return streamingJsonResponse(async () => {
      const root = process.env.AID_COMPANION_DATA_DIR;
      const identity: unknown[] = [series.id, prompt, settings.scriptProvider, settings.scriptModel, settings.apiKey, settings.dmxApiKey];
      const savedScript = stage === 'script' || timing ? series.episodes.find(e => e.id === episodeId)?.script : undefined;
      if (savedScript) identity.push('dialogue-source-v2', savedScript);
      const key = createHash('sha256').update(JSON.stringify(identity)).digest('hex');
      const cache = !root ? {} : stage === 'outline'
        ? await migrateSeriesOutlineCache(root, key, createHash('sha256').update(JSON.stringify([
            series.id, legacySeriesPrompt(stage, series, episodeId), settings.scriptProvider,
            settings.scriptModel, settings.apiKey, settings.dmxApiKey,
          ])).digest('hex'))
        : createSeriesGenerationCache(root, key);
      const deps = {
        ...cache,
        chat: (input: string, options?: { singleAttempt?: boolean }) => chatOnceResult(input, {
          apiKey: settings.apiKey,
          dmxApiKey: settings.dmxApiKey,
          provider: settings.scriptProvider,
          model: settings.scriptModel,
          maxOutputTokens: stage === "outline" ? 9000 : stage === 'episodes' ? 3500 : 7000,
          singleAttempt: options?.singleAttempt,
        }),
      };
      return timing ? generateDialogueTimingRepair(series, episodeId, deps) : generateSeriesStage(stage, series, episodeId, deps);
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "连续剧生成失败" },
      { status: 400 },
    );
  }
}
