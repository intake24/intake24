# Integrations

Intake24 provides access to [REST API](/api/), which is consumed by its 1<sup>st</sup> party applications, i.e. [admin tool](/admin/) and [survey app](/survey/) and can be used to integrate with any other 3<sup>rd</sup> party systems.

::: warning
For machine-to-machine communication, [personal access tokens](/admin/user/personal-access-tokens) should be used rather than primary user credentials.
:::

While REST API is a generic interface to be used to implement custom integrations, there are few features that can simplify the 3<sup>rd</sup> party integration into survey flow without delving too much into the API details:

- Respondent account creation

- Survey completion notifications

- Redirecting to 3<sup>rd</sup> party system

## Respondent account creation

Respondent accounts can be created on the fly using simplified API call with JWT-encoded parameters. This is suitable for studies, where seamless integration is required for real-time data processing/monitoring and respondent accounts are created on demand and respondents automatically redirected into the Intake24 system.

Survey can be enabled with respondent account generation using shared secret. To enable this feature, read [survey user settings](/admin/surveys/#users-settings) section.

- tick `allow user generation`
- set up `jwt secret` - opaque string to sign JWT for secure communication between Intake24 and 3<sup>rd</sup> party system

::: warning
JWT secret should be treated as a `shared secret for machine-to-machine communication`. Therefore it should always be securely stored in backend and not embedded in frontend code, where it can be easily extracted and misused.
:::

Once enabled, two options listed below can be used to create respondent accounts. Regardless of the selected option, [JWT token](/open-api.html#tag/survey/POST/surveys/{slug}/create-user){target="blank"} with payload must be created.

#### A) API endpoint

- use [create user API endpoint](/open-api.html#tag/survey/POST/surveys/{slug}/create-user){target="blank"}
- create JWT token with desired payload according the specification

#### Token specifications

- `token` must be a valid JWT token signed with the [`JWT secret`](/admin/surveys/#users-settings)
- `HS256` and `HS512` algorithms are supported

#### Standard JWT claims

Standard JWT claims to help identify JWT and limit its lifetime. Please see [RFC 7519 Chapter 4.1](https://datatracker.ietf.org/doc/html/rfc7519#section-4.1) for more details.

- `iat` - issued at timestamp (NumericDate in seconds)
- `exp` - expiration timestamp (NumericDate in seconds)
- `aud` - API resource server, e.g. `https://api.example.com`
- `sub` - survey identifier -> `survey code/slug`
- `iss` - issuer of the token

:::warning
Tokens without standard claims limit their identifiability and may pose increased security risk. E.g. tokens with missing `exp` claim won't expire, thus can pose a security risk.
:::

#### User creation claims

- `username` - Unique respondent username within the survey
- `password` (optional) - password for `username:password` login, can be omitted if only authentication URL is intended to be used
- `name` (optional) - user's name for personalisation
- `customFields` (optional) - user's custom fields

#### JWT payload

```json
{
  // Standard JWT claims
  "iat"?: number,
  "exp"?: number,
  "aud"?: string | string[],
  "sub"?: string,
  "iss"?: string,
  // User creation claims
  "username": string,
  "password"?: string,
  "name"?: string,
  "customFields"?: [{"name": string, "value": string}],
}
```

- form authentication URL with response details using one of the [authentication URL patterns](/admin/surveys/#authentication-urls)
- redirect respondent to the URL

#### B) Frontend app URL

Under the hood same API endpoint is used as in `option A` calling the frontend app URL. User is automatically authenticated and redirected to the survey home page.

```http
app.domain.com/{surveyId}/create-user/{token}
```

**Optional redirect**

User can be redirected within the app to a specific page after account creation using `redirect` query parameter:

```http
app.domain.com/{surveyId}/create-user/{token}?redirect=recall
```

- Possible values:
  - `home` or `undefined` - user is redirected to the survey home
  - `recall` - user is redirected to the survey recall
  - `feedback` - user is redirected to the survey feedback

::: tip
Pick suitable option based on integration use case, depending whether you need to process API response (`A`) or not (`B`).
:::

## Survey notifications / webhooks

Intake24 can notify 3<sup>rd</sup> party system about survey progression using registered notifications / webhooks. To enable this feature, read [survey notifications](/admin/surveys/#notifications) section.

## Redirection to 3<sup>rd</sup> party system

Intake24 can redirect respondent to 3<sup>rd</sup> party system upon survey recall completion. To enable this feature, survey scheme needs to set up with terminal `redirect prompt` including desired parameters to form the `redirect URL`. Please see [redirect prompt](/admin/surveys/prompt-types#redirect-prompt) for more details.

## Missing integration?

Please note options described above are not exhaustive. It is a list of most frequently used methods, for more details consult [API documentation](/api/).

Not found the integration you're looking for? We appreciate that every system is a bit different, so we're happy to advise and where possible extend Intake24 to allow for seamless integration and wider adoption. Open an issue on [GitHub](https://github.com/intake24/intake24/issues) and we will try to help.
