export type Role = "user" | "admin" | "super_admin";

export interface CustomClaims {
  role: Role;
}
