/**
 * Topic management hook.
 * Wraps the DB service and syncs state via context.
 */
import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import * as db from '../services/db';
import { calculateProgressFromChildren } from '../utils/businessLogic';
import { logger } from '../utils/logger';

export const useTopics = () => {
  const { state, refreshTopics, showToast } = useAppContext();

  const addTopic = useCallback(
    (data) => {
      const topic = db.addTopic(data);
      refreshTopics();
      logger.success('Topic added', { title: topic.title });
      return topic;
    },
    [refreshTopics]
  );

  const updateTopic = useCallback(
    (id, updates) => {
      const updated = db.updateTopic(id, updates);
      // Recalculate parent progress if this topic has a parent
      if (updated.parent) {
        const allTopics = db.getAllTopics();
        const parentTopic = allTopics.find((t) => t.id === updated.parent);
        if (parentTopic) {
          const progress = calculateProgressFromChildren(parentTopic, allTopics);
          db.updateTopic(parentTopic.id, { progress });
        }
      }
      refreshTopics();
      logger.info('Topic updated', { id });
      return updated;
    },
    [refreshTopics]
  );

  const deleteTopic = useCallback(
    (id) => {
      db.deleteTopic(id);
      refreshTopics();
      logger.info('Topic deleted', { id });
    },
    [refreshTopics]
  );

  const addSubtopic = useCallback(
    (parentId, data) => {
      const child = db.addSubtopic(parentId, data);
      refreshTopics();
      logger.success('Subtopic added', { title: child.title, parent: parentId });
      return child;
    },
    [refreshTopics]
  );

  const changeStatus = useCallback(
    (topicId, newStatus) => {
      const isComplete = newStatus === 'Completed' || newStatus === 'Mastered';
      db.updateTopic(topicId, {
        status: newStatus,
        progress: isComplete ? 100 : undefined,
        completedAt: isComplete ? new Date().toISOString() : null,
      });
      // Recalculate parent progress
      const allTopics = db.getAllTopics();
      const topic = allTopics.find((t) => t.id === topicId);
      if (topic?.parent) {
        const parent = allTopics.find((t) => t.id === topic.parent);
        if (parent) {
          const progress = calculateProgressFromChildren(parent, allTopics);
          const allChildrenDone = allTopics
            .filter((t) => t.parent === parent.id)
            .every((c) => c.status === 'Completed' || c.status === 'Mastered');
          db.updateTopic(parent.id, {
            progress,
            ...(allChildrenDone ? { status: 'Completed', completedAt: new Date().toISOString() } : {}),
          });
        }
      }
      refreshTopics();
      logger.info('Status changed', { topicId, newStatus });
    },
    [refreshTopics]
  );

  const importTopics = useCallback(
    (topicsArray) => {
      db.importTopics(topicsArray);
      refreshTopics();
      logger.success('Topics imported', { count: topicsArray.length });
    },
    [refreshTopics]
  );

  return {
    topics: state.topics,
    addTopic,
    updateTopic,
    deleteTopic,
    addSubtopic,
    changeStatus,
    importTopics,
  };
};
