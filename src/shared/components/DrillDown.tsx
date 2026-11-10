import { useMemo, useState, type ReactNode } from 'react';
import { Box, Button, Card, CardContent, Chip, TextField, Typography } from '@mui/material';

/*
 * Shared drill-down shell — the platform-wide navigation pattern:
 *
 *   overview level 1 (cards side by side) → level 2 → … → item list
 *
 * Used by Grade Records today; Timetable / Attendance / User Management /
 * Assessments converge on it next. Everything is consistent by construction:
 * one breadcrumb bar, one card style, one flat-list toggle, one search box,
 * and the same "click a card to dig deeper" interaction everywhere.
 */

export interface DrillGroup<T> {
  /** Card + breadcrumb label, e.g. "BBA" or "Semester 3". Must be unique among its siblings. */
  label: string;
  /** Small grey line on the card, e.g. "12 records · 8 students". */
  subLabel?: string;
  /** Small chips on the card, e.g. ["Sem 3 · 4", "Sem 5 · 8"]. */
  chips?: string[];
  items: T[];
}

export interface DrillLevelSpec<T> {
  /** Level name shown in the empty/tooltip copy, e.g. "Programme". */
  title: string;
  /** Group the current subset of items for this level. */
  group: (items: T[]) => Array<DrillGroup<T>>;
}

export interface DrillDownProps<T> {
  items: T[];
  /** One grouping level per drill step; the last level's groups hold the items. */
  levels: Array<DrillLevelSpec<T>>;
  itemKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  /** Built-in search; `searchText` supplies the haystack per item. */
  searchText?: (item: T) => string;
  searchPlaceholder?: string;
  /** Extra controls on the toolbar row (filters owned by the page). */
  toolbar?: ReactNode;
  /** Start drilled in (default) or on the flat list. */
  defaultDrill?: boolean;
  /** Unit for the count line on cards, e.g. "records". */
  itemUnit?: string;
  emptyState?: ReactNode;
}

export default function DrillDown<T>({
  items,
  levels,
  itemKey,
  renderItem,
  searchText,
  searchPlaceholder = 'Search…',
  toolbar,
  defaultDrill = true,
  itemUnit = 'items',
  emptyState,
}: DrillDownProps<T>) {
  const [drillMode, setDrillMode] = useState(defaultDrill);
  const [path, setPath] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !searchText) return items;
    return items.filter((item) => searchText(item).toLowerCase().includes(q));
  }, [items, search, searchText]);

  // Walk the levels with the chosen breadcrumb labels; drop stale labels
  // (after a refresh the groups can change) instead of crashing.
  const { groupsAt, leafItems, activePath } = useMemo(() => {
    const groupsAt: Array<Array<DrillGroup<T>>> = [];
    const activePath: string[] = [];
    let current = filtered;
    for (let i = 0; i < levels.length; i += 1) {
      const groups = levels[i].group(current);
      groupsAt.push(groups);
      const wanted = path[i];
      const chosen = wanted ? groups.find((g) => g.label === wanted) : undefined;
      if (!chosen) break;
      activePath.push(chosen.label);
      current = chosen.items;
    }
    return { groupsAt, leafItems: current, activePath };
  }, [filtered, levels, path]);

  const atLeaf = activePath.length >= levels.length;
  const visibleGroups = !atLeaf ? groupsAt[activePath.length] || [] : [];

  return (
    <Box>
      {/* Toolbar: search + page filters + flat/drill toggle */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', mb: 2 }}>
        {searchText && (
          <TextField
            size="small"
            label={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 200 }}
          />
        )}
        {toolbar}
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            setDrillMode(!drillMode);
            setPath([]);
          }}
        >
          {drillMode ? 'Flat list' : 'Drill-down'}
        </Button>
      </Box>

      {/* Breadcrumbs */}
      {drillMode && (activePath.length > 0 || levels.length > 0) && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2 }}>
          <Button
            size="small"
            onClick={() => setPath([])}
            sx={{
              color: activePath.length === 0 ? 'primary.main' : 'text.secondary',
              fontWeight: activePath.length === 0 ? 700 : 400,
            }}
          >
            All
          </Button>
          {activePath.map((label, index) => (
            <Box key={`${label}-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography color="text.secondary">›</Typography>
              {index === activePath.length - 1 && !atLeaf ? (
                <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>{label}</Typography>
              ) : (
                <Button
                  size="small"
                  onClick={() => setPath(activePath.slice(0, index + 1))}
                  sx={{
                    color: index === activePath.length - 1 ? 'primary.main' : 'text.secondary',
                    fontWeight: index === activePath.length - 1 ? 700 : 400,
                  }}
                >
                  {label}
                </Button>
              )}
            </Box>
          ))}
          {atLeaf && activePath.length < levels.length + 1 && null}
        </Box>
      )}

      {/* Flat list */}
      {!drillMode && (
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          {filtered.map((item) => (
            <Box key={itemKey(item)}>{renderItem(item)}</Box>
          ))}
          {filtered.length === 0 && (emptyState || <Empty unit={itemUnit} />)}
        </Box>
      )}

      {/* Drill: group cards until the last level, then the item list */}
      {drillMode && !atLeaf && (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
          {visibleGroups.map((group) => (
            <Card
              key={group.label}
              variant="outlined"
              sx={{ cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
              onClick={() => setPath([...activePath, group.label])}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography sx={{ fontWeight: 700 }}>{group.label}</Typography>
                {group.subLabel && (
                  <Typography variant="body2" color="text.secondary">
                    {group.subLabel}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  {group.items.length} {itemUnit}
                </Typography>
                {group.chips && group.chips.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
                    {group.chips.map((chip) => (
                      <Chip key={chip} size="small" label={chip} />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
          {visibleGroups.length === 0 && (emptyState || <Empty unit={itemUnit} />)}
        </Box>
      )}

      {drillMode && atLeaf && (
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          {leafItems.map((item) => (
            <Box key={itemKey(item)}>{renderItem(item)}</Box>
          ))}
          {leafItems.length === 0 && (emptyState || <Empty unit={itemUnit} />)}
        </Box>
      )}
    </Box>
  );
}

function Empty({ unit }: { unit: string }) {
  return (
    <Typography color="text.secondary" variant="body2" sx={{ py: 4, textAlign: 'center', gridColumn: '1 / -1' }}>
      No {unit} match the current filters.
    </Typography>
  );
}
