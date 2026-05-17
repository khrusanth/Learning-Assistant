/**
 * Modal Component
 */
import React from 'react';
import { X } from 'lucide-react';
import '../styles/Modal.css';

export const Modal = ({ type, data, formData, onFormChange, onSave, onClose }) => {
  const getTitle = () => {
    switch (type) {
      case 'addTopic':
        return 'Add New Topic';
      case 'editTopic':
        return 'Edit Topic';
      case 'addSubtopic':
        return `Add Subtopic to "${data.parentTitle}"`;
      default:
        return 'Modal';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{getTitle()}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={onFormChange}
              placeholder="Enter topic title"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={onFormChange}
              placeholder="Enter topic description (optional)"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
