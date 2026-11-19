import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarIcon,
  CheckIcon,
  MapPinIcon,
  PlusIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { clubService } from '../services/clubService';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  SearchInput,
  SkeletonCard,
} from '../ui';

const categories = ['all', 'Academic', 'Sports', 'Arts', 'Technology', 'Cultural', 'Social', 'Professional', 'Other'];

const BrowseClubs = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [applyingId, setApplyingId] = useState(null);
  const [appliedIds, setAppliedIds] = useState([]);

  useEffect(() => {
    let active = true;
    const fetchClubs = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await clubService.getAllClubs();
        if (!active) return;
        setClubs(Array.isArray(data) ? data : data?.clubs || []);
      } catch (err) {
        if (active) setError(err.message || 'Failed to load clubs');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchClubs();
    return () => {
      active = false;
    };
  }, []);

  const filteredClubs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let result = clubs;

    if (term) {
      result = result.filter(
        (club) =>
          club.name?.toLowerCase().includes(term) ||
          club.description?.toLowerCase().includes(term) ||
          club.tags?.some((tag) => tag.toLowerCase().includes(term)),
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter((club) => club.category === selectedCategory);
    }

    return [...result].sort((a, b) => {
      if (sort === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sort === 'members') return (b.members?.length || 0) - (a.members?.length || 0);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [clubs, searchTerm, selectedCategory, sort]);

  const isMember = (club) => {
    const userId = user?._id || user?.id;
    if (!userId) return false;
    return (club.members || []).some((member) =>
      (typeof member === 'string' ? member : member?._id || member?.id) === userId,
    );
  };

  const handleJoinClub = async (clubId) => {
    setApplyingId(clubId);
    setActionError('');
    try {
      await clubService.applyToJoinClub(clubId);
      setAppliedIds((current) => [...current, clubId]);
    } catch (err) {
      setActionError(err.message || 'Could not submit your application.');
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Discover"
        title="Campus clubs"
        description="Find communities that match your interests, then apply to join in one click."
        actions={<ButtonLink to="/create-club" icon={PlusIcon}>Start a club</ButtonLink>}
      />

      <Card className="mt-6">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <SearchInput
            className="lg:max-w-sm lg:flex-1"
            placeholder="Search clubs, descriptions or tags…"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Search clubs"
          />

          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`h-8 rounded-full px-3 text-xs font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900'
                    : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700'
                }`}
              >
                {category === 'all' ? 'All' : category}
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sort clubs"
            className="h-9 shrink-0 rounded-[10px] border border-ink-200 bg-white px-3 text-sm text-ink-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
          >
            <option value="newest">Newest</option>
            <option value="name">Name A–Z</option>
            <option value="members">Most members</option>
          </select>
        </div>
      </Card>

      {actionError ? (
        <Alert variant="error" className="mt-4">
          {actionError}
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="error" className="mt-4" title="We could not load clubs">
          {error}
        </Alert>
      ) : null}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-ink-500 dark:text-ink-400">
          {loading ? 'Loading clubs…' : `${filteredClubs.length} club${filteredClubs.length === 1 ? '' : 's'} found`}
        </p>
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)
          : filteredClubs.map((club) => {
              const member = isMember(club);
              const applied = appliedIds.includes(club._id);
              return (
                <Card key={club._id} hover className="flex flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <Avatar name={club.name} src={club.logoUrl} size="lg" className="rounded-[12px]" />
                    <Badge variant="brand">{club.category || 'General'}</Badge>
                  </div>

                  <h3 className="mt-4 truncate text-base font-semibold text-ink-900 dark:text-white">
                    <Link to={`/clubs/${club._id}`} className="hover:text-brand-600 dark:hover:text-brand-300">
                      {club.name}
                    </Link>
                  </h3>
                  <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm text-ink-500 dark:text-ink-400">
                    {club.description || 'No description provided yet.'}
                  </p>

                  <div className="mt-3 space-y-1.5 text-xs text-ink-500 dark:text-ink-400">
                    <span className="flex items-center gap-2">
                      <UserGroupIcon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                      {(club.members?.length || 0)} member{(club.members?.length || 0) === 1 ? '' : 's'}
                    </span>
                    {club.meetingTime ? (
                      <span className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                        <span className="truncate">{club.meetingTime}</span>
                      </span>
                    ) : null}
                    {club.location ? (
                      <span className="flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                        <span className="truncate">{club.location}</span>
                      </span>
                    ) : null}
                  </div>

                  {club.tags?.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {club.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[11px] font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-auto flex items-center gap-2 pt-5">
                    {member || applied ? (
                      <ButtonLink to={`/clubs/${club._id}`} variant="secondary" size="sm" fullWidth>
                        {applied ? (
                          <>
                            <CheckIcon className="h-4 w-4" aria-hidden="true" />
                            Application sent
                          </>
                        ) : (
                          'View club'
                        )}
                      </ButtonLink>
                    ) : (
                      <Button
                        size="sm"
                        fullWidth
                        loading={applyingId === club._id}
                        onClick={() => handleJoinClub(club._id)}
                      >
                        Apply to join
                      </Button>
                    )}
                    <Link
                      to={`/clubs/${club._id}`}
                      className="inline-flex h-9 shrink-0 items-center justify-center rounded-[10px] border border-ink-200 px-3 text-sm font-medium text-ink-600 transition-colors hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
                    >
                      Details
                    </Link>
                  </div>
                </Card>
              );
            })}
      </div>

      {!loading && filteredClubs.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={UserGroupIcon}
            title="No clubs match your filters"
            description="Try a different category or clear your search. You can also start your own club."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                >
                  Clear filters
                </Button>
                <ButtonLink to="/create-club">Start a club</ButtonLink>
              </div>
            }
          />
        </div>
      ) : null}
    </>
  );
};

export default BrowseClubs;
