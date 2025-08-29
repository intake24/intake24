import type { ClientOptions } from '@opensearch-project/opensearch';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Client } from '@opensearch-project/opensearch';
import * as dotenv from 'dotenv';

// Load environment variables
const possiblePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../api/.env'),
  path.resolve(process.cwd(), '../../apps/api/.env'),
  path.resolve(__dirname, '../../../../api/.env'),
];

for (const envPath of possiblePaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    console.log(`✓ Loaded environment from: ${envPath}`);
    break;
  }
}

export interface EvaluateSearchArguments {
  locale: string;
  category?: string;
  scenario?: string;
  outputFormat: 'json' | 'markdown' | 'csv';
  verbose: boolean;
  testFile?: string;
}

interface TestResult {
  query: string;
  expectedType: string;
  totalResults: number;
  topResults: Array<{
    name: string;
    foodCode: string;
    score: number;
    position: number;
  }>;
  metrics: {
    found: boolean;
    relevantInTop5: number;
    relevantInTop10: number;
    averagePosition: number;
    responseTime: number;
  };
  variants?: {
    query: string;
    found: boolean;
    totalResults: number;
  }[];
}

interface CategoryResult {
  category: string;
  scenarios: Array<{
    id: string;
    description: string;
    tests: TestResult[];
    aggregateMetrics: {
      totalQueries: number;
      successfulQueries: number;
      averageResponseTime: number;
      averagePrecisionAt5: number;
      averagePrecisionAt10: number;
    };
  }>;
}

interface EvaluationReport {
  metadata: {
    timestamp: string;
    locale: string;
    totalTests: number;
    totalCategories: number;
    duration: number;
  };
  summary: {
    overallSuccessRate: number;
    averageResponseTime: number;
    categoriesEvaluated: string[];
    topPerformingCategories: string[];
    problematicQueries: Array<{ query: string; issue: string }>;
  };
  categoryResults: CategoryResult[];
  recommendations: string[];
}

