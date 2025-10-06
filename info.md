# 🧩 Taller TypeORM (Puro) — Guía del proyecto y entregables

Este documento resume lo necesario para completar la actividad usando Node.js + TypeScript + TypeORM (sin NestJS), eliminando lo redundante y adaptándolo al estado actual del repositorio.

---

## 👥 Modalidad de trabajo y distribución del dominio

- Grupo de 3 personas. Cada integrante modela y programa las entidades que le corresponden.
- Enfoques sugeridos:
  - Integrante 1: Entidades maestras (catálogos/configuración) → Datos estáticos y conexión.
  - Integrante 2: Entidades de negocio principal (clientes, productos) → Reglas y relaciones clave.
  - Integrante 3: Entidades transaccionales (ventas/órdenes, compras) → Datos dinámicos y múltiples relaciones.

---

## ⚙️ Alcance técnico (TypeORM puro)

- Capas a implementar: Entidades (decoradas) y Servicios/Repositorios que usan el DataSource de TypeORM.
- No se implementan controladores ni módulos de NestJS.

---

## 🚧 Estado actual del repo y adaptación

- Punto de entrada: `src/app.ts` (scripts: `npm run dev` y `npm start`).
- Entidades actuales: interfaces en `src/domain/entities/` (no están decoradas con TypeORM).
- Repositorios actuales: implementaciones en memoria en `src/infraestructure/`.

Para cumplir la actividad con TypeORM (Opción B — separación limpia):
- Mantener interfaces de dominio en `src/domain/entities` (p. ej., `IProduct`).
- Crear clases ORM decoradas en `src/models` (p. ej., `ProductEntity` con `@Entity`).
- Crear `src/data-source.ts` con el `DataSource` de TypeORM apuntando a `src/models`.
- Actualizar servicios para usar `AppDataSource.getRepository(ClaseEntity)` y mapear entre Entity ⇄ Interface cuando aplique.
- Mantener el punto de entrada en `src/app.ts` (o renombrar a `src/main.ts` si el equipo lo prefiere y actualiza scripts).

---

## 1) Configuración del proyecto y conexión

Instala dependencias clave (ejemplo con SQLite):

```powershell
npm i typeorm reflect-metadata sqlite3
```

Crea `src/data-source.ts` con la configuración básica (ej. SQLite durante desarrollo), importando clases desde `src/models`:

```ts
// src/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ProductEntity } from './models/ProductEntity';
// importa aquí TODAS las clases entity decoradas de src/models

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'db.sqlite',
  synchronize: true, // solo desarrollo
  logging: false,
  entities: [ProductEntity /*, CategoryEntity, ClientEntity, ...*/],
});
```

En `src/app.ts` inicializa la conexión antes de usar servicios:

```ts
import { AppDataSource } from './data-source';

await AppDataSource.initialize();
// …luego usa los servicios
```

---

## 2) Desarrollo del modelo de dominio (Entidades y Models)

Opción B (recomendada en este proyecto):
- Mantener las interfaces en `src/domain/entities` (solo tipos, sin decoradores).
- Crear las clases TypeORM en `src/models` (con decoradores y nombres como `XxxEntity`).

Requisitos mínimos por clase ORM:
- `@Entity()`, `@PrimaryGeneratedColumn()`.
- Al menos 4 columnas con `@Column()` (tipos adecuados).
- Relaciones según corresponda (`@OneToMany`, `@ManyToOne`, `@ManyToMany`, etc.).

Ejemplo mínimo de clase ORM:

```ts
// src/models/ProductEntity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'products' })
export class ProductEntity {
  @PrimaryGeneratedColumn()
  id_product!: number;

  @Column()
  product_name!: string;

  @Column('real')
  price!: number;

  @Column('int')
  stock!: number;
}
```

---

## 3) Lógica de persistencia (Servicios/Repositorios)

- Crear clases de servicio en `src/applications/<entidad>/<Entidad>Service.ts`.
- Obtener repositorio desde el `DataSource` inicializado usando la clase ORM de `src/models`:

```ts
import { AppDataSource } from '../../data-source';
import { ProductEntity } from '../../models/ProductEntity';

const repo = AppDataSource.getRepository(ProductEntity);
```

- Implementar los 5 métodos CRUD obligatorios por entidad:
  - `create(data)`
  - `findAll()`
  - `findOne(id)`
  - `update(id, data)`
  - `remove(id)`
  - (Opcional recomendado) Mapear Entity ⇄ Interface para desacoplar dominio del ORM.

---

## 4) Prueba funcional y seeding

- Usar `src/app.ts` como script ejecutable de pruebas (o `src/main.ts` si el equipo lo decide).
- Inicializar `AppDataSource` y luego ejecutar seeds significativos: primero catálogos, luego negocio, luego transaccional.
- Probar `findAll`, `findOne`, `update`, `remove` y verificar relaciones.

Ejemplo de flujo (esquemático):

```ts
await categoryService.create({ name: 'Electrónicos' });
await productService.create({ name: 'Laptop', price: 800, stock: 5 });
await orderService.create({ /* datos que referencian client/product */ });
```

Ejecución (desarrollo y producción):

```powershell
# desarrollo (recarga):
npm run dev

# build + run:
npm start
```

---

## 5) Generación del DER

- Generar la visualización del esquema a partir de las entidades (TypeORM CLI, o herramientas como Draw.io/Lucidchart replicando fielmente el modelo).
- El DER debe coincidir con nombres, cardinalidades y relaciones del código.

---

## 📦 Entregables

1) Repositorio individual con:
- Código completo en TypeScript: entidades decoradas + servicios CRUD que usan TypeORM.
- Commits identificables de cada integrante.

2) README.md con:
- Descripción de entidades y relaciones.
- Instrucciones de instalación y ejecución del seeding desde `src/app.ts` (o `main.ts`).

3) DER:
- Imagen/captura del esquema generado a partir del modelo.

4) Demostración:
- Ejecución en clase del seeding y de las operaciones CRUD (no se requieren capturas de consola).

---

## ✅ Checklist de validación

- [ ] DataSource configurado e inicializado.
- [ ] Entidades con mínimo 4 columnas y relaciones correctas.
- [ ] Servicios con CRUD completo por entidad.
- [ ] Seeding coherente que demuestre relaciones y reglas de negocio.
- [ ] DER fiel al modelo implementado.

---

## 📝 Notas de adaptación al proyecto actual

- Actualmente hay repositorios en memoria; migrarlos a repositorios de TypeORM (usando `getRepository` sobre clases de `src/models`).
- Mantener interfaces de dominio en `src/domain/entities` (p. ej., `IProduct`) y crear clases ORM en `src/models` (p. ej., `ProductEntity`).
- Crear mappers sencillos cuando el servicio exponga/consuma interfaces del dominio.
- El punto de entrada es `src/app.ts` (ya referenciado en scripts); puedes mantenerlo o renombrarlo a `src/main.ts` si actualizas los scripts.

✨ Objetivo final: un proyecto funcional con entidades conectadas vía TypeORM, CRUD operativo y DER consistente con el modelo.
