<template>
  <v-card :loading :tile="$vuetify.display.mobile">
    <v-card-text>
      <div class="d-flex gc-2">
        <component
          :is="`${prompt.barcode.type}-input`"
          v-model="searchTerm"
          :clearable="prompt.barcode.type === 'none'"
          flat
          hide-details
          :label="promptI18n.search"
          :options="prompt.barcode"
          outlined
          :placeholder="promptI18n.search"
          prepend-inner-icon="$search"
          @detected="search"
          @keydown.enter="search"
        />
        <v-btn
          v-if="$vuetify.display.smAndUp"
          color="primary"
          :disabled="!canSearch"
          elevation="0"
          height="initial"
          size="x-large"
          :title="promptI18n.search"
          @click="search"
        >
          <v-icon icon="fas fa-turn-down fa-rotate-90" start />
          {{ promptI18n.search }}
        </v-btn>
      </div>
      <template v-if="selectedProductDetails">
        <v-btn class="my-4" color="grey-lighten-2" elevation="0" size="large" @click="back">
          <v-icon icon="fas fa-turn-up fa-flip-horizontal" start />
          {{ promptI18n.back }}
        </v-btn>
        <v-card class="off-product-card pa-3">
          <div class="pa-2 bg-white rounded">
            <v-img
              height="250px"
              :src="selectedProductDetails.url"
            />
          </div>
          <v-card-title class="px-0">
            {{ selectedProductDetails.name }}
          </v-card-title>
          <v-card-text class="px-0">
            <div v-if="selectedProductDetails.code" class="my-2">
              <span class="font-weight-medium">
                {{ promptI18n['products.code'] }}:
              </span>
              {{ selectedProductDetails.code }}
            </div>
            <div v-if="selectedProductDetails.name || selectedProductDetails.genericName" class="my-2">
              <span class="font-weight-medium">
                {{ promptI18n['products.name'] }}:
              </span>
              {{ selectedProductDetails.name || selectedProductDetails.genericName }}
            </div>
            <div v-if="selectedProductDetails.quantity" class="my-2">
              <span class="font-weight-medium">
                {{ promptI18n['products.quantity'] }}:
              </span>
              {{ selectedProductDetails.quantity }}
            </div>
            <div v-if="selectedProductDetails.packaging" class="my-2">
              <span class="font-weight-medium">
                {{ promptI18n['products.packaging'] }}:</span>
              {{ selectedProductDetails.packaging }}
            </div>
          </v-card-text>
        </v-card>
      </template>
      <v-container v-if="!selected && canSearch" class="pa-0" fluid>
        <div class="d-flex flex-column flex-md-row justify-space-between align-center py-3 gr-2">
          <div>
            {{ promptI18n['products.results'] }}
          </div>
          <v-pagination
            v-model="response.data.page"
            :length="Math.ceil(response.data.count / response.data.page_size)"
            rounded
            :total-visible="7"
            @update:model-value="search"
          />
        </div>
        <template v-if="!loading">
          <v-row justify="center">
            <v-col v-for="product in response.data.products" :key="product.code" cols="12" md="4" sm="6">
              <v-card class="off-product-card off-product-card--result pa-3" height="100%" link @click="select(product)">
                <div class="pa-2 bg-white rounded">
                  <v-img
                    height="250px"
                    :src="resolveImageUrl(product)"
                  />
                </div>
                <v-card-title class="px-0">
                  {{ getProductName(product, true) }}
                </v-card-title>
              </v-card>
            </v-col>
          </v-row>
          <div v-if="response.data.products.length > 9" class="d-flex justify-end align-center py-3">
            <v-pagination
              v-model="response.data.page"
              :length="Math.ceil(response.data.count / response.data.page_size)"
              outlined
              rounded
              :total-visible="7"
              @update:model-value="search"
            />
          </div>
          <v-alert v-if="!loading && !response.data.products.length" class="my-4" type="warning">
            {{ promptI18n['products.none'] }}
          </v-alert>
        </template>
        <v-row v-else justify="center">
          <v-col v-for="(item, idx) in Array.from({ length: 6 })" :key="idx" cols="12" md="4" sm="6">
            <v-skeleton-loader
              class="mx-auto border"
              type="image, heading"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Prompts, PromptStates } from '@intake24/common/prompts';
import type { FoodState } from '@intake24/common/surveys';

import axios, { isAxiosError, isCancel } from 'axios';
import { computed, onMounted, ref, watch } from 'vue';

import { usePromptUtils } from '@intake24/survey/composables';
import { barcodes } from '@intake24/ui';
import { useApp } from '@intake24/ui/stores';

defineOptions({
  name: 'OpenFoodFacts',
  components: { ...barcodes },
});