const evaluateSearch = {
  handler: async (args: EvaluateSearchArguments): Promise<void> => {
    const { locale, category, scenario, outputFormat, verbose, testFile } = args;
    const startTime = Date.now();

    console.log(`🔍 Starting Japanese Food Search Evaluation`);
    console.log(`   Locale: ${locale}`);
    if (category)
      console.log(`   Category: ${category}`);
    if (scenario)
      console.log(`   Scenario: ${scenario}`);
    console.log(`   Output format: ${outputFormat}`);
    console.log('');

    // Load test scenarios
    const testDataPath = testFile || path.resolve(__dirname, '../../test-data/japanese-food-search-scenarios.json');
    let testData: any;

    try {
      const fileContent = await fs.readFile(testDataPath, 'utf-8');
      testData = JSON.parse(fileContent);
      console.log(`✓ Loaded test scenarios from: ${testDataPath}`);
    }
    catch (error) {
      console.error(`❌ Failed to load test data: ${error}`);
      process.exit(1);
    }

    // Initialize OpenSearch client
    const opensearchConfig = {
      host: process.env.OPENSEARCH_HOST || 'https://search-intake24-food-search-szuol46zbsxedzttt3cme3m6my.ap-southeast-2.es.amazonaws.com',
      username: process.env.OPENSEARCH_USERNAME || 'admin',
      password: process.env.OPENSEARCH_PASSWORD || 'admin',
      indexName: process.env.OPENSEARCH_JAPANESE_INDEX || 'intake24_foods_ja',
    };

    const clientOptions: ClientOptions = {
      node: opensearchConfig.host,
      auth: {
        username: opensearchConfig.username,
        password: opensearchConfig.password,
      },
      ssl: {
        rejectUnauthorized: false,
      },
    };

    const opensearchClient = new Client(clientOptions);

    // Test connection
    try {
      const health = await opensearchClient.cluster.health();
      console.log(`✓ OpenSearch cluster status: ${health.body.status}`);
      console.log('');
    }
    catch (error) {
      console.error(`❌ Failed to connect to OpenSearch: ${error}`);
      process.exit(1);
    }

    // Initialize evaluation report
    const report: EvaluationReport = {
      metadata: {
        timestamp: new Date().toISOString(),
        locale,
        totalTests: 0,
        totalCategories: 0,
        duration: 0,
      },
      summary: {
        overallSuccessRate: 0,
        averageResponseTime: 0,
        categoriesEvaluated: [],
        topPerformingCategories: [],
        problematicQueries: [],
      },
      categoryResults: [],
      recommendations: [],
    };

    // Filter categories based on arguments
    const categoriesToTest = category
      ? { [category]: testData.testCategories[category] }
      : testData.testCategories;

    // Run evaluations
    for (const [categoryKey, categoryData] of Object.entries(categoriesToTest) as any[]) {
      console.log(`\n📊 Evaluating category: ${categoryData.name} (${categoryKey})`);
      console.log('='.repeat(60));

      const categoryResult: CategoryResult = {
        category: categoryKey,
        scenarios: [],
      };

      // Filter scenarios
      const scenariosToTest = scenario
        ? categoryData.scenarios.filter((s: any) => s.id === scenario)
        : categoryData.scenarios;

      for (const scenarioData of scenariosToTest) {
        console.log(`\n  Scenario: ${scenarioData.mealDescription} (${scenarioData.id})`);

        const scenarioResults: TestResult[] = [];
        let totalResponseTime = 0;
        let successfulQueries = 0;

        for (const searchTest of scenarioData.searchQueries) {
          const startQuery = Date.now();

          try {
            // Main query
            const searchResponse = await opensearchClient.search({
              index: opensearchConfig.indexName,
              body: {
                query: {
                  multi_match: {
                    query: searchTest.query,
                    fields: ['name^3', 'name.reading^2', 'description'],
                    type: 'best_fields',
                    fuzziness: 'AUTO',
                  },
                },
                size: 10,
                _source: ['food_code', 'name'],
              },
            });

            const responseTime = Date.now() - startQuery;
            totalResponseTime += responseTime;

            const hits = searchResponse.body.hits;
            const total = typeof hits.total === 'object' ? hits.total.value : hits.total || 0;

            const testResult: TestResult = {
              query: searchTest.query,
              expectedType: searchTest.expectedType,
              totalResults: total,
              topResults: [],
              metrics: {
                found: total > 0,
                relevantInTop5: 0,
                relevantInTop10: 0,
                averagePosition: 0,
                responseTime,
              },
              variants: [],
            };

            // Process top results
            if (hits.hits && hits.hits.length > 0) {
              testResult.topResults = hits.hits.slice(0, 10).map((hit: any, idx: number) => ({
                name: hit._source.name,
                foodCode: hit._source.food_code,
                score: hit._score,
                position: idx + 1,
              }));

              // Calculate relevance metrics (simplified - in real scenario, would need labeled data)
              const relevantTerms = [searchTest.query, ...(searchTest.variants || [])];
              testResult.topResults.forEach((result, idx) => {
                const isRelevant = relevantTerms.some(term =>
                  result.name.toLowerCase().includes(term.toLowerCase()),
                );
                if (isRelevant) {
                  if (idx < 5)
                    testResult.metrics.relevantInTop5++;
                  if (idx < 10)
                    testResult.metrics.relevantInTop10++;
                }
              });

              successfulQueries++;
            }

            // Test variants if provided
            if (searchTest.variants && verbose) {
              for (const variant of searchTest.variants) {
                const variantResponse = await opensearchClient.search({
                  index: opensearchConfig.indexName,
                  body: {
                    query: {
                      match: {
                        name: variant,
                      },
                    },
                    size: 1,
                  },
                });

                const variantHits = variantResponse.body.hits;
                const variantTotal = typeof variantHits.total === 'object'
                  ? variantHits.total.value
                  : variantHits.total || 0;

                testResult.variants?.push({
                  query: variant,
                  found: variantTotal > 0,
                  totalResults: variantTotal,
                });
              }
            }

            scenarioResults.push(testResult);
            report.metadata.totalTests++;

            if (verbose) {
              console.log(`    ✓ "${searchTest.query}": ${total} results (${responseTime}ms)`);
              if (testResult.topResults.length > 0) {
                console.log(`      Top result: ${testResult.topResults[0].name}`);
              }
            }

            // Track problematic queries
            if (total === 0) {
              report.summary.problematicQueries.push({
                query: searchTest.query,
                issue: 'No results found',
              });
            }
            else if (testResult.metrics.relevantInTop5 === 0) {
              report.summary.problematicQueries.push({
                query: searchTest.query,
                issue: 'No relevant results in top 5',
              });
            }
          }
          catch (error) {
            console.error(`    ❌ Error testing "${searchTest.query}": ${error}`);
            report.summary.problematicQueries.push({
              query: searchTest.query,
              issue: `Error: ${error}`,
            });
          }
        }

        // Calculate scenario aggregate metrics
        const aggregateMetrics = {
          totalQueries: scenarioResults.length,
          successfulQueries,
          averageResponseTime: totalResponseTime / scenarioResults.length,
          averagePrecisionAt5: scenarioResults.reduce((acc, r) => acc + (r.metrics.relevantInTop5 / 5), 0) / scenarioResults.length,
          averagePrecisionAt10: scenarioResults.reduce((acc, r) => acc + (r.metrics.relevantInTop10 / 10), 0) / scenarioResults.length,
        };

        categoryResult.scenarios.push({
          id: scenarioData.id,
          description: scenarioData.mealDescription,
          tests: scenarioResults,
          aggregateMetrics,
        });

        if (!verbose) {
          console.log(`    Completed: ${successfulQueries}/${scenarioResults.length} successful`);
          console.log(`    Avg response time: ${aggregateMetrics.averageResponseTime.toFixed(0)}ms`);
          console.log(`    Precision@5: ${(aggregateMetrics.averagePrecisionAt5 * 100).toFixed(1)}%`);
        }
      }

      report.categoryResults.push(categoryResult);
      report.metadata.totalCategories++;
      report.summary.categoriesEvaluated.push(categoryKey);
    }

    // Calculate overall metrics
    const allTests = report.categoryResults.flatMap(c =>
      c.scenarios.flatMap(s => s.tests),
    );

    report.summary.overallSuccessRate =
      (allTests.filter(t => t.metrics.found).length / allTests.length) * 100;

    report.summary.averageResponseTime =
      allTests.reduce((acc, t) => acc + t.metrics.responseTime, 0) / allTests.length;

    // Identify top performing categories
    report.categoryResults.forEach((category) => {
      const categorySuccessRate = category.scenarios.reduce((acc, s) =>
        acc + (s.aggregateMetrics.successfulQueries / s.aggregateMetrics.totalQueries), 0) / category.scenarios.length;

      if (categorySuccessRate > 0.8) {
        report.summary.topPerformingCategories.push(category.category);
      }
    });

    // Generate recommendations
    if (report.summary.overallSuccessRate < 70) {
      report.recommendations.push('Consider reviewing synonym mappings and query analyzer configuration');
    }
    if (report.summary.averageResponseTime > 100) {
      report.recommendations.push('Consider optimizing index settings or query structure for better performance');
    }
    if (report.summary.problematicQueries.length > allTests.length * 0.2) {
      report.recommendations.push('Many queries are failing - review tokenization and normalization settings');
    }

    report.metadata.duration = Date.now() - startTime;

    // Output results
    console.log(`\n${'='.repeat(60)}`);
    console.log('📈 EVALUATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total tests run: ${report.metadata.totalTests}`);
    console.log(`Categories evaluated: ${report.metadata.totalCategories}`);
    console.log(`Overall success rate: ${report.summary.overallSuccessRate.toFixed(1)}%`);
    console.log(`Average response time: ${report.summary.averageResponseTime.toFixed(0)}ms`);
    console.log(`Evaluation duration: ${(report.metadata.duration / 1000).toFixed(1)}s`);

    if (report.summary.topPerformingCategories.length > 0) {
      console.log(`\n✅ Top performing categories:`);
      report.summary.topPerformingCategories.forEach((cat) => {
        console.log(`   - ${cat}`);
      });
    }

    if (report.summary.problematicQueries.length > 0) {
      console.log(`\n⚠️  Problematic queries (showing first 10):`);
      report.summary.problematicQueries.slice(0, 10).forEach((pq) => {
        console.log(`   - "${pq.query}": ${pq.issue}`);
      });
    }

    if (report.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      report.recommendations.forEach((rec) => {
        console.log(`   - ${rec}`);
      });
    }

    // Save report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    let outputPath: string;
    let outputContent: string;

    switch (outputFormat) {
      case 'json':
        outputPath = `search-evaluation-${timestamp}.json`;
        outputContent = JSON.stringify(report, null, 2);
        break;

      case 'markdown':
        outputPath = `search-evaluation-${timestamp}.md`;
        outputContent = generateMarkdownReport(report);
        break;

      case 'csv':
        outputPath = `search-evaluation-${timestamp}.csv`;
        outputContent = generateCSVReport(report);
        break;

      default:
        outputPath = `search-evaluation-${timestamp}.json`;
        outputContent = JSON.stringify(report, null, 2);
    }

    await fs.writeFile(outputPath, outputContent, 'utf-8');
    console.log(`\n✅ Report saved to: ${outputPath}`);
  },
};

function generateMarkdownReport(report: EvaluationReport): string {
  let md = `# Japanese Food Search Evaluation Report\n\n`;
  md += `**Date:** ${report.metadata.timestamp}\n`;
  md += `**Locale:** ${report.metadata.locale}\n`;
  md += `**Total Tests:** ${report.metadata.totalTests}\n\n`;

  md += `## Summary\n\n`;
  md += `- **Overall Success Rate:** ${report.summary.overallSuccessRate.toFixed(1)}%\n`;
  md += `- **Average Response Time:** ${report.summary.averageResponseTime.toFixed(0)}ms\n`;
  md += `- **Categories Evaluated:** ${report.summary.categoriesEvaluated.join(', ')}\n\n`;

  md += `## Category Results\n\n`;
  for (const category of report.categoryResults) {
    md += `### ${category.category}\n\n`;
    for (const scenario of category.scenarios) {
      md += `#### ${scenario.description}\n`;
      md += `- Success Rate: ${((scenario.aggregateMetrics.successfulQueries / scenario.aggregateMetrics.totalQueries) * 100).toFixed(1)}%\n`;
      md += `- Avg Response Time: ${scenario.aggregateMetrics.averageResponseTime.toFixed(0)}ms\n`;
      md += `- Precision@5: ${(scenario.aggregateMetrics.averagePrecisionAt5 * 100).toFixed(1)}%\n\n`;
    }
  }

  if (report.recommendations.length > 0) {
    md += `## Recommendations\n\n`;
    report.recommendations.forEach((rec) => {
      md += `- ${rec}\n`;
    });
  }

  return md;
}

function generateCSVReport(report: EvaluationReport): string {
  let csv = 'Category,Scenario,Query,Total Results,Found,Response Time (ms),Relevant in Top 5,Relevant in Top 10\n';

  for (const category of report.categoryResults) {
    for (const scenario of category.scenarios) {
      for (const test of scenario.tests) {
        csv += `"${category.category}","${scenario.description}","${test.query}",`;
        csv += `${test.totalResults},${test.metrics.found},${test.metrics.responseTime},`;
        csv += `${test.metrics.relevantInTop5},${test.metrics.relevantInTop10}\n`;
      }
    }
  }

  return csv;
}

export default evaluateSearch;
