import React from 'react';
import { cn } from '../../utils/cn';

export function Skeleton({ className, width, height, radius, variant, style, ...props }) {
  const resolvedStyle = {
    ...(width !== undefined ? { width } : null),
    ...(height !== undefined ? { height } : null),
    ...(radius !== undefined ? { borderRadius: radius } : null),
    ...style,
  };
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[var(--bg-hover)]',
        variant === 'circle' && 'rounded-full',
        className
      )}
      style={Object.keys(resolvedStyle).length > 0 ? resolvedStyle : undefined}
      {...props}
    />
  );
}

export function SkeletonPostCard() {
  return (
    <div className="w-full max-w-[470px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 mb-4 flex flex-col gap-3">
      {/* Author Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="w-28 h-3.5" />
            <Skeleton className="w-16 h-2.5" />
          </div>
        </div>
        <Skeleton className="w-6 h-6 rounded-full" />
      </div>

      {/* Media Box */}
      <Skeleton className="w-full aspect-square rounded-lg" />

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="w-6 h-6 rounded-full" />
        </div>
        <Skeleton className="w-6 h-6 rounded-full" />
      </div>

      {/* Likes & Caption */}
      <Skeleton className="w-24 h-3.5 mt-1" />
      <div className="flex flex-col gap-1">
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-3/4 h-3" />
      </div>
    </div>
  );
}

export function SkeletonStoryBar() {
  return (
    <div className="w-full max-w-[630px] flex items-center gap-4 py-3 px-2 overflow-hidden border-b border-[var(--border-subtle)] mb-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <Skeleton className="w-16 h-16 rounded-full" />
          <Skeleton className="w-12 h-2.5" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfileHeader() {
  return (
    <div className="w-full max-w-[935px] flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-16 py-8 px-4 border-b border-[var(--border-subtle)]">
      <Skeleton className="w-24 h-24 sm:w-36 sm:h-36 rounded-full flex-shrink-0" />
      <div className="flex flex-col gap-4 w-full max-w-md">
        <div className="flex items-center gap-4">
          <Skeleton className="w-36 h-6" />
          <Skeleton className="w-24 h-8 rounded-lg" />
        </div>
        <div className="flex items-center gap-8">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-20 h-4" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="w-28 h-4" />
          <Skeleton className="w-48 h-3.5" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonUserRows({ count = 5, compact = false, showAction = false }) {
  return (
    <div className={cn('flex flex-col w-full', compact ? 'gap-2.5 py-2' : 'gap-3.5 p-3')}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3 px-2 py-1">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Skeleton className={cn('rounded-full flex-shrink-0', compact ? 'w-9 h-9' : 'w-11 h-11')} />
            <div className="flex flex-col gap-1.5 flex-1">
              <Skeleton className={cn('h-3.5', i % 2 === 0 ? 'w-32' : 'w-24')} />
              <Skeleton className={cn('h-2.5', i % 2 === 0 ? 'w-20' : 'w-28')} />
            </div>
          </div>
          {showAction && <Skeleton className="w-16 h-7 rounded-full flex-shrink-0" />}
        </div>
      ))}
    </div>
  );
}

export function SkeletonSuggestionsCard() {
  return (
    <div className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton className="w-28 h-3.5" />
        <Skeleton className="w-12 h-3" />
      </div>
      <SkeletonUserRows count={4} compact showAction />
    </div>
  );
}

export function SkeletonHomePage() {
  return (
    <div className="w-full max-w-[980px] mx-auto px-4 sm:px-7 py-4 flex justify-center items-start gap-8 lg:gap-12">
      <div className="flex-1 min-w-0 max-w-[560px] flex flex-col items-center">
        <div className="w-full flex items-center gap-6 h-10 mb-3 px-1">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-20 h-4" />
        </div>
        <SkeletonStoryBar />
        <SkeletonPostCard />
        <SkeletonPostCard />
      </div>
      <div className="hidden lg:flex w-[320px] flex-shrink-0 flex-col gap-4 pt-2">
        <div className="flex items-center justify-end gap-2 mb-1">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-12 h-8 rounded-full" />
        </div>
        <div className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="w-24 h-3.5" />
              <Skeleton className="w-16 h-2.5" />
            </div>
          </div>
          <Skeleton className="w-20 h-8 rounded-lg" />
        </div>
        <SkeletonSuggestionsCard />
      </div>
    </div>
  );
}

export function SkeletonAppShell() {
  return (
    <div className="flex min-h-screen w-full bg-[var(--bg-primary)]">
      <aside className="hidden md:flex w-[72px] xl:w-[244px] flex-shrink-0 flex-col gap-5 p-4 border-r border-[var(--border-subtle)]">
        <Skeleton className="w-28 h-7 mb-2 hidden xl:block" />
        <Skeleton className="w-8 h-8 rounded-lg mb-2 xl:hidden" />
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex items-center gap-3.5 py-1.5">
            <Skeleton className="w-6 h-6 rounded-md flex-shrink-0" />
            <Skeleton className="w-24 h-4 hidden xl:block" />
          </div>
        ))}
      </aside>
      <main className="flex-1 min-w-0 py-2">
        <SkeletonHomePage />
      </main>
    </div>
  );
}

