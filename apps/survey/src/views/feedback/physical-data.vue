<template>
  <v-container :class="{ 'pa-0': $vuetify.display.mobile }">
    <v-row justify="center" :no-gutters="$vuetify.display.mobile">
      <v-col cols="12" md="8" sm="9">
        <v-card :tile="$vuetify.display.mobile">
          <v-card-title>{{ $t('feedback.physicalData.title') }}</v-card-title>
          <v-card-subtitle>
            {{ $t('feedback.physicalData.subtitle') }}
          </v-card-subtitle>
          <v-card-text class="pa-4">
            <v-form @keydown="errors.clear($event.target.name)" @submit.prevent="submit">
              <v-row>
                <v-col v-if="collectPhysicalDataField('sex')" cols="12" lg="6">
                  <v-select
                    v-model="form.sex"
                    :error-messages="errors.get('sex')"
                    hide-details="auto"
                    :items="sexes"
                    :label="$t('feedback.physicalData.sexes._')"
                    name="sex"
                    prepend-inner-icon="fas fa-genderless"
                    variant="outlined"
                    @update:model-value="errors.clear('sex')"
                  >
                    <template #item="{ props, item }">
                      <v-list-item v-bind="props" :title="item.raw.text">
                        <template #prepend>
                          <span :class="`${item.raw.icon} me-3`" />
                        </template>
                      </v-list-item>
                    </template>
                    <template #selection="{ item }">
                      <span :class="`${item.raw.icon} me-3`" />
                      {{ item.raw.text }}
                    </template>
                  </v-select>
                </v-col>
                <v-col v-if="collectPhysicalDataField('birthdate')" cols="12" lg="6">
                  <v-text-field
                    v-model="form.birthdate"
                    :error-messages="errors.get('birthdate')"
                    hide-details="auto"
                    :label="$t('feedback.physicalData.birthdate')"
                    name="birthdate"
                    prepend-inner-icon="fas fa-birthday-cake"
                  />
                </v-col>
                <v-col v-if="collectPhysicalDataField('heightCm')" cols="12" lg="6">
                  <v-text-field
                    v-model="form.heightCm"
                    :error-messages="errors.get('heightCm')"
                    hide-details="auto"
                    :label="$t('feedback.physicalData.heightCm')"
                    name="heightCm"
                    prepend-inner-icon="fas fa-arrows-alt-v"
                  />
                </v-col>
                <v-col v-if="collectPhysicalDataField('weightKg')" cols="12" lg="6">
                  <v-text-field
                    v-model="form.weightKg"
                    :error-messages="errors.get('weightKg')"
                    hide-details="auto"
                    :label="$t('feedback.physicalData.weightKg')"
                    name="weightKg"
                    prepend-inner-icon="fas fa-weight"
                  />
                </v-col>
                <v-col v-if="collectPhysicalDataField('physicalActivityLevelId')" cols="12" lg="6">
                  <v-select
                    v-model="form.physicalActivityLevelId"
                    :error-messages="errors.get('physicalActivityLevelId')"
                    hide-details="auto"
                    item-title="name"
                    item-value="id"
                    :items="physicalActivityLevels"
                    :label="$t('feedback.physicalData.physicalActivityLevelId')"
                    name="physicalActivityLevelId"
                    prepend-inner-icon="fas fa-running"
                    @update:model-value="errors.clear('physicalActivityLevelId')"
                  />
                </v-col>
                <v-col v-if="collectPhysicalDataField('weightTarget')" cols="12" lg="6">
                  <v-select
                    v-model="form.weightTarget"
                    :error-messages="errors.get('weightTarget')"
                    hide-details="auto"
                    :items="weightTargets"
                    :label="$t('feedback.physicalData.weightTargets._')"
                    name="weightTarget"
                    prepend-inner-icon="fas fa-crosshairs"
                    variant="outlined"
                    @update:model-value="errors.clear('weightTarget')"
                  />
                </v-col>
              </v-row>
              <v-row class="mt-3" justify="center">
                <v-col cols="12" sm="auto">
                  <v-btn
                    block
                    class="px-10"
                    color="primary"
                    :disabled="errors.any()"
                    size="x-large"
                    :title="$t('common.action.continue')"
                    type="submit"
                  >
                    {{ $t('common.action.continue') }}
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import axios, { HttpStatusCode } from 'axios';
import { mapState } from 'pinia';
import { defineComponent } from 'vue';
import type { FeedbackPhysicalDataField, Sex } from '@intake24/common/feedback';
import { sexes, weightTargets } from '@intake24/common/feedback';
import type { PhysicalActivityLevelAttributes } from '@intake24/common/types/http/admin';
import { Errors } from '@intake24/common/util';
import { userService } from '@intake24/survey/services';
import { useLoading, useSurvey } from '@intake24/survey/stores';
import type { UserPhysicalData } from '@intake24/ui/feedback';
import { createFeedbackService } from '@intake24/ui/feedback';

