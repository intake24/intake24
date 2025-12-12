# Authentication

`Authentication` and `Authorization` protected endpoints require valid access token (JSON Web Token format, a.k.a `JWT`) attached as `Authorization` http request header.

### Request

```http
GET /api/endpoint

Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Response

```json
200 OK

{
    ...
}
```

#### Invalid authentication attempt will return HTTP `401 Unauthorized` status code.

```json
401 Unauthorized
```

#### Invalid authorization attempt will return HTTP `403 Forbidden` status code.

```json
403 Forbidden
```

Access tokens can be obtained in two ways depending on intended usage.

## SPA applications

Authentication flow for SPA applications (`admin` and `survey`) is based on combination of short-lived `access token` and long-lived `refresh token`.

Login endpoints issue JWT `access tokens` in response body. `Access token` is short-lived JWT and has to be included in `Authorization` header for specific endpoint.

Response includes cookie with `refresh token`, which can be used to obtain fresh `access token`. By default, cookie is `http-only` (prevents to be read by javascript code) and `secure` (sent over https-only), refer to [security configuration](/config/api/security#json-web-tokens) for more details.

Combination of short-lived `access token` and long-lived `refresh token` is focused on security and usability within SPA applications. Moreover, account can be protected with multi-factor authentication, which is not suitable for `machine-to-machine` communication.

## Personal access tokens

The use of personal access tokens a.k.a. `API Keys` is recommended for `machine-to-machine` communication.

Personal access tokens are long-lived JWT tokens, which can be used to authenticate requests. Personal access tokens are bound to specific user. Personal access tokens can be managed in [admin tool](/admin/user/personal-access-tokens).

::: tip
Personal access tokens are long lived and should be treated as sensitive data. They should be stored securely and never exposed to public (e.g. embedded into frontend code).
:::