const props = defineProps({
  food: {
    type: Object as PropType<FoodState>,
    required: true,
  },
  prompt: {
    type: Object as PropType<Prompts['external-source-prompt']>,
    required: true,
  },
  modelValue: {
    type: Object as PropType<PromptStates['external-source-prompt']>,
    required: true,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const searchParams = {
  json: 1,
};

export type OOFProduct = Record<string, any> & {
  code: string;
};

export type OOFProductResponse = {
  code: string;
  status: 1;
  status_verbose: string;
  product: OOFProduct;
}/*  | {
  code: string;
  status: 0;
  _verbose: string;
} */;

export type OOFProductsResponse = {
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  products: OOFProduct[];
  skip: number;
};

export type SearchResponse = {
  searchTerm: string;
  data: OOFProductsResponse;
};

const emptyResponse: SearchResponse['data'] = {
  count: 0,
  page: 1,
  page_count: 0,
  page_size: 1,
  products: [],
  skip: 0,
};

const app = useApp();
const { translatePrompt } = usePromptUtils(props, { emit });

const baseUrl = computed(() => `https://${props.prompt.source.country || 'world'}.openfoodfacts.org`);
const searchBaseUrl = computed(() => `${baseUrl.value}/cgi/search.pl`);
const productBaseUrl = computed(() => `${baseUrl.value}/api/v2/product`);
const categoriesTags = computed(() => {
  if (props.food.type !== 'encoded-food')
    return [];

  return props.food.data.tags.reduce<string[]>((acc, tag) => {
    if (tag.startsWith('off:'))
      acc.push(tag.replace(/^off:/, ''));

    return acc;
  }, []);
});
const hasSearchFilters = computed(() => !!(Object.keys(props.prompt.source.query).length || categoriesTags.value.length));

const client = axios.create({ baseURL: baseUrl.value });
let clientCtrl = new AbortController();

function cancelRequest() {
  clientCtrl.abort();
  clientCtrl = new AbortController();
}

const loading = ref(false);
const lang = computed(() => app.lang);

const searchFields = computed(() => [
  'id',
  'code',
  'countries_tags',
  'generic_name',
  'generic_name_en',
  `generic_name_${lang.value}`,
  'product_name',
  'product_name_en',
  `product_name_${lang.value}`,
  'packaging',
  'quantity',
  'image_front_small_url',
  'selected_images',
]);

const productFields = computed(() => []);

const response = ref<SearchResponse>({
  searchTerm: '',
  data: emptyResponse,
});
const selected = ref<OOFProduct | undefined>();
const searchTerm = ref(props.modelValue.searchTerm);
const canSearch = computed(() => hasSearchFilters.value || !!searchTerm.value);

const promptI18n = computed(() =>
  translatePrompt([
    'search',
    'back',
    'products.results',
    'products.none',
    'products.name',
    'products.code',
    'products.quantity',
    'products.packaging',
  ], {
    'products.results': { count: response.value.data.count ?? 0 },
  }),
);

function resolveImageUrl(product: OOFProduct) {
  return product.image_front_small_url ?? Object.values(product.selected_images?.front?.small ?? {})[0];
}

function getProductName(product: OOFProduct, withQuantity = false) {
  const name = product[`product_name_${lang.value}`] || product.product_name_en || product.product_name;
  const genericName = product[`generic_name_${lang.value}`] || product.generic_name_en || product.generic_name;
  const finalName = name || genericName;

  return withQuantity && product.quantity ? `${finalName} (${product.quantity})` : finalName;
}

const selectedProductDetails = computed(() => {
  const product = selected.value;
  if (!product)
    return undefined;

  const code = product.code;
  const name = product[`product_name_${lang.value}`] || product.product_name_en || product.product_name;
  const genericName = product[`generic_name_${lang.value}`] || product.generic_name_en || product.generic_name;
  const quantity = product.quantity;
  const packaging = product.packaging;
  const url = resolveImageUrl(product);

  return {
    code,
    name,
    genericName,
    quantity,
    packaging,
    url,
  };
});

async function fetchProduct(barcode: string) {
  cancelRequest();
  loading.value = true;

  try {
    const { data: { product } } = await client.get<OOFProductResponse>(`${productBaseUrl.value}/${barcode}`, {
      params: {
        fields: productFields.value.length ? productFields.value.join(',') : undefined,
      },
      signal: clientCtrl.signal,
    });

    selected.value = { ...product };
  }
  catch (err) {
    if (isCancel(err))
      return;

    if (isAxiosError(err) && err.response?.status === 404) {
      response.value.data = { ...emptyResponse };
      return;
    }

    throw err;
  }
  finally {
    loading.value = false;
  }
}

async function fetchProducts(search: string) {
  cancelRequest();
  loading.value = true;
  selected.value = undefined;
  response.value.searchTerm = search;

  try {
    const { data } = await client.get<OOFProductsResponse>(searchBaseUrl.value, {
      params: {
        ...searchParams,
        ...props.prompt.source.query,
        categories_tags: categoriesTags.value.length ? categoriesTags.value.join('|') : undefined,
        search_terms: search,
        fields: searchFields.value.length ? searchFields.value.join(',') : undefined,
        page: response.value.searchTerm === search ? response.value.data.page : 1,
      },
      signal: clientCtrl.signal,
    });
    response.value = { searchTerm: search, data };
  }
  catch (err) {
    if (isCancel(err))
      return;

    throw err;
  }
  finally {
    loading.value = false;
  }
}

async function search() {
  const searchValue = searchTerm.value ?? '';
  if (!searchValue && !hasSearchFilters.value) {
    response.value = { searchTerm: '', data: { ...emptyResponse } };
    return;
  }

  if (/^\d+$/.test(searchValue))
    await fetchProduct(searchValue);
  else
    await fetchProducts(searchValue);
}

function back() {
  selected.value = undefined;
}

async function select(product: OOFProduct) {
  await fetchProduct(product.code);
}

onMounted(async () => {
  await search();
});

watch(selected, (data) => {
  emit('update:modelValue', { ...props.modelValue, data });
});

watch(() => response.value.searchTerm, async (searchTerm) => {
  emit('update:modelValue', { ...props.modelValue, searchTerm });
});
</script>

<style lang="scss">
.off-product-card {
  background-color: rgba(#ff9d60, 0.2) !important;

  .v-image__image--cover {
    background-size: contain;
  }

  &.off-product-card--result:hover {
    background-color: rgba(#ff9d60, 0.5) !important;
  }
}
</style>
