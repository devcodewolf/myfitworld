/**
 * Las tablas de Better Auth.
 *
 * Nació generado por su CLI, pero **ya no se regenera a ciegas**: el CLI
 * público va por detrás de la librería y se ha dejado columnas fuera más de una
 * vez. La lista autorizada la da la propia librería, y hay que consultarla al
 * añadir un plugin:
 *
 *   node -e "import('better-auth/db').then(m => console.log(m.getAuthTables({})))"
 *
 * Son las cuatro tablas que Better Auth necesita:
 *   user          quién eres
 *   session       tus sesiones abiertas, con su cookie y su caducidad
 *   account       cómo entras: aquí vive el hash de la contraseña, y aquí
 *                 vivirían los tokens si algún día se añade entrar con Google
 *   verification  códigos y enlaces temporales: verificar correo, recuperar
 *                 contraseña, códigos de un solo uso
 *
 * Que el hash de la contraseña viva en `account` y no en `user` no es capricho:
 * permite que una misma persona entre por varios caminos —contraseña, Google,
 * código por correo— sin duplicar la cuenta.
 */
import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),

  // ── Del plugin `admin` de Better Auth ──────────────────────────────────
  /** `user` o `admin`. Vacío cuenta como `user`: el valor por defecto lo pone la librería. */
  role: text('role'),
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),

  // ── Nuestro ────────────────────────────────────────────────────────────
  /**
   * La papelera. Una cuenta con fecha aquí no puede entrar, pero **sigue
   * entera**: sus entrenos, sus ajustes y su perfil no se han tocado.
   *
   * Existe porque borrar una cuenta de verdad arrastra en cascada todo su
   * historial, y eso no se deshace. Con la papelera en medio, el borrado
   * irreversible es un segundo acto deliberado y no un clic de más.
   */
  deletedAt: timestamp('deleted_at'),
});

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    /**
     * Del plugin `admin`: quién está suplantando a quién.
     *
     * Cuando un admin entra como otra persona, la sesión es la de esa persona
     * y aquí queda su firma. Es lo que hace que suplantar deje rastro en vez
     * de ser indistinguible de un acceso normal.
     */
    impersonatedBy: text('impersonated_by'),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
);

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    // Añadido a mano: el CLI público va por detrás de better-auth 1.7.2 y no lo
    // emite. La lista autorizada la da la propia librería:
    //   node -e "console.log(require('better-auth/db').getAuthTables({}).account.fields)"
    issuer: text('issuer').notNull(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
);

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
