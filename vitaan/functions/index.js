const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// AI Query/Task Logic
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

exports.askGemini = onCall(async (request) => {
  if (!GEMINI_API_KEY) {
    throw new HttpsError("internal", "Gemini API key not configured.");
  }
  const { type, payload } = request.data;
  let systemPrompt = "";
  let userMessage = "";

  if (type === "queryResolver") {
    systemPrompt = "You are a helpful assistant for an NGO project management platform. You have knowledge about the platform's projects and tasks. Answer the user's query helpfully and concisely.";
    userMessage = `Project Context: ${payload.projectTitle || 'Unknown'}\nUser Query: ${payload.query}`;
  } 
  else if (type === "taskRecommendation") {
    systemPrompt = "You are an expert NGO project manager. Given the following project details, generate a list of 6 to 10 specific actionable tasks needed to complete this project. Return the tasks strictly as a JSON array with fields: title (string), description (string), estimatedDays (number). Do not return markdown formatted codeblocks, only pure JSON string.";
    userMessage = `Project title: ${payload.title}\nProject description: ${payload.description}`;
  } 
  else {
    throw new HttpsError("invalid-argument", "Unknown type requested.");
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: { text: systemPrompt } },
        contents: [ { parts: [{ text: userMessage }] } ]
      })
    });
    if (!response.ok) throw new HttpsError("internal", "Gemini API error.");
    const data = await response.json();
    return { text: data.candidates?.[0]?.content?.parts?.[0]?.text || "" };
  } catch (err) {
    logger.error("Gemini Error", err);
    throw new HttpsError("internal", err.message);
  }
});

// Admin User Creation Logic
exports.adminCreateUser = onCall(async (request) => {
  try {
    logger.info("Starting user creation...", request.data);

    // 1. Verify caller is authenticated
    if (!request.auth || !request.auth.uid) {
      logger.error("User not authenticated.");
      throw new HttpsError("unauthenticated", "Please log in first.");
    }

    // 2. Check Admin role
    const callerDoc = await db.collection("users").doc(request.auth.uid).get();
    if (!callerDoc.exists) {
        logger.error(`No user document found for ${request.auth.uid}`);
        throw new HttpsError("not-found", "User record not found.");
    }
    
    if (callerDoc.data().role !== "admin") {
      logger.error(`Unauthorized access attempt by ${request.auth.uid} with role ${callerDoc.data().role}`);
      throw new HttpsError("permission-denied", "Only admins can create users.");
    }

    const { email, password, name, role } = request.data;
    if (!email || !password || !name) {
       throw new HttpsError("invalid-argument", "Missing required fields.");
    }

    // 3. Create User in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // 4. Create User Doc in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      name,
      email,
      role: role || "volunteer",
      skills: [],
      projectIds: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info(`Successfully created user: ${userRecord.uid}`);
    return { uid: userRecord.uid, success: true };
  } catch (error) {
    logger.error("Detailed Error in adminCreateUser:", {
        message: error.message,
        code: error.code,
        stack: error.stack
    });
    // Rethrow as HttpsError so the frontend gets it
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to create user.");
  }
});
