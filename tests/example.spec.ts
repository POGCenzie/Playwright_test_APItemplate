import { createToken } from '../helpers/createToken';
import { expect } from '../utils/custom-expect';
import { test } from '../utils/fixture';





let authToken : string

test.beforeEach('Get Token', async ({api  }) => {
 const tokenResponse = await api 
    .path('/users/login')
    .body({user: {email: "bessietesting@gmail.com", password: "password_2131"}})
    .postRequest(200);
await expect(tokenResponse).shouldMatchSchema('users', 'POST_users_login');
authToken = 'Token ' + tokenResponse.user.token;
})



test('get test tags', async ({ request }) => {
  const tagsResponse = await request.get('https://conduit-api.bondaracademy.com/api/tags');
  expect(tagsResponse.status()).toEqual(200);
  const tagsResponseJson = await tagsResponse.json();
  await expect(tagsResponseJson).shouldMatchSchema('tags', 'GET_tags');
  expect(tagsResponseJson.tags[0]).toEqual('Test');
  expect(tagsResponseJson.tags.length).toBeLessThanOrEqual(10);
  });

test('Create and Delete Article', async ({ request }, testInfo) => {


const title = `New Article ${testInfo.project.name} ${Date.now()}`;
let slugid: string | undefined;

try {
const NewArticleResponse = await request.post('https://conduit-api.bondaracademy.com/api/articles/', {
  data: {
    article: {
      title: title,
      description: "This is a test article",
      body: "This is the body of the test article",
      tagList: ["Test", "Article"]
    }
  },
  headers : {
    authorization: authToken}
});

//to create new article
const NewArticleResponseJson = await NewArticleResponse.json();
expect(NewArticleResponse.status()).toEqual(201);
await expect(NewArticleResponseJson).shouldMatchSchema('articles', 'POST_articles');
expect(NewArticleResponseJson.article.title).toEqual(title);
slugid = NewArticleResponseJson.article.slug;

// to show new article after creating
  const articlesResponse = await request.get(`https://conduit-api.bondaracademy.com/api/articles/${slugid}`,{

    //auth for specific private article
    headers : {
      authorization: authToken}
  });

  const articleresponseJson = await articlesResponse.json();
  expect(articlesResponse.status()).toEqual(200);
  await expect(articleresponseJson).shouldMatchSchema('articles', 'GET_articles_slug');
  expect(articleresponseJson.article.title).toEqual(title);
} finally {
  if (slugid) {
    const deleteArticleResponse = await request.delete(`https://conduit-api.bondaracademy.com/api/articles/${slugid}`, {
      headers : {
        authorization: authToken}
    });
    expect(deleteArticleResponse.status()).toEqual(204);
  }
}
})

test('Create Update and Delete Article', async ({ request }, testInfo) => {
const title = `New Article ${testInfo.project.name} ${Date.now()}`;
const modifiedTitle = `${title} Modified`;
let articleSlug: string | undefined;

try {
const NewArticleResponse = await request.post('https://conduit-api.bondaracademy.com/api/articles/', {
  data: {
    article: {
      title: title,
      description: "This is a test article",
      body: "This is the body of the test article",
      tagList: ["Test", "Article"]
    }
  },
  headers : {
    authorization: authToken}
});

//to create new article
const NewArticleResponseJson = await NewArticleResponse.json();
expect(NewArticleResponse.status()).toEqual(201);
await expect(NewArticleResponseJson).shouldMatchSchema('articles', 'POST_articles');
expect(NewArticleResponseJson.article.title).toEqual(title);
articleSlug = NewArticleResponseJson.article.slug;

// TO update article
const updateArticleResponse = await request.put(`https://conduit-api.bondaracademy.com/api/articles/${articleSlug}`,{
data: {
    article: {
      title: modifiedTitle,
      description: "This is a test article Modified ",
      body: "This is the body of the test article Modified",
      tagList: ["Test", "Article"]
    }
  },
  headers : {
    authorization: authToken}


});
const updateArticleResponseJson = await updateArticleResponse.json();
expect(updateArticleResponse.status()).toEqual(200);
await expect(updateArticleResponseJson).shouldMatchSchema('articles', 'PUT_articles');
expect(updateArticleResponseJson.article.title).toEqual(modifiedTitle);
articleSlug = updateArticleResponseJson.article.slug;


// to show new article after creating
  const articlesResponse = await request.get(`https://conduit-api.bondaracademy.com/api/articles/${articleSlug}`,{

    //auth for specific private article
    headers : {
      authorization: authToken}
  });



  const articleresponseJson = await articlesResponse.json();
  expect(articlesResponse.status()).toEqual(200);
  await expect(articleresponseJson).shouldMatchSchema('articles', 'GET_articles_slug');
  expect(articleresponseJson.article.title).toEqual(modifiedTitle);
} finally {
  if (articleSlug) {
    const deleteArticleResponse = await request.delete(`https://conduit-api.bondaracademy.com/api/articles/${articleSlug}`, {
      headers : {
        authorization: authToken}
    });
    expect(deleteArticleResponse.status()).toEqual(204);
  }
}
})
