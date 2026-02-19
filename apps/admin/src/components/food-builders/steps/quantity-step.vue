<script lang="ts" setup>
import { createStepProps } from './step';

defineProps(createStepProps<'quantity'>());

defineEmits(['update:modelValue']);
</script>

<style lang="scss">
</style>
