# Playwright API Test Framework Guide

This project is a custom API testing framework built on top of Playwright Test. It tests the Conduit API and adds a cleaner layer for authentication, request building, logging, schema validation, reusable test data, and custom assertions.

The main idea is simple:

```ts
const response = await api
  .path('/articles')
  .params({ limit: 4, offset: 0 })
  .clearAuth()
  .getRequest(200);
```

Instead of repeating full URLs, headers, status checks, response parsing, and logs in every test, the framework wraps those actions inside reusable helpers.

## Project Structure

```txt
pw-api-testing/
  api-test.config.ts
  playwright.config.ts
  helpers/
    createToken.ts
  request-objects/
    POST-articles.json
  response-schemas/
    articles/
      GET_articles_schema.json
      POST_articles_schema.json
    tags/
      GET_tags_schema.json
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

## Configuration

### `api-test.config.ts`

This file controls environment-specific API settings.

It exports:

```ts
config.apiUrl
config.userEmail
config.userPassword
```

Default API URL:

```txt
https://conduit-api.bondaracademy.com/api
```

Environment selection comes from:

```ts
process.env.TEST_ENV
```

If `TEST_ENV` is not set, it defaults to `prod`.

For `prod`, the framework reads credentials from:

```txt
PROD_USERNAME
PROD_PASSWORD
```

These values should live in `.env`, which is already loaded with `dotenv`.

### `playwright.config.ts`

This controls how Playwright runs the tests.

Important settings:

```ts
testDir: './tests'
fullyParallel: false
workers: 1
reporter: [['html'], ['list']]
trace: 'retain-on-failure'
```

There are two projects:

```ts
smoke-tests
api-testing
```

The `api-testing` project depends on `smoke-tests`, meaning smoke tests run first.

## Custom Fixture

File:

```txt
utils/fixture.ts
```

The framework extends Playwright's normal `test` fixture and adds:

```ts
api
config
authToken
```

Use it like this:

```ts
import { test } from '../utils/fixture';
import { expect } from '../utils/custom-expect';
```

### `authToken`

```ts
authToken: string
```

This is a worker-scoped fixture. It logs in once per worker using `createToken()` and shares the token across tests in that worker.

Because `workers` is set to `1`, the suite gets one shared token for the run.

### `api`

```ts
api: RequestHandler
```

This is the main custom request object. It gives you chainable methods like:

```ts
api.path('/articles').getRequest(200)
```

It automatically:

- Uses the base API URL from `config.apiUrl`
- Adds the default auth token unless you call `.clearAuth()`
- Logs request and response details
- Validates the expected status code
- Parses JSON responses
- Cleans request state after each request

### `config`

```ts
config: typeof config
```

This exposes the loaded environment config inside tests.

## Request Handler

File:

```txt
utils/request-handler.ts
```

`RequestHandler` is the core API wrapper. It uses Playwright's `APIRequestContext` internally, but gives you a simpler testing syntax.

### Chain Setup Methods

#### `.url(url: string)`

Overrides the base URL for one request.

```ts
await api
  .url('https://example.com/api')
  .path('/health')
  .getRequest(200);
```

Use this only when you need a different API host from the default `config.apiUrl`.

#### `.path(path: string)`

Sets the endpoint path.

```ts
await api
  .path('/tags')
  .getRequest(200);
```

The final URL becomes:

```txt
config.apiUrl + path
```

Example:

```txt
https://conduit-api.bondaracademy.com/api/tags
```

#### `.params(params: object)`

Adds query parameters.

```ts
await api
  .path('/articles')
  .params({ limit: 10, offset: 0 })
  .getRequest(200);
```

Final URL:

```txt
/articles?limit=10&offset=0
```

#### `.headers(headers: Record<string, string>)`

Adds request headers.

```ts
await api
  .path('/articles')
  .headers({ 'Content-Type': 'application/json' })
  .getRequest(200);
```

The framework also adds `Authorization` automatically unless `.clearAuth()` is used.

#### `.body(body: object)`

Adds a JSON request body.

```ts
await api
  .path('/articles')
  .body({
    article: {
      title: 'My Article',
      description: 'Short description',
      body: 'Article body',
      tagList: ['Test']
    }
  })
  .postRequest(201);
```

Used mainly with:

- `postRequest`
- `putRequest`

#### `.clearAuth()`

Removes the default authorization token for one request.

```ts
await api
  .path('/articles')
  .clearAuth()
  .getRequest(200);
```

Use this for public endpoints or negative tests where you want to test unauthenticated behavior.

## Request Methods

Each request method accepts the expected status code. If the actual status does not match, the framework throws a custom error with recent API logs.

### `.getRequest(statusCode: number)`

Sends a GET request and returns parsed JSON.

```ts
const response = await api
  .path('/tags')
  .getRequest(200);
```

### `.postRequest(statusCode: number)`

Sends a POST request with the current body and returns parsed JSON.

```ts
const response = await api
  .path('/articles')
  .body(articleRequest)
  .postRequest(201);
