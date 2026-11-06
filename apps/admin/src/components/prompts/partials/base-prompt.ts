import { defineComponent } from 'vue';

export default defineComponent({
  name: 'BasePrompt',

  methods: {
    update(field: string, value: any) {
      this.$emit('update:options', { [field]: value });
    },
    updateNumber(field: string, value: any, fallback = null) {
      const number = Number(value);
      this.$emit('update:options', {
        [field]: Number.isNaN(number)
          ? fallback
          : number,
      });
    },
    updateInteger(field: string, value: any, fallback = null) {
      const integer = Number.parseInt(value, 10);
      this.$emit('update:options', {
        [field]: Number.isNaN(integer)
          ? fallback
          : integer,
      });
    },
    updateLanguage(field: string, lang: string, value: any) {
      this.$emit('update:options', {
        [field]: { ...this.$props[field], [lang]: value },
      });
    },
  },
});
