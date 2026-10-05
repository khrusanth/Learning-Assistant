/**
 * Confirmation Dialog Component
 * Replaces native confirm() with a professional modal.
 */
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { AlertTriangle } from 'lucide-react';

export const ConfirmDialog = () => {
  const { state } = useAppContext();
  const dialog = state.confirmDialog;

  if (!dialog) return null;

  return (
    <div className="modal-overlay" onClick={dialog.onCancel}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-body">
          <div className="confirm-body">
            <div className="confirm-icon">
              <AlertTriangle size={28} />
            </div>
            <p className="confirm-message">{dialog.message}</p>
            <div className="confirm-footer">
              <button className="btn btn-secondary" onClick={dialog.onCancel}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={dialog.onConfirm}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
