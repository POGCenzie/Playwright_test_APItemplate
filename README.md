# Playwright API Testing Framework

Custom API testing framework built with Playwright Test for the Conduit API.

It adds a small framework layer on top of Playwright so tests can use:

```ts
const response = await api
  .path('/articles')
  .params({ limit: 10, offset: 0 })
  .clearAuth()
  .getRequest(200);
```

Instead of repeating full URLs, auth headers, response parsing, status checks, logs, and schema validation in every test.

## Features

- Chainable API request helper
- Automatic auth token fixture
- Environment-based config with `.env`
- Custom schema validation matcher
- JSON schema generation support
- Custom assertion messages with recent API logs
- Faker-based random article payloads
- Request payloads stored as reusable JSON files
- Playwright HTML and list reporters

## Project Structure

```txt
pw-api-testing/
  api-test.config.ts
  playwright.config.ts
  FRAMEWORK_GUIDE.md
  helpers/
    createToken.ts
  request-objects/
    POST-articles.json
  response-schemas/
    articles/
    tags/
    users/
  tests/
    example.spec.ts
    negativeTest.spec.ts
    smokeTest.spec.ts
  utils/
    custom-expect.ts
    data-generator.ts
    fixture.ts
    logger.ts
    request-handler.ts
    schema-validator.ts
```

## Setup

Install dependencies:

```powershell
cd "d:\test training\pw-api-testing"
npm install
```

Create or update `.env`:

```env
PROD_USERNAME=your-email
PROD_PASSWORD=your-password
```

The framework reads credentials from `.env` through `api-test.config.ts`.

## Running Tests

Run the configured suite from the parent folder:

```powershell
cd "d:\test training"
.\pw-api-testing\node_modules\.bin\playwright.cmd test --config .\pw-api-testing\playwright.config.ts
```

Run the negative tests directly:

```powershell
.\pw-api-testing\node_modules\.bin\playwright.cmd test pw-api-testing/tests/negativeTest.spec.ts
```

Open the HTML report:

```powershell
.\pw-api-testing\node_modules\.bin\playwright.cmd show-report .\pw-api-testing\playwright-report
```

## Writing Tests

Use the framework imports:

```ts
import { test } from '../utils/fixture';
import { expect } from '../utils/custom-expect';
```

Example:

```ts
test('Get tags', async ({ api }) => {
  const response = await api
    .path('/tags')
    .getRequest(200);

  await expect(response).shouldMatchSchema('tags', 'GET_tags');
  expect(response.tags[0]).shouldEqual('Test');
});
```

## Schema Validation

Use:

```ts
await expect(response).shouldMatchSchema('folder', 'REQUEST_endpoint');
```

Examples:

```ts
await expect(response).shouldMatchSchema('tags', 'GET_tags');
await expect(response).shouldMatchSchema('articles', 'POST_articles');
await expect(response).shouldMatchSchema('users', 'POST_users_login');
```

Schema files live in:

```txt
response-schemas/<folder>/<fileName>_schema.json
```

To generate a new schema from a response, temporarily pass `true` as the third argument:

```ts
await expect(response).shouldMatchSchema('tags', 'GET_tags', true);
```

Remove `true` after the schema has been generated so tests validate against the saved schema.

## Main Helpers

`utils/fixture.ts`

Adds the custom `api`, `config`, and `authToken` fixtures.

`utils/request-handler.ts`

Provides chainable API methods:

```ts
.url()
.path()
.params()
.headers()
.body()
.clearAuth()
.getRequest()
.postRequest()
.putRequest()
.deleteRequest()
```

`utils/custom-expect.ts`

Adds custom matchers:

```ts
.shouldEqual()
.shouldBeLessThanOrEqual()
.shouldMatchSchema()
```

`utils/schema-validator.ts`

Loads, generates, and validates JSON schemas with AJV.

`utils/data-generator.ts`

Creates random article payloads with Faker.

`utils/logger.ts`

Stores API request and response logs for better failure messages.

## More Detail

Read the full framework explanation here:

[FRAMEWORK_GUIDE.md](./FRAMEWORK_GUIDE.md)
