import React, { useState } from 'react';
import { CloudArrowUpIcon, PhotoIcon } from '@heroicons/react/24/outline';
import FileUpload from '../components/FileUpload';
import MediaGallery from '../components/MediaGallery';
import { Card, PageHeader, SegmentedControl } from '../ui';

const tabs = [
  { value: 'upload', label: 'Upload', icon: CloudArrowUpIcon },
  { value: 'gallery', label: 'Media gallery', icon: PhotoIcon },
];

const FileManagement = () => {
  const [tab, setTab] = useState('upload');

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Files"
        description="Upload images, documents and media for your clubs and events, then reuse them in announcements."
      />

      <div className="mt-6">
        <SegmentedControl
          options={tabs.map(({ value, label }) => ({ value, label }))}
          value={tab}
          onChange={setTab}
          label="File management section"
        />
      </div>

      <Card className="mt-5">
        {tab === 'upload' ? (
          <FileUpload
            onUploadComplete={() => setTab('gallery')}
            acceptedFileTypes={{
              'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp'],
              'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
              'application/pdf': ['.pdf'],
              'application/msword': ['.doc'],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
              'text/*': ['.txt', '.csv'],
            }}
            maxFiles={10}
            maxFileSize={50 * 1024 * 1024}
          />
        ) : (
          <div className="p-2 sm:p-4">
            <MediaGallery />
          </div>
        )}
      </Card>
    </>
  );
};

export default FileManagement;
