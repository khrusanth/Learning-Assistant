/**
 * Business logic utilities
 */
import { logger } from './logger';

export const CompletionStatus = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  MASTERED: 'Mastered',
  NEEDS_REVISION: 'Needs Revision',
};

export const RevisionStatus = {
  DONE: 'Done',
  NEEDS_REVISION: 'Needs Revision',
  FORGOTTEN: 'Forgotten',
};

// Calculate progress from children
export const calculateProgressFromChildren = (topic, allTopics) => {
  if (!topic.children || topic.children.length === 0) {
    return topic.progress;
  }

  const children = allTopics.filter((t) => topic.children.includes(t.id));
  if (children.length === 0) return topic.progress;

  const avgProgress = children.reduce((sum, child) => sum + (child.progress || 0), 0) / children.length;
  return Math.round(avgProgress);
};

// Calculate overall progress
export const calculateOverallProgress = (topics) => {
  if (topics.length === 0) return 0;

  // Only count root topics (no parent)
  const rootTopics = topics.filter((t) => !t.parent);
  if (rootTopics.length === 0) return 0;

  const totalProgress = rootTopics.reduce((sum, topic) => sum + (topic.progress || 0), 0);
  return Math.round(totalProgress / rootTopics.length);
};

// Auto-complete parent when all children are complete
export const autoCompleteParent = (topic, allTopics) => {
  if (!topic.parent) return topic;

  const parentTopic = allTopics.find((t) => t.id === topic.parent);
  if (!parentTopic) return topic;

  const children = allTopics.filter((t) => parentTopic.children.includes(t.id));
  const allChildrenCompleted = children.every(
    (child) =>
      child.status === CompletionStatus.COMPLETED ||
      child.status === CompletionStatus.MASTERED
  );

  if (allChildrenCompleted && parentTopic.progress === 100) {
    parentTopic.status = CompletionStatus.COMPLETED;
    parentTopic.completedAt = new Date().toISOString();
  }

  return topic;
};

// Calculate XP based on topic completion
export const calculateXP = (topic, multiplier = 1) => {
  let xp = 0;

  // Base XP for completion
  if (topic.status === CompletionStatus.COMPLETED) {
    xp = 100 * multiplier;
  } else if (topic.status === CompletionStatus.MASTERED) {
    xp = 150 * multiplier;
  } else if (topic.status === CompletionStatus.IN_PROGRESS) {
    xp = topic.progress * 0.5 * multiplier;
  }

  // Confidence bonus
  if (topic.confidence > 80) {
    xp += 50 * multiplier;
  }

  return Math.round(xp);
};

// Calculate level from total XP
export const calculateLevel = (totalXP) => {
  const xpPerLevel = 500;
  return Math.floor(totalXP / xpPerLevel) + 1;
};

// Get level up threshold
export const getLevelUpThreshold = (currentLevel) => {
  return currentLevel * 500;
};

// Schedule revision based on spaced repetition
export const scheduleRevision = (completedDate, daysForNextRevision = 1) => {
  const nextRevisionDate = new Date(new Date(completedDate).getTime() + daysForNextRevision * 24 * 60 * 60 * 1000);
  return nextRevisionDate.toISOString();
};

// Get topics needing revision
export const getTopicsNeedingRevision = (topics, now = new Date()) => {
  return topics.filter((topic) => {
    if (topic.status !== CompletionStatus.COMPLETED && topic.status !== CompletionStatus.MASTERED) {
      return false;
    }

    // Check if has revisions scheduled
    if (!topic.revisions || topic.revisions.length === 0) return true;

    const lastRevision = topic.revisions[topic.revisions.length - 1];
    const lastRevisionDate = new Date(lastRevision.scheduledDate || lastRevision.date);
    const daysSinceLastRevision = Math.floor((now - lastRevisionDate) / (1000 * 60 * 60 * 24));

    // Need revision if more than scheduled days have passed
    return daysSinceLastRevision >= (lastRevision.nextRevisionDays || 1);
  });
};

// Get learning insights
export const generateInsights = (topics) => {
  const insights = [];

  if (topics.length === 0) return insights;

  // Category analysis
  const rootTopics = topics.filter((t) => !t.parent);
  if (rootTopics.length > 1) {
    const categoryProgress = rootTopics.map((t) => ({
      title: t.title,
      progress: t.progress,
      children: t.children.length,
    }));

    const sortedByProgress = [...categoryProgress].sort((a, b) => b.progress - a.progress);

    if (sortedByProgress[0] && sortedByProgress[0].progress > sortedByProgress[1]?.progress) {
      insights.push({
        type: 'strength',
        message: `You're strongest in ${sortedByProgress[0].title}! Keep it up!`,
      });
    }

    if (sortedByProgress[sortedByProgress.length - 1].progress < 20) {
      insights.push({
        type: 'weakness',
        message: `${sortedByProgress[sortedByProgress.length - 1].title} needs more attention.`,
      });
    }
  }

  // Revision reminders
  const needsRevision = getTopicsNeedingRevision(topics);
  if (needsRevision.length > 0) {
    insights.push({
      type: 'revision',
      message: `You have ${needsRevision.length} topic(s) that need revision.`,
    });
  }

  // Completion rate
  const completed = topics.filter((t) => t.status === CompletionStatus.COMPLETED || t.status === CompletionStatus.MASTERED).length;
  const completionRate = Math.round((completed / topics.length) * 100);
  if (completionRate > 70) {
    insights.push({
      type: 'achievement',
      message: `Great job! You've completed ${completionRate}% of your topics!`,
    });
  }

  return insights;
};

// Get learning streak
export const calculateStreak = (completedTopics) => {
  if (completedTopics.length === 0) return 0;

  const sorted = [...completedTopics]
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  let streak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentDate = new Date(sorted[0].completedAt);
  currentDate.setHours(0, 0, 0, 0);

  // Check if first completion is today or yesterday
  const dayDiff = Math.floor((today - currentDate) / (1000 * 60 * 60 * 24));
  if (dayDiff > 1) return 0;

  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i].completedAt);
    prevDate.setHours(0, 0, 0, 0);

    const diff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }

  return streak;
};
