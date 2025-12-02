# Get started with your survey

If you are accessing your survey for the first time, log in here: [admin.intake24.org](https://admin.intake24.org) and follow the on-screen instructions to set your new password. You will not need to repeat this step.

Once in the Intake24 admin tool, click on `Surveys` in sidebar. Next to your survey, click on the detail icon.

To get started with using Intake24, read and follow all the instructions in the sections below.

## Detail

This tab summarises the set-up of your study, updates can be made in the `edit` tab. All
fields are explained in the next section.

## Edit

This tab is used to create your study in Intake24. The study set-up form sent to Cambridge is used to populate this tab.

There are a number of fields, listed below, which you are unable to edit. However, apart from `Survey ID` all fields can be modified by Cambridge if needed.

### Survey ID

- Short string-based field which is included in the survey URL / authentication URLs
- Once set, this can't be edited

### Locale

- The food data that will be used for the survey
- This can be amended but will require further discussion

### Survey scheme

- Recall questions forming the recall flow
- This is set to pre-defined / default questions, additional questions can be added, please discuss

### Feedback scheme

- Can be enabled / disabled
- If dietary feedback is switched on, feedback scheme needs to be set
- As above, this is set to a default scheme but this can be customised
- More information can be found in [feedback scheme section](/admin/feedback/schemes.html)

---

The remaining fields, listed below, can be edited freely by you/your study team:

### Survey name

- Name of survey appearing on recall

### Start date

- Start date of your survey

### End date

- End date of your survey

### Support email

- Designated mailbox for your survey help requests

### State

1. **Not started** – survey has not started, respondents will not be able to
   complete recalls.
2. **Active** – survey is LIVE, respondents are able to complete recalls
3. **Suspended** – survey is paused, respondents are unable to complete recalls
   until survey is set to active again
4. **Completed** – survey has finished data collection, respondents are unable to
   complete recalls.

### Store user session on server

- If enabled, user partial submission data are sent to server for storage and retrieval
- If disabled, user partial submission data are only stored locally
- This is switched on by default

### Sorting algorithm

Determines the order of foods displayed to respondent:

1. Popularity (reporting frequency): returned food matched list based on
   popularity of selection – survey specific
2. Global popularity (reporting frequency): returned food matched list based on
   popularity of selection – all studies. This is our default setting.
3. Predetermined order: returned food matched list compiled by researcher and
   uploaded into Intake24

### Match score weight

- Match score weight parameter or sorting algorithm.
- Our default score weight is 20

### Allow user personal identifiers

- Can be enabled / disabled
- If enabled, user can store values to email / phone / name fields on user records through the survey respondent UI (i.e. the UI will show this additional fields and also CSV upload will accept those columns to import)

### Allow user custom fields

- Can be enabled / disabled
- If enabled, user can store additional values in user custom fields, which is `key:value` pair.
- This can e.g. be done using CSV file upload, any column name that is not matched with user fields, will get stored as custom field

### Captcha verification

- Can be toggled on / off
- If enabled, strengthens participant logins (username/password and authentication URLs) to better guard against potential bot activity

### URL Token character set

- String of characters used for authentication tokens (related to redirecting respondents once recall(s) are complete)

### URL Token length

- Authentication token length, see [authentication settings](/admin/surveys/#authentication-settings) for more information

### URL Domain override

- URL override to used to generate full authentication links in CSV export file

### Allow user generation

- Can be switched on / off, see [authentication settings](/admin/surveys/#authentication-settings) for more information
- This is switched off by default

### JWT secret for M2M communication

- String to sign JWT token

### Submission notification URL

- Webhook to be called when recall data is submitted
- See [notifications settings](/admin/surveys/#notifications) for more information

### Maximum allowed submissions per calendar day

- Maximum number of recalls that can be submitted in one day
- This is set to 1 recall by default

### Maximum allowed total submissions

- Maximum number of recalls that can be submitted by same respondent

### Minimum interval between submissions (seconds)

- Shortest minimal interval between submissions by same respondent
- Set to 600 secs by default

### Number of submissions for feedback

- If feedback is switched on, this can be set to number of submissions required to allow respondent access to feedback

## Respondents

This tab is used to upload usernames and passwords and generate survey URLs for survey participants. It`s recommended to upload usernames and passwords in bulk and in CSV
format.

To bulk upload usernames and passwords:

**1) Compile a CSV file which includes at least `username` column**

The usernames should not contain any spaces (or personally identifiable information).

Please see [survey respondent import](/admin/system/job-types#surveyrespondentsimport) for more details on CSV format.

If passwords are used, the minimum requirements for creating passwords are as follows:

- Minimum 10 character length (for both)
- Character set to include both lower/upper letters [a-zA-Z] and digits [0-9]

Usernames / passwords must NOT include personally identifiable information

:::tip
If your CSV file with usernames and passwords is not uploading to Intake24 and you
have carefully checked that the headings match those given above, it may be that
your CSV file contains a `BOM` (byte order marking) character. To check and remove
this, open the file in an editor that supports encoding (e.g. Notepad++). In
Notepad++ if you see it says UTF-8 BOM in the bottom right corner of the screen,
you can remove it by clicking `Encoding` on the top menu and then `UTF-8`. Save the
file and try uploading this new version. If this does not work or if you encounter any
further issues, contact your IT or technical department.
:::

**2. Click on the three dots beside `new respondent` followed by `respondents upload`**

**3. Click into field `CSV file to upload`**

- This will open up your file directory
- Choose the correct file and click open
- The `CSV file to upload` field should be filled with file name
- Click on `upload`
- Click `close` once the upload is complete – a green tick should appear beside the import job

**4. Click into a different tab and then back into `respondents`**

- This will update the tab to include the newly uploaded usernames

**5. To generate survey URLs, follow step 2 but click on `Authentication URLs`**

- Click `generate file`
- Once generated, you will be able to download the file. You can either circulate the `ShortSurveyAuthenticationURL` or
  `SurveyAuthenticationURL`, see [survey submissions](/admin/surveys/#respondents) for more details.
- Respondents will not require their usernames and passwords to log-in, instead the URL can be used for Intake24 recall access
- To manually create new respondents, click on `new respondent` and complete all fields
- Finally click `save`
- Remember to not include any personal identifiable information
- Repeat step 5 to generate log-in URLs for new respondents

:::warning
Please note that it is your responsibility to test your survey prior to starting data collection.
:::

## Submissions

This tab allows you to view / filter / delete submissions. You can filter the results by `username`. Any deletions made in this tab will automatically update the data export.

## Tasks

This tab allows you to import/extract the following reports:

- `Survey – Export authentication URLs` - export log-in credentials
- `Survey – Submission data export` - export survey submission data to CSV file
- `Survey – Nutrients recalculation` - recalculates survey submission nutrient data
- `Survey – Ratings export` - export survey dietary feedback ratings (please note, both
  dietary feedback and the ratings feature will need to be enabled in order to collect this
  information)
- `Survey – Import respondents` - import usernames and passwords
