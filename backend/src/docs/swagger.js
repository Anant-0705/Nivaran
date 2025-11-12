const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Nivaran Civic Reporting API',
    version: '1.0.0',
    description: 'A comprehensive API for civic issue reporting and community engagement platform',
    contact: {
      name: 'Nivaran Development Team',
      email: 'support@nivaran.app',
      url: 'https://nivaran.app'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: process.env.API_URL || 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://api.nivaran.app',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from authentication endpoint'
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for service-to-service authentication'
      }
    },
    schemas: {
      User: {
        type: 'object',
        required: ['email', 'full_name'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique user identifier',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com'
          },
          full_name: {
            type: 'string',
            description: 'User full name',
            example: 'John Doe'
          },
          phone: {
            type: 'string',
            description: 'User phone number',
            example: '+1-234-567-8900'
          },
          avatar_url: {
            type: 'string',
            format: 'uri',
            description: 'User avatar image URL',
            example: 'https://example.com/avatars/user.jpg'
          },
          role: {
            type: 'string',
            enum: ['citizen', 'official', 'admin'],
            description: 'User role in the system',
            example: 'citizen'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp',
            example: '2024-01-15T10:30:00Z'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
            example: '2024-01-15T10:30:00Z'
          }
        }
      },
      Issue: {
        type: 'object',
        required: ['title', 'description', 'category', 'location'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique issue identifier',
            example: '123e4567-e89b-12d3-a456-426614174001'
          },
          title: {
            type: 'string',
            maxLength: 200,
            description: 'Issue title',
            example: 'Pothole on Main Street'
          },
          description: {
            type: 'string',
            description: 'Detailed issue description',
            example: 'Large pothole causing damage to vehicles near the intersection'
          },
          category: {
            type: 'string',
            enum: ['infrastructure', 'safety', 'environment', 'transportation', 'utilities', 'other'],
            description: 'Issue category',
            example: 'infrastructure'
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
            description: 'Issue priority level',
            example: 'high'
          },
          status: {
            type: 'string',
            enum: ['reported', 'acknowledged', 'in_progress', 'resolved', 'closed'],
            description: 'Current issue status',
            example: 'reported'
          },
          location: {
            type: 'object',
            required: ['latitude', 'longitude'],
            properties: {
              latitude: {
                type: 'number',
                format: 'double',
                minimum: -90,
                maximum: 90,
                description: 'Location latitude',
                example: 40.7128
              },
              longitude: {
                type: 'number',
                format: 'double',
                minimum: -180,
                maximum: 180,
                description: 'Location longitude',
                example: -74.0060
              },
              address: {
                type: 'string',
                description: 'Human-readable address',
                example: '123 Main Street, New York, NY 10001'
              }
            }
          },
          images: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uri'
            },
            description: 'Array of image URLs',
            example: ['https://example.com/issue1.jpg', 'https://example.com/issue2.jpg']
          },
          user_id: {
            type: 'string',
            format: 'uuid',
            description: 'ID of user who reported the issue',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          assigned_to: {
            type: 'string',
            format: 'uuid',
            description: 'ID of official assigned to handle the issue',
            example: '123e4567-e89b-12d3-a456-426614174002'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Issue creation timestamp',
            example: '2024-01-15T10:30:00Z'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
            example: '2024-01-15T10:30:00Z'
          }
        }
      },
      Comment: {
        type: 'object',
        required: ['content'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique comment identifier',
            example: '123e4567-e89b-12d3-a456-426614174003'
          },
          content: {
            type: 'string',
            description: 'Comment content',
            example: 'I can confirm this issue exists. It damaged my tire yesterday.'
          },
          issue_id: {
            type: 'string',
            format: 'uuid',
            description: 'ID of the related issue',
            example: '123e4567-e89b-12d3-a456-426614174001'
          },
          user_id: {
            type: 'string',
            format: 'uuid',
            description: 'ID of user who made the comment',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Comment creation timestamp',
            example: '2024-01-15T10:30:00Z'
          }
        }
      },
      Reward: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique reward identifier',
            example: '123e4567-e89b-12d3-a456-426614174004'
          },
          title: {
            type: 'string',
            description: 'Reward title',
            example: 'Community Hero Badge'
          },
          description: {
            type: 'string',
            description: 'Reward description',
            example: 'Awarded for reporting 10 confirmed issues'
          },
          points: {
            type: 'integer',
            description: 'Points value of the reward',
            example: 100
          },
          type: {
            type: 'string',
            enum: ['badge', 'points', 'certificate', 'voucher'],
            description: 'Type of reward',
            example: 'badge'
          },
          criteria: {
            type: 'object',
            description: 'Criteria for earning this reward',
            properties: {
              issues_reported: {
                type: 'integer',
                example: 10
              },
              issues_resolved: {
                type: 'integer',
                example: 5
              },
              community_engagement: {
                type: 'integer',
                example: 20
              }
            }
          }
        }
      },
      Error: {
        type: 'object',
        required: ['error', 'message'],
        properties: {
          error: {
            type: 'string',
            description: 'Error type',
            example: 'ValidationError'
          },
          message: {
            type: 'string',
            description: 'Error message',
            example: 'The provided data is invalid'
          },
          code: {
            type: 'integer',
            description: 'Error code',
            example: 400
          },
          details: {
            type: 'object',
            description: 'Additional error details',
            additionalProperties: true
          }
        }
      },
      HealthCheck: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['healthy', 'unhealthy', 'degraded'],
            description: 'Overall service status',
            example: 'healthy'
          },
          database: {
            type: 'string',
            enum: ['healthy', 'unhealthy', 'unknown'],
            description: 'Database connection status',
            example: 'healthy'
          },
          ai_service: {
            type: 'string',
            enum: ['healthy', 'unhealthy', 'unknown'],
            description: 'AI service status',
            example: 'healthy'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Health check timestamp',
            example: '2024-01-15T10:30:00Z'
          },
          uptime: {
            type: 'number',
            description: 'Service uptime in seconds',
            example: 3600
          },
          version: {
            type: 'string',
            description: 'Service version',
            example: '1.0.0'
          }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'AuthenticationError',
              message: 'Authentication required. Please provide a valid token.',
              code: 401
            }
          }
        }
      },
      ForbiddenError: {
        description: 'Access denied',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'PermissionError',
              message: 'You do not have permission to perform this action.',
              code: 403
            }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'NotFoundError',
              message: 'The requested resource was not found.',
              code: 404
            }
          }
        }
      },
      ValidationError: {
        description: 'Invalid request data',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'ValidationError',
              message: 'Invalid request data',
              code: 400,
              details: {
                field: 'email',
                message: 'Valid email address is required'
              }
            }
          }
        }
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'RateLimitError',
              message: 'Rate limit exceeded. Please try again later.',
              code: 429
            }
          }
        }
      },
      ServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'InternalServerError',
              message: 'An unexpected error occurred. Please try again later.',
              code: 500
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Health',
      description: 'Service health and monitoring endpoints'
    },
    {
      name: 'Authentication',
      description: 'User authentication and authorization'
    },
    {
      name: 'Users',
      description: 'User management operations'
    },
    {
      name: 'Issues',
      description: 'Civic issue reporting and management'
    },
    {
      name: 'Rewards',
      description: 'Community engagement rewards system'
    },
    {
      name: 'AI',
      description: 'AI-powered features and analysis'
    }
  ]
};

// Swagger options
const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/*.js',
    './src/models/*.js',
    './src/controllers/*.js'
  ]
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Swagger UI configuration
const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 50px 0 }
    .swagger-ui .info .title { color: #2c3e50 }
    .swagger-ui .scheme-container { background: #f8f9fa; padding: 15px; margin: 20px 0; }
  `,
  customSiteTitle: 'Nivaran API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    requestInterceptor: (req) => {
      // Add custom headers or modify requests
      if (process.env.NODE_ENV === 'development') {
        console.log('API Request:', req.url);
      }
      return req;
    }
  }
};

module.exports = {
  swaggerSpec,
  swaggerUi,
  swaggerUiOptions
};