// Plural forms: French treats 0 and 1 as singular; Arabic has six forms
// (zero, one, two, few, many, other), picked with Intl.PluralRules.
const AR_FORMS = ['zero', 'one', 'two', 'few', 'many', 'other']
const arPlural = new Intl.PluralRules('ar')

export default defineI18nConfig(() => ({
  fallbackLocale: 'en',
  pluralRules: {
    fr: (choice: number, choicesLength: number) => (choicesLength === 2 ? (choice <= 1 ? 0 : 1) : Math.min(choice, choicesLength - 1)),
    ar: (choice: number, choicesLength: number) =>
      choicesLength === 6 ? AR_FORMS.indexOf(arPlural.select(choice)) : Math.min(choice === 1 ? 0 : 1, choicesLength - 1),
  },
}))
