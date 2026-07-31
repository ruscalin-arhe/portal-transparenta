import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient() {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

  client.$use(async (params, next) => {
    const start = Date.now();
    try {
      const result = await next(params);
      const ms = Date.now() - start;
      if (process.env.PRISMA_LOG_ALL === "1" || ms >= 200) {
        console.log(
          `[prisma] ${params.model ?? "?"}.${params.action} ${ms}ms`
        );
      }
      return result;
    } catch (e) {
      console.error(
        `[prisma:error] ${params.model ?? "?"}.${params.action}`,
        e instanceof Error ? e.message : e
      );
      throw e;
    }
  });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
