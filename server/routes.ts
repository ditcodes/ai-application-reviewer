import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { Anthropic } from "@anthropic-ai/sdk";
import type {
  Application,
  EvaluationRule,
  Persona,
  JustificationReport,
  RuleInfluence,
  PersonaFeedback,
} from "@shared/schema";

const anthropic = new Anthropic();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ========================
  // APPLICATIONS
  // ========================
  app.get("/api/applications", async (_req, res) => {
    const apps = await storage.getApplications();
    res.json(apps);
  });

  app.get("/api/applications/:id", async (req, res) => {
    const app_ = await storage.getApplication(req.params.id);
    if (!app_) return res.status(404).json({ error: "Application not found" });
    res.json(app_);
  });

  app.post("/api/applications", async (req, res) => {
    try {
      const result = await storage.createApplication(req.body);
      res.status(201).json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/applications/batch", async (req, res) => {
    try {
      const { applications } = req.body;
      if (!Array.isArray(applications)) {
        return res.status(400).json({ error: "applications must be an array" });
      }
      const results = await storage.createApplicationsBatch(applications);
      res.status(201).json(results);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/applications/:id", async (req, res) => {
    const updated = await storage.updateApplication(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Application not found" });
    res.json(updated);
  });

  app.delete("/api/applications/:id", async (req, res) => {
    const deleted = await storage.deleteApplication(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Application not found" });
    res.json({ success: true });
  });

  // ========================
  // EVALUATION RULES
  // ========================
  app.get("/api/rules", async (_req, res) => {
    const rules = await storage.getRules();
    res.json(rules);
  });

  app.post("/api/rules", async (req, res) => {
    try {
      const rule = await storage.createRule(req.body);
      res.status(201).json(rule);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/rules/:id", async (req, res) => {
    const updated = await storage.updateRule(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Rule not found" });
    res.json(updated);
  });

  app.delete("/api/rules/:id", async (req, res) => {
    const deleted = await storage.deleteRule(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Rule not found" });
    res.json({ success: true });
  });

  // ========================
  // PERSONAS
  // ========================
  app.get("/api/personas", async (_req, res) => {
    const personas = await storage.getPersonas();
    res.json(personas);
  });

  app.post("/api/personas", async (req, res) => {
    try {
      const persona = await storage.createPersona(req.body);
      res.status(201).json(persona);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/personas/:id", async (req, res) => {
    const updated = await storage.updatePersona(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Persona not found" });
    res.json(updated);
  });

  app.delete("/api/personas/:id", async (req, res) => {
    const deleted = await storage.deletePersona(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Persona not found" });
    res.json({ success: true });
  });

  // ========================
  // REVIEWS
  // ========================
  app.get("/api/reviews", async (_req, res) => {
    const reviews = await storage.getReviews();
    res.json(reviews);
  });

  app.get("/api/reviews/application/:applicationId", async (req, res) => {
    const reviews = await storage.getReviewsByApplication(req.params.applicationId);
    res.json(reviews);
  });

  // ========================
  // CONTEXT SETTINGS
  // ========================
  app.get("/api/context-settings", async (_req, res) => {
    const settings = await storage.getContextSettings();
    res.json(settings);
  });

  app.patch("/api/context-settings/:id", async (req, res) => {
    const updated = await storage.updateContextSetting(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Setting not found" });
    res.json(updated);
  });

  // ========================
  // PLAN SETTINGS
  // ========================
  app.get("/api/plan-settings", async (_req, res) => {
    const settings = await storage.getPlanSettings();
    res.json(settings);
  });

  app.patch("/api/plan-settings", async (req, res) => {
    const updated = await storage.updatePlanSettings(req.body);
    res.json(updated);
  });

  // ========================
  // AI EVALUATION ENGINE
  // ========================
  app.post("/api/evaluate/:applicationId", async (req, res) => {
    try {
      const application = await storage.getApplication(req.params.applicationId);
      if (!application) return res.status(404).json({ error: "Application not found" });

      const rules = await storage.getRules();
      const activeRules = rules.filter((r) => r.isActive);
      const allPersonas = await storage.getPersonas();
      const plan = await storage.getPlanSettings();
      const contextSettings = await storage.getContextSettings();

      // For free plan, only use first non-paid persona
      const availablePersonas = plan.plan === "free"
        ? allPersonas.filter((p) => !p.isPaid).slice(0, 1)
        : allPersonas;

      if (availablePersonas.length === 0) {
        return res.status(400).json({ error: "No personas available for evaluation" });
      }

      await storage.updateApplication(application.id, { status: "under_review" });

      const allReviews: any[] = [];
      const personaFeedback: PersonaFeedback[] = [];

      for (const persona of availablePersonas) {
        const review = await evaluateWithPersona(application, persona, activeRules, contextSettings);
        const savedReview = await storage.createReview({
          applicationId: application.id,
          personaId: persona.id,
          score: review.score,
          reasoning: review.reasoning,
          strengths: review.strengths,
          weaknesses: review.weaknesses,
          ruleInfluences: review.ruleInfluences,
          confidence: review.confidence,
        });
        allReviews.push(savedReview);
        personaFeedback.push({
          personaId: persona.id,
          personaName: persona.name,
          score: review.score,
          summary: review.reasoning,
        });
      }

      // Aggregate scores
      const avgScore = allReviews.reduce((sum, r) => sum + r.score, 0) / allReviews.length;
      const avgConfidence = allReviews.reduce((sum, r) => sum + r.confidence, 0) / allReviews.length;

      // Combine all rule influences
      const allRuleInfluences: RuleInfluence[] = [];
      for (const r of allReviews) {
        for (const ri of r.ruleInfluences) {
          if (!allRuleInfluences.find((x) => x.ruleId === ri.ruleId)) {
            allRuleInfluences.push(ri);
          }
        }
      }

      // Combine strengths and weaknesses
      const allStrengths = [...new Set(allReviews.flatMap((r) => r.strengths))];
      const allWeaknesses = [...new Set(allReviews.flatMap((r) => r.weaknesses))];

      // Classification
      let classification: string;
      if (avgScore >= 8) classification = "trailblazer";
      else if (avgScore >= 6) classification = "rising_star";
      else if (avgScore >= 4) classification = "needs_development";
      else classification = "not_selected";

      // Recommendation
      let recommendation: string;
      if (avgScore >= 7) recommendation = "Accept";
      else if (avgScore >= 5) recommendation = "Waitlist for further review";
      else recommendation = "Decline";

      const justification: JustificationReport = {
        summary: `Evaluation of ${application.name}'s application based on ${availablePersonas.length} reviewer persona(s) and ${activeRules.length} evaluation rules.`,
        strengths: allStrengths,
        weaknesses: allWeaknesses,
        ruleInfluences: allRuleInfluences,
        personaFeedback,
        confidence: Math.round(avgConfidence * 100) / 100,
        recommendation,
      };

      const updatedApp = await storage.updateApplication(application.id, {
        status: "reviewed",
        overallScore: Math.round(avgScore * 10) / 10,
        classification,
        justification,
      });

      res.json(updatedApp);
    } catch (e: any) {
      console.error("Evaluation error:", e);
      res.status(500).json({ error: "Evaluation failed: " + e.message });
    }
  });

  // Evaluate all pending applications
  app.post("/api/evaluate-all", async (_req, res) => {
    try {
      const apps = await storage.getApplications();
      const pending = apps.filter((a) => a.status === "pending");

      if (pending.length === 0) {
        return res.json({ message: "No pending applications to evaluate", evaluated: 0 });
      }

      const results: Application[] = [];
      for (const application of pending) {
        const rules = await storage.getRules();
        const activeRules = rules.filter((r) => r.isActive);
        const allPersonas = await storage.getPersonas();
        const plan = await storage.getPlanSettings();
        const contextSettings = await storage.getContextSettings();

        const availablePersonas = plan.plan === "free"
          ? allPersonas.filter((p) => !p.isPaid).slice(0, 1)
          : allPersonas;

        if (availablePersonas.length === 0) continue;

        await storage.updateApplication(application.id, { status: "under_review" });

        const allReviews: any[] = [];
        const personaFeedback: PersonaFeedback[] = [];

        for (const persona of availablePersonas) {
          const review = await evaluateWithPersona(application, persona, activeRules, contextSettings);
          const savedReview = await storage.createReview({
            applicationId: application.id,
            personaId: persona.id,
            score: review.score,
            reasoning: review.reasoning,
            strengths: review.strengths,
            weaknesses: review.weaknesses,
            ruleInfluences: review.ruleInfluences,
            confidence: review.confidence,
          });
          allReviews.push(savedReview);
          personaFeedback.push({
            personaId: persona.id,
            personaName: persona.name,
            score: review.score,
            summary: review.reasoning,
          });
        }

        const avgScore = allReviews.reduce((sum, r) => sum + r.score, 0) / allReviews.length;
        const avgConfidence = allReviews.reduce((sum, r) => sum + r.confidence, 0) / allReviews.length;

        const allRuleInfluences: RuleInfluence[] = [];
        for (const r of allReviews) {
          for (const ri of r.ruleInfluences) {
            if (!allRuleInfluences.find((x) => x.ruleId === ri.ruleId)) {
              allRuleInfluences.push(ri);
            }
          }
        }

        const allStrengths = [...new Set(allReviews.flatMap((r) => r.strengths))];
        const allWeaknesses = [...new Set(allReviews.flatMap((r) => r.weaknesses))];

        let classification: string;
        if (avgScore >= 8) classification = "trailblazer";
        else if (avgScore >= 6) classification = "rising_star";
        else if (avgScore >= 4) classification = "needs_development";
        else classification = "not_selected";

        let recommendation: string;
        if (avgScore >= 7) recommendation = "Accept";
        else if (avgScore >= 5) recommendation = "Waitlist for further review";
        else recommendation = "Decline";

        const justification: JustificationReport = {
          summary: `Evaluation of ${application.name}'s application based on ${availablePersonas.length} reviewer persona(s) and ${activeRules.length} evaluation rules.`,
          strengths: allStrengths,
          weaknesses: allWeaknesses,
          ruleInfluences: allRuleInfluences,
          personaFeedback,
          confidence: Math.round(avgConfidence * 100) / 100,
          recommendation,
        };

        const updatedApp = await storage.updateApplication(application.id, {
          status: "reviewed",
          overallScore: Math.round(avgScore * 10) / 10,
          classification,
          justification,
        });

        if (updatedApp) results.push(updatedApp);
      }

      res.json({ message: `Evaluated ${results.length} applications`, evaluated: results.length, results });
    } catch (e: any) {
      console.error("Batch evaluation error:", e);
      res.status(500).json({ error: "Batch evaluation failed: " + e.message });
    }
  });

  // Make final decision
  app.post("/api/applications/:id/decide", async (req, res) => {
    const { decision } = req.body;
    if (!["accepted", "rejected", "waitlisted"].includes(decision)) {
      return res.status(400).json({ error: "Decision must be accepted, rejected, or waitlisted" });
    }
    const plan = await storage.getPlanSettings();
    const updated = await storage.updateApplication(req.params.id, {
      decision,
      decisionMode: plan.reviewMode,
      status: "decided",
    });
    if (!updated) return res.status(404).json({ error: "Application not found" });
    res.json(updated);
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (_req, res) => {
    const apps = await storage.getApplications();
    const reviews = await storage.getReviews();

    const totalApplications = apps.length;
    const reviewed = apps.filter((a) => ["reviewed", "decided"].includes(a.status)).length;
    const pending = apps.filter((a) => a.status === "pending").length;
    const decided = apps.filter((a) => a.status === "decided").length;

    const avgManualMinutes = 15;
    const avgAiSeconds = 30;
    const estimatedManualTime = totalApplications * avgManualMinutes;
    const estimatedAiTime = Math.ceil((totalApplications * avgAiSeconds) / 60);
    const timeSaved = Math.max(0, estimatedManualTime - estimatedAiTime);
    const productivity = estimatedManualTime > 0
      ? Math.round((timeSaved / estimatedManualTime) * 100)
      : 0;

    const classifications = {
      trailblazer: apps.filter((a) => a.classification === "trailblazer").length,
      rising_star: apps.filter((a) => a.classification === "rising_star").length,
      needs_development: apps.filter((a) => a.classification === "needs_development").length,
      not_selected: apps.filter((a) => a.classification === "not_selected").length,
    };

    const decisions = {
      accepted: apps.filter((a) => a.decision === "accepted").length,
      rejected: apps.filter((a) => a.decision === "rejected").length,
      waitlisted: apps.filter((a) => a.decision === "waitlisted").length,
    };

    const avgScore = apps.filter((a) => a.overallScore !== null).reduce((sum, a) => sum + (a.overallScore || 0), 0) / (reviewed || 1);

    res.json({
      totalApplications,
      reviewed,
      pending,
      decided,
      totalReviews: reviews.length,
      estimatedManualTime,
      estimatedAiTime,
      timeSaved,
      productivity,
      classifications,
      decisions,
      avgScore: Math.round(avgScore * 10) / 10,
    });
  });

  return httpServer;
}

// AI Evaluation Function
async function evaluateWithPersona(
  application: Application,
  persona: Persona,
  rules: EvaluationRule[],
  contextSettings: any[]
): Promise<{
  score: number;
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
  ruleInfluences: RuleInfluence[];
  confidence: number;
}> {
  const responsesText = Object.entries(application.responses)
    .map(([q, a]) => `Q: ${q}\nA: ${a}`)
    .join("\n\n");

  const rulesText = rules
    .map((r) => `- ${r.fieldName} (Weight: ${r.weight}, Strictness: ${r.strictness}): ${r.description}`)
    .join("\n");

  const activeContexts = contextSettings.filter((c: any) => c.enabled);
  const contextText = activeContexts.length > 0
    ? `\nContextual Considerations (use as secondary signals, do not override quality assessment):\n${activeContexts.map((c: any) => `- ${c.name} (Weight: ${c.weight})`).join("\n")}`
    : "";

  const prompt = `You are ${persona.name}, an AI application reviewer with the following profile:\nArchetype: ${persona.archetype}\nDescription: ${persona.description}\nEvaluation Style: ${persona.evaluationStyle}\n\nReview the following application using the evaluation rules below. Be fair and thoughtful. Interpret messy text submissions charitably — infer meaning and intent rather than penalising for poor writing, spelling errors, or grammar mistakes.\n\nAPPLICATION:\nApplicant: ${application.name}\nEmail: ${application.email}\n\nResponses:\n${responsesText}\n\nEVALUATION RULES:\n${rulesText}\n${contextText}\n\nProvide your evaluation in the following JSON format (and ONLY valid JSON, no markdown):\n{\n  "score": <number 1-10>,\n  "reasoning": "<2-3 sentence overall assessment>",\n  "strengths": ["<strength 1>", "<strength 2>", ...],\n  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],\n  "ruleInfluences": [\n    {\n      "ruleId": "<rule field name>",\n      "ruleName": "<rule field name>",\n      "impact": "<positive|negative|neutral>",\n      "explanation": "<brief explanation>"\n    }\n  ],\n  "confidence": <number 0.0-1.0>\n}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude_sonnet_4_5",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON in AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Map rule influences to include actual rule IDs
    const ruleInfluences: RuleInfluence[] = (parsed.ruleInfluences || []).map((ri: any) => {
      const matchingRule = rules.find(
        (r) => r.fieldName.toLowerCase().includes(ri.ruleName?.toLowerCase() || "") ||
          ri.ruleName?.toLowerCase().includes(r.fieldName.toLowerCase())
      );
      return {
        ruleId: matchingRule?.id || "unknown",
        ruleName: ri.ruleName || "Unknown Rule",
        impact: ri.impact || "neutral",
        explanation: ri.explanation || "",
      };
    });

    return {
      score: Math.max(1, Math.min(10, Number(parsed.score) || 5)),
      reasoning: parsed.reasoning || "No reasoning provided",
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      ruleInfluences,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.7)),
    };
  } catch (error: any) {
    console.error("AI evaluation error:", error);
    // Fallback to rule-based evaluation
    return fallbackEvaluation(application, persona, rules);
  }
}

function fallbackEvaluation(
  application: Application,
  persona: Persona,
  rules: EvaluationRule[]
): {
  score: number;
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
  ruleInfluences: RuleInfluence[];
  confidence: number;
} {
  const responses = application.responses;
  const responseValues = Object.values(responses);
  const totalLength = responseValues.join(" ").length;

  // Basic heuristic scoring
  let score = 5;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const ruleInfluences: RuleInfluence[] = [];

  // Length signals effort
  if (totalLength > 500) {
    score += 1;
    strengths.push("Detailed and thorough responses");
  } else if (totalLength < 100) {
    score -= 1;
    weaknesses.push("Responses lack detail");
  }

  // Check each rule
  for (const rule of rules) {
    const fieldValue = Object.entries(responses).find(([key]) =>
      key.toLowerCase().includes(rule.fieldName.toLowerCase().split("/")[0].trim().toLowerCase())
    )?.[1] || "";

    const hasContent = fieldValue.length > 20;
    const weightMultiplier = rule.weight === "critical" ? 1.5 : rule.weight === "high" ? 1.2 : rule.weight === "medium" ? 1.0 : 0.7;

    if (hasContent) {
      score += 0.5 * weightMultiplier;
      ruleInfluences.push({
        ruleId: rule.id,
        ruleName: rule.fieldName,
        impact: "positive",
        explanation: `Applicant provided substantive content for ${rule.fieldName}`,
      });
    } else {
      score -= 0.3 * weightMultiplier;
      ruleInfluences.push({
        ruleId: rule.id,
        ruleName: rule.fieldName,
        impact: "negative",
        explanation: `Insufficient detail for ${rule.fieldName}`,
      });
    }
  }

  score = Math.max(1, Math.min(10, Math.round(score * 10) / 10));

  return {
    score,
    reasoning: `Evaluation completed using rule-based analysis. Score reflects response completeness and alignment with ${rules.length} evaluation criteria.`,
    strengths: strengths.length > 0 ? strengths : ["Application received for review"],
    weaknesses: weaknesses.length > 0 ? weaknesses : ["Could not perform AI-powered analysis"],
    ruleInfluences,
    confidence: 0.5,
  };
}
