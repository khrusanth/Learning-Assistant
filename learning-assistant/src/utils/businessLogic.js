/**
 * Pure business logic functions.
 * No side effects — these are all pure computations.
 */

export const CompletionStatus = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  MASTERED: 'Mastered',
  NEEDS_REVISION: 'Needs Revision',
};

/** Calculate progress from children completion */
export const calculateProgressFromChildren = (topic, allTopics) => {
  const children = allTopics.filter((t) => t.parent === topic.id);
  if (children.length === 0) return topic.progress || 0;
  const completed = children.filter(
    (c) => c.status === CompletionStatus.COMPLETED || c.status === CompletionStatus.MASTERED
  ).length;
  return Math.round((completed / children.length) * 100);
};

/** Calculate overall progress across all root topics */
export const calculateOverallProgress = (topics) => {
  const roots = topics.filter((t) => !t.parent);
  if (roots.length === 0) return 0;
  const total = roots.reduce((sum, t) => {
    const children = topics.filter((c) => c.parent === t.id);
    if (children.length === 0) {
      return sum + (t.status === CompletionStatus.COMPLETED || t.status === CompletionStatus.MASTERED ? 100 : t.progress || 0);
    }
    const completed = children.filter(
      (c) => c.status === CompletionStatus.COMPLETED || c.status === CompletionStatus.MASTERED
    ).length;
    return sum + Math.round((completed / children.length) * 100);
  }, 0);
  return Math.round(total / roots.length);
};

/** Calculate XP level from total XP */
export const calculateLevel = (totalXP) => Math.floor(totalXP / 500) + 1;

/** Get XP earned for a topic */
export const calculateXP = (topic) => {
  if (topic.status === CompletionStatus.MASTERED) return 150;
  if (topic.status === CompletionStatus.COMPLETED) return 100;
  if (topic.status === CompletionStatus.IN_PROGRESS) return Math.round((topic.progress || 0) * 0.5);
  return 0;
};

/** Generate insights from topics */
export const generateInsights = (topics) => {
  const insights = [];
  if (topics.length === 0) return insights;

  const roots = topics.filter((t) => !t.parent);

  // Category strengths/weaknesses
  if (roots.length > 1) {
    const withProgress = roots.map((r) => {
      const children = topics.filter((t) => t.parent === r.id);
      const completed = children.filter(
        (c) => c.status === CompletionStatus.COMPLETED || c.status === CompletionStatus.MASTERED
      ).length;
      const progress = children.length > 0 ? Math.round((completed / children.length) * 100) : (r.progress || 0);
      return { title: r.title, progress };
    });
    const sorted = [...withProgress].sort((a, b) => b.progress - a.progress);

    if (sorted[0]?.progress > (sorted[1]?.progress ?? 0)) {
      insights.push({
        type: 'strength',
        message: `You're strongest in ${sorted[0].title}! Keep it up!`,
      });
    }
    const weakest = sorted[sorted.length - 1];
    if (weakest && weakest.progress < 20) {
      insights.push({
        type: 'weakness',
        message: `${weakest.title} needs more attention.`,
      });
    }
  }

  // Revision reminders
  const completedTopics = topics.filter(
    (t) => t.status === CompletionStatus.COMPLETED || t.status === CompletionStatus.MASTERED
  );
  const needsRevision = completedTopics.filter((t) => {
    if (!t.revisions || t.revisions.length === 0) return true;
    const last = t.revisions[t.revisions.length - 1];
    const daysSince = Math.floor(
      (Date.now() - new Date(last.date || last.scheduledDate).getTime()) / 86400000
    );
    return daysSince >= (last.nextRevisionDays || 7);
  });
  if (needsRevision.length > 0) {
    insights.push({
      type: 'revision',
      message: `${needsRevision.length} topic(s) may need revision.`,
    });
  }

  // Completion milestone
  const rate = Math.round((completedTopics.length / topics.length) * 100);
  if (rate > 70) {
    insights.push({
      type: 'achievement',
      message: `Great job! You've completed ${rate}% of your topics!`,
    });
  }

  return insights;
};

/** Get a status badge variant name */
export const getStatusBadge = (status) => {
  switch (status) {
    case CompletionStatus.COMPLETED: return 'success';
    case CompletionStatus.MASTERED: return 'primary';
    case CompletionStatus.IN_PROGRESS: return 'warning';
    case CompletionStatus.NEEDS_REVISION: return 'danger';
    default: return 'neutral';
  }
};
