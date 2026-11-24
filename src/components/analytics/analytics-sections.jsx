import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { CalendarHeatmap } from '@/components/charts/calendar-heatmap';
import { ChartCard } from '@/components/charts/chart-card';
import { ColumnChart } from '@/components/charts/column-chart';
import { LineChart } from '@/components/charts/line-chart';
import { RankedBars } from '@/components/charts/ranked-bars';
import { Sparkline } from '@/components/charts/sparkline';
import { CATEGORY_ICONS } from '@/constants/quest-visuals';
import { BorderWidth, CategoryColors, ChartColors, Colors, Radius, Spacing } from '@/constants/theme';
import { ATTRIBUTES } from '@/features/progression/attributes';
import { CATEGORIES_BY_KEY } from '@/features/quests/quest-config';
import { parseLocalDateKey } from '@/features/quests/quest-periods';
import { formatNumber } from '@/utils/format';

const SHORT_DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const WEEKDAY_DATE = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const shortDate = (date) => SHORT_DATE.format(date);
const percent = (value) => (value == null ? '—' : `${Math.round(value * 100)}%`);
const bucketLabel = (point) => (point.key.includes('-W') ? `Week of ${shortDate(point.startDate)}` : WEEKDAY_DATE.format(point.startDate));
const partialNote = (point) => (point.isPartial ? ' (so far)' : '');

const XP_SERIES = [
  { key: 'quest', label: 'Quests', color: ChartColors.series[0] },
  { key: 'reward', label: 'Rewards', color: ChartColors.series[1] },
  { key: 'other', label: 'Other', color: ChartColors.series[2] },
];

export function XpSection({ xp, rangeDays }) {
  const series = xp.series.some((point) => point.other > 0) ? XP_SERIES : XP_SERIES.slice(0, 2);
  return (
    <ChartCard
      title={`XP earned · ${rangeDays} days`}
      headline={`${formatNumber(xp.total)} XP`}
      caption={`${formatNumber(Math.round(xp.averagePerDay))} per day · ${formatNumber(xp.fromQuests)} from quests, ${formatNumber(xp.fromRewards)} from rewards`}
      series={series}
      table={{
        columns: ['Period', ...series.map((item) => item.label), 'Total'],
        rows: xp.series.map((point) => ({ key: point.key, cells: [bucketLabel(point), ...series.map((item) => formatNumber(point[item.key])), formatNumber(point.total)] })),
      }}>
      <ColumnChart
        data={xp.series.map((point) => ({ key: point.key, xLabel: shortDate(point.startDate), isPartial: point.isPartial, values: point, raw: point }))}
        series={series}
        describe={(point) =>
          point.summary
            ? `XP earned over ${rangeDays} days: ${formatNumber(xp.total)} total.`
            : `${bucketLabel(point.raw)}${partialNote(point.raw)} · ${series.map((item) => `${item.label} ${formatNumber(point.raw[item.key])}`).join(' · ')}`
        }
      />
    </ChartCard>
  );
}

export function CompletionRateSection({ completionRates }) {
  const { daily, weekly, dailyAverage, weeklyAverage } = completionRates;
  return (
    <ChartCard
      title="Completion rate"
      headline={`${percent(dailyAverage)} daily · ${percent(weeklyAverage)} weekly`}
      caption="Averages over finished days and weeks. Only quests that existed and were scheduled count."
      table={{
        columns: ['Day', 'Cleared', 'Scheduled', 'Rate'],
        rows: daily.map((day) => ({ key: day.key, cells: [WEEKDAY_DATE.format(day.startDate), String(day.completed), String(day.eligible), percent(day.rate)] })),
      }}>
      <AppText variant="label" color="textMuted">
        Daily quests
      </AppText>
      <LineChart
        points={daily.map((day) => ({ key: day.key, xLabel: shortDate(day.startDate), value: day.rate, raw: day }))}
        yMax={1}
        formatValue={(value) => `${Math.round(value * 100)}%`}
        describe={(point) =>
          point
            ? `${WEEKDAY_DATE.format(point.raw.startDate)}${partialNote(point.raw)} · ${point.raw.completed} of ${point.raw.eligible} cleared${point.value == null ? '' : ` (${percent(point.value)})`}`
            : `Daily completion rate averages ${percent(dailyAverage)}.`
        }
      />
      {weekly.some((week) => week.eligible > 0) ? (
        <>
          <AppText variant="label" color="textMuted">
            Weekly quests
          </AppText>
          <ColumnChart
            height={110}
            data={weekly.map((week) => ({ key: week.key, xLabel: shortDate(week.startDate), isPartial: week.isPartial, values: { rate: Math.round((week.rate ?? 0) * 100) }, raw: week }))}
            series={[{ key: 'rate', label: 'Weekly rate', color: ChartColors.series[0] }]}
            formatValue={(value) => `${value}%`}
            describe={(point) =>
              point.summary
                ? `Weekly completion rate averages ${percent(weeklyAverage)}.`
                : `Week of ${shortDate(point.raw.startDate)}${partialNote(point.raw)} · ${point.raw.completed} of ${point.raw.eligible} cleared`
            }
          />
        </>
      ) : null}
    </ChartCard>
  );
}