```

### `.putRequest(statusCode: number)`

Sends a PUT request with the current body and returns parsed JSON.

```ts
const response = await api
  .path(`/articles/${slug}`)
  .body(updatedArticle)
  .putRequest(200);
```

### `.deleteRequest(statusCode: number)`

Sends a DELETE request.

```ts
await api
  .path(`/articles/${slug}`)
  .deleteRequest(204);
```

This method does not return a response body.

## Automatic Cleanup

After every request, `RequestHandler` resets:

```ts
apiBody
apiHeaders
baseUrl
apiPath
queryParams
clearAuthFlag
```

That means this:

```ts
await api.path('/tags').getRequest(200);
await api.path('/articles').getRequest(200);
```

is safe. The second request does not accidentally reuse the first request's path, body, headers, or params.

## Authentication Helper

File:

```txt
helpers/createToken.ts
```

Function:

```ts
createToken(email: string, password: string)
```

What it does:

1. Creates a new Playwright API request context.
2. Builds a temporary `RequestHandler`.
3. Sends a login request to `/users/login`.
4. Returns the token in this format:

```txt
Token <actual-token>
```

The fixture uses this function automatically, so most tests do not need to call it directly.

## Custom Assertions

File:

```txt
utils/custom-expect.ts
```

Import custom expect like this:

```ts
import { expect } from '../utils/custom-expect';
```

The framework extends Playwright's `expect` with custom matchers.

### `.shouldEqual(expected)`

Wrapper around Playwright's `toEqual()`, but with recent API logs added to the failure message.

```ts
expect(response.tags[0]).shouldEqual('Test');
```

Supports `.not`:

```ts
expect(articleResponse.articles[0].title).not.shouldEqual(articleTitle);
```

### `.shouldBeLessThanOrEqual(expected)`

Wrapper around `toBeLessThanOrEqual()`, also with API logs added on failure.

```ts
expect(response.tags.length).shouldBeLessThanOrEqual(10);
```

### `.shouldMatchSchema(dirName, fileName, createSchemaFlag?)`

Validates a response body against a JSON schema.

```ts
await expect(response).shouldMatchSchema('articles', 'GET_articles');
```

This looks for:

```txt
response-schemas/articles/GET_articles_schema.json
```

You can also generate or overwrite a schema from the current response:

```ts
await expect(response).shouldMatchSchema('tags', 'GET_tags', true);
```

Be careful with `true`: it writes a new schema based on the current API response. This is useful when creating schemas, but risky if the API response is already wrong.

## Schema Validation

File:

```txt
utils/schema-validator.ts
```

Function:

```ts
validateSchema(dirName, fileName, responseBody, createSchemaFlag)
```

It uses:

- `ajv` for JSON schema validation
- `ajv-formats` for formats like `date-time`
- `genson-js` to generate schemas from live responses

Schema file naming convention:

```txt
response-schemas/<dirName>/<fileName>_schema.json
```

Example:

```ts
await expect(response).shouldMatchSchema('articles', 'POST_articles');
```

Uses:

```txt
response-schemas/articles/POST_articles_schema.json
```

## API Logger

File:

```txt
utils/logger.ts
```

Class:

```ts
APILogger
```

It stores recent API activity in memory.

Methods:

```ts
logRequest(method, url, headers, body?)
logResponse(statusCode, body?)
getRecentLogs()
```

The request handler logs every API request and response. Custom assertions include these logs when a test fails.

This is one of the biggest benefits of the framework: when a status code, schema, or assertion fails, you can see the request and response that caused the failure.

## Test Data Generator

File:

```txt
utils/data-generator.ts
```

Function:

```ts
getNewRandomArticle()
```

It starts from:

```txt
request-objects/POST-articles.json
```

Then it uses Faker to generate:

```ts
article.title
article.description
article.body
```

Example:

```ts
const articleRequest = getNewRandomArticle();

const createArticleResponse = await api
  .path('/articles')
  .body(articleRequest)
  .postRequest(201);
```

This prevents duplicate article titles and makes tests more reliable.

## Request Objects

Folder:

```txt
request-objects/
```

Current file:

```txt
POST-articles.json
```

This stores the base article payload:

```json
{
  "article": {
    "title": "New Article",
    "description": "This is a New article",
    "body": "This is the body of the test article",
    "tagList": ["Test", "Article"]
  }
}
```

The framework can clone this payload and modify it during tests.

## Writing A New Test

Use this pattern for new tests:

```ts
import { test } from '../utils/fixture';
import { expect } from '../utils/custom-expect';

test('Get tags', async ({ api }) => {
  const response = await api
    .path('/tags')
    .getRequest(200);

  await expect(response).shouldMatchSchema('tags', 'GET_tags');
  expect(response.tags[0]).shouldEqual('Test');
  expect(response.tags.length).shouldBeLessThanOrEqual(10);
});
```

For a public endpoint:

```ts
const response = await api
  .path('/articles')
  .params({ limit: 10, offset: 0 })
  .clearAuth()
  .getRequest(200);
