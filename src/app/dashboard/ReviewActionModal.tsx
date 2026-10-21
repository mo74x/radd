/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Send, AlertTriangle } from 'lucide-react';
import {
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Icon,
  StarRating,
  Textarea,
  useToast,
} from '@/components/ui';

export interface ReviewItemData {
  id: string;
  reviewer_name?: string | null;
  rating: number;
  text?: string | null;
  flags?: string[] | null;
  location_name?: string | null;
  draft?: {
    id: string;
    body: string;
    final_body?: string | null;
    status: string;
    approval_token?: string;
    model?: string;
    prompt_version?: string;
  } | null;
}

export interface ReviewActionModalProps {
  review: ReviewItemData | null;
  open: boolean;
  onClose: () => void;
}

export const ReviewActionModal: React.FC<ReviewActionModalProps> = ({
  review,
  open,
  onClose,
}) => {
  const router = useRouter();
  const toast = useToast();

  const draft = review?.draft;
  const initialText = draft?.final_body || draft?.body || '';
  const [replyText, setReplyText] = useState(initialText);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initialText when modal opens for a new review
  React.useEffect(() => {
    if (review?.draft) {
      setReplyText(review.draft.final_body || review.draft.body || '');
    }
  }, [review]);

  if (!review) return null;

  const handleApprove = async () => {
    if (!draft?.approval_token) {
      toast.error('Approval token missing for this draft.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isEdited = replyText.trim() !== draft.body.trim();
      const res = await fetch(`/api/drafts/${draft.approval_token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isEdited ? 'edit' : 'approve',
          editedBody: isEdited ? replyText : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to approve reply');
      }

      toast.success('Reply approved and queued for Google publishing!');
      onClose();
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Approval failed';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} size="lg">
      <DialogHeader onClose={onClose}>
        <div className="flex items-center gap-2">
          <DialogTitle>Review & Approve AI Reply</DialogTitle>
          <Badge variant="accent" size="sm">
            {draft?.status || 'Draft'}
          </Badge>
        </div>
        <DialogDescription>
          Customize the response if needed. Once approved, it will be published to Google Business Profile.
        </DialogDescription>
      </DialogHeader>

      <DialogBody>
        {/* Customer Review Snapshot */}
        <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-2 text-start">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-text text-sm">
                {review.reviewer_name || 'Customer'}
              </span>
              {review.location_name && (
                <span className="text-xs text-text-muted">
                  📍 {review.location_name}
                </span>
              )}
            </div>
            <StarRating value={review.rating} size="sm" />
          </div>

          <p dir="auto" className="text-sm text-text leading-relaxed">
            {review.text || <span className="italic text-text-muted">(Star rating only — no comment)</span>}
          </p>

          {review.flags && review.flags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {review.flags.map((flag) => (
                <Badge key={flag} variant="danger" size="sm">
                  <Icon icon={AlertTriangle} size={12} className="me-1" />
                  {flag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Proposed Reply Textarea with live character counter */}
        <div className="space-y-2 text-start pt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-text flex items-center gap-1.5">
              <Icon icon={Sparkles} size={16} className="text-primary" />
              <span>Drafted Reply</span>
            </span>
            {draft?.model && (
              <span className="text-xs text-text-muted font-mono">
                {draft.model} ({draft.prompt_version})
              </span>
            )}
          </div>

          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            maxLength={1000}
            showCount
            rows={5}
            placeholder="Write or customize your response here..."
          />
        </div>
      </DialogBody>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="primary"
          loading={isSubmitting}
          onClick={handleApprove}
          startIcon={<Icon icon={Send} size={16} />}
        >
          Approve & Publish to Google
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
