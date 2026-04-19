const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// AI Query/Task Logic
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ========================
// 1. CHAT WITH GEMINI
// ========================
exports.aiChat = onCall(async (request) => {
  if (!GEMINI_API_KEY) {
    throw new HttpsError("internal", "Gemini API key not configured.");
  }

  const { message, context = {} } = request.data;

  if (!message) {
    throw new HttpsError("invalid-argument", "Message is required.");
  }

  const systemPrompt = `You are an intelligent AI assistant for Allocraft AI - a volunteer management platform for NGOs. 
You help volunteers with:
- Task management and tracking
- Team collaboration
- Project information
- Query resolution
- Guidance on platform features

Be helpful, friendly, and concise. Use emojis when appropriate.
Context: ${JSON.stringify(context)}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: { text: systemPrompt } },
          contents: [{ parts: [{ text: message }] }],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${error.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response. Please try again.";

    return { reply };
  } catch (err) {
    logger.error("AI Chat Error", err);
    throw new HttpsError("internal", err.message || "Failed to get AI response");
  }
});

// ========================
// 2. ANALYZE TASKS
// ========================
exports.analyzeTask = onCall(async (request) => {
  if (!GEMINI_API_KEY) {
    throw new HttpsError("internal", "Gemini API key not configured.");
  }

  const { taskTitle, taskDescription, projectTitle } = request.data;

  if (!taskTitle || !taskDescription) {
    throw new HttpsError("invalid-argument", "Task title and description are required.");
  }

  const systemPrompt = `You are an expert project analyst. Analyze the given task and provide:
1. Complexity level (Easy/Medium/Hard)
2. Estimated duration in days
3. Required skills
4. Key challenges
5. Success criteria

Respond in JSON format: { complexity, estimatedDays, requiredSkills: [], challenges: [], successCriteria: [] }`;

  const userMessage = `Project: ${projectTitle || "Unknown"}
Task Title: ${taskTitle}
Task Description: ${taskDescription}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: { text: systemPrompt } },
          contents: [{ parts: [{ text: userMessage }] }],
        }),
      }
    );

    if (!response.ok) throw new Error("Gemini API error");

    const data = await response.json();
    let analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Extract JSON from response if wrapped in markdown
    const jsonMatch = analysis.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      analysis = jsonMatch[0];
    }

    return { analysis: JSON.parse(analysis) };
  } catch (err) {
    logger.error("Task Analysis Error", err);
    throw new HttpsError("internal", "Failed to analyze task");
  }
});

// ========================
// 3. AUTO-ASSIGN TASKS
// ========================
exports.autoAssignTasks = onCall(async (request) => {
  if (!GEMINI_API_KEY) {
    throw new HttpsError("internal", "Gemini API key not configured.");
  }

  const { projectId, tasks, volunteers } = request.data;

  if (!projectId || !tasks || !volunteers || tasks.length === 0 || volunteers.length === 0) {
    throw new HttpsError("invalid-argument", "Project ID, tasks, and volunteers are required.");
  }

  const systemPrompt = `You are an expert task assignment manager. Given a list of tasks and volunteers, assign tasks to the most suitable volunteers based on:
1. Skill match
2. Current workload
3. Task complexity and volunteer expertise
4. Volunteer availability

Return a JSON array: [{ taskId, volunteerId, matchScore (0-100), reason }]
Ensure fair distribution of work.`;

  const userMessage = `Tasks:
${JSON.stringify(tasks, null, 2)}

Volunteers:
${JSON.stringify(volunteers, null, 2)}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: { text: systemPrompt } },
          contents: [{ parts: [{ text: userMessage }] }],
        }),
      }
    );

    if (!response.ok) throw new Error("Gemini API error");

    const data = await response.json();
    let assignments = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    
    // Extract JSON from response
    const jsonMatch = assignments.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      assignments = jsonMatch[0];
    }

    const parsedAssignments = JSON.parse(assignments);

    // Apply assignments to Firestore
    const batch = db.batch();
    for (const assignment of parsedAssignments) {
      const taskRef = db.collection("projects").doc(projectId).collection("tasks").doc(assignment.taskId);
      batch.update(taskRef, {
        assignedTo: assignment.volunteerId,
        status: "pending",
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    logger.info(`Auto-assigned ${parsedAssignments.length} tasks for project ${projectId}`);

    return { success: true, assignments: parsedAssignments };
  } catch (err) {
    logger.error("Auto-Assign Error", err);
    throw new HttpsError("internal", err.message || "Failed to auto-assign tasks");
  }
});

// ========================
// 4. GENERATE TASK SUGGESTIONS
// ========================
exports.generateTaskSuggestions = onCall(async (request) => {
  if (!GEMINI_API_KEY) {
    throw new HttpsError("internal", "Gemini API key not configured.");
  }

  const { projectTitle, projectDescription } = request.data;

  if (!projectTitle || !projectDescription) {
    throw new HttpsError("invalid-argument", "Project title and description are required.");
  }

  const systemPrompt = `You are an expert NGO project manager. Generate 8-12 specific, actionable tasks needed to complete the given project. 
Return a JSON array: [{ title, description, estimatedDays, requiredSkills: [], priority (High/Medium/Low) }]
Do not include markdown formatting, only pure JSON.`;

  const userMessage = `Project Title: ${projectTitle}
Project Description: ${projectDescription}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: { text: systemPrompt } },
          contents: [{ parts: [{ text: userMessage }] }],
        }),
      }
    );

    if (!response.ok) throw new Error("Gemini API error");

    const data = await response.json();
    let suggestions = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    
    // Extract JSON
    const jsonMatch = suggestions.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      suggestions = jsonMatch[0];
    }

    return { suggestions: JSON.parse(suggestions) };
  } catch (err) {
    logger.error("Task Suggestion Error", err);
    throw new HttpsError("internal", "Failed to generate task suggestions");
  }
});

// ========================
// 5. GET AI INSIGHTS
// ========================
exports.getProjectInsights = onCall(async (request) => {
  if (!GEMINI_API_KEY) {
    throw new HttpsError("internal", "Gemini API key not configured.");
  }

  const { projectData, tasksData, volunteersData } = request.data;

  if (!projectData) {
    throw new HttpsError("invalid-argument", "Project data is required.");
  }

  const systemPrompt = `You are a strategic project analyst. Provide concise insights about the project including:
1. Project health (On Track/At Risk/Behind Schedule)
2. Key risks
3. Bottlenecks
4. Recommendations
5. Team performance summary

Keep it brief and actionable.`;

  const userMessage = `Project: ${JSON.stringify(projectData)}
Tasks: ${JSON.stringify(tasksData || {})}
Volunteers: ${JSON.stringify(volunteersData || {})}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: { text: systemPrompt } },
          contents: [{ parts: [{ text: userMessage }] }],
        }),
      }
    );

    if (!response.ok) throw new Error("Gemini API error");

    const data = await response.json();
    const insights = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return { insights };
  } catch (err) {
    logger.error("Project Insights Error", err);
    throw new HttpsError("internal", "Failed to get project insights");
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
