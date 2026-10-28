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

                manufacturer_id: { type: "integer" },
                type_id: { type: "integer" },
                form_factor_id: { type: "integer" },

                manufacturer_name: {
                  type: "text",
                  fields: { keyword: { type: "keyword" } },
                },
                type_name: {
                  type: "text",
                  fields: { keyword: { type: "keyword" } },
                },
                form_factor_name: {
                  type: "text",
                  fields: { keyword: { type: "keyword" } },
                },
                model_name: {
                  type: "text",
                  fields: { keyword: { type: "keyword" } },
                },
                description: {
                  type: "text",
                  fields: { keyword: { type: "keyword", ignore_above: 256 } },
                },

                capacity_gb: { type: "integer" },
                frequency_mhz: { type: "integer" },
                extra_features: { type: "object" },

                // ДОДАНО: Зберігаємо URL, але вимикаємо індексацію для нього (index: false),
                // оскільки ми ніколи не шукаємо оперативку по тексту самого посилання.
                // Це економить ресурси Elasticsearch.
                image_url: { type: "keyword", index: false },
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
          manufacturer_id: doc.manufacturer_id,
          type_id: doc.type_id,
          form_factor_id: doc.form_factor_id,

          manufacturer_name: doc.manufacturer_name,
          type_name: doc.type_name,
          form_factor_name: doc.form_factor_name,
          model_name: doc.model_name,
          capacity_gb: doc.capacity_gb,
          frequency_mhz: doc.frequency_mhz,
          description: doc.description,
          extra_features: doc.extra_features,
          image_url: doc.image_url, // ДОДАНО
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
          manufacturer_id: doc.manufacturer_id,
          type_id: doc.type_id,
          form_factor_id: doc.form_factor_id,
          manufacturer_name: doc.manufacturer_name,
          type_name: doc.type_name,
          form_factor_name: doc.form_factor_name,
          model_name: doc.model_name,
          capacity_gb: doc.capacity_gb,
          frequency_mhz: doc.frequency_mhz,
          description: doc.description,
          extra_features: doc.extra_features,
          image_url: doc.image_url, // ДОДАНО
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
            bool: {
              should: [
                {
                  multi_match: {
                    query: queryText,
                    fields: [
                      "model_name^3",
                      "manufacturer_name^2",
                      "type_name",
                      "form_factor_name",
                      "description",
                    ],
                    fuzziness: "AUTO",
                  },
                },
                {
                  multi_match: {
                    query: queryText,
                    type: "phrase_prefix",
                    fields: [
                      "model_name^3",
                      "manufacturer_name^2",
                      "type_name",
                      "form_factor_name",
                      "description",
                    ],
                  },
                },
              ],
              minimum_should_match: 1,
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

  async searchWithFilters(filters: any) {
    try {
      const filterConditions: any[] = [];

      if (filters.manufacturer_id) {
        filterConditions.push({
          term: { manufacturer_id: Number(filters.manufacturer_id) },
        });
      }
      if (filters.type_id) {
        filterConditions.push({ term: { type_id: Number(filters.type_id) } });
      }
      if (filters.form_factor_id) {
        filterConditions.push({
          term: { form_factor_id: Number(filters.form_factor_id) },
        });
      }
      if (filters.min_capacity) {
        filterConditions.push({
          range: { capacity_gb: { gte: Number(filters.min_capacity) } },
        });
      }
      if (filters.min_frequency) {
        filterConditions.push({
          range: { frequency_mhz: { gte: Number(filters.min_frequency) } },
        });
      }
      if (filters.has_rgb !== undefined && filters.has_rgb !== "") {
        filterConditions.push({
          term: {
            "extra_features.has_rgb":
              filters.has_rgb === "true" || filters.has_rgb === true,
          },
        });
      }
      if (filters.profile) {
        filterConditions.push({
          match: { "extra_features.profiles": filters.profile },
        });
      }

      let mustCondition: any = { match_all: {} };

      if (filters.search) {
        mustCondition = {
          bool: {
            should: [
              {
                multi_match: {
                  query: filters.search,
                  fields: [
                    "model_name^3",
                    "manufacturer_name^2",
                    "type_name",
                    "form_factor_name",
                    "description",
                  ],
                  fuzziness: "AUTO",
                },
              },
              {
                multi_match: {
                  query: filters.search,
                  type: "phrase_prefix",
                  fields: [
                    "model_name^3",
                    "manufacturer_name^2",
                    "type_name",
                    "form_factor_name",
                    "description",
                  ],
                },
              },
            ],
            minimum_should_match: 1,
          },
        };
      }

      const result = await elasticClient.search({
        index: this.INDEX_NAME,
        body: {
          query: {
            bool: {
              must: mustCondition,
              filter: filterConditions,
            },
          },
          sort: filters.search ? [] : [{ ram_id: { order: "desc" } }],
        },
      });

      return result.hits.hits.map((hit) => hit._source);
    } catch (error) {
      console.error("❌ Помилка пошуку з фільтрами в Elasticsearch:", error);
      throw new Error("Помилка отримання каталогу");
    }
  }

  async init() {
    await this.createIndexIfNotExists();
    await this.syncData();
  }
}
