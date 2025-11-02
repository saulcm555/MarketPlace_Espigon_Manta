import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Función para cargar archivos YAML
const loadYamlFiles = (dir: string): any => {
  const files = fs.readdirSync(dir);
  const schemas: any = {};
  
  files.forEach(file => {
    if (file.endsWith('.yaml') || file.endsWith('.yml')) {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = yaml.load(content);
      Object.assign(schemas, parsed);
    }
  });
  
  return schemas;
};

// Cargar definiciones y paths desde archivos YAML
const swaggerDir = path.join(__dirname, '../../../swagger');
const definitions = loadYamlFiles(path.join(swaggerDir, 'definitions'));
const paths = loadYamlFiles(path.join(swaggerDir, 'paths'));

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MarketPlace Espigón Manta API',
      version: '1.0.0',
      description: 'API REST para el sistema de MarketPlace con Clean Architecture y tablas transaccionales',
      contact: {
        name: 'API Support',
        email: 'support@marketplace.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingrese el token JWT'
        }
      },
      schemas: {
        // Schemas cargados desde archivos YAML
        ...definitions,
        
        // Auth Schemas (mantenemos los existentes mientras se migran todos)
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'password123'
            }
          }
        },
        
        LoginResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string'
            },
            token: {
              type: 'string',
              description: 'Token JWT'
            },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' }
              }
            }
          }
        },
        
        // Cart Schemas
        Cart: {
          type: 'object',
          properties: {
            id_cart: { type: 'integer' },
            id_client: { type: 'integer' },
            cart_status: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        
        AddProductToCartRequest: {
          type: 'object',
          required: ['id_cart', 'id_product', 'quantity'],
          properties: {
            id_cart: {
              type: 'integer',
              example: 1,
              description: 'ID del carrito'
            },
            id_product: {
              type: 'integer',
              example: 1,
              description: 'ID del producto'
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              example: 2,
              description: 'Cantidad del producto'
            }
          }
        },
        
        UpdateCartItemRequest: {
          type: 'object',
          required: ['quantity'],
          properties: {
            quantity: {
              type: 'integer',
              minimum: 1,
              example: 3
            }
          }
        },
        
        // Product Schemas
        Product: {
          type: 'object',
          properties: {
            id_product: { type: 'integer' },
            product_name: { type: 'string' },
            product_description: { type: 'string' },
            product_price: { type: 'number' },
            product_image: { type: 'string' },
            id_category: { type: 'integer' },
            id_sub_category: { type: 'integer' },
            id_seller: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        
        CreateProductRequest: {
          type: 'object',
          required: ['product_name', 'product_price', 'id_category', 'id_seller'],
          properties: {
            product_name: { type: 'string', example: 'Laptop Dell' },
            product_description: { type: 'string', example: 'Laptop Dell XPS 15' },
            product_price: { type: 'number', example: 1299.99 },
            product_image: { type: 'string', example: 'http://example.com/image.jpg' },
            id_category: { type: 'integer', example: 1 },
            id_sub_category: { type: 'integer', example: 1 },
            id_seller: { type: 'integer', example: 1 }
          }
        },
        
        // Order Schemas
        Order: {
          type: 'object',
          properties: {
            id_order: { type: 'integer' },
            id_client: { type: 'integer' },
            id_payment_method: { type: 'integer' },
            id_delivery: { type: 'integer' },
            order_status: { type: 'string' },
            order_notes: { type: 'string' },
            total_amount: { type: 'number' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        
        CreateOrderRequest: {
          type: 'object',
          required: ['id_client', 'id_cart', 'id_payment_method', 'id_delivery'],
          properties: {
            id_client: { type: 'integer', example: 1 },
            id_cart: { 
              type: 'integer', 
              example: 1,
              description: 'Carrito desde el cual crear ProductOrder (tabla transaccional)'
            },
            id_payment_method: { type: 'integer', example: 1 },
            id_delivery: { type: 'integer', example: 1 },
            order_notes: { type: 'string', example: 'Entregar en horario de oficina' }
          }
        },
        
        UpdateOrderStatusRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
              example: 'processing'
            }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Endpoints de autenticación' },
      { name: 'Carts', description: 'Gestión de carritos' },
      { name: 'Products', description: 'Gestión de productos' },
      { name: 'Orders', description: 'Gestión de órdenes' },
      { name: 'Clients', description: 'Gestión de clientes' },
      { name: 'Sellers', description: 'Gestión de vendedores' },
      { name: 'Admins', description: 'Gestión de administradores' },
      { name: 'Categories', description: 'Gestión de categorías' },
      { name: 'SubCategories', description: 'Gestión de subcategorías' },
      { name: 'Payment Methods', description: 'Métodos de pago' },
      { name: 'Deliveries', description: 'Métodos de entrega' },
      { name: 'Inventory', description: 'Gestión de inventario' }
    ],
    // Paths cargados desde archivos YAML
    paths: {
      ...paths
    }
  },
  apis: ['./src/infrastructure/http/controllers/*.ts', './src/infrastructure/http/routes/*.ts']
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'MarketPlace API Docs'
  }));

  // Ruta para obtener el JSON de Swagger
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 Swagger documentation available at http://localhost:3000/api-docs');
};
