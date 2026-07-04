export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'AI Task Manager API',
    version: '1.0.0',
    description: 'Production-ready MERN AI Task Manager REST endpoints.',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Root',
    },
  ],
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                  role: { type: 'string', enum: ['ADMIN', 'TEAM_LEAD', 'MEMBER'] },
                },
                required: ['name', 'email', 'password'],
              },
            },
          },
        },
        responses: {
          201: { description: 'User successfully created' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login user and get JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
        },
      },
    },
    '/tasks': {
      get: {
        summary: 'Get all tasks with filtering and pagination',
        responses: {
          200: { description: 'Success' },
        },
      },
      post: {
        summary: 'Create a new task',
        responses: {
          201: { description: 'Task created successfully' },
        },
      },
    },
  },
};
