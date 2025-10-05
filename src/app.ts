import { AdminRepositoryImpl } from "./infraestructure/AdminRepositoryImpl";
import { AdminService } from "./applications/admin/AdminService";
import { Admin } from "./domain/entities/admin";

import { ProductRepositoryImpl } from "./infraestructure/ProductRepositoryImpl";
import { ProductService } from "./applications/product/ProductService";
import { Product } from "./domain/entities/product";

(() => {
  // 1️⃣ Inicializar repositorios
  const adminRepo = new AdminRepositoryImpl();
  const productRepo = new ProductRepositoryImpl();

  // 2️⃣ Inicializar servicios
  const adminService = new AdminService(adminRepo);
  const productService = new ProductService(productRepo);

  // 3️⃣ Crear Admin
  const adminData: Omit<Admin, "id_admin" | "created_at"> = {
    admin_name: "Juan Pérez",
    admin_email: "juan.perez@email.com",
    admin_password: "123456",
    role: "superadmin"
    // created_at lo pone el repositorio
  };

  adminService.createAdmin(adminData as Admin, (err, admin) => {
    if (err) {
      console.error("Error en callback:", err);
    } else {
      console.log("Admin creado:", admin);

      // 4️⃣ Crear Producto (puedes dejar esto aquí si quieres que se cree después del admin)
      const productData: Omit<Product, "id_product" | "created_at" | "inventory" | "seller" | "category" | "subcategory"> = {
        id_seller: 1,
        id_inventory: 1,
        id_category: 1,
        id_sub_category: 1,
        product_name: "Laptop HP",
        description: "Laptop HP 15 pulgadas",
        price: 1200,
        stock: 10,
        image_url: "https://example.com/laptop-hp.jpg"
      };
      productService.createProduct(productData as Product, (err, product) => {
        if (err) {
          console.error("Error al crear producto:", err);
        } else {
          console.log("Producto creado:", product);

          // 5️⃣ Listar productos
          productService.getAllProducts().then(products => {
            console.log("Productos existentes:", products);

            // 6️⃣ Listar admins
            adminService.getAllAdmins().then(admins => {
              console.log("Admins existentes:", admins);
            });
          });
        }
      });
    }
  });
})();