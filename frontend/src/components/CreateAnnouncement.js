import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MegaphoneIcon,
  PhotoIcon,
  XMarkIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import { announcementService } from '../services/announcementService';
import { clubService } from '../services/clubService';
import { useAuth } from '../contexts/AuthContext';
import {
  Alert,
  Avatar,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  PageHeader,
  PageSkeleton,
  Select,
  Textarea,
} from '../ui';

const MAX_CHARACTERS = 500;

const CreateAnnouncement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({ message: '', clubId: '', image: null });
  const [imagePreview, setImagePreview] = useState(null);
  const [userClubs, setUserClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserClubs = async () => {
      try {
        setLoadingClubs(true);
        const response = await clubService.getMyClubs();
        const approvedClubs = (response.createdClubs || []).filter((club) => club.status === 'approved');
        setUserClubs(approvedClubs);
        if (approvedClubs.length === 1) {
          setFormData((prev) => ({ ...prev, clubId: approvedClubs[0]._id }));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load your clubs.');
      } finally {
        setLoadingClubs(false);
      }
    };
    fetchUserClubs();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    if (name === 'message' && value.length > MAX_CHARACTERS) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('The image must be smaller than 5 MB.');
      return;
    }
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
      setError('Only JPEG, PNG and GIF images are supported.');
      return;
    }
    setFormData((prev) => ({ ...prev, image: file }));
    const reader = new FileReader();
    reader.onload = (readerEvent) => setImagePreview(readerEvent.target.result);
    reader.readAsDataURL(file);
    setError('');
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: null }));
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.message.trim()) {
      setError('Write a message before publishing.');
      return;
    }
    if (!formData.clubId) {
      setError('Choose the club this announcement belongs to.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await announcementService.createAnnouncement({
        message: formData.message.trim(),
        clubId: formData.clubId,
        image: formData.image,
      });
      navigate('/announcements', { state: { message: 'Announcement published.' } });
    } catch (err) {
      setError(err.message || 'Failed to publish the announcement.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingClubs) {
    return <PageSkeleton />;
  }

  if (userClubs.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader eyebrow="Announcements" title="Create an announcement" />
        <EmptyState
          icon={BuildingOffice2Icon}
          title="No approved clubs yet"
          description="Only approved club owners and members can post announcements. Create a club or join one first."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <ButtonLink to="/create-club">Create a club</ButtonLink>
              <ButtonLink to="/my-clubs" variant="secondary">
                View my clubs
              </ButtonLink>
            </div>
          }
        />
      </div>
    );
  }

  const selectedClub = userClubs.find((club) => club._id === formData.clubId);
  const authorName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'You';
  const characterRatio = formData.message.length / MAX_CHARACTERS;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Announcements"
        title="Create an announcement"
        description="Share a short update with your club members."
      />

      {error ? <Alert variant="error">{error}</Alert> : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader title="Announcement details" />
          <CardBody className="space-y-4">
            <Field label="Club" htmlFor="clubId" required>
              <Select id="clubId" name="clubId" value={formData.clubId} onChange={handleInputChange} required>
                <option value="">Choose a club</option>
                {userClubs.map((club) => (
                  <option key={club._id} value={club._id}>
                    {club.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Message" htmlFor="message" required>
              <Textarea
                id="message"
                name="message"
                rows={6}
                value={formData.message}
                onChange={handleInputChange}
                placeholder="What should members know? Include dates, places and next steps."
                required
              />
              <p
                className={`mt-1.5 text-right text-xs ${
                  characterRatio > 0.9
                    ? 'text-danger-600'
                    : characterRatio > 0.7
                    ? 'text-warning-600'
                    : 'text-ink-400 dark:text-ink-500'
                }`}
              >
                {formData.message.length}/{MAX_CHARACTERS}
              </p>
            </Field>

            <Field label="Image" hint="Optional. JPEG, PNG or GIF up to 5 MB.">
              {imagePreview ? (
                <div className="relative overflow-hidden rounded-[10px] border border-ink-200 dark:border-ink-800">
                  <img src={imagePreview} alt="Announcement preview" className="max-h-72 w-full object-cover" />
                  <button
                    type="button"
                    onClick={removeImage}
                    aria-label="Remove image"
                    className="absolute right-2 top-2 rounded-full bg-ink-950/70 p-1.5 text-white hover:bg-ink-950"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="rounded-[10px] border-2 border-dashed border-ink-200 p-6 text-center dark:border-ink-700">
                  <PhotoIcon className="mx-auto h-9 w-9 text-ink-400" aria-hidden="true" />
                  <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">Attach an image to make it stand out.</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="sr-only"
                    aria-label="Announcement image"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose image
                  </Button>
                </div>
              )}
            </Field>

            <div className="flex flex-col-reverse gap-2 border-t border-ink-100 pt-4 sm:flex-row sm:justify-end dark:border-ink-800">
              <ButtonLink to="/announcements" variant="secondary">
                Cancel
              </ButtonLink>
              <Button
                type="submit"
                icon={MegaphoneIcon}
                loading={loading}
                disabled={!formData.message.trim() || !formData.clubId}
              >
                Publish announcement
              </Button>
            </div>
          </CardBody>
        </Card>

        {formData.message.trim() ? (
          <Card>
            <CardHeader title="Preview" description="How it will look in the feed." />
            <CardBody>
              <div className="flex items-start gap-3">
                <Avatar name={authorName} src={user?.profilePicture} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-900 dark:text-white">{authorName}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">
                    {selectedClub?.name || 'Select a club'} · just now
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-ink-700 dark:text-ink-200">
                    {formData.message}
                  </p>
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt=""
                      className="mt-3 max-h-72 w-full rounded-[10px] border border-ink-200 object-cover dark:border-ink-800"
                    />
                  ) : null}
                </div>
              </div>
            </CardBody>
          </Card>
        ) : null}
      </form>
    </div>
  );
};

export default CreateAnnouncement;
