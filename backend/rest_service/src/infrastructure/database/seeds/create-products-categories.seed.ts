/**
 * Seed para crear categorías y productos de prueba
 * 
 * Este script puebla la base de datos con datos iniciales para el marketplace
 * 
 * Ejecutar con: npx ts-node src/infrastructure/database/seeds/create-products-categories.seed.ts
 * 
 * @author Marketplace Team
 * @version 1.0.0
 */

import "reflect-metadata";
import AppDataSource from "../data-source";
import { CategoryEntity } from "../../../models/categoryModel";
import { SubCategoryEntity } from "../../../models/subCategoryModel";
import { ProductEntity } from "../../../models/productModel";
import { SellerEntity } from "../../../models/sellerModel";
import { InventoryEntity } from "../../../models/inventoryModel";

/**
 * Categorías del Parque El Espigón
 */
const CATEGORIES = [
  {
    category_name: "Alimentos y Bebidas",
    description: "Productos frescos, comidas preparadas y bebidas",
    photo: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400"
  },
  {
    category_name: "Artesanías",
    description: "Productos artesanales hechos a mano",
    photo: "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=400"
  },
  {
    category_name: "Ropa y Accesorios",
    description: "Prendas de vestir y accesorios de moda",
    photo: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400"
  },
  {
    category_name: "Joyas y Bisutería",
    description: "Joyas, anillos, collares y pulseras",
    photo: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400"
  },
  {
    category_name: "Decoración",
    description: "Artículos decorativos para el hogar",
    photo: "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=400"
  },
  {
    category_name: "Electrónica",
    description: "Dispositivos electrónicos y accesorios",
    photo: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400"
  }
];

/**
 * Productos de ejemplo por categoría
 */
const PRODUCTS = [
  // Alimentos y Bebidas
  {
    product_name: "Ceviche de Camarón",
    description: "Delicioso ceviche fresco del día con camarones, limón y especias",
    price: 8.50,
    stock: 15,
    category: "Alimentos y Bebidas",
    image_url: "https://images.unsplash.com/photo-1579631342753-35d94dc0a2b1?w=500"
  },
  {
    product_name: "Corvina Frita",
    description: "Corvina fresca frita con patacones y ensalada",
    price: 12.00,
    stock: 10,
    category: "Alimentos y Bebidas",
    image_url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500"
  },
  {
    product_name: "Jugo Natural de Naranja",
    description: "Jugo de naranja fresco recién exprimido",
    price: 2.50,
    stock: 30,
    category: "Alimentos y Bebidas",
    image_url: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500"
  },
  {
    product_name: "Empanadas de Queso",
    description: "Empanadas caseras rellenas de queso (paquete de 3)",
    price: 3.00,
    stock: 25,
    category: "Alimentos y Bebidas",
    image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500"
  },

  // Artesanías
  {
    product_name: "Sombrero de Paja Toquilla",
    description: "Sombrero artesanal ecuatoriano de paja toquilla",
    price: 45.00,
    stock: 8,
    category: "Artesanías",
    image_url: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500"
  },
  {
    product_name: "Bolso Artesanal",
    description: "Bolso tejido a mano con fibras naturales",
    price: 25.00,
    stock: 12,
    category: "Artesanías",
    image_url: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500"
  },
  {
    product_name: "Figura de Cerámica",
    description: "Figura decorativa de cerámica pintada a mano",
    price: 18.00,
    stock: 15,
    category: "Artesanías",
    image_url: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500"
  },

  // Ropa y Accesorios
  {
    product_name: "Camiseta Ecuador",
    description: "Camiseta de algodón con diseño ecuatoriano",
    price: 15.00,
    stock: 20,
    category: "Ropa y Accesorios",
    image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500"
  },
  {
    product_name: "Gorra Deportiva",
    description: "Gorra ajustable de algodón",
    price: 8.00,
    stock: 30,
    category: "Ropa y Accesorios",
    image_url: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500"
  },
  {
    product_name: "Bufanda de Lana",
    description: "Bufanda tejida a mano de lana de alpaca",
    price: 22.00,
    stock: 10,
    category: "Ropa y Accesorios",
    image_url: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=500"
  },

  // Joyas y Bisutería
  {
    product_name: "Collar de Plata",
    description: "Collar de plata 925 con diseño andino",
    price: 35.00,
    stock: 6,
    category: "Joyas y Bisutería",
    image_url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500"
  },
  {
    product_name: "Aretes de Tagua",
    description: "Aretes hechos con semillas de tagua pintadas",
    price: 12.00,
    stock: 18,
    category: "Joyas y Bisutería",
    image_url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500"
  },
  {
    product_name: "Pulsera de Macramé",
    description: "Pulsera tejida en macramé con cuentas",
    price: 8.00,
    stock: 25,
    category: "Joyas y Bisutería",
    image_url: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500"
  },

  // Decoración
  {
    product_name: "Cuadro Decorativo",
    description: "Cuadro pintado a mano con paisaje costero",
    price: 40.00,
    stock: 5,
    category: "Decoración",
    image_url: "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=500"
  },
  {
    product_name: "Maceta de Cerámica",
    description: "Maceta decorativa de cerámica pintada",
    price: 15.00,
    stock: 12,
    category: "Decoración",
    image_url: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500"
  },

  // Electrónica
  {
    product_name: "Auriculares Bluetooth",
    description: "Auriculares inalámbricos con cancelación de ruido",
    price: 45.00,
    stock: 15,
    category: "Electrónica",
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
  },
  {
    product_name: "Cargador Portátil",
    description: "Power bank de 10000mAh con carga rápida",
    price: 25.00,
    stock: 20,
    category: "Electrónica",
    image_url: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500"
  }
];

