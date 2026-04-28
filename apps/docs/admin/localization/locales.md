# Locales

Locale is a grouping record to hold a specific list of categories / foods and its inheritance.

## Properties

- `Locale ID` - Valid locale ID and unique string within `locale` records

- `Prototype locale ID` - Prototype locale it inherits foods data from

- `English name` - English name of the language (e.g. Czech)

- `Local name` - Local name of the language (e.g. Čeština)

- `Country flag code` - Country code to select correct flag (`DEPRECATED - moved to language settings`)

- `Text direction` - Read / write direction of text. Valid options are `ltr` or `rlt` (`DEPRECATED - moved to language settings`)

- `Food index enabled` - Enable food index for this locale

- `Food index language backend` - Language backend for food index

- `Visibility` - Record visibility, valid options are `public` or `restricted` ([record visibility](/admin/acl/securables#record-visibility)).

## Deletion

Locale deletion won't be permitted if there are surveys using it. User firstly needs to update the surveys to use different locale.

## Recipe foods

Recipe foods management

## Split lists

Split list entries management

Entry has following fields:

- `First word` - first word
- `Words` - space delimited list of words

## Split words

Split words entries management

Entry has following fields:

- `Words` - space delimited list of words

## Synonym sets

Synonym sets entries management

Entry has following fields:

- `Synonyms` - space delimited list of synonyms

## Tasks

Tasks section allows to submit resource specific tasks into the job queue with additional parameters. See [job types](/admin/system/job-types) for more information.

Jobs that can be submitted:

- [Copy locale](/admin/system/job-types#localecopy)

- [Export foods](/admin/system/job-types#localefoods)

- [Export foods nutrients mapping](/admin/system/job-types#localefoodnutrientmapping)

- [Food ranking upload](/admin/system/job-types#localefoodrankingupload)

### New locale setup

1. Within the [`locales`](/admin/localization/locales) section, click on the `New locale` button.

2. Complete all fields and ensure `Food index enabled` is toggled on. Click `save` to create the new locale.

3. Go to the [`Tasks`](/admin/localization/locales#tasks) tab.

4. From the drop-down list, select `Locale - Copy data` job.

5. Under the `Job Parameters` section, click in the box `Source Locale ID`, then select the locale you want to clone e.g. United Kingdom (current) and confirm.

6. Leave the `Subtasks` list as it is (all items ticked), unless you specifically want to exclude some items from the copy process.

7. `Submit` and then `Save`.