export function FitnessSection({ fitness, rangeDays }) {
  return (
    <ChartCard
      title="Strength & fitness"
      headline={`STR Lv. ${fitness.strengthLevel.start} → ${fitness.strengthLevel.end}`}
      caption={`+${formatNumber(fitness.strengthXpGained)} Strength XP · ${fitness.fitnessCompletions} fitness quests in ${rangeDays} days`}
      table={{
        columns: ['Period', 'Fitness quests'],
        rows: fitness.fitnessPerBucket.map((point) => ({ key: point.key, cells: [bucketLabel(point), String(point.value)] })),
      }}>
      <AppText variant="label" color="textMuted">
        Strength level
      </AppText>
      <LineChart
        points={fitness.strengthSeries.map((point) => ({ key: point.key, xLabel: shortDate(point.startDate), value: point.levelProgress, raw: point }))}
        formatValue={(value) => (Number.isInteger(value) ? String(value) : value.toFixed(1))}
        describe={(point) =>
          point
            ? `${WEEKDAY_DATE.format(point.raw.startDate)} · Strength level ${point.raw.level} (${formatNumber(point.raw.totalXp)} XP)`
            : `Strength went from level ${fitness.strengthLevel.start} to ${fitness.strengthLevel.end}.`
        }
      />
      <AppText variant="label" color="textMuted">
        Fitness quests cleared
      </AppText>
      <ColumnChart
        height={110}
        data={fitness.fitnessPerBucket.map((point) => ({ key: point.key, xLabel: shortDate(point.startDate), isPartial: point.isPartial, values: { value: point.value }, raw: point }))}
        series={[{ key: 'value', label: 'Fitness quests', color: ChartColors.series[0] }]}
        describe={(point) => (point.summary ? `${fitness.fitnessCompletions} fitness quests cleared.` : `${bucketLabel(point.raw)}${partialNote(point.raw)} · ${point.raw.value} fitness quests`)}
      />
    </ChartCard>
  );
}

export function NutritionSection({ nutrition, rangeDays }) {
  return (
    <ChartCard
      title="Nutrition consistency"
      headline={percent(nutrition.consistency)}
      caption={`${nutrition.activeDays} of ${rangeDays} days with a nutrition quest · current streak ${nutrition.currentStreak} day${nutrition.currentStreak === 1 ? '' : 's'}`}>
      <CalendarHeatmap
        cells={nutrition.calendar}
        summary={`Nutrition quests on ${nutrition.activeDays} of ${rangeDays} days.`}
        describe={(cell) => `${WEEKDAY_DATE.format(cell.date)} · ${cell.value ? 'Nutrition quest cleared' : 'No nutrition quest'}`}
      />
    </ChartCard>
  );
}

