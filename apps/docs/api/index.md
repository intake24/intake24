# Introduction

API design largely aims to follow RESTful principals.

By default, expected content type is `application/json`.

```http
GET /api/endpoint

Content-Type: application/json
```

For endpoints expecting file, expected content type is `multipart/form-data`.

```http
GET /api/endpoint

Content-Type: multipart/form-data
```

## Reference

OpenAPI specification is used to describe the API -> [OpenAPI specification](/open-api.html){target="blank"}

::: warning
OpenAPI specification is available for ALL survey endpoints and part of admin endpoints.

We're in the process of adding OpenAPI specification for all endpoints.
:::
