import type { ParameterBuilder } from '../types'
import { createStandardQuery } from '../utils'

export const geographyBuilders: Record<string, ParameterBuilder> = {
  country: createStandardQuery('country', ['country'], "country != ''"),
  region: createStandardQuery("CONCAT(region, ', ', country)", ['region', 'country'], "region != ''"),
  timezone: createStandardQuery('timezone', ['timezone'], "timezone != ''"),
  language: createStandardQuery('language', ['language'], "language != '' AND language IS NOT NULL"),
} 