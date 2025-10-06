import "reflect-metadata";
import AppDataSource from "./data-source";

// Entities
import { AdminEntity } from "./models/adminModel";
import { CategoryEntity } from "./models/categoryModel";
import { SubCategoryEntity } from "./models/subCategoryModel";
import { SellerEntity } from "./models/sellerModel";
import { InventoryEntity } from "./models/inventoryModel";
import { ProductEntity } from "./models/productModel";

async function seed() {
  const adminRepo = AppDataSource.getRepository(AdminEntity);
  const categoryRepo = AppDataSource.getRepository(CategoryEntity);
  const subCategoryRepo = AppDataSource.getRepository(SubCategoryEntity);
  const sellerRepo = AppDataSource.getRepository(SellerEntity);
  const inventoryRepo = AppDataSource.getRepository(InventoryEntity);
  const productRepo = AppDataSource.getRepository(ProductEntity);

  console.log("Iniciando seeding mínimo...");

  // Admin
  const adminEmail = "juan.perez@email.com";
  let admin = await adminRepo.findOne({ where: { admin_email: adminEmail } });
  if (!admin) {
    admin = adminRepo.create({
      admin_name: "Juan Pérez",
      admin_email: adminEmail,
      admin_password: "123456",
      role: "superadmin",
    });
    admin = await adminRepo.save(admin);
    console.log("✔ Admin creado");
  } else {
    console.log("↪ Admin ya existía");
  }

  // Category
  const categoryName = "Electrónica";
  let category = await categoryRepo.findOne({ where: { category_name: categoryName } });
  if (!category) {
    category = categoryRepo.create({
      category_name: categoryName,
      description: "Productos electrónicos",
      // photo es nullable; omitimos para evitar validaciones de URL
    });
    category = await categoryRepo.save(category);
    console.log("✔ Category creada");
  } else {
    console.log("↪ Category ya existía");
  }

  // SubCategory
  const subCategoryName = "Laptops";
  let subCategory = await subCategoryRepo.findOne({
    where: { sub_category_name: subCategoryName, id_category: category.id_category },
  });
  if (!subCategory) {
    subCategory = subCategoryRepo.create({
      id_category: category.id_category,
      sub_category_name: subCategoryName,
      description: "Computadoras portátiles",
    });
    subCategory = await subCategoryRepo.save(subCategory);
    console.log("✔ SubCategory creada");
  } else {
    console.log("↪ SubCategory ya existía");
  }

  // Seller
  const sellerEmail = "ventas@techmanta.com";
  let seller = await sellerRepo.findOne({ where: { seller_email: sellerEmail } });
  if (!seller) {
    seller = sellerRepo.create({
      seller_name: "Tech Manta",
      seller_email: sellerEmail,
      seller_password: "123456",
      phone: 593987654321,
      bussines_name: "Tech Manta S.A.",
      location: "Manta, Ecuador",
    });
    seller = await sellerRepo.save(seller);
    console.log("✔ Seller creado");
  } else {
    console.log("↪ Seller ya existía");
  }

  // Inventory
  let inventory = await inventoryRepo.findOne({ where: { id_seller: seller.id_seller } });
  if (!inventory) {
    inventory = inventoryRepo.create({
      id_seller: seller.id_seller,
    });
    inventory = await inventoryRepo.save(inventory);
    console.log("✔ Inventory creado");
  } else {
    console.log("↪ Inventory ya existía");
  }

  // Product
  const productName = "Laptop HP";
  let product = await productRepo.findOne({
    where: { product_name: productName, id_seller: seller.id_seller },
  });
  if (!product) {
    product = productRepo.create({
      id_seller: seller.id_seller,
      id_inventory: inventory.id_inventory,
      id_category: category.id_category,
      id_sub_category: subCategory.id_sub_category,
      product_name: productName,
      description: "Laptop HP 15 pulgadas",
      price: 1200,
      stock: 10,
      image_url: "https://example.com/laptop-hp.jpg",
    });
    product = await productRepo.save(product);
    console.log("✔ Product creado");
  } else {
    console.log("↪ Product ya existía");
  }

  console.log("Seeding finalizado ✨");
}

AppDataSource.initialize()
  .then(async () => {
    await seed();
  })
  .catch((err) => {
    console.error("Error inicializando la base de datos:", err);
  });