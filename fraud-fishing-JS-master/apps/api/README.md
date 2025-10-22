# API de Gestión de Usuarios (NestJS)

Este proyecto es una API RESTful construida con NestJS para la gestión de usuarios, incluyendo funcionalidades de autenticación, administración de usuarios y perfiles de usuario. Utiliza una base de datos relacional y autenticación JWT.

## Estructura del Proyecto

La API está organizada en módulos, cada uno con sus controladores, servicios y repositorios correspondientes.

-   **`src/admin`**: Módulo para la gestión de usuarios por parte de administradores.
-   **`src/auth`**: Módulo para la autenticación de usuarios (login, refresco de tokens).
-   **`src/common`**: Módulo para utilidades comunes como guardias de autenticación e interfaces.
-   **`src/db`**: Módulo para la conexión y gestión de la base de datos.
-   **`src/users`**: Módulo principal para la lógica de negocio de usuarios.
-   **`src/util`**: Utilidades varias, como funciones de hashing.

## Configuración y Ejecución

### Requisitos

-   Node.js (versión recomendada: 18 o superior)
-   npm o yarn
-   Una base de datos (por ejemplo, SQLite, PostgreSQL). Asegúrate de que tu archivo `schema.sql` y `seed.sql` estén configurados correctamente para tu base de datos.

### Instalación

1.  Clona el repositorio:
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd fraud-fishing-JS/apps/api
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    # o
    yarn install
    ```

### Ejecución

1.  **Iniciar la base de datos (si aplica)**
3.  **Iniciar la aplicación NestJS**:
    ```bash
    npm run start:dev
    # o
    yarn start:dev
    ```
    La API estará disponible en `http://localhost:3000`

## Documentación de la API (Swagger)

La API está documentada utilizando Swagger UI. Una vez que la aplicación esté corriendo, puedes acceder a la documentación interactiva en:

`http://localhost:3000/docs`

Aquí podrás probar los endpoints directamente desde el navegador.

## Endpoints de la API

### Módulo de Administración (`/admin/user`)

Estos endpoints están diseñados para ser utilizados por usuarios con roles de administrador y requieren autenticación (JWT Bearer Token).

#### `GET /admin/user/list`

-   **Descripción**: Obtiene una lista de todos los usuarios registrados en el sistema.
-   **Autenticación**: Requiere un token JWT válido en el encabezado `Authorization` (Bearer Token).
-   **Respuestas**:
    -   `200 OK`: Lista de objetos `UserDto` (email, name).
    -   `401 Unauthorized`: Si no se proporciona un token o es inválido.
    -   `403 Forbidden`: Si el usuario no tiene permisos de administrador.

#### `GET /admin/user/:id`

-   **Descripción**: Obtiene los detalles de un usuario específico por su ID.
-   **Parámetros de Ruta**:
    -   `:id` (number): El ID del usuario a buscar.
-   **Autenticación**: Requiere un token JWT válido en el encabezado `Authorization` (Bearer Token).
-   **Respuestas**:
    -   `200 OK`: Objeto `UserDto` (email, name) del usuario encontrado.
    -   `404 Not Found`: Si el usuario con el ID proporcionado no existe.
    -   `401 Unauthorized`: Si no se proporciona un token o es inválido.
    -   `403 Forbidden`: Si el usuario no tiene permisos de administrador.

#### `PUT /admin/user/:id`

-   **Descripción**: Actualiza la información de un usuario específico por su ID.
-   **Parámetros de Ruta**:
    -   `:id` (number): El ID del usuario a actualizar.
-   **Cuerpo de la Solicitud (`UpdateUserDto`)**:
    -   `name` (string, opcional): Nuevo nombre del usuario.
    -   `password` (string): Nueva contraseña del usuario.
-   **Autenticación**: Requiere un token JWT válido en el encabezado `Authorization` (Bearer Token).
-   **Respuestas**:
    -   `200 OK`: Objeto `UserDto` (email, name) del usuario actualizado.
    -   `404 Not Found`: Si el usuario con el ID proporcionado no existe.
    -   `401 Unauthorized`: Si no se proporciona un token o es inválido.
    -   `403 Forbidden`: Si el usuario no tiene permisos de administrador.

### Módulo de Usuarios (`/users`)

Estos endpoints permiten a los usuarios registrarse y gestionar su propio perfil.

#### `POST /users`

-   **Descripción**: Registra un nuevo usuario en el sistema.
-   **Cuerpo de la Solicitud (`CreateUserDto`)**:
    -   `email` (string): Correo electrónico del nuevo usuario (debe ser único).
    -   `name` (string, opcional): Nombre del nuevo usuario.
    -   `password` (string): Contraseña del nuevo usuario.
-   **Respuestas**:
    -   `201 Created`: Objeto `UserDto` (email, name) del usuario creado.
    -   `500 Internal Server Error`: Si ocurre un error durante el registro (ej. email ya existe).

#### `PUT /users/me`

-   **Descripción**: Actualiza la información del usuario actualmente autenticado.
-   **Autenticación**: Requiere un token JWT válido en el encabezado `Authorization` (Bearer Token).
-   **Cuerpo de la Solicitud (`UpdateUserDto`)**:
    -   `name` (string, opcional): Nuevo nombre del usuario.
    -   `password` (string): Nueva contraseña del usuario.
-   **Respuestas**:
    -   `200 OK`: Objeto `UserDto` (email, name) del usuario actualizado.
    -   `404 Not Found`: Si el usuario autenticado no se encuentra (situación inusual si el token es válido).
    -   `401 Unauthorized`: Si no se proporciona un token o es inválido.
    -   `500 Internal Server Error`: Si ocurre un error durante la actualización.

### Módulo de Autenticación (`/auth`)

Estos endpoints gestionan el proceso de inicio de sesión y la gestión de tokens.

#### `POST /auth/login`

-   **Descripción**: Permite a un usuario iniciar sesión y obtener tokens de acceso y refresco.
-   **Cuerpo de la Solicitud (`LoginDto`)**:
    -   `email` (string): Correo electrónico del usuario.
    -   `password` (string): Contraseña del usuario.
-   **Respuestas**:
    -   `200 OK`: Objeto que contiene `accessToken` (string) y `refreshToken` (string).
    -   `401 Unauthorized`: Si las credenciales son incorrectas.
    -   `500 Internal Server Error`: Si ocurre un error inesperado.

#### `GET /auth/profile`

-   **Descripción**: Obtiene el perfil del usuario actualmente autenticado.
-   **Autenticación**: Requiere un token JWT válido en el encabezado `Authorization` (Bearer Token).
-   **Respuestas**:
    -   `200 OK`: Objeto que contiene el `profile` del usuario (id, email, name).
    -   `401 Unauthorized`: Si no se proporciona un token o es inválido.

#### `POST /auth/refresh`

-   **Descripción**: Refresca el token de acceso utilizando un token de refresco válido.
-   **Cuerpo de la Solicitud (`RefreshDto`)**:
    -   `refreshToken` (string): El token de refresco obtenido durante el login.
-   **Respuestas**:
    -   `200 OK`: Objeto que contiene un nuevo `accessToken` (string).
    -   `401 Unauthorized`: Si el token de refresco es inválido o ha expirado.
    -   `500 Internal Server Error`: Si ocurre un error inesperado.