export interface NullablePhysicalActivityLevel extends Omit<PhysicalActivityLevelAttributes, 'id'> {
  id: string | null;
}

export default defineComponent({
  name: 'FeedbackPhysicalData',

  beforeRouteEnter({ params }, from, next) {
    if (useSurvey().parameters?.feedbackScheme?.physicalDataFields.length)
      next();
    else
      next({ name: 'feedback-home', params });
  },

  props: {
    surveyId: {
      type: String,
      required: true,
    },
  },

  data() {
    const feedbackService = createFeedbackService();

    const genderIcon = (gender: Sex): string => {
      const icons: Record<Sex, string> = { m: 'fas fa-mars', f: 'fas fa-venus' };
      return icons[gender];
    };

    return {
      feedbackService,
      form: {
        sex: null,
        birthdate: null,
        heightCm: null,
        weightKg: null,
        physicalActivityLevelId: null,
        weightTarget: null,
      } as UserPhysicalData,
      errors: new Errors(),
      sexes: [
        { text: this.$t('common.not.selected'), value: null, icon: 'fas fa-genderless' },
        ...sexes.map(value => ({
          text: this.$t(`feedback.physicalData.sexes.${value}`),
          value,
          icon: genderIcon(value),
        })),
      ],
      physicalActivityLevels: [
        { id: null, name: this.$t('common.not.selected'), coefficient: 0 },
      ] as NullablePhysicalActivityLevel[],
      weightTargets: [
        { text: this.$t('common.not.selected'), value: null },
        ...weightTargets.map(value => ({
          text: this.$t(`feedback.physicalData.weightTargets.${value}`),
          value,
        })),
      ],
    };
  },

  computed: {
    ...mapState(useSurvey, ['parameters']),

    feedbackScheme() {
      return this.parameters?.feedbackScheme;
    },
  },

  async mounted() {
    const { surveyId } = this;

    const loading = useLoading();
    loading.addItem('feedback-physical-data');

    try {
      const [physicalData, feedbackData] = await Promise.all([
        userService.fetchPhysicalData(),
        this.feedbackService.getFeedbackData(),
      ]);

      this.form = { ...physicalData };

      this.physicalActivityLevels = [
        { id: null, name: this.$t('common.not.selected'), coefficient: 0 },
        ...feedbackData.physicalActivityLevels,
      ];
    }
    catch {
      this.$router.push({ name: 'feedback-error', params: { surveyId } });
    }
    finally {
      loading.removeItem('feedback-physical-data');
    }
  },

  methods: {
    collectPhysicalDataField(field: FeedbackPhysicalDataField): boolean {
      return !!this.feedbackScheme?.physicalDataFields.includes(field);
    },

    async submit() {
      const { surveyId } = this;

      try {
        await userService.savePhysicalData(surveyId, this.form);
        this.$router.push({ name: 'feedback-home', params: { surveyId } });
      }
      catch (err) {
        if (
          axios.isAxiosError(err)
          && err.response?.status === HttpStatusCode.BadRequest
          && 'errors' in err.response.data
        ) {
          this.errors.record(err.response.data.errors);
          return;
        }

        throw err;
      }
    },
  },
});
</script>

<style lang="scss"></style>
