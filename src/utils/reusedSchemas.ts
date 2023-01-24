export const idParamSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string'/* , format: 'uuid' */ },
  },
} as const;
