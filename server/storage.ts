import {
  type Application,
  type InsertApplication,
  type EvaluationRule,
  type InsertEvaluationRule,
  type Persona,
  type InsertPersona,
  type Review,
  type InsertReview,
  type ContextSetting,
  type InsertContextSetting,
  type PlanSetting,
  type JustificationReport,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Applications
  getApplications(): Promise<Application[]>;
  getApplication(id: string): Promise<Application | undefined>;
  createApplication(app: InsertApplication): Promise<Application>;
  createApplicationsBatch(apps: InsertApplication[]): Promise<Application[]>;
  updateApplication(id: string, updates: Partial<Application>): Promise<Application | undefined>;
  deleteApplication(id: string): Promise<boolean>;

  // Evaluation Rules
  getRules(): Promise<EvaluationRule[]>;
  getRule(id: string): Promise<EvaluationRule | undefined>;
  createRule(rule: InsertEvaluationRule): Promise<EvaluationRule>;
  updateRule(id: string, updates: Partial<EvaluationRule>): Promise<EvaluationRule | undefined>;
  deleteRule(id: string): Promise<boolean>;

  // Personas
  getPersonas(): Promise<Persona[]>;
  getPersona(id: string): Promise<Persona | undefined>;
  createPersona(persona: InsertPersona): Promise<Persona>;
  deletePersona(id: string): Promise<boolean>;

  // Reviews
  getReviews(): Promise<Review[]>;
  getReviewsByApplication(applicationId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Context Settings
  getContextSettings(): Promise<ContextSetting[]>;
  updateContextSetting(id: number, updates: Partial<ContextSetting>): Promise<ContextSetting | undefined>;

  // Plan Settings
  getPlanSettings(): Promise<PlanSetting>;
  updatePlanSettings(updates: Partial<PlanSetting>): Promise<PlanSetting>;

  // Justification Reports
  getJustificationReport(applicationId: string): Promise<JustificationReport | undefined>;
  createJustificationReport(report: { applicationId: string; content: string; generatedAt: Date }): Promise<JustificationReport>;
}

export class MemStorage implements IStorage {
  private applications: Map<string, Application> = new Map();
  private rules: Map<string, EvaluationRule> = new Map();
  private personas: Map<string, Persona> = new Map();
  private reviews: Map<string, Review> = new Map();
  private contextSettings: ContextSetting[];
  private planSettings: PlanSetting;
  private justificationReports: Map<string, JustificationReport> = new Map();

  constructor() {
    // Seed default evaluation rules
    const defaultRules: InsertEvaluationRule[] = [
      { name: "Relevant Experience", description: "Years and quality of relevant work experience", weight: 8, enabled: true },
      { name: "Communication Skills", description: "Clarity and professionalism of written communication", weight: 7, enabled: true },
      { name: "Technical Skills", description: "Demonstrated technical knowledge and skills", weight: 9, enabled: true },
      { name: "Cultural Alignment", description: "Alignment with company values and team culture", weight: 6, enabled: true },
      { name: "Problem Solving", description: "Demonstrated ability to solve complex problems", weight: 8, enabled: true },
    ];
    defaultRules.forEach(rule => {
      const id = randomUUID();
      this.rules.set(id, { ...rule, id, createdAt: new Date() });
    });

    // Seed default personas
    const defaultPersonas: InsertPersona[] = [
      {
        name: "The Pragmatist",
        archetype: "operations_focused",
        description: "Focuses on practical skills, delivery track record, and operational excellence.",
        evaluationStyle: "Values concrete achievements over potential. Looks for evidence of execution.",
        isPaid: false,
      },
      {
        name: "The Visionary",
        archetype: "founder_friendly",
        description: "Seeks innovative thinkers, entrepreneurial spirit, and transformative potential.",
        evaluationStyle: "Prioritizes growth mindset, creativity, and ability to think beyond conventional boundaries.",
        isPaid: true,
      },
      {
        name: "The Analyst",
        archetype: "conservative_investor",
        description: "Data-driven evaluator who values structured thinking and measurable outcomes.",
        evaluationStyle: "Focuses on quantifiable achievements, analytical rigor, and systematic problem-solving.",
        isPaid: true,
      },
    ];
    defaultPersonas.forEach(persona => {
      const id = randomUUID();
      this.personas.set(id, { ...persona, id, createdAt: new Date() });
    });

    // Seed context settings
    this.contextSettings = [
      { id: 1, name: "Geographic Diversity", description: "Favor underrepresented regions", enabled: false, weight: 0.2, category: "diversity" },
      { id: 2, name: "Career Stage Balance", description: "Balance senior and junior applicants", enabled: false, weight: 0.15, category: "balance" },
      { id: 3, name: "Industry Diversity", description: "Prefer applicants from different industries", enabled: false, weight: 0.1, category: "diversity" },
    ];

    // Seed plan settings
    this.planSettings = {
      id: 1,
      plan: "free",
      reviewMode: "human_in_loop",
      updatedAt: new Date(),
    };
  }

  // Applications
  async getApplications(): Promise<Application[]> {
    return Array.from(this.applications.values());
  }

  async getApplication(id: string): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async createApplication(app: InsertApplication): Promise<Application> {
    const id = randomUUID();
    const application: Application = {
      ...app,
      id,
      status: "pending",
      overallScore: null,
      classification: null,
      decision: null,
      reviewCount: 0,
      submittedAt: new Date(),
      reviewedAt: null,
    };
    this.applications.set(id, application);
    return application;
  }

  async createApplicationsBatch(apps: InsertApplication[]): Promise<Application[]> {
    const created: Application[] = [];
    for (const app of apps) {
      created.push(await this.createApplication(app));
    }
    return created;
  }

  async updateApplication(id: string, updates: Partial<Application>): Promise<Application | undefined> {
    const app = this.applications.get(id);
    if (!app) return undefined;
    const updated = { ...app, ...updates };
    this.applications.set(id, updated);
    return updated;
  }

  async deleteApplication(id: string): Promise<boolean> {
    return this.applications.delete(id);
  }

  // Evaluation Rules
  async getRules(): Promise<EvaluationRule[]> {
    return Array.from(this.rules.values());
  }

  async getRule(id: string): Promise<EvaluationRule | undefined> {
    return this.rules.get(id);
  }

  async createRule(rule: InsertEvaluationRule): Promise<EvaluationRule> {
    const id = randomUUID();
    const newRule: EvaluationRule = { ...rule, id, createdAt: new Date() };
    this.rules.set(id, newRule);
    return newRule;
  }

  async updateRule(id: string, updates: Partial<EvaluationRule>): Promise<EvaluationRule | undefined> {
    const rule = this.rules.get(id);
    if (!rule) return undefined;
    const updated = { ...rule, ...updates };
    this.rules.set(id, updated);
    return updated;
  }

  async deleteRule(id: string): Promise<boolean> {
    return this.rules.delete(id);
  }

  // Personas
  async getPersonas(): Promise<Persona[]> {
    return Array.from(this.personas.values());
  }

  async getPersona(id: string): Promise<Persona | undefined> {
    return this.personas.get(id);
  }

  async createPersona(persona: InsertPersona): Promise<Persona> {
    const id = randomUUID();
    const newPersona: Persona = { ...persona, id, createdAt: new Date() };
    this.personas.set(id, newPersona);
    return newPersona;
  }

  async deletePersona(id: string): Promise<boolean> {
    return this.personas.delete(id);
  }

  // Reviews
  async getReviews(): Promise<Review[]> {
    return Array.from(this.reviews.values());
  }

  async getReviewsByApplication(applicationId: string): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(r => r.applicationId === applicationId);
  }

  async createReview(review: InsertReview): Promise<Review> {
    const id = randomUUID();
    const newReview: Review = { ...review, id, createdAt: new Date() };
    this.reviews.set(id, newReview);
    return newReview;
  }

  // Context Settings
  async getContextSettings(): Promise<ContextSetting[]> {
    return this.contextSettings;
  }

  async updateContextSetting(id: number, updates: Partial<ContextSetting>): Promise<ContextSetting | undefined> {
    const index = this.contextSettings.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    this.contextSettings[index] = { ...this.contextSettings[index], ...updates };
    return this.contextSettings[index];
  }

  // Plan Settings
  async getPlanSettings(): Promise<PlanSetting> {
    return this.planSettings;
  }

  async updatePlanSettings(updates: Partial<PlanSetting>): Promise<PlanSetting> {
    this.planSettings = { ...this.planSettings, ...updates, updatedAt: new Date() };
    return this.planSettings;
  }

  // Justification Reports
  async getJustificationReport(applicationId: string): Promise<JustificationReport | undefined> {
    return this.justificationReports.get(applicationId);
  }

  async createJustificationReport(report: { applicationId: string; content: string; generatedAt: Date }): Promise<JustificationReport> {
    const id = randomUUID();
    const newReport: JustificationReport = { ...report, id };
    this.justificationReports.set(report.applicationId, newReport);
    return newReport;
  }
}

export const storage = new MemStorage();
