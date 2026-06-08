import { createToken } from '../helpers/createToken';
import { expect } from '../utils/custom-expect';
import { test } from '../utils/fixture';
import { validateSchema } from '../utils/schema-validator';
import articleResponsePayload from '../request-objects/POST-articles.json'
import { faker } from '@faker-js/faker';
import { getNewRandomArticle } from '../utils/data-generator';


test('Get Articles', async ({ api }) => {

    const response = await api
        .path('/articles')
        .params({ limit: 4, offset: 0 })
        .clearAuth()
        .getRequest(200);
    await expect(response).shouldMatchSchema('articles', 'GET_articles')
    expect(response.articles.length).shouldBeLessThanOrEqual(10);
    expect(response.articlesCount).shouldEqual(10);
})
test('Get tags', async ({ api }) => {
    const response = await api
        .path('/tags')
        .getRequest(200);
    await expect(response).shouldMatchSchema('tags', 'GET_tags')
    expect(response.tags[0]).shouldEqual('Test');
    expect(response.tags.length).shouldBeLessThanOrEqual(10);

    
})
test('Create and Delete Articles', async ({ api }) => {
    const articleRequest = getNewRandomArticle()
    const createArticleResponse = await api
        .path('/articles')
        .body(articleRequest)
        .postRequest(201);
    await expect(createArticleResponse).shouldMatchSchema('articles', 'POST_articles')
    expect(createArticleResponse.article.title).shouldEqual(articleRequest.article.title);
    const slugid = createArticleResponse.article.slug;

    // To Get Request
    const articleResponse = await api
        .path('/articles')
        .params({ limit: 10, offset: 0 })
        .getRequest(200);
    await expect(articleResponse).shouldMatchSchema('articles', 'GET_articles')
    expect(articleResponse.articles[0].title).shouldEqual(articleRequest.article.title);


    // Delete Request
    await api
        .path(`/articles/${slugid}`)

        .deleteRequest(204)

    const articleResponseTwo = await api
        .path('/articles')

        .params({ limit: 10, offset: 0 })
        .getRequest(200);
    await expect(articleResponseTwo).shouldMatchSchema('articles', 'GET_articles')
    expect(articleResponseTwo.articles[0].title).not.shouldEqual(articleRequest.article.title);

})
test('Create Update and Delete Articles', async ({ api }) => {
    const articleTitle = faker.lorem.sentence(5)
    const articleRequest = JSON.parse(JSON.stringify(articleResponsePayload))
     articleRequest.article.title = articleTitle
    const createArticleResponse = await api
        .path('/articles')
        .body(articleRequest)
        .postRequest(201);
    await expect(createArticleResponse).shouldMatchSchema('articles', 'POST_articles')
    expect(createArticleResponse.article.title).shouldEqual(articleTitle);
    const slugid = createArticleResponse.article.slug;

    const articletitleTwo = faker.lorem.sentence(5)
    articleRequest.article.title = articletitleTwo
    const UpdateArticleResponse = await api
        .path(`/articles/${slugid}`)
        .body(articleRequest)
        .putRequest(200)
    await expect(UpdateArticleResponse).shouldMatchSchema('articles', 'PUT_articles')
    expect(UpdateArticleResponse.article.title).shouldEqual(articletitleTwo);
    const Newslugid = UpdateArticleResponse.article.slug;

    // To Get Request
    const articleResponse = await api
        .path('/articles')
        .params({ limit: 10, offset: 0 })
        .getRequest(200);
    await expect(articleResponse).shouldMatchSchema('articles', 'GET_articles')
    expect(articleResponse.articles[0].title).shouldEqual(articletitleTwo);

    // Delete Request
    await api
        .path(`/articles/${Newslugid}`)

        .deleteRequest(204)

    // to check if created article is deleted
    const articleResponseTwo = await api
        .path('/articles')

        .params({ limit: 10, offset: 0 })
        .getRequest(200);
    await expect(articleResponseTwo).shouldMatchSchema('articles', 'GET_articles')
    expect(articleResponseTwo.articles[0].title).not.shouldEqual(articletitleTwo);

})
function clearAuth() {
    throw new Error('Function not implemented.');
}