/**
 * Función principal del seed
 */
async function seedData() {
  console.log("🌱 Iniciando seed de productos y categorías...\n");

  try {
    // 1. Inicializar conexión
    console.log("📡 Conectando a la base de datos...");
    await AppDataSource.initialize();
    console.log("✅ Conexión establecida\n");

    // 2. Obtener repositorios
    const categoryRepo = AppDataSource.getRepository(CategoryEntity);
    const productRepo = AppDataSource.getRepository(ProductEntity);
    const sellerRepo = AppDataSource.getRepository(SellerEntity);
    const inventoryRepo = AppDataSource.getRepository(InventoryEntity);

    // 3. Verificar si ya existen datos
    const existingCategories = await categoryRepo.count();
    if (existingCategories > 2) {
      console.log("⚠️  Ya existen categorías en la base de datos.");
      console.log("   Si deseas recrear los datos, elimina las categorías existentes primero.\n");
      
      const response = await new Promise<string>((resolve) => {
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        readline.question("¿Deseas continuar de todas formas? (s/n): ", (answer: string) => {
          readline.close();
          resolve(answer.toLowerCase());
        });
      });

      if (response !== 's' && response !== 'si' && response !== 'y' && response !== 'yes') {
        console.log("❌ Operación cancelada.");
        await AppDataSource.destroy();
        return;
      }
    }

    // 4. Buscar un vendedor existente o crear uno de prueba
    let seller = await sellerRepo.findOne({ where: {} });
    
    if (!seller) {
      console.log("📝 Creando vendedor de prueba...");
      seller = sellerRepo.create({
        seller_name: "Vendedor Demo",
        seller_email: "vendedor@demo.com",
        seller_password: "demo123", // En producción esto debería estar hasheado
        phone: 999999999,
        bussines_name: "Negocio Demo",
        location: "Parque El Espigón, Manta"
      });
      seller = await sellerRepo.save(seller);
      console.log("✅ Vendedor creado\n");
    }

    // 5. Crear categorías
    console.log("📁 Creando categorías...");
    const createdCategories: { [key: string]: CategoryEntity } = {};
    
    for (const catData of CATEGORIES) {
      const existing = await categoryRepo.findOne({
        where: { category_name: catData.category_name }
      });

      if (!existing) {
        const category = categoryRepo.create(catData);
        const saved = await categoryRepo.save(category);
        createdCategories[catData.category_name] = saved;
        console.log(`  ✓ ${catData.category_name}`);
      } else {
        createdCategories[catData.category_name] = existing;
        console.log(`  ⊙ ${catData.category_name} (ya existía)`);
      }
    }
    console.log("");

    // 6. Crear productos
    console.log("📦 Creando productos...");
    let createdCount = 0;
    
    for (const prodData of PRODUCTS) {
      const category = createdCategories[prodData.category];
      if (!category) continue;

      // Verificar si ya existe el producto
      const existing = await productRepo.findOne({
        where: { product_name: prodData.product_name }
      });

      if (!existing) {
        // Crear inventario
        const inventory = inventoryRepo.create({
          id_seller: seller.id_seller
        });
        const savedInventory = await inventoryRepo.save(inventory);

        // Crear producto
        const product = productRepo.create({
          product_name: prodData.product_name,
          description: prodData.description,
          price: prodData.price,
          stock: prodData.stock,
          image_url: prodData.image_url,
          id_seller: seller.id_seller,
          id_category: category.id_category,
          id_inventory: savedInventory.id_inventory,
          id_sub_category: 1 // Por ahora usamos 1 por defecto
        });

        await productRepo.save(product);
        console.log(`  ✓ ${prodData.product_name} - $${prodData.price}`);
        createdCount++;
      } else {
        console.log(`  ⊙ ${prodData.product_name} (ya existía)`);
      }
    }

    console.log(`\n✅ Seed completado exitosamente!`);
    console.log(`   Categorías: ${Object.keys(createdCategories).length}`);
    console.log(`   Productos nuevos: ${createdCount}`);
    console.log(`   Total de productos: ${await productRepo.count()}\n`);

  } catch (error) {
    console.error("❌ Error durante el seed:", error);
  } finally {
    await AppDataSource.destroy();
    console.log("🔌 Conexión cerrada");
  }
}

// Ejecutar el seed
seedData();
