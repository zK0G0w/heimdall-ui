import { createProdMockServer } from 'vite-plugin-mock/es/createProdMockServer'

import area from './area'
import oauth2Consent from './oauth2-consent'

export function setupProdMockServer() {
  createProdMockServer([...area, ...oauth2Consent])
}
