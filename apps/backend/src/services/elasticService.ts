import { elasticClient } from "../config/elastic";
import { RamRepository } from "../repositories/ramRepository";

export class ElasticService {
  private readonly INDEX_NAME = "ram_models";
  private ramRepo: RamRepository;

  constructor() {
    this.ramRepo = new RamRepository();
  }

  async createIndexIfNotExists() {
    try {
      const indexExists = await elasticClient.indices.exists({
        index: this.INDEX_NAME,
      });

      if (!indexExists) {
        await elasticClient.indices.create({
          index: this.INDEX_NAME,
          body: {
            mappings: {
              properties: {
                ram_id: { type: "integer" },
                manufacturer_name: { type: "keyword" },
                type_name: { type: "keyword" },
                form_factor_name: { type: "keyword" },
                model_name: {
                  type: "text",
                  fields: {
                    keyword: { type: "keyword" },
                  },
                },
                capacity_gb: { type: "integer" },
                frequency_mhz: { type: "integer" },
                description: { type: "text" },
                extra_features: { type: "object" },
              },
            },
          },
        });
        console.log(
          `✅ Індекс "${this.INDEX_NAME}" успішно створено в Elasticsearch`,
        );
      } else {
        console.log(`ℹ️ Індекс "${this.INDEX_NAME}" вже існує в Elasticsearch`);
      }
    } catch (error) {
      console.error("❌ Помилка при створенні індексу Elasticsearch:", error);
    }
  }

  async syncData() {
    try {
      const allRamModels = await this.ramRepo.findAll();

      if (allRamModels.length === 0) {
        console.log(
          "ℹ️ В базі PostgreSQL немає моделей ОЗП для синхронізації.",
        );
        return;
      }

      const operations = allRamModels.flatMap((doc) => [
        { index: { _index: this.INDEX_NAME, _id: doc.ram_id.toString() } },
        {
          ram_id: doc.ram_id,
          manufacturer_name: doc.manufacturer_name,
          type_name: doc.type_name,
          form_factor_name: doc.form_factor_name,
          model_name: doc.model_name,
          capacity_gb: doc.capacity_gb,
          frequency_mhz: doc.frequency_mhz,
          description: doc.description,
          extra_features: doc.extra_features,
        },
      ]);

      const bulkResponse = await elasticClient.bulk({
        refresh: true,
        operations,
      });

      if (bulkResponse.errors) {
        console.error(
          "❌ Виникли помилки під час Bulk-вставки в Elasticsearch.",
        );
      } else {
        console.log(
          `✅ Успішно синхронізовано ${allRamModels.length} моделей ОЗП в Elasticsearch`,
        );
      }
    } catch (error) {
      console.error("❌ Помилка синхронізації з Elasticsearch:", error);
    }
  }

  async addOrUpdateDocument(doc: any) {
    try {
      await elasticClient.index({
        index: this.INDEX_NAME,
        id: doc.ram_id.toString(),
        document: {
          ram_id: doc.ram_id,
          manufacturer_name: doc.manufacturer_name,
          type_name: doc.type_name,
          form_factor_name: doc.form_factor_name,
          model_name: doc.model_name,
          capacity_gb: doc.capacity_gb,
          frequency_mhz: doc.frequency_mhz,
          description: doc.description,
          extra_features: doc.extra_features,
        },
        refresh: true,
      });
    } catch (error) {
      console.error(
        `❌ Помилка додавання документу ${doc.ram_id} в Elasticsearch:`,
        error,
      );
    }
  }

  async deleteDocument(id: number) {
    try {
      await elasticClient.delete({
        index: this.INDEX_NAME,
        id: id.toString(),
        refresh: true,
      });
    } catch (error: any) {
      if (error.meta?.statusCode !== 404) {
        console.error(
          `❌ Помилка видалення документу ${id} з Elasticsearch:`,
          error,
        );
      }
    }
  }

  async search(queryText: string) {
    try {
      const result = await elasticClient.search({
        index: this.INDEX_NAME,
        body: {
          query: {
            multi_match: {
              query: queryText,
              fields: [
                "model_name^3",
                "manufacturer_name^2",
                "description",
                "type_name",
              ],
              fuzziness: "AUTO", 
            },
          },
        },
      });

      return result.hits.hits.map((hit) => hit._source);
    } catch (error) {
      console.error("❌ Помилка пошуку в Elasticsearch:", error);
      throw new Error("Помилка пошукового рушія");
    }
  }

  async init() {
    await this.createIndexIfNotExists();
    await this.syncData();
  }
}