const SOCIAL_SERIES = [
  { key: 'social', label: 'Social', color: ChartColors.series[0] },
  { key: 'family', label: 'Family', color: ChartColors.series[1] },
];
const sinceLabel = (days) => (days == null ? 'never' : days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`);

export function SocialSection({ social }) {
  return (
    <ChartCard
      title="Social & family"
      headline={`${social.socialCompletions} social · ${social.familyCompletions} family`}
      caption={`Last social quest ${sinceLabel(social.daysSinceSocial)} · last family quest ${sinceLabel(social.daysSinceFamily)}`}
      series={SOCIAL_SERIES}
      table={{
        columns: ['Period', 'Social', 'Family'],
        rows: social.perBucket.map((point) => ({ key: point.key, cells: [bucketLabel(point), String(point.social), String(point.family)] })),
      }}>
      <ColumnChart
        data={social.perBucket.map((point) => ({ key: point.key, xLabel: shortDate(point.startDate), isPartial: point.isPartial, values: point, raw: point }))}
        series={SOCIAL_SERIES}
        describe={(point) =>
          point.summary
            ? `${social.socialCompletions} social and ${social.familyCompletions} family quests.`
            : `${bucketLabel(point.raw)}${partialNote(point.raw)} · Social ${point.raw.social} · Family ${point.raw.family}`
        }
      />
    </ChartCard>
  );
}

export function AttributesSection({ attributes }) {
  return (
    <ChartCard
      title="Attribute progression"
      caption="Level trend per attribute over the range (each on its own scale)."
      table={{
        columns: ['Attribute', 'Start', 'Now', 'XP gained'],
        rows: attributes.map((attribute) => {
          const definition = ATTRIBUTES.find((item) => item.key === attribute.attributeKey);
          return { key: attribute.attributeKey, cells: [definition.label, String(attribute.startLevel), String(attribute.endLevel), formatNumber(attribute.xpGained)] };
        }),
      }}>
      <View style={styles.multiples}>
        {attributes.map((attribute) => {
          const definition = ATTRIBUTES.find((item) => item.key === attribute.attributeKey);
          return (
            <View
              key={attribute.attributeKey}
              style={styles.multiple}
              accessible
              accessibilityLabel={`${definition.label}: level ${attribute.endLevel}, plus ${attribute.xpGained} XP`}>
              <View style={styles.multipleHeader}>
                <AppText variant="label" color="textSecondary">
                  {definition.shortLabel}
                </AppText>
                <AppText variant="stat" style={styles.multipleLevel}>
                  Lv. {attribute.endLevel}
                </AppText>
              </View>
              <Sparkline values={attribute.series.map((point) => point.levelProgress)} />
              <AppText variant="caption" color={attribute.xpGained > 0 ? 'textSecondary' : 'textMuted'}>
                +{formatNumber(attribute.xpGained)} XP
              </AppText>
            </View>
          );
        })}
      </View>
    </ChartCard>
  );
}

export function CategorySection({ categories, totalCompletions }) {
  return (
    <ChartCard title="Quest categories" headline={`${totalCompletions} quests cleared`} caption="Share of cleared quests by category.">
      <RankedBars
        rows={categories.map((row) => ({
          key: row.category,
          label: CATEGORIES_BY_KEY[row.category].label,
          Icon: CATEGORY_ICONS[row.category],
          iconColor: CategoryColors[row.category],
          value: row.count,
          valueLabel: row.count ? `${row.count} · ${Math.round(row.share * 100)}%` : '0',
        }))}
      />
    </ChartCard>
  );
}

export function StreakSection({ streaks, rangeDays }) {
  return (
    <ChartCard
      title="Streaks"
      headline={`${streaks.current} day${streaks.current === 1 ? '' : 's'} · best ${streaks.longest}`}
      caption={`Active on ${streaks.activeDaysInRange} of the last ${rangeDays} days`}>
      <CalendarHeatmap
        cells={streaks.calendar}
        summary={`Active on ${streaks.activeDaysInRange} of the last ${rangeDays} days.`}
        describe={(cell) => `${WEEKDAY_DATE.format(cell.date)} · ${cell.value} quest${cell.value === 1 ? '' : 's'} cleared`}
      />
      {streaks.runs.length > 0 ? (
        <View style={styles.runs}>
          <AppText variant="label" color="textMuted">
            Streak history
          </AppText>
          {streaks.runs.map((run) => (
            <View key={run.start} style={styles.run}>
              <View style={[styles.runBar, { flex: run.length / Math.max(streaks.longest, 1) }]} />
              <View style={{ flex: 1 - run.length / Math.max(streaks.longest, 1) }} />
              <AppText variant="caption" color="textSecondary" style={styles.runLabel}>
                {run.length} days · {shortDate(parseLocalDateKey(run.start))}–{shortDate(parseLocalDateKey(run.end))}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
    </ChartCard>
  );
}

const styles = StyleSheet.create({
  multiples: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  multiple: {
    flexBasis: '30%',
    flexGrow: 1,
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundElevated,
  },
  multipleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  multipleLevel: { fontSize: 14, lineHeight: 16 },
  runs: { gap: Spacing.sm },
  run: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  runBar: { height: 8, borderTopRightRadius: Radius.xs, borderBottomRightRadius: Radius.xs, backgroundColor: ChartColors.series[0], minWidth: 6 },
  runLabel: { width: 150, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
