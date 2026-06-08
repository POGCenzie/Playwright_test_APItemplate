import articleResponsePayload from '../request-objects/POST-articles.json'
import { faker } from '@faker-js/faker';


export function getNewRandomArticle(){
    const articleRequest = structuredClone(articleResponsePayload)
    articleRequest.article.title = faker.lorem.sentence(5)
    articleRequest.article.description = faker.lorem.sentence(3)
    articleRequest.article.body = faker.lorem.paragraph(8)
    return articleRequest
}