```

For an authenticated create flow:

```ts
const createArticleResponse = await api
  .path('/articles')
  .body(articleRequest)
  .postRequest(201);
```

For cleanup:

```ts
await api
  .path(`/articles/${slug}`)
  .deleteRequest(204);
```

## Current Test Files

### `tests/smokeTest.spec.ts`

This is the best example of the finished framework style.

It covers:

- Get articles
- Get tags
- Create and delete article
- Create, update, and delete article
- Schema validation
- Custom assertions
- Random data generation

### `tests/negativeTest.spec.ts`

This tests validation errors for user signup.

It loops through username test cases:

```ts
[
  { username: 'dd', usernameErrorMessage: 'is too short (minimum is 3 characters)' },
  { username: 'ddd', usernameErrorMessage: '' },
  { username: 'dddddddddddddddddddd', usernameErrorMessage: '' },
  { username: 'ddddddddddddddddddddd', usernameErrorMessage: 'is too long (maximum is 20 characters)' },
]
```

This is a good pattern for data-driven negative testing.

### `tests/example.spec.ts`

This mostly shows the older raw Playwright API style.

It is useful for comparison, but new tests should usually use:

```ts
import { test } from '../utils/fixture';
import { expect } from '../utils/custom-expect';
```

and the custom `api` fixture.

## How To Run

From the parent folder:

```powershell
cd "d:\test training"
npx playwright test --config .\pw-api-testing\playwright.config.ts
```

To run only smoke tests:

```powershell
npx playwright test --config .\pw-api-testing\playwright.config.ts --project smoke-tests
```

To open the HTML report:

```powershell
npx playwright show-report .\pw-api-testing\playwright-report
```

Important: `schema-validator.ts` currently uses this schema base path:

```ts
./pw-api-testing/response-schemas
```

So schema validation is expected to run from the parent folder, `d:\test training`. If you run from inside `pw-api-testing`, schema files may not be found.

## Framework Pros

### Less repeated code

Tests no longer need to repeat:

- Full API base URL
- Auth header setup
- Response status validation
- JSON parsing
- Logging
- Schema file loading

### Cleaner test readability

The chainable syntax makes the test read like a request description:

```ts
api.path('/articles').params({ limit: 10 }).getRequest(200)
```

### Better failure messages

When status validation or custom assertions fail, recent API activity is printed. That makes debugging much faster.

### Built-in authentication

The fixture gets a token automatically and applies it to requests. You only call `.clearAuth()` when you intentionally want no auth.

### Schema validation support

API responses can be checked against stored JSON schemas. This catches contract changes, missing fields, wrong field types, and unexpected API shape changes.

### Reusable request payloads

Request JSON lives in `request-objects`, which keeps test files smaller and easier to maintain.

### Random test data

Faker-generated article data reduces duplicate-data failures and makes create/update tests more stable.

### Data-driven negative testing

`negativeTest.spec.ts` shows how one test structure can run multiple validation cases.

## Watch-Outs

### Use the custom imports

For framework-style tests, use:

```ts
import { test } from '../utils/fixture';
import { expect } from '../utils/custom-expect';
```

If you import from `@playwright/test`, you will not get the custom `api` fixture or custom matchers.

### `.clearAuth()` is per request

After the request finishes, the framework resets the flag. If you need multiple unauthenticated requests, call `.clearAuth()` on each one.

### `createSchemaFlag: true` overwrites schemas

This is useful when creating new schemas, but do not leave it enabled accidentally in stable tests unless you really want schemas to update from live responses.

### Response body parsing assumes JSON

`getRequest`, `postRequest`, and `putRequest` call `response.json()`. That is correct for the current API, but endpoints with empty or non-JSON responses would need special handling.

### The logger keeps logs for the fixture lifetime

`APILogger` stores recent logs in memory and currently does not clear them after each request or test. This is helpful for context, but long test runs may show more history than expected.

## Recommended Pattern For Future Tests

Use this as the standard template:

```ts
import { test } from '../utils/fixture';
import { expect } from '../utils/custom-expect';

test('Test name', async ({ api }) => {
  const response = await api
    .path('/endpoint')
    .params({ limit: 10, offset: 0 })
    .getRequest(200);

  await expect(response).shouldMatchSchema('folder', 'FILE_name');
  expect(response.someField).shouldEqual('expected value');
});
```

For create/update/delete tests, always clean up created data:

```ts
let slug: string | undefined;

try {
  const created = await api
    .path('/articles')
    .body(articleRequest)
    .postRequest(201);

  slug = created.article.slug;
} finally {
  if (slug) {
    await api
      .path(`/articles/${slug}`)
      .deleteRequest(204);
  }
}
```

This keeps the API environment clean even when an assertion fails midway through a test.
