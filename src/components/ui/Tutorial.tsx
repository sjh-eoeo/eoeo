import React, { useState } from 'react';
import Joyride, { Step, CallBackProps, STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from './Button';

interface TutorialProps {
  page: 'dashboard' | 'videos' | 'profiles' | 'payments' | 'finance' | 'admin';
}

const tutorialSteps: Record<string, Step[]> = {
  dashboard: [
    {
      target: 'body',
      content: '🎉 Welcome to the Dashboard! This is your command center where you can monitor all key metrics at a glance.',
      placement: 'center',
    },
    {
      target: '[data-tour="summary-cards"]',
      content: '📊 Summary Cards: View real-time statistics including total profiles, videos, views, and engagement rates. These numbers update automatically as data changes.',
    },
    {
      target: '[data-tour="payment-summary"]',
      content: '💰 Payment Summary: Track total contract amounts, paid amounts, and remaining balances. The progress bar shows payment completion percentage.',
    },
    {
      target: '[data-tour="top-performers"]',
      content: '🏆 Top Performing Profiles: See the top 5 creators ranked by video upload count. Click any profile card to visit their TikTok profile.',
    },
    {
      target: '[data-tour="recent-videos"]',
      content: '🎬 Recent Videos: View the 5 most recently uploaded videos. Click video or profile links to open them directly on TikTok.',
    },
  ],
  videos: [
    {
      target: 'body',
      content: '🎬 Welcome to Videos Management! Here you can track and manage all TikTok video uploads.',
      placement: 'center',
    },
    {
      target: '[data-tour="add-video-btn"]',
      content: '➕ Add Video Button: Click here to upload a new video record. You\'ll enter TikTok ID, video URL, upload date, brand, and optional notes.',
    },
    {
      target: '[data-tour="search-bar"]',
      content: '🔍 Search Bar: Quickly find videos by searching for TikTok ID, video ID, or any text in notes. Type and press Enter to search.',
    },
    {
      target: '[data-tour="brand-filter"]',
      content: '🏷️ Brand Filter: Filter videos by specific brand. Select "All Brands" to see everything, or choose a brand to view only its videos.',
    },
    {
      target: '[data-tour="select-all"]',
      content: '☑️ Select All Checkbox: Check this to select all videos on the current page. Use this for bulk actions like mass deletion.',
    },
    {
      target: '[data-tour="delete-selected"]',
      content: '🗑️ Delete Selected Button: After selecting videos, click this to delete multiple videos at once. Requires confirmation.',
    },
    {
      target: '[data-tour="videos-table"]',
      content: '📋 Videos Table: View all video details including upload date, TikTok profile & video links (clickable), brand, GMV Boost status, and notes. Click Edit to modify or Delete to remove.',
    },
    {
      target: '[data-tour="gmv-boost"]',
      content: '📈 GMV Boost Column: Shows if GMV Boost campaign is enabled. Click "Enable" to set up daily budget and campaign duration, or "Edit" to modify existing campaigns.',
    },
    {
      target: '[data-tour="pagination"]',
      content: '📄 Pagination Controls: Navigate through pages with First, Previous, Next, Last buttons. Shows 20 videos per page. Current page and total count displayed in the center.',
    },
    {
      target: '[data-tour="edit-video"]',
      content: '✏️ Edit Button: Click to modify video details. You can update any field including GMV Boost settings.',
    },
    {
      target: '[data-tour="delete-video"]',
      content: '🗑️ Delete Button: Permanently remove a video record. This action cannot be undone.',
    },
  ],
  profiles: [
    {
      target: 'body',
      content: '� Welcome to Profile Management! Here you manage all creator profiles, contracts, payments, and shipping information.',
      placement: 'center',
    },
    {
      target: '[data-tour="add-profile-btn"]',
      content: '➕ Add Profile Button: Create a new creator profile. Enter TikTok ID, brand, real name, address, contract terms, bank details, and payment information.',
    },
    {
      target: '[data-tour="search-bar"]',
      content: '🔍 Search Bar: Find profiles by TikTok ID, real name, address, or any text field. Type your query and press Enter.',
    },
    {
      target: '[data-tour="brand-filter"]',
      content: '🏷️ Brand Filter: View profiles by specific brand. Select a brand to filter, or "All Brands" to see all profiles.',
    },
    {
      target: '[data-tour="profiles-table"]',
      content: '📋 Profiles Table: Complete overview of all creators including TikTok ID (clickable link), contract amount, payment status, shipping tracking, and action buttons.',
    },
    {
      target: '[data-tour="tiktok-link"]',
      content: "🔗 TikTok Profile Link: Click the TikTok ID to open the creator's profile on TikTok in a new tab.",
    },
    {
      target: '[data-tour="payment-info"]',
      content: '💰 Payment Information: Shows contract amount, paid amount, remaining balance, and payment completion percentage. Updated automatically as payments are recorded.',
    },
    {
      target: '[data-tour="shipping-tracking"]',
      content: '📦 Shipping Tracking Column: Displays shipping status (Pending/Shipped/Delivered). Click to expand and add tracking number, carrier, estimated delivery date.',
    },
    {
      target: '[data-tour="shipping-confirm"]',
      content: '✅ Confirm Delivery Button: After product is delivered, click this to mark shipment as complete and record delivery date.',
    },
    {
      target: '[data-tour="contract-upload"]',
      content: '📄 Contract Upload: Upload signed contract PDF files. Files are stored in Firebase Storage and can be viewed/downloaded anytime.',
    },
    {
      target: '[data-tour="view-contract"]',
      content: '�️ View Contract Button: Opens uploaded contract file in a new tab for review or download.',
    },
    {
      target: '[data-tour="edit-profile"]',
      content: '✏️ Edit Button: Modify profile details including personal info, contract terms, bank details, and payment information.',
    },
    {
      target: '[data-tour="delete-profile"]',
      content: '🗑️ Delete Button: Permanently remove a profile. Warning: This also deletes associated videos and payments. Cannot be undone.',
    },
  ],
  payments: [
    {
      target: 'body',
      content: '💰 Welcome to Payments Management! Track all contract payments, invoices, and payment methods.',
      placement: 'center',
    },
    {
      target: '[data-tour="add-payment-btn"]',
      content: '➕ Add Payment Button: Record a new payment. Enter TikTok ID, payment amount, payment date, payment method, and upload invoice PDF.',
    },
    {
      target: '[data-tour="search-bar"]',
      content: '🔍 Search Bar: Find payments by TikTok ID, payment method, memo text, or any payment details. Type and press Enter.',
    },
    {
      target: '[data-tour="brand-filter"]',
      content: '🏷️ Brand Filter: View payments for specific brand. Select a brand or "All Brands" to see all payment records.',
    },
    {
      target: '[data-tour="status-filter"]',
      content: '📊 Status Filter: Filter by payment status - All, Pending, Partial, or Paid. Helps identify outstanding payments.',
    },
    {
      target: '[data-tour="payments-table"]',
      content: '📋 Payments Table: Complete payment history including date, amount, method, contract amount, remaining balance, and invoice files.',
    },
    {
      target: '[data-tour="payment-method"]',
      content: '💳 Payment Method Column: Shows how payment was made (Bank Transfer, PayPal, Cash, Check, Wire Transfer). Can be updated when editing.',
    },
    {
      target: '[data-tour="invoice-upload"]',
      content: '📄 Upload Invoice: Attach PDF invoice files to payment records. Files are stored securely in Firebase Storage.',
    },
    {
      target: '[data-tour="view-invoice"]',
      content: '👁️ View Invoice Button: Opens uploaded invoice PDF in new tab for review or download.',
    },
    {
      target: '[data-tour="payment-progress"]',
      content: '📈 Payment Progress: Visual progress bar showing percentage of contract amount paid. Green when 100% complete.',
    },
    {
      target: '[data-tour="payment-due"]',
      content: '⚠️ Payment Alerts: Automatic warnings for upcoming payment due dates. Helps ensure timely payments.',
    },
    {
      target: '[data-tour="edit-payment"]',
      content: '✏️ Edit Button: Modify payment details including amount, date, method, or upload new invoice.',
    },
    {
      target: '[data-tour="delete-payment"]',
      content: '🗑️ Delete Button: Remove payment record. This updates the remaining balance automatically. Cannot be undone.',
    },
  ],
  finance: [
    {
      target: 'body',
      content: '� Welcome to Finance Dashboard! This is a dedicated page for finance team to view and export all payment records.',
      placement: 'center',
    },
    {
      target: '[data-tour="access-control"]',
      content: '� Access Control: This page is only accessible to users with Admin or Finance role. Regular users cannot view financial data.',
    },
    {
      target: '[data-tour="summary-stats"]',
      content: '� Summary Statistics: View total payment count, total amount paid, and number of invoices. These stats reflect current filters.',
    },
    {
      target: '[data-tour="export-csv"]',
      content: '📥 Export CSV Button: Download all payment records as CSV file for Excel. Includes BOM encoding for proper display of special characters.',
    },
    {
      target: '[data-tour="date-range"]',
      content: '📅 Date Range Filter: Select start and end dates to view payments within specific time period. Both dates are optional.',
    },
    {
      target: '[data-tour="clear-filters"]',
      content: '🔄 Clear Filters Button: Reset all date filters to view all payment records again.',
    },
    {
      target: '[data-tour="finance-table"]',
      content: '📋 Finance Table: Consolidated view of all payments across all brands. Includes TikTok ID, date, amount, method, brand, and invoice files.',
    },
    {
      target: '[data-tour="view-file"]',
      content: '👁️ View File Button: Click to open invoice PDF in new tab. Uses Firebase Storage secure URLs for file access.',
    },
    {
      target: '[data-tour="brand-column"]',
      content: '🏷️ Brand Column: Shows which brand the payment belongs to. Helps identify revenue sources.',
    },
    {
      target: '[data-tour="payment-date"]',
      content: '📆 Payment Date Column: Date when payment was made. Sortable by clicking column header.',
    },
  ],
  admin: [
    {
      target: 'body',
      content: '� Welcome to Admin Panel! Manage user permissions, system settings, and data. Admin-only access.',
      placement: 'center',
    },
    {
      target: '[data-tour="user-management"]',
      content: '👥 User Management Section: View and manage all registered users including their status, role, and access permissions.',
    },
    {
      target: '[data-tour="users-table"]',
      content: '📋 Users Table: Complete list of all users with email, display name, status, role, and last sign-in date.',
    },
    {
      target: '[data-tour="user-status"]',
      content: '✅ User Status Dropdown: Change user status between Active and Inactive. Inactive users cannot access the system.',
    },
    {
      target: '[data-tour="user-role"]',
      content: '� User Role Dropdown: Assign roles - User (basic access), Finance (finance page access), or Admin (full access). Controls page visibility.',
    },
    {
      target: '[data-tour="last-signin"]',
      content: '🕐 Last Sign-In Column: Shows when user last logged in. Helps identify active vs inactive users.',
    },
    {
      target: '[data-tour="system-stats"]',
      content: '📊 System Statistics Cards: Real-time counts of total users, active users, and admin users. Updates automatically.',
    },
    {
      target: '[data-tour="total-users"]',
      content: '� Total Users Card: Shows count of all registered users in the system.',
    },
    {
      target: '[data-tour="active-users"]',
      content: '✅ Active Users Card: Shows count of users with Active status who can log in.',
    },
    {
      target: '[data-tour="admin-count"]',
      content: '👑 Admin Users Card: Shows count of users with Admin role who have full system access.',
    },
    {
      target: '[data-tour="danger-zone"]',
      content: '⚠️ Danger Zone: Critical system actions that can cause data loss. Use with extreme caution!',
    },
    {
      target: '[data-tour="delete-all"]',
      content: '🚨 Delete All Data Button: Permanently deletes ALL videos, profiles, and payments from the system. This action is IRREVERSIBLE! Only use for system reset.',
    },
  ],
};

export const Tutorial: React.FC<TutorialProps> = ({ page }) => {
  const { appUser } = useAuthStore();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Check if user has seen the tutorial
  const tutorialKey = `tutorial-seen-${page}`;
  const hasSeenTutorial = localStorage.getItem(tutorialKey);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false);
      setStepIndex(0);
      localStorage.setItem(tutorialKey, 'true');
    } else if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
      setStepIndex(index + 1);
    } else if (type === EVENTS.STEP_AFTER && action === ACTIONS.PREV) {
      setStepIndex(index - 1);
    }
  };

  const startTutorial = () => {
    setStepIndex(0);
    setRun(true);
  };

  const steps = tutorialSteps[page] || [];

  // Auto-start tutorial on first visit
  React.useEffect(() => {
    if (!hasSeenTutorial && steps.length > 0) {
      // Delay to ensure DOM elements are loaded
      const timer = setTimeout(() => {
        setRun(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTutorial, steps.length]);

  if (!appUser || steps.length === 0) return null;

  return (
    <>
      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        callback={handleJoyrideCallback}
        continuous
        showProgress
        showSkipButton
        disableScrolling={false}
        styles={{
          options: {
            primaryColor: '#06b6d4',
            textColor: '#ffffff',
            backgroundColor: '#1f2937',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            arrowColor: '#1f2937',
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: 8,
            fontSize: 14,
          },
          buttonNext: {
            backgroundColor: '#06b6d4',
            borderRadius: 6,
            padding: '8px 16px',
          },
          buttonBack: {
            color: '#9ca3af',
            marginRight: 10,
          },
          buttonSkip: {
            color: '#9ca3af',
          },
        }}
        locale={{
          back: 'Back',
          close: 'Close',
          last: 'Finish',
          next: 'Next',
          skip: 'Skip',
        }}
      />

      {/* Tutorial Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={startTutorial}
        className="fixed bottom-6 right-6 z-50 shadow-lg"
      >
        💡 Tutorial
      </Button>
    </>
  );
};
