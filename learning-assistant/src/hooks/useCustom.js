/**
 * Custom React hooks
 */
import { useCallback, useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  calculateProgressFromChildren,
  calculateOverallProgress,
  calculateXP,
  calculateLevel,
  autoCompleteParent,
} from '../utils/businessLogic';
import { logger } from '../utils/logger';

export const useTopics = () => {
  const { state, dispatch, actions, saveTopicsData } = useAppContext();

  const addTopic = useCallback(
    (topicData) => {
      const newTopic = {
        ...topicData,
        id: `topic-${Date.now()}-${Math.random()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        progress: 0,
        confidence: 0,
        tags: [],
        notes: '',
        resources: [],
        children: [],
        revisions: [],
      };
      dispatch({ type: actions.ADD_TOPIC, payload: newTopic });
      saveTopicsData([...state.topics, newTopic]);
      logger.info('Topic added', { title: newTopic.title });
      return newTopic;
    },
    [state.topics, dispatch, actions, saveTopicsData]
  );

  const updateTopic = useCallback(
    (id, updates) => {
      const updatedTopics = state.topics.map((topic) => {
        if (topic.id === id) {
          const updated = {
            ...topic,
            ...updates,
            updatedAt: new Date().toISOString(),
          };

          // Auto-calculate progress from children
          if (topic.children && topic.children.length > 0) {
            updated.progress = calculateProgressFromChildren(updated, state.topics);
          }

          return updated;
        }
        return topic;
      });

      dispatch({ type: actions.SET_TOPICS, payload: updatedTopics });
      saveTopicsData(updatedTopics);
      logger.info('Topic updated', { id });
    },
    [state.topics, dispatch, actions, saveTopicsData]
  );

  const deleteTopic = useCallback(
    (id) => {
      const updatedTopics = state.topics.filter((t) => t.id !== id);
      dispatch({ type: actions.SET_TOPICS, payload: updatedTopics });
      saveTopicsData(updatedTopics);
      logger.info('Topic deleted', { id });
    },
    [state.topics, dispatch, actions, saveTopicsData]
  );

  const addSubtopic = useCallback(
    (parentId, subtopicData) => {
      const newSubtopic = {
        ...subtopicData,
        id: `topic-${Date.now()}-${Math.random()}`,
        parent: parentId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        progress: 0,
        confidence: 0,
        tags: [],
        notes: '',
        resources: [],
        children: [],
        revisions: [],
      };

      const updatedTopics = state.topics.map((topic) => {
        if (topic.id === parentId) {
          return {
            ...topic,
            children: [...(topic.children || []), newSubtopic.id],
            updatedAt: new Date().toISOString(),
          };
        }
        return topic;
      });

      updatedTopics.push(newSubtopic);
      dispatch({ type: actions.SET_TOPICS, payload: updatedTopics });
      saveTopicsData(updatedTopics);
      logger.info('Subtopic added', { parent: parentId, title: newSubtopic.title });
      return newSubtopic;
    },
    [state.topics, dispatch, actions, saveTopicsData]
  );

  const moveSubtopic = useCallback(
    (subtopicId, oldParentId, newParentId) => {
      const updatedTopics = state.topics.map((topic) => {
        if (topic.id === oldParentId) {
          return {
            ...topic,
            children: topic.children.filter((id) => id !== subtopicId),
          };
        }
        if (topic.id === newParentId) {
          return {
            ...topic,
            children: [...(topic.children || []), subtopicId],
          };
        }
        if (topic.id === subtopicId) {
          return {
            ...topic,
            parent: newParentId,
          };
        }
        return topic;
      });

      dispatch({ type: actions.SET_TOPICS, payload: updatedTopics });
      saveTopicsData(updatedTopics);
      logger.info('Subtopic moved', { subtopicId, from: oldParentId, to: newParentId });
    },
    [state.topics, dispatch, actions, saveTopicsData]
  );

  return {
    topics: state.topics,
    addTopic,
    updateTopic,
    deleteTopic,
    addSubtopic,
    moveSubtopic,
  };
};

export const useStats = () => {
  const { state, dispatch, actions, saveStatsData } = useAppContext();

  const updateStats = useCallback(
    (updates) => {
      const newStats = { ...state.stats, ...updates };
      dispatch({ type: actions.SET_STATS, payload: newStats });
      saveStatsData(newStats);
      logger.info('Stats updated', { stats: newStats });
    },
    [state.stats, dispatch, actions, saveStatsData]
  );

  const addXP = useCallback(
    (xpAmount) => {
      const newTotalXP = state.stats.totalXP + xpAmount;
      const newLevel = calculateLevel(newTotalXP);
      updateStats({
        totalXP: newTotalXP,
        level: newLevel,
        lastActivityDate: new Date().toISOString(),
      });
      logger.info('XP added', { amount: xpAmount, newTotal: newTotalXP, newLevel });
    },
    [state.stats, updateStats]
  );

  return {
    stats: state.stats,
    updateStats,
    addXP,
  };
};

export const useAchievements = () => {
  const { state, dispatch, actions } = useAppContext();

  const addAchievement = useCallback(
    (achievementData) => {
      const achievement = {
        ...achievementData,
        id: `achievement-${Date.now()}`,
        unlockedAt: new Date().toISOString(),
      };
      const newAchievements = [...state.achievements, achievement];
      dispatch({ type: actions.SET_ACHIEVEMENTS, payload: newAchievements });
      logger.info('Achievement unlocked', { title: achievement.title });
      return achievement;
    },
    [state.achievements, dispatch, actions]
  );

  const hasAchievement = useCallback(
    (title) => {
      return state.achievements.some((a) => a.title === title);
    },
    [state.achievements]
  );

  return {
    achievements: state.achievements,
    addAchievement,
    hasAchievement,
  };
};
