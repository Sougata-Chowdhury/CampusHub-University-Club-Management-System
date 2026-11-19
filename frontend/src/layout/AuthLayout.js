import React from 'react';
import { Link } from 'react-router-dom';
import { AcademicCapIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const highlights = [
  'Discover and join clubs that match your interests',
  'Register for campus events in a couple of clicks',
  'Track membership payments and feedback in one place',
];

const AuthLayout = ({ title, subtitle, children, footer }) => (
  <div className="flex min-h-screen bg-white dark:bg-[#0b1220]">
    {/* Brand panel */}
    <div className="relative hidden w-1/2 overflow-hidden bg-[#0f172a] lg:flex xl:w-[55%]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.35),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(124,58,237,0.3),_transparent_50%)]" />
      <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
        <Link to="/login" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-inset ring-white/20 backdrop-blur">
            <AcademicCapIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">CampusHub</span>
        </Link>

        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">
            University club management
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.15] tracking-tight text-white xl:text-[42px]">
            The simplest way to run campus life.
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-ink-300">
            One home for clubs, events, announcements, payments and feedback — built for students
            and administrators.
          </p>

          <ul className="mt-8 space-y-3.5">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-ink-200">
                <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-ink-400">
          © {new Date().getFullYear()} CampusHub. Built for university communities.
        </p>
      </div>
    </div>

    {/* Form panel */}
    <div className="flex w-full flex-col justify-center px-5 py-10 sm:px-8 lg:w-1/2 xl:w-[45%]">
      <div className="mx-auto w-full max-w-[400px]">
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-brand-500 to-violet-600 text-white">
            <AcademicCapIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold text-ink-900 dark:text-white">CampusHub</span>
        </div>

        <h1 className="text-[26px] font-semibold tracking-tight text-ink-900 dark:text-white">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>
        ) : null}

        <div className="mt-8">{children}</div>
        {footer ? <div className="mt-8">{footer}</div> : null}
      </div>
    </div>
  </div>
);

export default AuthLayout;
