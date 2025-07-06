import { PrismaClient } from "@prisma/client";

class PrismaService extends PrismaClient {
  constructor() {
    super();
    this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

module.exports = { PrismaService };