export function SkeletonAuthCard() {
  return (
    <div className="ig-skeleton-auth-figma min-h-[100dvh] w-full flex flex-col bg-[#0b0e14]">
      <div className="flex-1 w-full flex flex-col min-[900px]:flex-row min-h-0">
        {/* Left Hero Showcase Skeleton matching Figma split login */}
        <div
          className="hidden min-[900px]:flex flex-1 relative flex-col items-center justify-center p-10 bg-[#0b0e14]"
          aria-hidden="true"
        >
          <Skeleton className="absolute top-7 left-8 w-9 h-9 rounded-xl" />
          <div className="flex flex-col items-center gap-3 max-w-[500px] w-full">
            <Skeleton className="w-48 h-8 rounded-lg" />
            <Skeleton className="w-64 h-8 rounded-lg" />
            <Skeleton className="w-44 h-8 rounded-lg" />
            <Skeleton className="w-[340px] h-[270px] rounded-3xl mt-4" />
          </div>
        </div>

        {/* Right Auth Panel Skeleton */}
        <div className="flex-1 min-[900px]:flex-none w-full min-[900px]:w-[clamp(390px,38.4vw,540px)] min-[900px]:border-l border-[#2b2f38] bg-[#151821] flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-[440px] flex flex-col">
            <Skeleton className="min-[900px]:hidden w-11 h-11 rounded-xl mx-auto mb-5" />
            <Skeleton className="w-40 h-5 rounded-md mb-2.5" />
            <Skeleton className="w-72 max-w-full h-3 rounded mb-4" />
            <div className="flex flex-col gap-3">
              <Skeleton className="w-full h-[54px] rounded-[15px]" />
              <Skeleton className="w-full h-[54px] rounded-[15px]" />
              <Skeleton className="w-full h-11 rounded-full mt-1" />
              <Skeleton className="w-32 h-3.5 mx-auto mt-1.5 rounded" />
            </div>
            <Skeleton className="w-full h-11 rounded-full mt-7" />
          </div>
        </div>
      </div>

      {/* Bottom Footer Skeleton */}
      <div className="w-full border-t border-[#2b2f38] bg-[#0b0e14] py-3.5 px-6 flex items-center justify-center">
        <Skeleton className="w-40 h-3 rounded" />
      </div>
    </div>
  );
}

export function SkeletonMediaGrid({ count = 9, columns = 3, aspect = 'aspect-square', className = '' }) {
  const gridColsClass =
    columns === 4
      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
      : 'grid-cols-3';
  return (
    <div className={cn('grid gap-1 sm:gap-3 w-full max-w-[935px] mx-auto', gridColsClass, className)}>
      {[...Array(count)].map((_, i) => (
        <Skeleton key={i} className={cn('w-full rounded-md', aspect)} />
      ))}
    </div>
  );
}

