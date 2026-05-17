/**
 * Dashboard Page
 */
import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useTopics, useStats } from '../hooks/useCustom';
import { generateInsights, calculateOverallProgress } from '../utils/businessLogic';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Zap, BookOpen, Trophy, Target } from 'lucide-react';
import '../styles/Dashboard.css';

export const Dashboard = () => {
  const { state } = useAppContext();
  const { topics } = useTopics();
  const { stats } = useStats();

  const insights = useMemo(() => generateInsights(topics), [topics]);
  const overallProgress = useMemo(() => calculateOverallProgress(topics), [topics]);

  // Prepare data for pie chart
  const completionData = useMemo(() => {
    const completed = topics.filter((t) => t.status === 'Completed' || t.status === 'Mastered').length;
    const inProgress = topics.filter((t) => t.status === 'In Progress').length;
    const notStarted = topics.filter((t) => t.status === 'Not Started').length;

    return [
      { name: 'Completed', value: completed, fill: '#10b981' },
      { name: 'In Progress', value: inProgress, fill: '#f59e0b' },
      { name: 'Not Started', value: notStarted, fill: '#e5e7eb' },
    ];
  }, [topics]);

  // Progress by category
  const categoryProgress = useMemo(() => {
    return topics
      .filter((t) => !t.parent)
      .map((t) => ({
        name: t.title.substring(0, 12),
        progress: t.progress,
      }))
      .slice(0, 5);
  }, [topics]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="text-muted">Welcome back! Here's your learning progress.</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <Target size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Overall Progress</div>
            <div className="stat-value">{overallProgress}%</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <BookOpen size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Topics</div>
            <div className="stat-value">{topics.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <Zap size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">XP</div>
            <div className="stat-value">{stats.totalXP}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon info">
            <Trophy size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Level</div>
            <div className="stat-value">{stats.level}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Charts */}
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Completion Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={completionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {completionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {categoryProgress.length > 0 && (
            <div className="chart-card">
              <h3>Category Progress</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={categoryProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Line type="monotone" dataKey="progress" stroke="#6366f1" dot={{ fill: '#6366f1' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="insights-card">
          <h3>Learning Insights</h3>
          {insights.length > 0 ? (
            <div className="insights-list">
              {insights.map((insight, idx) => (
                <div key={idx} className={`insight-item ${insight.type}`}>
                  <div className="insight-icon">
                    {insight.type === 'strength' && '⭐'}
                    {insight.type === 'weakness' && '⚠️'}
                    {insight.type === 'revision' && '🔄'}
                    {insight.type === 'achievement' && '🎉'}
                  </div>
                  <div className="insight-message">{insight.message}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">Complete more topics to unlock insights</p>
          )}
        </div>
      </div>
    </div>
  );
};
