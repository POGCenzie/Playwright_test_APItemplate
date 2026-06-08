import { error } from 'console';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });



const processENV = process.env.TEST_ENV
const env = processENV || 'prod'
console.log('Test Environment is: ' + env )
const config = {
    apiUrl:'https://conduit-api.bondaracademy.com/api',
    userEmail: 'devbessietesting@gmail.com',
    userPassword: 'devpassword_2131'
}

if(env === 'qa'){
    config.userEmail = 'bessietesting@gmail.com',
    config.userPassword = 'password_2131'
}

if(env === 'prod'){
//     if(!process.env.PROD_USERNAME || !process.env.PROD_PASSWORD){
// throw error('Missing Required Environment Variables')
//     }
    config.userEmail = process.env.PROD_USERNAME as string,
    config.userPassword = process.env.PROD_PASSWORD as string
}


export {config}