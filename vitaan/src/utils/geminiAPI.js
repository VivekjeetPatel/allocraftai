import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

/**
 * Gemini API Utility Functions
 * All functions use Firebase Cloud Functions as backend
 */

// ========================
// 1. CHAT & QUERIES
// ========================

/**
 * Get AI response for a chat message
 * @param {string} message - User message
 * @param {object} context - Optional context (userRole, userName, projectId, etc.)
 * @returns {Promise<string>} AI response text
 */
export const chatWithAI = async (message, context = {}) => {
  try {
    const aiChat = httpsCallable(functions, 'aiChat');
    const response = await aiChat({ message, context });
    return response.data.reply;
  } catch (error) {
    console.error('Chat Error:', error);
    throw new Error('Failed to get AI response');
  }
};

/**
 * Ask Gemini about queries (with project context)
 * @param {string} query - User's question
 * @param {string} projectTitle - Project context
 * @returns {Promise<string>} AI suggestion
 */
export const askQuery = async (query, projectTitle = '') => {
  return chatWithAI(query, { projectTitle, type: 'query' });
};

// ========================
// 2. TASK ANALYSIS
// ========================

/**
 * Analyze a task and get recommendations
 * @param {string} taskTitle - Task title
 * @param {string} taskDescription - Task description
 * @param {string} projectTitle - Project title
 * @returns {Promise<object>} Analysis with complexity, estimatedDays, requiredSkills, etc.
 */
export const analyzeTask = async (taskTitle, taskDescription, projectTitle = '') => {
  try {
    const analyze = httpsCallable(functions, 'analyzeTask');
    const response = await analyze({ taskTitle, taskDescription, projectTitle });
    return response.data.analysis;
  } catch (error) {
    console.error('Task Analysis Error:', error);
    throw new Error('Failed to analyze task');
  }
};

/**
 * Generate task suggestions for a project
 * @param {string} projectTitle - Project title
 * @param {string} projectDescription - Project description
 * @returns {Promise<array>} Array of suggested tasks
 */
export const generateTaskSuggestions = async (projectTitle, projectDescription) => {
  try {
    const suggest = httpsCallable(functions, 'generateTaskSuggestions');
    const response = await suggest({ projectTitle, projectDescription });
    return response.data.suggestions;
  } catch (error) {
    console.error('Task Suggestion Error:', error);
    throw new Error('Failed to generate task suggestions');
  }
};

// ========================
// 3. AUTO-ASSIGNMENT
// ========================

/**
 * Auto-assign tasks to volunteers based on skills and workload
 * @param {string} projectId - Project ID
 * @param {array} tasks - Array of task objects with title, description, requiredSkills
 * @param {array} volunteers - Array of volunteer objects with uid, name, skills, taskCount
 * @returns {Promise<array>} Array of assignments with taskId, volunteerId, matchScore, reason
 */
export const autoAssignTasks = async (projectId, tasks, volunteers) => {
  try {
    const assign = httpsCallable(functions, 'autoAssignTasks');
    const response = await assign({ projectId, tasks, volunteers });
    return response.data.assignments;
  } catch (error) {
    console.error('Auto-Assign Error:', error);
    throw new Error('Failed to auto-assign tasks');
  }
};

// ========================
// 4. PROJECT INSIGHTS
// ========================

/**
 * Get AI insights about project health, risks, and recommendations
 * @param {object} projectData - Project object
 * @param {array} tasksData - Array of tasks with status, deadline
 * @param {array} volunteersData - Array of volunteers with performance data
 * @returns {Promise<string>} AI insights text
 */
export const getProjectInsights = async (projectData, tasksData = [], volunteersData = []) => {
  try {
    const insights = httpsCallable(functions, 'getProjectInsights');
    const response = await insights({ projectData, tasksData, volunteersData });
    return response.data.insights;
  } catch (error) {
    console.error('Project Insights Error:', error);
    throw new Error('Failed to get project insights');
  }
};

// ========================
// 5. HELPER FUNCTIONS
// ========================

/**
 * Format task data for Gemini analysis
 * @param {object} task - Firestore task document
 * @returns {object} Formatted task
 */
export const formatTaskForAnalysis = (task) => ({
  id: task.id,
  title: task.title,
  description: task.description || '',
  priority: task.priority || 'Medium',
  deadline: task.deadline?.toDate?.()?.toISOString() || '',
  skills: task.requiredSkills || [],
});

/**
 * Format volunteer data for auto-assignment
 * @param {object} volunteer - Firestore user document
 * @returns {object} Formatted volunteer
 */
export const formatVolunteerForAssignment = (volunteer) => ({
  volunteerId: volunteer.uid,
  name: volunteer.name,
  skills: volunteer.skills || [],
  taskCount: volunteer.assignedTasks || 0,
  role: volunteer.role,
  availability: volunteer.availability || 'available',
});

/**
 * Parse Gemini JSON response safely
 * @param {string} text - Response text that may contain JSON
 * @returns {object} Parsed JSON or null
 */
export const parseGeminiJSON = (text) => {
  try {
    // Try direct parse
    return JSON.parse(text);
  } catch (e) {
    try {
      // Try extracting JSON from text
      const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e2) {
      // Return null if can't parse
      console.error('Failed to parse Gemini response as JSON:', text);
      return null;
    }
  }
};

export default {
  chatWithAI,
  askQuery,
  analyzeTask,
  generateTaskSuggestions,
  autoAssignTasks,
  getProjectInsights,
  formatTaskForAnalysis,
  formatVolunteerForAssignment,
  parseGeminiJSON,
};
