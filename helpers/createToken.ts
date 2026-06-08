import { RequestHandler } from "../utils/request-handler";
import { config } from "../api-test.config";
import { APILogger } from "../utils/logger";
import { request } from "@playwright/test";
import { expect, setCustomExpectLogger } from "../utils/custom-expect";


export async function createToken(email:string, password:string){
    const context = await request.newContext()
    const logger = new APILogger()
    setCustomExpectLogger(logger)
    const api = new RequestHandler(context, config.apiUrl,logger);

try {
    const tokenResponse = await api 
.path('/users/login')
.body({user: {email: email, password: password}})
.postRequest(200);
    await expect(tokenResponse).shouldMatchSchema('users', 'POST_users_login')
    return 'Token ' + tokenResponse.user.token;
}
catch(error){
if (error instanceof Error) {
    Error.captureStackTrace(error, createToken)
  }
  throw error
} finally {
   await  context.dispose()
}}
