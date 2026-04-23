/**
 * Toast.js — Compact Notification System
 * Shows small, non-intrusive toast notifications.
 */

let activeToast = null;

/**
 * Shows a compact toast notification.
 * @param {string} message - Text to display
 * @param {'success'|'error'|'info'} type
 * @param {number} durationMs - Auto-dismiss time
 */
export function showToast(message, type = 'info', durationMs = 2500) {
  // Remove existing toast immediately
  if (activeToast) {
    activeToast.remove();
    activeToast = null;
  }

  const emojis = { success: '✅', error: '❌', info: 'ℹ️' };

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__emoji">${emojis[type] || emojis.info}</span>
    <span class="toast__message">${message}</span>
  `;

  document.body.appendChild(toast);
  activeToast = toast;

  // Auto dismiss
  setTimeout(() => {
    toast.classList.add('toast--exiting');
    toast.addEventListener('animationend', () => {
      toast.remove();
      if (activeToast === toast) activeToast = null;
    });
  }, durationMs);

  return toast;
}