export function SkeletonMessageThread({ count = 5, compact = false }) {
  return (
    <div className={cn('flex flex-col w-full gap-3', compact ? 'px-4 py-2' : 'p-5')}>
      {[...Array(count)].map((_, i) => {
        const isRight = i % 2 === 1;
        return (
          <div key={i} className={cn('flex items-end gap-2', isRight ? 'justify-end' : 'justify-start')}>
            {!isRight && <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />}
            <Skeleton
              className={cn(
                'h-9 rounded-2xl',
                i % 3 === 0 ? 'w-44' : isRight ? 'w-36' : 'w-56'
              )}
            />
          </div>
        );
      })}
    </div>
  );
}

export function SkeletonSettingsForm() {
  return (
    <div className="w-full max-w-[600px] flex flex-col gap-5 p-4">
      <Skeleton className="w-40 h-6" />
      <div className="rounded-xl border border-[var(--border-subtle)] p-4 flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-44 h-3" />
        </div>
        <Skeleton className="w-24 h-8 rounded-lg" />
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="w-28 h-3.5" />
          <Skeleton className="w-full h-10 rounded-lg" />
        </div>
      ))}
      <Skeleton className="w-32 h-9 rounded-lg mt-2" />
    </div>
  );
}

export function SkeletonAdminOverview() {
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Row 1: 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4 flex items-center gap-3.5"
          >
            <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <Skeleton className="w-20 h-3" />
              <Skeleton className="w-12 h-7" />
              <Skeleton className="w-28 h-2.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Platform Growth Chart + Content Distribution Donut + Moderation Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.85fr_1.05fr_1fr] gap-4">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="w-36 h-5" />
              <Skeleton className="w-56 h-3" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-14 h-7 rounded-lg" />
              <Skeleton className="w-16 h-7 rounded-lg" />
              <Skeleton className="w-20 h-7 rounded-lg" />
            </div>
          </div>
          <Skeleton className="w-full h-48 rounded-xl" />
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-5 flex flex-col gap-5">
          <Skeleton className="w-40 h-5" />
          <div className="flex items-center justify-around gap-4 my-auto">
            <Skeleton className="w-28 h-28 rounded-full flex-shrink-0" />
            <div className="flex flex-col gap-3 flex-1">
              <Skeleton className="w-full h-3.5" />
              <Skeleton className="w-5/6 h-3.5" />
              <Skeleton className="w-4/6 h-3.5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1">
            <Skeleton className="w-40 h-5" />
            <Skeleton className="w-7 h-5 rounded-full" />
          </div>
          <Skeleton className="w-full h-11 rounded-xl" />
          <Skeleton className="w-full h-11 rounded-xl" />
          <Skeleton className="w-full h-11 rounded-xl" />
        </div>
      </div>

      {/* Row 3: Bottom Bento Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-5 flex flex-col gap-3"
          >
            <Skeleton className="w-36 h-5" />
            <Skeleton className="w-full h-12 rounded-xl" />
            <Skeleton className="w-full h-12 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonAdminUsersTable({ rows = 5 }) {
  return (
    <div className="w-full flex flex-col">
      <div className="hidden md:grid grid-cols-[1.4fr_1.4fr_0.7fr_0.7fr_0.6fr_1.6fr] gap-4 px-5 py-3.5 border-b border-[var(--border-subtle)]">
        <Skeleton className="w-12 h-3" />
        <Skeleton className="w-14 h-3" />
        <Skeleton className="w-10 h-3" />
        <Skeleton className="w-14 h-3" />
        <Skeleton className="w-14 h-3" />
        <Skeleton className="w-16 h-3 ml-auto" />
      </div>
      <div className="flex flex-col divide-y divide-[var(--border-subtle)]">
        {[...Array(rows)].map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-1 md:grid-cols-[1.4fr_1.4fr_0.7fr_0.7fr_0.6fr_1.6fr] items-center gap-4 px-5 py-3.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
              <div className="flex flex-col gap-1.5 min-w-0">
                <Skeleton className="w-24 h-3.5" />
                <Skeleton className="w-16 h-2.5" />
              </div>
            </div>
            <Skeleton className="w-40 h-3.5" />
            <Skeleton className="w-14 h-6 rounded-full" />
            <Skeleton className="w-16 h-6 rounded-full" />
            <Skeleton className="w-10 h-3" />
            <div className="flex items-center gap-2 md:justify-end">
              <Skeleton className="w-20 h-7 rounded-lg" />
              <Skeleton className="w-24 h-7 rounded-lg" />
              <Skeleton className="w-16 h-7 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonAdminContentGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="rounded-[15px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] overflow-hidden flex flex-col"
        >
          <Skeleton className="w-full h-[180px] rounded-none" />
          <div className="p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
              <div className="flex flex-col gap-1">
                <Skeleton className="w-20 h-3" />
                <Skeleton className="w-10 h-2.5" />
              </div>
            </div>
            <Skeleton className="w-3/4 h-3" />
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="w-28 h-3" />
              <Skeleton className="w-20 h-7 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonAdminReportsList({ count = 4 }) {
  return (
    <div className="flex flex-col gap-3.5 w-full">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-5 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-20 h-6 rounded-full" />
              <Skeleton className="w-16 h-6 rounded-full" />
              <Skeleton className="w-40 h-3.5" />
            </div>
            <Skeleton className="w-14 h-3" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="w-24 h-2.5" />
              <Skeleton className="w-36 h-4" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Skeleton className="w-20 h-2.5" />
              <Skeleton className="w-28 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-28 h-8 rounded-lg" />
            <Skeleton className="w-24 h-8 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonAdminEmailConfigGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-5 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="w-24 h-6 rounded-full" />
            <Skeleton className="w-14 h-4 rounded-full" />
          </div>
          <Skeleton className="w-44 h-5" />
          <Skeleton className="w-full h-3.5" />
          <Skeleton className="w-4/5 h-3.5" />
          <div className="rounded-xl border border-[var(--border-subtle)] p-3 flex flex-col gap-2 mt-1">
            <Skeleton className="w-3/4 h-3" />
            <Skeleton className="w-2/3 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonAdminConfigsPage() {
  return (
    <div className="w-full max-w-[1160px] mx-auto p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="w-64 h-7" />
          <Skeleton className="w-96 max-w-full h-3.5" />
        </div>
        <Skeleton className="w-36 h-9 rounded-lg flex-shrink-0" />
      </div>
      <div className="flex items-center gap-2.5 overflow-hidden pb-1">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-28 h-9 rounded-full flex-shrink-0" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-5 flex flex-col gap-3"
          >
            <Skeleton className="w-44 h-4" />
            <Skeleton className="w-full h-3" />
            <Skeleton className="w-full h-10 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonAdminDashboardShell({ search = '' }) {
  const params = new URLSearchParams(search || '');
  const tab = (params.get('tab') || '').toLowerCase();

  return (
    <div className="w-full max-w-[1280px] mx-auto px-6 py-6 flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Skeleton className="w-64 h-8" />
            <Skeleton className="w-32 h-6 rounded-full" />
          </div>
          <Skeleton className="w-72 h-3.5" />
        </div>
        <Skeleton className="w-72 h-10 rounded-full" />
      </div>

      <div className="flex items-center gap-2.5 overflow-hidden">
        <Skeleton className="w-44 h-9 rounded-xl flex-shrink-0" />
        <Skeleton className="w-36 h-9 rounded-xl flex-shrink-0" />
        <Skeleton className="w-36 h-9 rounded-xl flex-shrink-0" />
      </div>

      {tab === 'users' ? (
        <>
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3.5 flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="w-64 h-9 rounded-xl" />
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-28 h-9 rounded-xl" />
              <Skeleton className="w-24 h-9 rounded-xl" />
              <Skeleton className="w-24 h-9 rounded-xl" />
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] overflow-hidden">
            <SkeletonAdminUsersTable rows={5} />
          </div>
        </>
      ) : tab === 'content' ? (
        <>
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="w-16 h-8 rounded-lg" />
              <Skeleton className="w-16 h-8 rounded-lg" />
              <Skeleton className="w-16 h-8 rounded-lg" />
            </div>
            <Skeleton className="w-56 h-9 rounded-xl" />
            <Skeleton className="w-24 h-9 rounded-xl" />
          </div>
          <SkeletonAdminContentGrid count={6} />
        </>
      ) : (
        <SkeletonAdminOverview />
      )}
    </div>
  );
}

export function SkeletonConversationRows({ count = 6 }) {
  return (
    <div className="flex flex-col w-full py-1">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-[14px] py-[10px] mx-[10px] my-0.5 rounded-[14px]"
        >
          <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <Skeleton className={cn('h-3.5', i % 2 === 0 ? 'w-28' : 'w-24')} />
            <Skeleton className={cn('h-3', i % 3 === 0 ? 'w-44' : i % 2 === 0 ? 'w-36' : 'w-40')} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChatThreadPane() {
  return (
    <div className="flex-1 flex flex-col justify-between h-full">
      <div className="h-[70px] px-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="w-28 h-4" />
            <Skeleton className="w-16 h-3" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="w-5 h-5 rounded-full" />
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-end overflow-hidden">
        <SkeletonMessageThread count={6} />
      </div>
      <div className="px-6 py-4">
        <Skeleton className="w-full h-11 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonMessagesPage({ hasConversation = false }) {
  return (
    <div className="flex w-full h-screen h-[100dvh] overflow-hidden">
      <aside className="w-full md:w-[397px] md:max-w-[420px] min-w-[240px] flex-shrink-0 border-r border-[var(--border-subtle)] flex flex-col h-full">
        <div className="flex items-center justify-between px-6 pt-5 pb-3.5">
          <Skeleton className="w-24 h-6" />
          <Skeleton className="w-9 h-9 rounded-xl" />
        </div>
        <div className="px-[18px] pb-3">
          <Skeleton className="w-full h-10 rounded-full" />
        </div>
        <div className="px-[18px] py-2 flex items-start gap-4 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <Skeleton className="w-16 h-5 rounded-2xl" />
              <Skeleton className="w-16 h-16 rounded-full" />
              <Skeleton className="w-12 h-2.5" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 px-4 py-3.5 border-b border-[var(--border-subtle)]">
          <Skeleton className="w-16 h-4 mx-auto" />
          <Skeleton className="w-16 h-4 mx-auto" />
        </div>
        <div className="flex-1 overflow-hidden">
          <SkeletonConversationRows count={6} />
        </div>
      </aside>
      <section className="hidden md:flex flex-1 flex-col h-full">
        {hasConversation ? (
          <SkeletonChatThreadPane />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
            <Skeleton className="w-20 h-20 rounded-full mb-1" />
            <Skeleton className="w-36 h-6" />
            <Skeleton className="w-64 h-3.5" />
            <Skeleton className="w-36 h-10 rounded-full mt-2" />
          </div>
        )}
      </section>
    </div>
  );
}

export function SkeletonNotificationSections() {
  const sections = [
    { key: 'new', rows: ['action', 'thumb'] },
    { key: 'earlier', rows: ['thumb', 'action', 'thumb'] },
  ];
  return (
    <div className="flex flex-col gap-6 w-full">
      {sections.map((sec) => (
        <div key={sec.key} className="flex flex-col gap-3">
          <Skeleton className="w-16 h-4" />
          <div className="flex flex-col gap-2.5">
            {sec.rows.map((rightKind, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3.5 px-[18px] py-[14px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <Skeleton className="w-11 h-11 rounded-full flex-shrink-0" />
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <Skeleton className={cn('h-3.5', rightKind === 'action' ? 'w-3/5' : 'w-3/4')} />
                    <Skeleton className="w-20 h-2.5" />
                  </div>
                </div>
                {rightKind === 'action' ? (
                  <Skeleton className="w-20 h-8 rounded-lg flex-shrink-0" />
                ) : (
                  <Skeleton className="w-11 h-11 rounded-lg flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonNotificationsPage() {
  const pillWidths = ['w-14', 'w-20', 'w-24', 'w-24', 'w-16', 'w-20'];
  return (
    <div className="w-full max-w-[780px] mx-auto px-7 pt-9 pb-16 flex flex-col">
      <div className="flex items-center justify-between gap-4 mb-5">
        <Skeleton className="w-40 h-8" />
        <Skeleton className="w-[38px] h-[38px] rounded-full flex-shrink-0" />
      </div>
      <div className="flex items-center gap-2.5 mb-6 overflow-hidden">
        {pillWidths.map((w, i) => (
          <Skeleton key={i} className={cn(w, 'h-9 rounded-full flex-shrink-0')} />
        ))}
      </div>
      <SkeletonNotificationSections />
    </div>
  );
}

export function SkeletonSearchPage() {
  return (
    <div className="w-full max-w-[960px] mx-auto px-7 pt-9 pb-16 flex flex-col">
      <div className="max-w-[680px] w-full mx-auto mb-6 flex flex-col">
        <Skeleton className="w-28 h-8 mb-4" />
        <Skeleton className="w-full h-12 rounded-full mb-4" />
        <div className="flex items-center gap-2.5 pb-3.5 border-b border-[var(--border-subtle)]">
          <Skeleton className="w-28 h-9 rounded-full" />
          <Skeleton className="w-20 h-9 rounded-full" />
          <Skeleton className="w-24 h-9 rounded-full" />
        </div>
      </div>
      <div className="w-full flex flex-col gap-3.5">
        <Skeleton className="w-24 h-5" />
        <SkeletonMediaGrid count={6} className="max-w-none gap-3.5 [&>div]:rounded-2xl" />
      </div>
    </div>
  );
}

export function SkeletonHealthPage() {
  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 py-3 flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="w-64 h-7" />
          <Skeleton className="w-96 max-w-full h-3.5" />
        </div>
        <Skeleton className="w-24 h-9 rounded-lg flex-shrink-0" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4 flex flex-col justify-between gap-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Skeleton className="w-6 h-6 rounded-md flex-shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="w-28 h-4" />
                  <Skeleton className="w-20 h-3" />
                </div>
              </div>
              <Skeleton className="w-20 h-6 rounded-full flex-shrink-0" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Skeleton className="w-full h-3" />
              <Skeleton className="w-4/5 h-3" />
            </div>
            <div className="pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <Skeleton className="w-20 h-3" />
              <Skeleton className="w-24 h-3.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonRouteContent({ pathname = '/', search = '' }) {
  if (pathname.startsWith('/messages')) {
    const hasConversation = /^\/messages\/[^/]+/.test(pathname);
    return <SkeletonMessagesPage hasConversation={hasConversation} />;
  }
  if (pathname.startsWith('/profile')) {
    return (
      <div className="w-full max-w-[935px] mx-auto px-4 flex flex-col gap-6">
        <SkeletonProfileHeader />
        <SkeletonMediaGrid count={9} />
      </div>
    );
  }
  if (pathname.startsWith('/explore') || pathname.startsWith('/audio')) {
    return (
      <div className="w-full max-w-[935px] mx-auto p-4">
        <SkeletonMediaGrid count={9} />
      </div>
    );
  }
  if (pathname.startsWith('/reels')) {
    return (
      <div className="w-full min-h-[75dvh] flex items-center justify-center p-4">
        <Skeleton className="w-[320px] sm:w-[360px] h-[540px] sm:h-[620px] rounded-2xl" />
      </div>
    );
  }
  if (pathname.startsWith('/search')) {
    return <SkeletonSearchPage />;
  }
  if (pathname.startsWith('/notifications')) {
    return <SkeletonNotificationsPage />;
  }
  if (pathname.startsWith('/settings') || pathname.startsWith('/your-activity')) {
    return (
      <div className="w-full max-w-[935px] mx-auto p-4">
        <SkeletonSettingsForm />
      </div>
    );
  }
  if (pathname.startsWith('/admin/reports') || pathname.startsWith('/admin/moderation')) {
    return (
      <div className="w-full p-6">
        <SkeletonAdminReportsList count={4} />
      </div>
    );
  }
  if (pathname.startsWith('/admin/email')) {
    return (
      <div className="w-full max-w-[1200px] mx-auto p-6">
        <SkeletonAdminEmailConfigGrid count={4} />
      </div>
    );
  }
  if (pathname.startsWith('/admin/configs')) {
    return <SkeletonAdminConfigsPage />;
  }
  if (pathname.startsWith('/admin')) {
    return <SkeletonAdminDashboardShell search={search} />;
  }
  if (pathname.startsWith('/health')) {
    return <SkeletonHealthPage />;
  }
  return <SkeletonHomePage />;
}

export default Skeleton;
