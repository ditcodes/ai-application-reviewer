import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Applications table
export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  responses: jsonb("responses").notNull().$type<Record<string, string>>(),
  attachments: jsonb("attachments").$type<string[]>().default([]),
  status: text("status").notNull().default("pending"), // pending, under_review, reviewed, decided
  overallScore: real("overall_score"),
  classification: text("classification"), // trailblazer, rising_star, needs_development, not_selected
  decision: text("decision"), // accepted, rejected, waitlisted
  decisionMode: text("decision_mode"), // human_in_loop, autonomous
  justification: jsonb("justification").$type<JustificationReport | null>(),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

// Evaluation rules
export const evaluationRules = pgTable("evaluation_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fieldName: text("field_name").notNull(),
  description: text("description").notNull(),
  weight: text("weight").notNull().default("medium"), // low, medium, high, critical
  strictness: text("strictness").notNull().default("moderate"), // lenient, moderate, strict
  isActive: boolean("is_active").notNull().default(true),
});

// AI Reviewer Personas
export const personas = pgTable("personas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  archetype: text("archetype").notNull(), // conservative_investor, founder_friendly, operations_focused, impact_focused, custom
  description: text("description").notNull(),
  evaluationStyle: text("evaluation_style").notNull(),
  isPaid: boolean("is_paid").notNull().default(false),
});

// Reviews (per persona per application)
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull(),
  personaId: varchar("persona_id").notNull(),
  score: real("score").notNull(),
  reasoning: text("reasoning").notNull(),
  strengths: jsonb("strengths").notNull().$type<string[]>(),
  weaknesses: jsonb("weaknesses").notNull().$type<string[]>(),
  ruleInfluences: jsonb("rule_influences").notNull().$type<RuleInfluence[]>(),
  confidence: real("confidence").notNull(),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

// Context settings (diversity toggles)
export const contextSettings = pgTable("context_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  enabled: boolean("enabled").notNull().default(false),
  weight: text("weight").notNull().default("low"), // low, medium, high
});

// Plan settings
export const planSettings = pgTable("plan_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plan: text("plan").notNull().default("free"), // free, paid
  reviewMode: text("review_mode").notNull().default("human_in_loop"), // human_in_loop, autonomous
});

// Types
export interface JustificationReport {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  ruleInfluences: RuleInfluence[];
  personaFeedback: PersonaFeedback[];
  confidence: number;
  recommendation: string;
}

export interface RuleInfluence {
  ruleId: string;
  ruleName: string;
  impact: "positive" | "negative" | "neutral";
  explanation: string;
}

export interface PersonaFeedback {
  personaId: string;
  personaName: string;
  score: number;
  summary: string;
}

// Insert schemas
export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  createdAt: true,
  overallScore: true,
  classification: true,
  decision: true,
  decisionMode: true,
  justification: true,
});

export const insertEvaluationRuleSchema = createInsertSchema(evaluationRules).omit({
  id: true,
});

export const insertPersonaSchema = createInsertSchema(personas).omit({
  id: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertContextSettingSchema = createInsertSchema(contextSettings).omit({
  id: true,
});

// Inferred types
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type EvaluationRule = typeof evaluationRules.$inferSelect;
export type InsertEvaluationRule = z.infer<typeof insertEvaluationRuleSchema>;
export type Persona = typeof personas.$inferSelect;
export type InsertPersona = z.infer<typeof insertPersonaSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type ContextSetting = typeof contextSettings.$inferSelect;
export type InsertContextSetting = z.infer<typeof insertContextSettingSchema>;
export type PlanSetting = typeof planSettings.$inferSelect;
