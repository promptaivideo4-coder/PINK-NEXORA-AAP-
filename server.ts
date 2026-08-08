import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import helmet from "helmet";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON body parsing for API endpoints
  app.use(express.json());

  // Security headers with custom CSP to allow Google AI Studio workers and Monaco editor
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'self'"],
          "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://studio.google.com", "https://*.google.com", "https://cdn.jsdelivr.net"],
          "worker-src": ["'self'", "blob:", "https://studio.google.com", "https://*.google.com"],
          "connect-src": ["'self'", "https:", "wss:", "https://*.google.com", "https://*.googleapis.com", "https://*.supabase.co"],
          "img-src": ["'self'", "data:", "blob:", "https://*.google.com", "https://*.googleusercontent.com", "https://tile.openstreetmap.org", "https://*.tile.openstreetmap.org"],
          "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://studio.google.com"],
          "font-src": ["'self'", "https://fonts.gstatic.com"],
          "frame-ancestors": ["'self'", "https://studio.google.com", "https://*.google.com"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // Use memory storage to process image with Gemini before doing anything else
  const upload = multer({ storage: multer.memoryStorage() });

  // AI Helper function for fallback replies
  function getFallbackReplies(customerName?: string, serviceName?: string, rating?: number, tone?: string): string[] {
    const name = customerName || 'there';
    const service = serviceName ? `for your ${serviceName}` : 'for visiting Nexora';
    const r = rating || 5;

    if (r <= 3) {
      return [
        `Dear ${name}, thank you for sharing your feedback regarding your ${serviceName || 'recent'} appointment. We sincerely apologize that your experience fell short of our high standards. Please reach out to our manager directly at manager@nexora.com so we can make this right for you.`,
        `Hi ${name}, we appreciate you bringing this to our attention. We hold our team to top luxury standards at Nexora, and we'd love the opportunity to offer a complimentary touch-up for your ${serviceName || 'service'}. Please contact us!`,
        `Thank you for your candid review, ${name}. We take all client feedback seriously and are reviewing this with our team to ensure continuous improvement.`
      ];
    } else if (tone === 'promotional') {
      return [
        `Thank you so much ${name}! We loved working on your ${serviceName || 'hair'}! Rebook your next treatment online within 30 days to receive 15% off your service.`,
        `Hi ${name}, thank you for the fantastic review! Be sure to mention your review on your next visit to receive a complimentary Kerastase conditioning ritual!`,
        `Dear ${name}, thank you for choosing Nexora! We can't wait to see you again soon for your next luxury experience.`
      ];
    } else {
      return [
        `Thank you so much, ${name}! We're absolutely thrilled to hear you had such a wonderful experience ${service}. Our team looks forward to welcoming you back to Nexora Salon soon!`,
        `Dear ${name}, reviews like yours make our entire team smile! Thank you for trusting us with your hair and beauty needs. See you at your next visit!`,
        `Hi ${name}, thank you for taking the time to leave such a lovely review! It was a pleasure hosting you at Nexora.`
      ];
    }
  }

  // Helper to generate a fallback offer when Gemini key is missing or fails
  function getFallbackOffer(
    campaignGoal = 'Bookings',
    customerType = 'All',
    occasion = '',
    services: unknown = [],
    discountPreference = 'Percentage',
    validity = '',
    language = 'English',
    tone = 'Professional'
  ) {
    // API input is untrusted. Normalise it so a malformed request can never
    // take down the Node process while the fallback response is being built.
    const safeServices = Array.isArray(services)
      ? services.filter((service): service is string => typeof service === 'string' && service.trim().length > 0)
      : [];
    const safeCustomerType = typeof customerType === 'string' && customerType.trim() ? customerType.trim() : 'All';
    const safeOccasion = typeof occasion === 'string' ? occasion.trim() : '';
    const safeValidity = typeof validity === 'string' ? validity.trim() : '';
    const safeDiscountPreference = typeof discountPreference === 'string' ? discountPreference : 'Percentage';
    const serviceText = safeServices.length > 0 ? safeServices.join(' & ') : 'luxury services';
    const discountVal = safeDiscountPreference === 'Percentage' ? '20% Off' : safeDiscountPreference === 'Fixed' ? '₹500 Off' : 'Buy 1 Get 1 Free';
    const code = ((safeOccasion ? safeOccasion.toUpperCase().substring(0, 4) : 'GLOW') + (safeDiscountPreference === 'Percentage' ? '20' : '15')).replace(/\s+/g, '');

    return {
      title: `${safeOccasion ? safeOccasion + ' ' : ''}Special: ${discountVal} ${serviceText}`,
      shortPromoText: `Elevate your style with our exclusive ${discountVal} on all ${serviceText}. Designed for ${safeCustomerType === 'All' ? 'everyone' : safeCustomerType + ' clients'} who deserve the ultimate luxury experience.`,
      whatsappMessage: `Hi there! ✨ Treat yourself to Nexora's exclusive ${safeOccasion || 'seasonal'} offer. Enjoy ${discountVal} on our signature ${serviceText}! Valid until ${safeValidity || 'the end of this month'}. Book your slot now using code ${code}. Click here: [Link]`,
      suggestedCouponCode: code,
      termsAndConditions: `Offer valid for ${safeCustomerType.toLowerCase()} customers only. Cannot be combined with other offers. Validity: ${safeValidity || 'Limited time only'}.`
    };
  }

  // API endpoint to generate AI suggested replies for reviews
  app.post("/api/suggest-reply", async (req, res) => {
    try {
      const { reviewText, customerName, serviceName, rating, tone = "warm" } = req.body || {};

      if (!reviewText) {
        return res.status(400).json({ error: "reviewText is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        const fallbackOptions = getFallbackReplies(customerName, serviceName, rating, tone);
        return res.json({ suggestions: fallbackOptions, source: "fallback" });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `You are an AI assistant for "Nexora Luxury Salon". 
Write 3 distinct, elegant, professional yet warm response options for a salon owner to reply to this customer review.

Client Name: ${customerName || 'Valued Client'}
Service: ${serviceName || 'Salon Treatment'}
Rating: ${rating || 5} out of 5 stars
Review: "${reviewText}"
Requested Tone: ${tone} (Options: warm, professional, apologetic, promotional)

Requirements:
1. Keep responses concise (2 to 3 sentences).
2. Reference the specific service or client detail appropriately.
3. If rating is 1-3 stars, sound genuinely empathetic, professional, and offer a resolution.
4. Return ONLY a raw JSON object with the structure: { "suggestions": ["option 1", "option 2", "option 3"] }. No markdown syntax, no extra text outside JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      });

      const text = response.text;
      let parsed;
      try {
        parsed = JSON.parse(text || "{}");
      } catch (e) {
        parsed = { suggestions: [text] };
      }

      const suggestions = Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0 
        ? parsed.suggestions 
        : getFallbackReplies(customerName, serviceName, rating, tone);

      res.json({ suggestions, source: "gemini" });
    } catch (error) {
      console.error("Error in AI reply suggestion:", error);
      const body = req.body || {};
      const fallback = getFallbackReplies(body.customerName, body.serviceName, body.rating, body.tone);
      res.json({ suggestions: fallback, source: "fallback" });
    }
  });

  // API endpoint to generate custom luxury salon promotional offers using Gemini 1.5-flash
  app.post("/api/generate-offer", async (req, res) => {
    try {
      const { campaignGoal = 'Bookings', customerType = 'All', occasion = '', services = [], discountPreference = 'Percentage', validity = '', language = "English", tone = "Professional" } = req.body || {};

      if (!process.env.GEMINI_API_KEY) {
        const fallback = getFallbackOffer(campaignGoal, customerType, occasion, services, discountPreference, validity, language, tone);
        return res.json({ ...fallback, source: "fallback" });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const servicesString = services.length > 0 ? services.join(", ") : "our premium services";
      const prompt = `You are a world-class marketing strategist and copywriter for "Nexora Luxury Salon".
Create an exceptionally high-converting, premium promotional campaign with these parameters:
- Campaign Goal: ${campaignGoal}
- Customer Type/Audience: ${customerType}
- Special Occasion/Festival: ${occasion || "None"}
- Services to Promote: ${servicesString}
- Discount Type/Preference: ${discountPreference}
- Offer Validity Period: ${validity || "Limited time"}
- Communication Language: ${language} (Write in ${language}. If Hinglish, use English alphabet but write in conversational Hindi/English mix commonly used in India).
- Brand Tone: ${tone} (Make it match this tone beautifully: e.g. friendly, professional, premium/luxurious, or urgent/exclusive).

Requirements:
1. Title: Create a short, highly compelling headline (max 8 words).
2. Short Promotional Text: A highly engaging description explaining the value and giving a stylish reason to book now (2 sentences max).
3. WhatsApp Message: An inviting, formatted chat message using elegant emojis (like ✨, 🌸, 💇‍♀️, 💅), with clear spacing, a call to action containing [Link], and the promo code highlighted. Keep it easy to read on mobile.
4. Suggested Coupon Code: Generate a memorable, relevant code (e.g. GLOW20, DIWALI50, BOGOPOST) uppercase without spaces.
5. Terms & Conditions: A concise list of 2-3 essential terms (e.g., "Valid for first-time visitors only. Appointment required. Cannot be combined with other offers.")

Return ONLY a JSON object matching the requested schema. No extra conversational text or markdown blocks outside the JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          temperature: 0.8,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              shortPromoText: { type: Type.STRING },
              whatsappMessage: { type: Type.STRING },
              suggestedCouponCode: { type: Type.STRING },
              termsAndConditions: { type: Type.STRING }
            },
            required: ["title", "shortPromoText", "whatsappMessage", "suggestedCouponCode", "termsAndConditions"]
          }
        }
      });

      let parsed;
      try {
        parsed = JSON.parse(response.text || "{}");
      } catch (e) {
        console.error("Failed to parse Gemini response:", response.text);
        parsed = getFallbackOffer(campaignGoal, customerType, occasion, services, discountPreference, validity, language, tone);
      }

      res.json({ ...parsed, source: "gemini" });
    } catch (error) {
      console.error("Error generating offer with Gemini:", error);
      const body = req.body || {};
      const fallback = getFallbackOffer(body.campaignGoal, body.customerType, body.occasion, body.services, body.discountPreference, body.validity, body.language, body.tone);
      res.json({ ...fallback, source: "fallback" });
    }
  });

  // API routes
  app.post("/api/analyze-image", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `Analyze this image for a salon website gallery.
Provide a JSON object with the following properties:
- title: A short, descriptive, and SEO-friendly title (e.g., "Sunset Balayage Long Hair", "Acrylic Nails with French Tip", "Relaxing Hot Stone Massage").
- tag: A single category tag from this list: ["Hair", "Nails", "Spa"]. Choose the best fit or create a new one if it absolutely doesn't fit (e.g. "Makeup", "Lashes"). Keep it very short (1-2 words max).
- alt: A descriptive, SEO-friendly alt-text for accessibility, describing what the image shows in detail to help search engines understand the content.

Return ONLY the raw JSON object, without markdown formatting or code blocks.`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          prompt,
          {
            inlineData: {
              data: req.file.buffer.toString("base64"),
              mimeType: req.file.mimetype,
            },
          },
        ],
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });

      const text = response.text;
      let analysis;
      try {
        analysis = JSON.parse(text || "{}");
      } catch (e) {
        return res.status(500).json({ error: "Failed to parse AI response" });
      }

      // Normally we would save the file to a CDN or local disk here.
      // For this example, we'll convert it to a base64 data URI so it can be previewed immediately by the client,
      // since the preview environment doesn't have durable local file storage.
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

      res.json({
        title: analysis.title || "Untitled",
        tag: analysis.tag || "Misc",
        alt: analysis.alt || "Salon image",
        image: base64Image
      });

    } catch (error) {
      console.error("Error analyzing image:", error);
      res.status(500).json({ error: "Failed to analyze image" });
    }
  });

  // Return JSON for malformed JSON payloads instead of Express's default HTML error page.
  app.use((error: Error & { type?: string; status?: number }, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (error instanceof SyntaxError && error.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON request body' });
    }
    next(error);
  });

  /* ------------------------------------------------------------------
     PUBLISHED WEBSITES — the "GO LIVE" part
     POST /api/publish-site → saves the generated salon website
     GET  /site/:slug/      → serves the live website (same HTML that was
                              shown in the Interactive Preview)
     ------------------------------------------------------------------ */
  const PUBLISH_DIR = path.join(process.cwd(), "publish");
  fs.mkdirSync(PUBLISH_DIR, { recursive: true });

  function sanitizeSlug(s: unknown): string {
    return (
      String(s || "mysalon")
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "mysalon"
    );
  }

  app.post("/api/publish-site", (req, res) => {
    try {
      const { html, slug } = req.body || {};
      if (typeof html !== "string" || html.length < 50) {
        return res.status(400).json({ ok: false, error: "html is missing or empty" });
      }
      const base = sanitizeSlug(slug);
      let dir = path.join(PUBLISH_DIR, base);
      let n = 2;
      while (fs.existsSync(dir)) {
        dir = path.join(PUBLISH_DIR, `${base}-${n++}`);
      }
      fs.mkdirSync(dir, { recursive: true });
      const finalSlug = path.basename(dir);
      fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
      res.json({ ok: true, url: `/site/${finalSlug}/`, slug: finalSlug });
    } catch (e) {
      res.status(500).json({ ok: false, error: String((e as Error)?.message || e) });
    }
  });

  app.get(["/site/:slug", "/site/:slug/*"], (req, res) => {
    try {
      const slug = sanitizeSlug(req.params.slug);
      const rest = (req.params[0] as string | undefined) || "";
      let file = rest ? rest.split("/").pop() || "index.html" : "index.html";
      if (!file || file === ".") file = "index.html";
      const safeFile = path.normalize(file).replace(/^(\.\.(\/|\\|$))+/, "");
      const target = path.join(PUBLISH_DIR, slug, safeFile);
      if (!target.startsWith(PUBLISH_DIR)) {
        return res.status(404).json({ ok: false, error: "Not found" });
      }
      if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
        return res.status(404).json({ ok: false, error: "Site not found" });
      }
      res.sendFile(target);
    } catch (e) {
      res.status(500).json({ ok: false, error: String((e as Error)?.message || e) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
