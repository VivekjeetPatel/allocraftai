# Gemini API Integration Guide

## ✅ Setup Complete!

Your Allocraft AI app is now fully integrated with Google's Gemini AI API for:

### Features Enabled:

1. **🤖 AI Chatbot** - Real-time chat powered by Gemini
2. **📋 Task Analysis** - Analyze tasks for complexity, estimated time, and required skills
3. **🎯 Task Suggestions** - Auto-generate tasks for new projects
4. **👥 Auto-Assignment** - Intelligently assign tasks to volunteers based on skills
5. **💡 Project Insights** - Get AI-powered insights about project health and risks

---

## 🔑 Getting Your Gemini API Key

### Step 1: Go to Google AI Studio
1. Visit: https://aistudio.google.com
2. Sign in with your Google account

### Step 2: Create API Key
1. Click **"Get API Key"** button
2. Select **"Create new API key in new project"**
3. Copy the generated API key

### Step 3: Add to Firebase Functions

#### Option A: Using Firebase CLI (Recommended)

```bash
# Navigate to functions directory
cd functions

# Set the environment variable
firebase functions:config:set gemini.api_key="YOUR_API_KEY_HERE"

# Deploy functions
firebase deploy --only functions
```

#### Option B: Manual Setup
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: **allocraftai**
3. Go to **Functions** > **Runtime config**
4. Set environment variable: `GEMINI_API_KEY` = your API key
5. Redeploy functions

---

## 📚 Using Gemini Features in Your App

### 1. Chat with AI

```javascript
import { chatWithAI } from './utils/geminiAPI';

// Simple chat
const response = await chatWithAI("What should I do with task X?");

// Chat with context
const response = await chatWithAI(
  "Help me with my task",
  { userRole: 'volunteer', projectId: 'proj123' }
);
```

### 2. Analyze Tasks

```javascript
import { analyzeTask } from './utils/geminiAPI';

const analysis = await analyzeTask(
  "Design homepage",
  "Create a responsive homepage with hero section",
  "Web Design Project"
);

console.log(analysis);
// {
//   complexity: "Medium",
//   estimatedDays: 5,
//   requiredSkills: ["UI Design", "HTML", "CSS"],
//   challenges: [...],
//   successCriteria: [...]
// }
```

### 3. Generate Task Suggestions

```javascript
import { generateTaskSuggestions } from './utils/geminiAPI';

const tasks = await generateTaskSuggestions(
  "Mobile App Development",
  "Build a cross-platform mobile app for volunteer management"
);

// Returns array of suggested tasks with descriptions and estimates
```

### 4. Auto-Assign Tasks

```javascript
import { 
  autoAssignTasks, 
  formatTaskForAnalysis,
  formatVolunteerForAssignment 
} from './utils/geminiAPI';

// Format your data
const tasks = taskList.map(formatTaskForAnalysis);
const volunteers = volunteerList.map(formatVolunteerForAssignment);

// Get assignments
const assignments = await autoAssignTasks(projectId, tasks, volunteers);

// Apply assignments
assignments.forEach(assignment => {
  // Update task with volunteer assignment
  db.collection('projects').doc(projectId)
    .collection('tasks').doc(assignment.taskId)
    .update({ assignedTo: assignment.volunteerId });
});
```

### 5. Get Project Insights

```javascript
import { getProjectInsights } from './utils/geminiAPI';

const insights = await getProjectInsights(
  projectData,
  tasksWithStatus,
  volunteersWithPerformance
);

console.log(insights);
// Gets health status, risks, bottlenecks, and recommendations
```

---

## 🚀 Integrating with Your Components

### Option 1: Update QueryBoard (Existing)
The QueryBoard already uses `askGemini` - it's now enhanced!

### Option 2: Add to Task Creation
```javascript
// In your task creation form
import { analyzeTask } from './utils/geminiAPI';

const handleAnalyzeTask = async () => {
  setLoading(true);
  try {
    const analysis = await analyzeTask(
      formData.title,
      formData.description,
      projectName
    );
    setTaskAnalysis(analysis);
  } catch (error) {
    toast.error('Failed to analyze task');
  }
  setLoading(false);
};
```

### Option 3: Add to Project Dashboard
```javascript
// Show project insights on dashboard
import { getProjectInsights } from './utils/geminiAPI';

useEffect(() => {
  const loadInsights = async () => {
    const insights = await getProjectInsights(
      currentProject,
      projectTasks,
      projectVolunteers
    );
    setInsights(insights);
  };
  loadInsights();
}, [currentProject]);
```

