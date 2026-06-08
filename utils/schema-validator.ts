import fs from 'fs/promises'
import path from 'path'
import Ajv from 'ajv'
import { createSchema } from 'genson-js';
import addFormats from "ajv-formats"

const SCHEMA_BASE_PATH = './pw-api-testing/response-schemas'
const ajv = new Ajv({allErrors: true})
addFormats(ajv)

export async function validateSchema(dirName: string, fileName:string,responseBody: object,createSchemaFlag: boolean = false){
    const schemaPath = path.join(SCHEMA_BASE_PATH,dirName,`${fileName}_schema.json`)

    if(createSchemaFlag) await generateNewSchema(responseBody,schemaPath)
    


    const schema = await loadSchema(schemaPath)
    const validate = ajv.compile(schema)

    
    const valid = validate(responseBody)
    if (!valid) {
        throw new Error(
            `Schema Validation ${fileName}_schema.json failed:\n`+
            `${JSON.stringify(validate.errors, null,4)}\n\n`+
            `Actual Reponse Body: \n`+
            `${JSON.stringify(responseBody,null,4)}`
        )
    }
}
async function loadSchema(schemaPath:string){
    try {
        const schemaContent = await fs.readFile(schemaPath,'utf-8')
        return JSON.parse(schemaContent)
    } catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  throw new Error(`Failed to Read the Schema File: ${message}`)
}}

async function generateNewSchema(responseBody:object,schemaPath:string) {
    try {
            const generatedSchema = createSchema(responseBody)
            addDateTimeFormatsToSchema(generatedSchema)

            await fs.mkdir(path.dirname(schemaPath),{recursive: true})
            await fs.writeFile(schemaPath,JSON.stringify(generatedSchema,null,4))
        } catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  throw new Error(`Failed to Read the Schema File: ${message}`)
}
}

function addDateTimeFormatsToSchema(schema: any) {
    if (!schema || typeof schema !== 'object') return

    if (schema.properties && typeof schema.properties === 'object') {
        for (const [propertyName, propertySchema] of Object.entries(schema.properties)) {
            if (isTimestampProperty(propertyName) && propertySchema && typeof propertySchema === 'object') {
                const timestampSchema = propertySchema as Record<string, unknown>
                timestampSchema.format = 'date-time'
            }

            addDateTimeFormatsToSchema(propertySchema)
        }
    }

    if (schema.items) {
        addDateTimeFormatsToSchema(schema.items)
    }
}

function isTimestampProperty(propertyName: string) {
    const normalizedPropertyName = propertyName.toLowerCase()
    return normalizedPropertyName === 'createdat' || normalizedPropertyName === 'updatedat'
}
