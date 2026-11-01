-- CreateTable
CREATE TABLE "AiSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "provider" TEXT NOT NULL DEFAULT 'OpenRouter',
    "baseUrl" TEXT NOT NULL DEFAULT 'https://openrouter.ai/api/v1',
    "model" TEXT NOT NULL DEFAULT 'openai/gpt-4o-mini',
    "apiKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiSetting_pkey" PRIMARY KEY ("id")
);