### Option 4: Auto-Assign Feature
```javascript
// Add button to auto-assign tasks
const handleAutoAssign = async () => {
  setLoading(true);
  try {
    const assignments = await autoAssignTasks(
      projectId,
      tasksToAssign,
      availableVolunteers
    );
    // Apply assignments
    await applyAssignments(assignments);
    toast.success('Tasks auto-assigned successfully!');
  } catch (error) {
    toast.error('Auto-assignment failed');
  }
  setLoading(false);
};
```

---

## 🛠️ Cloud Functions

All Gemini API calls go through these Cloud Functions:

### Available Functions:

1. **`aiChat`** - Chat endpoint
   - Input: `{ message, context }`
   - Output: `{ reply }`

2. **`analyzeTask`** - Task analysis
   - Input: `{ taskTitle, taskDescription, projectTitle }`
   - Output: `{ analysis }` (complexity, estimatedDays, skills, etc.)

3. **`generateTaskSuggestions`** - Generate tasks for project
   - Input: `{ projectTitle, projectDescription }`
   - Output: `{ suggestions }` (array of tasks)

4. **`autoAssignTasks`** - Smart task assignment
   - Input: `{ projectId, tasks, volunteers }`
   - Output: `{ assignments }` (with matchScores)

5. **`getProjectInsights`** - Project health analysis
   - Input: `{ projectData, tasksData, volunteersData }`
   - Output: `{ insights }` (text)

---

## 📋 Checklist

- [ ] Set Gemini API key in Firebase Functions
- [ ] Deploy Firebase Functions: `firebase deploy --only functions`
- [ ] Test ChatBox at `/chat` route
- [ ] Import and use Gemini utilities in your components
- [ ] Add task analysis to task creation form
- [ ] Add project insights to dashboard
- [ ] Test all features

---

## 🐛 Troubleshooting

### "Gemini API key not configured"
- Check Firebase Functions config
- Ensure key is set correctly: `firebase functions:config:get`
- Redeploy functions after setting key

### Chat returns empty response
- Check Cloud Function logs in Firebase Console
- Verify API key is valid
- Check network requests in browser DevTools

### "Failed to parse Gemini response"
- This is usually temporary
- The `parseGeminiJSON` utility handles this
- Check if Gemini API is experiencing issues

### Functions still showing old code
- Clear Firebase cache: `firebase functions:log`
- Force redeploy: `firebase deploy --force --only functions`

---

## 📞 API Rate Limits

Google Gemini Free Tier:
- 60 requests per minute per project
- 1,500 requests per day per project

If you exceed limits:
- Wait before retry
- Consider upgrading to paid API
- Implement request throttling in your app

---

## 🎓 Example: Full Task Auto-Workflow

```javascript
import {
  generateTaskSuggestions,
  analyzeTask,
  autoAssignTasks,
  formatTaskForAnalysis,
  formatVolunteerForAssignment
} from './utils/geminiAPI';

const handleAutoWorkflow = async (projectId, projectData) => {
  try {
    // Step 1: Generate tasks
    const suggestedTasks = await generateTaskSuggestions(
      projectData.title,
      projectData.description
    );

    // Step 2: Analyze each task
    const analyzedTasks = await Promise.all(
      suggestedTasks.map(task =>
        analyzeTask(task.title, task.description, projectData.title)
      )
    );

    // Step 3: Create tasks in Firestore
    const createdTasks = [];
    for (const task of suggestedTasks) {
      const taskRef = await db
        .collection('projects').doc(projectId)
        .collection('tasks').add({
          ...task,
          status: 'pending',
          createdAt: new Date()
        });
      createdTasks.push({ id: taskRef.id, ...task });
    }

    // Step 4: Auto-assign tasks
    const volunteers = await db
      .collection('users')
      .where('projectIds', 'array-contains', projectId)
      .get();

    const assignments = await autoAssignTasks(
      projectId,
      createdTasks.map(formatTaskForAnalysis),
      volunteers.docs.map(doc => formatVolunteerForAssignment(doc.data()))
    );

    // Step 5: Apply assignments
    for (const assignment of assignments) {
      await db
        .collection('projects').doc(projectId)
        .collection('tasks').doc(assignment.taskId)
        .update({ assignedTo: assignment.volunteerId });
    }

    return { success: true, tasksCreated: createdTasks.length };
  } catch (error) {
    console.error('Workflow error:', error);
    throw error;
  }
};
```

---

## ✨ Next Steps

1. Set up your Gemini API key (see above)
2. Deploy Firebase Functions
3. Test the chatbot at `/chat`
4. Integrate AI features into your pages
5. Customize prompts in `functions/index.js` for your needs

Your app is now AI-powered! 🎉
